import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { taskChatApi } = vi.hoisted(() => ({
  taskChatApi: { sendMessage: vi.fn() },
}))
vi.mock('../../../src/api/taskChat.js', () => ({ taskChatApi }))

import { useTerminalSend } from '../../../src/hooks/useTerminalSend'
import type { AgentTimeline } from '../../../src/hooks/useAgentTimeline'

function makeTimeline() {
  const pushed: Array<{ key: string; text: string; kind: string }> = []
  let seq = 0
  const removed: string[] = []
  const timeline = {
    pushLocalLine: (text: string, kind: any) => {
      seq += 1
      const key = `local-${seq}`
      pushed.push({ key, text, kind })
      return key
    },
    removeLocalLine: (key: string) => { removed.push(key) },
    loadChat: vi.fn(async () => {}),
    clearView: vi.fn(),
  } as unknown as AgentTimeline & { pushed: typeof pushed; removed: string[] }
  return { timeline: timeline as any, pushed, removed }
}

const baseOpts = { taskId: 1, running: false } as const

describe('useTerminalSend', () => {
  it('sends message: echo pushed, server called, chat reloaded', async () => {
    const { timeline, pushed } = makeTimeline()
    taskChatApi.sendMessage.mockResolvedValue({ id: 9 })
    const { result } = renderHook(() => useTerminalSend({
      ...baseOpts, timeline,
    }))

    act(() => result.current.setInput('  做完检查  '))
    await act(async () => { await result.current.handleSend() })

    expect(taskChatApi.sendMessage).toHaveBeenCalledWith(1, '做完检查')
    expect(pushed[0]).toMatchObject({ kind: 'user', text: '做完检查' })
    expect(timeline.loadChat).toHaveBeenCalled()
    expect(result.current.input).toBe('')
    expect(result.current.sending).toBe(false)
  })

  it('发送失败：撤回回声行、把文本还给输入框（不丢字）', async () => {
    const { timeline, pushed, removed } = makeTimeline()
    taskChatApi.sendMessage.mockRejectedValue(new Error('network down'))
    const { result } = renderHook(() => useTerminalSend({
      ...baseOpts, timeline,
    }))

    act(() => result.current.setInput('重要指令'))
    await act(async () => { await result.current.handleSend() })

    // 回声被撤回、文本恢复到输入框
    expect(removed).toEqual([pushed[0].key])
    expect(result.current.input).toBe('重要指令')
  })

  it('/stop 空闲时只提示不调用停止；/help 上屏命令列表', async () => {
    const { timeline, pushed } = makeTimeline()
    const doStop = vi.fn(async () => {})
    const { result } = renderHook(() => useTerminalSend({
      ...baseOpts, timeline, doStop,
    }))

    act(() => result.current.setInput('/stop'))
    await act(async () => { await result.current.handleSend() })
    expect(doStop).not.toHaveBeenCalled()
    expect(pushed.some(p => p.text === '当前没有执行中的任务')).toBe(true)

    act(() => result.current.setInput('/help'))
    await act(async () => { await result.current.handleSend() })
    expect(pushed.filter(p => p.kind === 'system').length).toBeGreaterThanOrEqual(3)
  })
})
