import { useCallback, useState } from 'react'
import { taskChatApi } from '../api/taskChat.js'
import { getErrorMessage } from '../utils/errorUtils.js'
import type { AgentTimeline } from './useAgentTimeline'
import {
  parseTerminalCommand,
  TERMINAL_COMMAND_HELP,
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

/**
 * 终端发送逻辑（斜杠命令 + 留言 + 乐观回声），任务详情页 AgentTerminal
 * 与 Console 工作台 ConsoleComposer 共用，避免两处漂移。
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

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return

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
  }, [input, sending, running, taskId, doStop, afterSend, onError,
    pushLocalLine, removeLocalLine, loadChat, clearView])

  return { input, setInput, sending, commandHint, handleSend }
}
