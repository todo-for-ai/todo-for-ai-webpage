import { useCallback, useMemo, useRef, useState } from 'react'
import { taskChatApi } from '../api/taskChat.js'
import { getErrorMessage } from '../utils/errorUtils.js'
import type { AgentTimeline } from './useAgentTimeline'
import {
  filterTerminalCommands,
  parseTerminalCommand,
  TERMINAL_COMMAND_HELP,
  type TerminalCommandMeta,
} from '../pages/components/TaskDetail/agentTerminalCore'

interface UseTerminalSendOptions {
  taskId: number
  running: boolean
  timeline: AgentTimeline
  /** 中断当前执行（任务详情卡片与工作台各自实现停止通道） */
  doStop: () => Promise<void>
  /** 消息落库成功后的扩展动作（如工作台的自动派发）；返回文本将以 system 行上屏 */
  afterSend?: () => Promise<string | void>
  onError?: (error: unknown, fallback: string) => void
}

export interface TerminalCommandMenuState {
  open: boolean
  items: TerminalCommandMeta[]
  index: number
  setIndex: (i: number) => void
  /** 选中补全项：填入输入框并立即执行该命令 */
  pick: (meta: TerminalCommandMeta) => void
}

const HISTORY_MAX = 100

/**
 * 终端发送逻辑（斜杠命令 + 留言 + 乐观回声 + ↑↓ 历史召回 + 命令补全菜单），
 * 任务详情页 AgentTerminal 与 Console 工作台 ConsoleComposer 共用，避免两处漂移。
 */
export function useTerminalSend({
  taskId,
  running,
  timeline,
  doStop,
  afterSend,
  onError,
}: UseTerminalSendOptions) {
  const { pushLocalLine, removeLocalLine, loadChat, clearView } = timeline
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const commandHint = input.trim().startsWith('/')

  // ↑↓ 历史召回：idx=null 表示不在翻历史；翻历史起点时把草稿暂存，翻到底恢复
  const historyRef = useRef<string[]>([])
  const historyIdxRef = useRef<number | null>(null)
  const draftRef = useRef('')
  // Esc 关闭补全菜单时记下当时的输入；输入变化后菜单自然恢复
  const [dismissedAt, setDismissedAt] = useState('')

  const pushHistory = useCallback((text: string) => {
    const arr = historyRef.current
    if (arr[arr.length - 1] === text) return
    arr.push(text)
    if (arr.length > HISTORY_MAX) arr.shift()
  }, [])

  const historyPrev = useCallback((): string | null => {
    const arr = historyRef.current
    if (!arr.length) return null
    const idx = historyIdxRef.current
    // 草稿被改过或不在线上：从最新一条重新开始
    if (idx === null || input !== arr[idx]) {
      draftRef.current = input
      historyIdxRef.current = arr.length - 1
    } else if (idx > 0) {
      historyIdxRef.current = idx - 1
    } else {
      return arr[0]
    }
    return arr[historyIdxRef.current]
  }, [input])

  const historyNext = useCallback((): string | null => {
    const arr = historyRef.current
    const idx = historyIdxRef.current
    if (idx === null) return null
    if (idx < arr.length - 1) {
      historyIdxRef.current = idx + 1
      return arr[historyIdxRef.current]
    }
    historyIdxRef.current = null
    return draftRef.current
  }, [])

  const recall = useCallback((value: string | null): boolean => {
    if (value === null) return false
    setInput(value)
    // 召回历史不弹补全菜单（终端惯例）
    if (value.startsWith('/')) setDismissedAt(value)
    return true
  }, [])

  const handleSend = useCallback(async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text || sending) return
    historyIdxRef.current = null
    pushHistory(text)

    const command = parseTerminalCommand(text)
    if (command) {
      setInput('')
      if (command.type === 'help') {
        TERMINAL_COMMAND_HELP.forEach(t => pushLocalLine(t, 'system'))
      } else if (command.type === 'clear') {
        clearView()
      } else if (command.type === 'stop') {
        if (running) await doStop()
        else pushLocalLine('当前没有执行中的任务', 'system')
      } else {
        pushLocalLine(`未知命令 /${command.name}，输入 /help 查看可用命令`, 'system')
      }
      return
    }

    setInput('')
    const echoKey = pushLocalLine(text, 'user')
    try {
      setSending(true)
      await taskChatApi.sendMessage(taskId, text)
      await loadChat()
      if (afterSend) {
        const note = await afterSend()
        if (note) pushLocalLine(note, 'system')
      }
    } catch (error) {
      // 发送失败：撤回乐观回声、把文本还给输入框，避免用户丢字
      removeLocalLine(echoKey)
      setInput(text)
      if (onError) onError(error, '发送失败')
      else pushLocalLine(`发送失败：${(error as Error)?.message || '未知错误'}`, 'error')
    } finally {
      setSending(false)
    }
  }, [input, sending, running, taskId, doStop, afterSend, onError, pushHistory,
    pushLocalLine, removeLocalLine, loadChat, clearView])

  // 斜杠命令补全：/ 开头、无空白、未被 Esc 关闭
  const items = useMemo(() => filterTerminalCommands(input), [input])
  const [menuIndex, setMenuIndex] = useState(0)
  const menuOpen = items.length > 0 && input !== dismissedAt && !sending
  if (menuIndex >= items.length && items.length > 0) setMenuIndex(0)

  const commandMenu: TerminalCommandMenuState = useMemo(() => ({
    open: menuOpen,
    items,
    index: menuIndex,
    setIndex: setMenuIndex,
    pick: (meta: TerminalCommandMeta) => {
      const text = `/${meta.name}`
      setInput(text)
      void handleSend(text)
    },
  }), [menuOpen, items, menuIndex, handleSend])

  /**
   * 输入框键位统一处理（TextArea onKeyDown 直接绑定本函数）：
   * 菜单开启时 ↑↓ 选择、Enter/Tab 选中执行、Esc 关闭（不触发外层中断）；
   * 否则 Enter 发送、↑↓ 在光标位于首/末行时召回历史。
   */
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return
    const el = e.currentTarget
    if (menuOpen && items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMenuIndex(i => (i + 1) % items.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMenuIndex(i => (i - 1 + items.length) % items.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        commandMenu.pick(items[menuIndex] || items[0])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        // 阻止冒泡：外层容器把 Esc 用作「两段式中断」
        e.stopPropagation()
        setDismissedAt(input)
      }
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
      return
    }
    const atStart = (el.selectionStart ?? 0) === 0 && (el.selectionEnd ?? 0) === 0
    const atEnd = (el.selectionStart ?? 0) === el.value.length
      && (el.selectionEnd ?? 0) === el.value.length
    if (e.key === 'ArrowUp' && atStart) {
      if (recall(historyPrev())) e.preventDefault()
    } else if (e.key === 'ArrowDown' && atEnd) {
      if (historyIdxRef.current !== null) {
        e.preventDefault()
        recall(historyNext())
      }
    }
  }, [menuOpen, items, menuIndex, commandMenu, input, handleSend, historyPrev, historyNext, recall])

  return { input, setInput, sending, commandHint, handleSend, handleInputKeyDown, commandMenu }
}
