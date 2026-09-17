import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Drawer, Input, Tag, message } from 'antd'
import {
  VerticalAlignBottomOutlined,
  PauseCircleOutlined,
  CopyOutlined,
  ClearOutlined,
  HistoryOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { runtimeEventsApi, type RuntimeEventItem } from '../../../api/runtimeEvents.js'
import { taskChatApi, type ChatMessage } from '../../../api/taskChat.js'
import { getErrorMessage } from '../../../utils/errorUtils.js'
import TaskChatThread from '../../../components/TaskChatThread'
import { useTaskRealtime } from '../../../hooks/useTaskRealtime'
import {
  buildTranscriptText,
  chatLinesFromMessages,
  eventLineFromEvent,
  mergeTerminalLines,
  parseTerminalCommand,
  TERMINAL_COMMAND_HELP,
  type TerminalLine,
} from './agentTerminalCore'

const MAX_LINES = 800
const CHAT_PAGE_SIZE = 50

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
 * 交互终端：Claude Code 风格的任务级 REPL。
 * 统一时间线（任务对话 + Agent 运行事件流）+ 底部输入行 + Esc 两段式中断
 * + /stop /clear /help 斜杠命令。交互式会话的收口界面。
 */
export const AgentTerminal: React.FC<AgentTerminalProps> = ({ taskId, running, onStopped }) => {
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([])
  const [events, setEvents] = useState<RuntimeEventItem[]>([])
  /** 本地乐观回声：发送后立即上屏，服务端记录回来后按同文去重顶替 */
  const [pending, setPending] = useState<TerminalLine[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [confirmingStop, setConfirmingStop] = useState(false)
  /** Esc 两段式中断：第一次武装提示，再次按下才真正停止 */
  const [escArmed, setEscArmed] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const lastEventIdRef = useRef(0)
  const seenEventIdsRef = useRef<Set<number>>(new Set())
  const localSeqRef = useRef(0)
  const escTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const appendEvents = useCallback((incoming: RuntimeEventItem[]) => {
    if (!incoming?.length) return
    // 去重与游标推进必须在 updater 外完成：updater 必须是纯函数，
    // StrictMode 双调用下副作用会让第二次执行误判为「全部见过」而丢掉整批事件。
    const fresh = incoming.filter(e => e.id && !seenEventIdsRef.current.has(e.id))
    if (!fresh.length) return
    fresh.forEach(e => seenEventIdsRef.current.add(e.id))
    const last = fresh[fresh.length - 1].id
    if (last > lastEventIdRef.current) lastEventIdRef.current = last
    setEvents(prev => {
      const merged = [...prev, ...fresh]
      return merged.length > MAX_LINES ? merged.slice(-MAX_LINES) : merged
    })
  }, [])

  /** 最新一页对话（升序）：total 超过一页时取最后一页，保证终端呈现最新记录 */
  const loadChat = useCallback(async () => {
    if (!taskId) return
    try {
      const first = await taskChatApi.getMessages(taskId, 1, CHAT_PAGE_SIZE)
      let items = first.items || []
      const total = first.total || items.length
      if (total > CHAT_PAGE_SIZE) {
        const lastPage = Math.ceil(total / CHAT_PAGE_SIZE)
        const last = await taskChatApi.getMessages(taskId, lastPage, CHAT_PAGE_SIZE)
        items = last.items || []
      }
      setChatMsgs(items)
      // 服务端已落库的消息顶替同文本的本地回声
      const serverTexts = new Set(
        items.filter(m => m.actor_type === 'HUMAN').map(m => m.content)
      )
      setPending(prev => prev.filter(p => !serverTexts.has(p.text)))
    } catch {
      // 静默：轮询兜底场景下可能暂无权限或网络抖动
    }
  }, [taskId])

  useEffect(() => {
    if (!taskId) return
    loadChat()
    const timer = setInterval(loadChat, 20000)
    return () => clearInterval(timer)
  }, [taskId, loadChat])

  // 运行事件：初始拉取 + 5s 轮询兜底 + WS 增量
  useEffect(() => {
    if (!taskId) return
    let cancelled = false
    const fetchEvents = async () => {
      try {
        const page = await runtimeEventsApi.list(taskId, lastEventIdRef.current)
        if (!cancelled) appendEvents(page.items || [])
      } catch {
        // 静默
      }
    }
    fetchEvents()
    const timer = setInterval(fetchEvents, 5000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [taskId, appendEvents])

  const onRuntimeEvent = useCallback((data: any) => {
    if (data?.task_id !== taskId || !data?.id) return
    appendEvents([data as RuntimeEventItem])
  }, [taskId, appendEvents])

  useTaskRealtime({ taskId, onRuntimeEvent, onComment: loadChat })

  const lines = useMemo(
    () => mergeTerminalLines(
      chatLinesFromMessages(chatMsgs),
      events.map(eventLineFromEvent).filter(Boolean) as TerminalLine[],
      pending,
    ),
    [chatMsgs, events, pending],
  )

  // 自动滚底（用户上翻时让位）
  useEffect(() => {
    if (atBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, atBottom])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }

  const scrollToBottom = () => {
    setAtBottom(true)
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const pushLocalLine = useCallback((text: string, kind: TerminalLine['kind']) => {
    localSeqRef.current += 1
    const line: TerminalLine = { key: `local-${localSeqRef.current}`, kind, text, ts: Date.now() }
    setPending(prev => [...prev, line])
  }, [])

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

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return

    const command = parseTerminalCommand(text)
    if (command) {
      setInput('')
      if (command.type === 'help') {
        TERMINAL_COMMAND_HELP.forEach(t => pushLocalLine(t, 'system'))
      } else if (command.type === 'clear') {
        setChatMsgs([])
        setEvents([])
        setPending([])
      } else if (command.type === 'stop') {
        if (running) await doStop()
        else pushLocalLine('当前没有执行中的任务', 'system')
      } else {
        pushLocalLine(`未知命令 /${command.name}，输入 /help 查看可用命令`, 'system')
      }
      return
    }

    setInput('')
    pushLocalLine(text, 'user')
    try {
      setSending(true)
      await taskChatApi.sendMessage(taskId, text)
      await loadChat()
    } catch (error) {
      message.error(getErrorMessage(error, '发送消息失败'))
    } finally {
      setSending(false)
    }
  }, [input, sending, running, taskId, doStop, loadChat, pushLocalLine])

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

  const handleClear = () => {
    // 仅清空视图；游标保留，避免轮询把历史重新灌回来
    setChatMsgs([])
    setEvents([])
    setPending([])
  }

  const commandHint = input.trim().startsWith('/')

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
          <Button size="small" type="text" icon={<ClearOutlined />} title="清空视图" onClick={handleClear} />
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
