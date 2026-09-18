import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { runtimeEventsApi, type RuntimeEventItem } from '../api/runtimeEvents.js'
import { taskChatApi, type ChatMessage } from '../api/taskChat.js'
import { useTaskRealtime } from './useTaskRealtime'
import {
  chatLinesFromMessages,
  eventLineFromEvent,
  mergeTerminalLines,
  normActor,
  type TerminalLine,
} from '../pages/components/TaskDetail/agentTerminalCore'

const MAX_LINES = 800
const CHAT_PAGE_SIZE = 50

export interface AgentTimeline {
  chatMsgs: ChatMessage[]
  events: RuntimeEventItem[]
  lines: TerminalLine[]
  pending: TerminalLine[]
  atBottom: boolean
  /** 用户上翻期间新到的行数（回到底部即清零），供「N 条新输出」徽标 */
  newBelow: number
  scrollRef: React.MutableRefObject<HTMLDivElement | null>
  handleScroll: () => void
  scrollToBottom: () => void
  loadChat: () => Promise<void>
  appendEvents: (incoming: RuntimeEventItem[]) => void
  onRuntimeEvent: (data: any) => void
  /** 返回该行 key，供失败时 removeLocalLine 撤回 */
  pushLocalLine: (text: string, kind: TerminalLine['kind']) => string
  removeLocalLine: (key: string) => void
  clearView: () => void
}

/**
 * 交互时间线状态（任务对话 + Agent 运行事件合并）：
 * AgentTerminal（任务详情卡片）与 ConsoleWorkspace（全屏工作台）共用。
 */
export function useAgentTimeline(taskId: number | null): AgentTimeline {
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([])
  const [events, setEvents] = useState<RuntimeEventItem[]>([])
  const [pending, setPending] = useState<TerminalLine[]>([])
  const [atBottom, setAtBottom] = useState(true)
  const [newBelow, setNewBelow] = useState(0)
  const lastEventIdRef = useRef(0)
  const seenEventIdsRef = useRef<Set<number>>(new Set())
  const localSeqRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  /** 镜像 atBottom / lines 长度，供增量统计 effect 不依赖它们重跑 */
  const atBottomRef = useRef(true)
  const linesLenRef = useRef(0)

  const markAtBottom = useCallback((value: boolean) => {
    atBottomRef.current = value
    setAtBottom(value)
    if (value) setNewBelow(0)
  }, [])

  // 任务切换时必须整体重置：游标与去重集合若残留旧任务值，
  // 新任务的运行事件会因 after_id 过大整段拉空、对话也会短暂串台。
  const activeTaskRef = useRef<number | null>(null)
  const resetForTask = useCallback((id: number | null) => {
    lastEventIdRef.current = 0
    seenEventIdsRef.current = new Set()
    localSeqRef.current = 0
    linesLenRef.current = 0
    setChatMsgs([])
    setEvents([])
    setPending([])
    setNewBelow(0)
    atBottomRef.current = true
    setAtBottom(true)
    activeTaskRef.current = id
  }, [])

  useEffect(() => {
    if (activeTaskRef.current !== taskId) {
      resetForTask(taskId)
    }
  }, [taskId, resetForTask])

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

  /** 最新一页对话（升序）：total 超过一页时取最后一页，保证呈现最新记录 */
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
      // 慢响应晚于任务切换到达时不得覆盖新任务的对话
      if (activeTaskRef.current !== taskId) return
      setChatMsgs(items)
      // 服务端已落库的消息顶替同文本的本地回声（actor_type 大小写归一）
      const serverTexts = new Set(
        items.filter(m => normActor(m.actor_type) === 'HUMAN').map(m => m.content)
      )
      setPending(prev => prev.filter(p => !serverTexts.has(p.text)))
    } catch {
      // 静默：轮询兜底场景下可能暂无权限或网络抖动
    }
  }, [taskId])

  useEffect(() => {
    if (!taskId) return
    loadChat()
    // 页面不可见时暂停网络轮询（WS 增量仍生效），回前台立即补一次
    const tick = () => { if (!document.hidden) loadChat() }
    const timer = setInterval(tick, 20000)
    const onVisible = () => { if (!document.hidden) loadChat() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
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
    const timer = setInterval(() => { if (!document.hidden) fetchEvents() }, 5000)
    const onVisible = () => { if (!document.hidden) fetchEvents() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [taskId, appendEvents])

  const onRuntimeEvent = useCallback((data: any) => {
    if (!taskId || data?.task_id !== taskId || !data?.id) return
    appendEvents([data as RuntimeEventItem])
  }, [taskId, appendEvents])

  useTaskRealtime({
    taskId: taskId || 0,
    onRuntimeEvent,
    onComment: taskId ? loadChat : undefined,
  })

  const lines = useMemo(
    () => mergeTerminalLines(
      chatLinesFromMessages(chatMsgs),
      events.map(eventLineFromEvent).filter(Boolean) as TerminalLine[],
      pending,
    ),
    [chatMsgs, events, pending],
  )

  // 上翻浏览期间新到的输出计入 newBelow（回到底部即清零）
  useEffect(() => {
    const delta = lines.length - linesLenRef.current
    linesLenRef.current = lines.length
    if (delta > 0 && !atBottomRef.current) setNewBelow(n => n + delta)
  }, [lines])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    markAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }, [markAtBottom])

  const scrollToBottom = useCallback(() => {
    markAtBottom(true)
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [markAtBottom])

  // 自动滚底（用户上翻时让位）
  useEffect(() => {
    if (atBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, atBottom])

  const pushLocalLine = useCallback((text: string, kind: TerminalLine['kind']) => {
    localSeqRef.current += 1
    const key = `local-${localSeqRef.current}`
    const line: TerminalLine = { key, kind, text, ts: Date.now() }
    setPending(prev => [...prev, line])
    return key
  }, [])

  const removeLocalLine = useCallback((key: string) => {
    setPending(prev => prev.filter(p => p.key !== key))
  }, [])

  const clearView = useCallback(() => {
    setChatMsgs([])
    setEvents([])
    setPending([])
  }, [])

  return {
    chatMsgs, events, lines, pending, atBottom, newBelow,
    scrollRef, handleScroll, scrollToBottom,
    loadChat, appendEvents, onRuntimeEvent,
    pushLocalLine, removeLocalLine, clearView,
  }
}
