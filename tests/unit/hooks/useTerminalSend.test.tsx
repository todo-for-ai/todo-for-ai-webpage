import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type React from 'react'

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

/** 构造 handleInputKeyDown 可用的伪键盘事件 */
const keyEvent = (key: string, value: string, caret?: number) => {
  const pos = caret ?? value.length
  return {
    key,
    nativeEvent: { isComposing: false },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    currentTarget: { value, selectionStart: pos, selectionEnd: pos },
  } as unknown as React.KeyboardEvent<HTMLTextAreaElement>
}

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

  it('↑↓ 召回输入历史：上翻到最旧、下翻回草稿，光标不在首/末行时不召回', async () => {
    taskChatApi.sendMessage.mockResolvedValue({ id: 1 })
    const { timeline } = makeTimeline()
    const { result } = renderHook(() => useTerminalSend({ ...baseOpts, timeline }))

    act(() => result.current.setInput('第一条'))
    await act(async () => { await result.current.handleSend() })
    act(() => result.current.setInput('第二条'))
    await act(async () => { await result.current.handleSend() })
    act(() => result.current.setInput('当前草稿'))

    // 每次按键都取当前渲染的 handler（真实组件每次渲染重绑，不存在陈旧闭包）
    const kd = (key: string, value: string, caret?: number) =>
      act(() => result.current.handleInputKeyDown(keyEvent(key, value, caret)))
    // ↑（光标在起点）→ 最新一条
    kd('ArrowUp', '当前草稿', 0)
    expect(result.current.input).toBe('第二条')
    // ↑ → 更早一条
    kd('ArrowUp', '第二条', 0)
    expect(result.current.input).toBe('第一条')
    // ↑ 已到最旧，保持
    kd('ArrowUp', '第一条', 0)
    expect(result.current.input).toBe('第一条')
    // ↓ → 前进
    kd('ArrowDown', '第一条')
    expect(result.current.input).toBe('第二条')
    // ↓ 到位后恢复进入翻历史前的草稿
    kd('ArrowDown', '第二条')
    expect(result.current.input).toBe('当前草稿')
  })

  it('召回后编辑再 ↑，从最新一条重新开始；历史入队去重', async () => {
    taskChatApi.sendMessage.mockResolvedValue({ id: 1 })
    const { timeline } = makeTimeline()
    const { result } = renderHook(() => useTerminalSend({ ...baseOpts, timeline }))

    act(() => result.current.setInput('甲'))
    await act(async () => { await result.current.handleSend() })
    act(() => result.current.setInput('乙'))
    await act(async () => { await result.current.handleSend() })

    act(() => result.current.setInput('乙'))
    act(() => result.current.handleInputKeyDown(keyEvent('ArrowUp', '乙', 0)))
    expect(result.current.input).toBe('乙')
    // 编辑了召回值 → 视为新草稿，下次 ↑ 从最新重新开始
    act(() => result.current.setInput('乙（改）'))
    act(() => result.current.handleInputKeyDown(keyEvent('ArrowUp', '乙（改）', 0)))
    expect(result.current.input).toBe('乙')
  })

  it('斜杠补全菜单：/ 弹出全部、前缀过滤、↑↓ 换选中、Enter 执行选中项、Esc 关闭', async () => {
    const { timeline, pushed } = makeTimeline()
    const { result } = renderHook(() => useTerminalSend({ ...baseOpts, timeline }))
    const kd = (key: string, value: string) =>
      act(() => result.current.handleInputKeyDown(keyEvent(key, value)))

    act(() => result.current.setInput('/'))
    expect(result.current.commandMenu.open).toBe(true)
    expect(result.current.commandMenu.items.map(c => c.name)).toEqual(['stop', 'clear', 'help'])

    act(() => result.current.setInput('/cl'))
    expect(result.current.commandMenu.items.map(c => c.name)).toEqual(['clear'])

    act(() => result.current.setInput('/'))
    kd('ArrowDown', '/')
    expect(result.current.commandMenu.index).toBe(1)
    // Enter 执行选中的 /clear（而非把 '/' 原文发送）
    kd('Enter', '/')
    await act(async () => {})
    expect(timeline.clearView).toHaveBeenCalled()
    expect(result.current.input).toBe('')

    act(() => result.current.setInput('/st'))
    kd('Escape', '/st')
    expect(result.current.commandMenu.open).toBe(false)
    expect(result.current.input).toBe('/st')
    // 输入变化后菜单恢复
    act(() => result.current.setInput('/sto'))
    expect(result.current.commandMenu.open).toBe(true)
    expect(pushed).toHaveLength(0)
  })

  it('补全开启时 Enter 执行 /stop 分支；空格后视为普通文本不再弹菜单', async () => {
    const { timeline, pushed } = makeTimeline()
    const { result } = renderHook(() => useTerminalSend({ ...baseOpts, timeline }))

    act(() => result.current.setInput('/s'))
    expect(result.current.commandMenu.items.map(c => c.name)).toEqual(['stop'])
    act(() => result.current.handleInputKeyDown(keyEvent('Enter', '/s')))
    await act(async () => {})
    expect(pushed.some(p => p.text === '当前没有执行中的任务')).toBe(true)

    // 空格 → 不再是命令名输入态
    act(() => result.current.setInput('/stop '))
    expect(result.current.commandMenu.open).toBe(false)
  })
})
