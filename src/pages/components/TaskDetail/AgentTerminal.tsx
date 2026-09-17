import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Card, Drawer, Input, Tag, message } from 'antd'
import {
  VerticalAlignBottomOutlined,
  PauseCircleOutlined,
  CopyOutlined,
  ClearOutlined,
  HistoryOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { runtimeEventsApi } from '../../../api/runtimeEvents.js'
import { getErrorMessage } from '../../../utils/errorUtils.js'
import TaskChatThread from '../../../components/TaskChatThread'
import { useAgentTimeline } from '../../../hooks/useAgentTimeline'
import { useTerminalSend } from '../../../hooks/useTerminalSend'
import {
  buildTranscriptText,
  type TerminalLine,
} from './agentTerminalCore'

const LINE_STYLE: Record<TerminalLine['kind'], { bullet: string; color: string; italic?: boolean }> = {
  user: { bullet: '❯', color: '#52c41a' },
  agent: { bullet: '⏺', color: '#d9d9d9' },
  system: { bullet: '○', color: '#8c8c8c', italic: true },
  progress: { bullet: '·', color: '#69b1ff' },
  status: { bullet: '▶', color: '#95de64' },
  error: { bullet: '✗', color: '#ff7875' },
}

const CONSOLE_FONT = 'SFMono-Regular, Consolas, Menlo, monospace'

interface AgentTerminalProps {
  taskId: number
  /** 任务是否处于执行中（in_progress 时可中断） */
  running: boolean
  /** 停止成功后的回调（父级刷新任务状态） */
  onStopped?: () => void
}

/**
 * 交互终端：Claude Code 风格的任务级 REPL（任务详情页内嵌卡片版）。
 * 时间线状态由 useAgentTimeline 提供；全屏版见 pages/console/ConsoleWorkspace。
 */
export const AgentTerminal: React.FC<AgentTerminalProps> = ({ taskId, running, onStopped }) => {
  const timeline = useAgentTimeline(taskId)
  const { lines, atBottom, scrollRef, handleScroll, scrollToBottom, clearView } = timeline
  const [stopping, setStopping] = useState(false)
  const [confirmingStop, setConfirmingStop] = useState(false)
  /** Esc 两段式中断：第一次武装提示，再次按下才真正停止 */
  const [escArmed, setEscArmed] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const escTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const doStop = useCallback(async () => {
    setEscArmed(false)
    setConfirmingStop(false)
    if (escTimerRef.current) clearTimeout(escTimerRef.current)
    try {
      setStopping(true)
      const result = await runtimeEventsApi.stopAgent(taskId)
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
  }, [taskId, onStopped])

  const armEsc = useCallback(() => {
    setEscArmed(true)
    if (escTimerRef.current) clearTimeout(escTimerRef.current)
    escTimerRef.current = setTimeout(() => setEscArmed(false), 2500)
  }, [])

  const { input, setInput, sending, commandHint, handleSend } = useTerminalSend({
    taskId,
    running,
    timeline,
    doStop,
    onError: (error, fallback) => message.error(getErrorMessage(error, fallback)),
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Escape' && running) {
      e.preventDefault()
      if (escArmed) doStop()
      else armEsc()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildTranscriptText(lines))
      message.success('已复制终端内容')
    } catch {
      message.error('复制失败')
    }
  }

  return (
    <Card
      size="small"
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#fa8c16' }}>✻</span>
          交互终端
          {running && <Tag color="orange" style={{ marginRight: 0 }}>⏵⏵ 执行中</Tag>}
        </span>
      }
      extra={
        <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          <Button size="small" type="text" icon={<CopyOutlined />} title="复制终端内容" onClick={handleCopy} />
          <Button size="small" type="text" icon={<ClearOutlined />} title="清空视图" onClick={clearView} />
          <Button size="small" type="text" icon={<HistoryOutlined />} title="完整对话记录" onClick={() => setShowHistory(true)} />
          {running && (
            confirmingStop ? (
              <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#999' }}>中断这次执行？</span>
                <Button size="small" danger loading={stopping} onClick={doStop}>确认停止</Button>
                <Button size="small" type="text" disabled={stopping} onClick={() => setConfirmingStop(false)}>取消</Button>
              </div>
            ) : (
              <Button size="small" danger icon={<PauseCircleOutlined />} onClick={() => setConfirmingStop(true)}>
                停止执行
              </Button>
            )
          )}
        </div>
      }
      onKeyDown={handleKeyDown}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-testid="terminal-body"
        style={{
          background: '#1e1e1e',
          borderRadius: 4,
          padding: '12px 14px',
          height: 400,
          overflowY: 'auto',
          fontFamily: CONSOLE_FONT,
          fontSize: 12.5,
          lineHeight: '20px',
        }}
      >
        {lines.length === 0 ? (
          <div style={{ color: '#666' }}>
            <div><span style={{ color: '#fa8c16' }}>✻</span> 欢迎使用交互终端</div>
            <div style={{ marginTop: 4 }}>输入消息与 Agent 对话，执行期间实时送达；/help 查看可用命令。</div>
          </div>
        ) : (
          lines.map(line => {
            const style = LINE_STYLE[line.kind]
            return (
              <div key={line.key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: style.color, flexShrink: 0, fontWeight: line.kind === 'user' ? 600 : 400 }}>
                  {style.bullet}
                </span>
                <span style={{
                  color: line.kind === 'user' ? '#e8e8e8' : style.color,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontStyle: style.italic ? 'italic' : 'normal',
                  flex: 1,
                }}>
                  {line.text}
                </span>
              </div>
            )
          })
        )}
      </div>

      {!atBottom && (
        <div style={{ textAlign: 'right', marginTop: 2 }}>
          <Button size="small" type="link" icon={<VerticalAlignBottomOutlined />} onClick={scrollToBottom}>
            回到底部
          </Button>
        </div>
      )}

      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8 }}>
        {commandHint && (
          <div style={{ fontFamily: CONSOLE_FONT, fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>
            /stop 中断执行 · /clear 清空视图 · /help 命令列表
          </div>
        )}
        {escArmed && (
          <div style={{ fontFamily: CONSOLE_FONT, fontSize: 12, color: '#faad14', marginBottom: 4 }}>
            再按 Esc 确认中断执行
          </div>
        )}
        {!running && !escArmed && (
          <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>
            留言将实时转发给 Agent，并在下一轮执行时正式纳入上下文。
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <span style={{ color: '#52c41a', fontWeight: 600, fontFamily: CONSOLE_FONT, fontSize: 14, lineHeight: '22px' }}>❯</span>
          <Input.TextArea
            ref={inputRef as any}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="输入消息… （Enter 发送，Shift+Enter 换行，/help 查看命令）"
            autoSize={{ minRows: 1, maxRows: 4 }}
            variant="borderless"
            style={{ flex: 1, background: '#1e1e1e', color: '#e8e8e8', fontFamily: CONSOLE_FONT, fontSize: 12.5, borderRadius: 4 }}
            disabled={sending}
          />
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!input.trim()}
            style={{ alignSelf: 'flex-end' }}
          />
        </div>
        {running && (
          <div style={{ fontFamily: CONSOLE_FONT, fontSize: 11, color: '#666', marginTop: 4 }}>
            ⏵⏵ Agent 执行中 · 按 Esc 中断
          </div>
        )}
      </div>

      <Drawer
        title="完整对话记录"
        width={520}
        open={showHistory}
        onClose={() => setShowHistory(false)}
        destroyOnHidden
      >
        <TaskChatThread taskId={taskId} />
      </Drawer>
    </Card>
  )
}

export default AgentTerminal
