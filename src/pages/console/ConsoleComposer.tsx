import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Input, Switch, Tooltip, message } from 'antd'
import { SendOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { runtimeEventsApi } from '../../api/runtimeEvents.js'
import { agentsApi } from '../../api/agents'
import { getErrorMessage } from '../../utils/errorUtils.js'
import type { AgentTimeline } from '../../hooks/useAgentTimeline'
import { useTerminalSend } from '../../hooks/useTerminalSend'
import { canDispatchTask, firstAgentId } from './consoleData'
import { CONSOLE_TOKENS, CONSOLE_MONO } from './consoleTheme'
import TerminalCommandMenu from '../components/TaskDetail/TerminalCommandMenu'

interface ConsoleComposerProps {
  task: any
  running: boolean
  timeline: AgentTimeline
  /** 发送/派发后刷新任务状态 */
  onActivity?: () => void
  onStopped?: () => void
}

/**
 * Console 底部指令区（对标 "Ask for follow-up changes"）：
 * 留言必达（实时转发 + 下轮注入）；空闲 AI 任务可「发送并派发」直接开工；
 * /stop /clear /help 与任务详情页终端共用同一发送逻辑（useTerminalSend）。
 */
export const ConsoleComposer: React.FC<ConsoleComposerProps> = ({
  task,
  running,
  timeline,
  onActivity,
  onStopped,
}) => {
  const [stopping, setStopping] = useState(false)
  /** Esc 两段式中断：第一次武装提示，再次按下才真正停止 */
  const [escArmed, setEscArmed] = useState(false)
  const escTimerRef = useRef<ReturnType<typeof setTimeout>>()
  /** 空闲且有 Agent 归属时默认勾选：发送留言后顺带派发执行 */
  const [dispatchAfterSend, setDispatchAfterSend] = useState(true)
  const dispatchable = canDispatchTask(task)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => () => { if (escTimerRef.current) clearTimeout(escTimerRef.current) }, [])

  // 切换任务后自动聚焦输入行
  useEffect(() => {
    inputRef.current?.focus()
  }, [task?.id])

  const doStop = useCallback(async () => {
    try {
      setStopping(true)
      const result = await runtimeEventsApi.stopAgent(task.id)
      message.success(
        result.transport === 'ws_command'
          ? '已发送停止指令，Agent 正在终止'
          : '已标记取消，Agent 将在下次续约时终止'
      )
      onStopped?.()
    } catch (error) {
      message.error(getErrorMessage(error, '停止失败'))
    } finally {
      setStopping(false)
    }
  }, [task?.id, onStopped])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Escape' && running) {
      e.preventDefault()
      if (escTimerRef.current) clearTimeout(escTimerRef.current)
      if (escArmed) {
        setEscArmed(false)
        doStop()
      } else {
        setEscArmed(true)
        escTimerRef.current = setTimeout(() => setEscArmed(false), 2500)
      }
    }
  }, [running, escArmed, doStop])

  const { input, setInput, sending, commandHint, handleSend, handleInputKeyDown, commandMenu } = useTerminalSend({
    taskId: task?.id,
    running,
    timeline,
    doStop,
    // 空闲任务：留言已入列，顺带派发让 Agent 马上开工
    afterSend: dispatchAfterSend && dispatchable
      ? async () => {
          const agentId = firstAgentId(task)
          await agentsApi.dispatchTasks(agentId!, { project_id: task.project_id })
          onActivity?.()
          return `已派发给 Agent #${agentId}，任务进入执行队列`
        }
      : undefined,
    onError: (error, fallback) => message.error(getErrorMessage(error, fallback)),
  })

  return (
    <div
      style={{ padding: '12px 20px 16px', borderTop: `1px solid ${CONSOLE_TOKENS.border}` }}
      data-testid="console-composer"
      onKeyDown={handleKeyDown}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', position: 'relative' }}>
        <TerminalCommandMenu menu={commandMenu} theme="console" testIdPrefix="console-cmd-menu" />
        <div
          className="console-input-shell"
          style={{
            flex: 1, minWidth: 0, display: 'flex', gap: 8, alignItems: 'flex-end',
            background: CONSOLE_TOKENS.bgField, borderRadius: 8, padding: '4px 12px',
          }}
        >
          <span style={{ color: CONSOLE_TOKENS.accent, fontWeight: 700, fontSize: 16, lineHeight: '26px', fontFamily: CONSOLE_MONO }}>❯</span>
          <Input.TextArea
            ref={inputRef as any}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={running ? 'Agent 执行中，留言将实时转发并在下轮注入…' : '让 Agent 做什么… （Enter 发送，/ 唤出命令）'}
            autoSize={{ minRows: 1, maxRows: 6 }}
            variant="borderless"
            data-testid="console-input"
            style={{ flex: 1, background: 'transparent', color: CONSOLE_TOKENS.textPrimary, fontSize: 14, padding: '6px 0' }}
          />
        </div>
        {running ? (
          <Tooltip title="中断当前执行">
            <Button danger icon={<PauseCircleOutlined />} loading={stopping} onClick={doStop}>
              停止
            </Button>
          </Tooltip>
        ) : null}
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          disabled={!input.trim()}
          onClick={() => handleSend()}
          style={{ borderRadius: 6 }}
        >
          发送
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 6, fontSize: 12, color: CONSOLE_TOKENS.textFaint }}>
        {escArmed && (
          <span style={{ color: CONSOLE_TOKENS.amber, fontFamily: CONSOLE_MONO }} data-testid="console-esc-hint">
            再按 Esc 确认中断执行
          </span>
        )}
        {dispatchable && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: dispatchAfterSend ? CONSOLE_TOKENS.accent : CONSOLE_TOKENS.textMuted }}>
            <Switch
              size="small"
              checked={dispatchAfterSend}
              onChange={setDispatchAfterSend}
              data-testid="console-dispatch-toggle"
            />
            发送并派发执行
          </label>
        )}
        {commandHint && <span style={{ color: CONSOLE_TOKENS.textMuted }}>/stop 中断 · /clear 清屏 · /help 列表</span>}
        <span>Enter 发送 · Shift+Enter 换行 · ↑↓ 历史 · /help 命令</span>
      </div>
    </div>
  )
}

export default ConsoleComposer
