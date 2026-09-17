import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Card, Tag, Tooltip, message } from 'antd'
import { VerticalAlignBottomOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { runtimeEventsApi, type RuntimeEventItem } from '../../../api/runtimeEvents.js'
import { getErrorMessage } from '../../../utils/errorUtils.js'
import { wsService } from '../../../services/websocketService'
import dayjs from 'dayjs'

const MAX_LINES = 800

const EVENT_STYLE: Record<string, { color: string; label?: string }> = {
  output: { color: '#d9d9d9' },
  progress: { color: '#69b1ff' },
  started: { color: '#52c41a', label: '▶' },
  completed: { color: '#52c41a', label: '✓' },
  cancelled: { color: '#faad14', label: '■' },
  error: { color: '#ff7875', label: '✗' },
  log: { color: '#d9d9d9' },
}

interface AgentRunConsoleProps {
  taskId: number
  /** 任务是否处于执行中（in_progress 时显示停止按钮） */
  running: boolean
  /** 停止成功后的回调（父级刷新任务状态） */
  onStopped?: () => void
}

/**
 * Agent 运行控制台：实时输出流（WS task_runtime_event）+ 游标轮询兜底
 * + 停止执行按钮。交互式会话（类 Codex/Claude Code）的观察面。
 */
export const AgentRunConsole: React.FC<AgentRunConsoleProps> = ({
  taskId,
  running,
  onStopped,
}) => {
  const [events, setEvents] = useState<RuntimeEventItem[]>([])
  const [stopping, setStopping] = useState(false)
  const [confirmingStop, setConfirmingStop] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const lastIdRef = useRef(0)
  const seenIdsRef = useRef<Set<number>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  const appendEvents = useCallback((incoming: RuntimeEventItem[]) => {
    if (!incoming.length) return
    setEvents(prev => {
      const fresh = incoming.filter(e => e.id && !seenIdsRef.current.has(e.id))
      if (!fresh.length) return prev
      fresh.forEach(e => seenIdsRef.current.add(e.id))
      const last = fresh[fresh.length - 1].id
      if (last > lastIdRef.current) lastIdRef.current = last
      const merged = [...prev, ...fresh]
      // 控制台保留尾部，避免长会话撑爆 DOM
      return merged.length > MAX_LINES ? merged.slice(-MAX_LINES) : merged
    })
  }, [])

  // 初始拉取（最近一段）+ 断线兜底轮询
  useEffect(() => {
    if (!taskId) return
    let cancelled = false

    const fetchEvents = async () => {
      try {
        const page = await runtimeEventsApi.list(taskId, lastIdRef.current)
        if (!cancelled) appendEvents(page.items || [])
      } catch {
        // 静默：轮询兜底场景下任务可能无权限或无事件
      }
    }

    fetchEvents()
    const timer = setInterval(fetchEvents, 5000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [taskId, appendEvents])

  // WS 实时增量
  useEffect(() => {
    if (!taskId) return
    const unsub = wsService.on('task_runtime_event', (data: any) => {
      if (data?.task_id !== taskId || !data?.id) return
      appendEvents([data as RuntimeEventItem])
    })
    return unsub
  }, [taskId, appendEvents])

  // 自动滚底（用户上翻时让位）
  useEffect(() => {
    if (atBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events, atBottom])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }

  const handleStop = async () => {
    try {
      setStopping(true)
      const result = await runtimeEventsApi.stopAgent(taskId)
      setConfirmingStop(false)
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
  }

  return (
    <Card
      size="small"
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Agent 运行控制台
          {running && <Tag color="processing" style={{ marginRight: 0 }}>执行中</Tag>}
        </span>
      }
      extra={
        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          <Tooltip title="清空重来">
            <Button size="small" type="text" icon={<ReloadOutlined />} onClick={() => {
              lastIdRef.current = 0
              seenIdsRef.current.clear()
              setEvents([])
            }} />
          </Tooltip>
          {running && (
            confirmingStop ? (
              <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#999' }}>取消这次执行？</span>
                <Button size="small" danger loading={stopping} onClick={handleStop}>
                  确认停止
                </Button>
                <Button size="small" type="text" disabled={stopping} onClick={() => setConfirmingStop(false)}>
                  取消
                </Button>
              </div>
            ) : (
              <Button size="small" danger icon={<PauseCircleOutlined />} onClick={() => setConfirmingStop(true)}>
                停止执行
              </Button>
            )
          )}
        </div>
      }
      style={{ marginTop: 8 }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          background: '#1e1e1e',
          borderRadius: 4,
          padding: '10px 12px',
          height: 260,
          overflowY: 'auto',
          fontFamily: 'SFMono-Regular, Consolas, Menlo, monospace',
          fontSize: 12,
          lineHeight: '18px',
        }}
      >
        {events.length === 0 ? (
          <div style={{ color: '#666' }}>
            暂无运行输出。Agent 开始执行任务后，输出会实时显示在这里。
          </div>
        ) : (
          events.map(ev => {
            const style = EVENT_STYLE[ev.event_type] || EVENT_STYLE.log
            const time = ev.event_timestamp
              ? dayjs(ev.event_timestamp).format('HH:mm:ss')
              : ''
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#666', flexShrink: 0 }}>{time}</span>
                <span style={{ color: style.color, flexShrink: 0 }}>{style.label || '·'}</span>
                <span style={{ color: style.color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {ev.message}
                </span>
              </div>
            )
          })
        )}
      </div>
      {!atBottom && (
        <div style={{ textAlign: 'right', marginTop: 4 }}>
          <Button size="small" type="link" icon={<VerticalAlignBottomOutlined />} onClick={() => {
            setAtBottom(true)
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
          }}>
            回到底部
          </Button>
        </div>
      )}
    </Card>
  )
}

export default AgentRunConsole
