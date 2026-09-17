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
  scrollRef: React.MutableRefObject<HTMLDivElement | null>
  handleScroll: () => void
  scrollToBottom: () => void
  loadChat: () => Promise<void>
  appendEvents: (incoming: RuntimeEventItem[]) => void
  onRuntimeEvent: (data: any) => void
  pushLocalLine: (text: string, kind: TerminalLine['kind']) => void
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
  const lastEventIdRef = useRef(0)
  const seenEventIdsRef = useRef<Set<number>>(new Set())
  const localSeqRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)

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

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }, [])

  const scrollToBottom = useCallback(() => {
    setAtBottom(true)
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  // 自动滚底（用户上翻时让位）
  useEffect(() => {
    if (atBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines, atBottom])

  const pushLocalLine = useCallback((text: string, kind: TerminalLine['kind']) => {
    localSeqRef.current += 1
    const line: TerminalLine = { key: `local-${localSeqRef.current}`, kind, text, ts: Date.now() }
    setPending(prev => [...prev, line])
  }, [])

  const clearView = useCallback(() => {
    setChatMsgs([])
    setEvents([])
    setPending([])
  }, [])

  return {
    chatMsgs, events, lines, pending, atBottom,
    scrollRef, handleScroll, scrollToBottom,
    loadChat, appendEvents, onRuntimeEvent,
    pushLocalLine, clearView,
  }
}
