import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

const { taskChatApi, runtimeEventsApi } = vi.hoisted(() => ({
  taskChatApi: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
  runtimeEventsApi: {
    list: vi.fn(),
    stopAgent: vi.fn(),
  },
}))

vi.mock('../../../src/api/taskChat.js', () => ({ taskChatApi }))
vi.mock('../../../src/api/runtimeEvents.js', () => ({ runtimeEventsApi }))
vi.mock('../../../src/services/websocketService', () => ({
  wsService: {
    on: () => () => {},
    joinTaskRoom: vi.fn(),
    leaveTaskRoom: vi.fn(),
  },
}))

import { useAgentTimeline } from '../../../src/hooks/useAgentTimeline'

const chatPage = (taskId: number, marker: string) => ({
  items: [
    { id: taskId * 10, task_id: taskId, actor_type: 'human', content: marker, content_type: 'text', created_at: '2026-09-18T10:00:00' },
  ],
  total: 1,
  page: 1,
})

describe('useAgentTimeline 任务切换重置（回归：游标残留致新任务事件流整段拉空）', () => {
  it('switching task clears old lines and refetches with after_id=0', async () => {
    taskChatApi.getMessages.mockImplementation(async (_id: number) => chatPage(1, '任务一的消息'))
    runtimeEventsApi.list.mockResolvedValue({
      task_id: 1,
      items: [
        { id: 501, attempt_id: 'a', event_type: 'output', seq: 1, message: '旧任务事件', event_timestamp: '2026-09-18T10:00:01' },
      ],
      last_id: 501,
    })

    const { result, rerender } = renderHook(({ taskId }) => useAgentTimeline(taskId), {
      initialProps: { taskId: 1 as number | null },
    })

    await waitFor(() => expect(result.current.lines.length).toBeGreaterThan(0))
    expect(result.current.lines.some(l => l.text === '旧任务事件')).toBe(true)

    // 切到事件 id 更小的新任务：游标必须归零重拉
    taskChatApi.getMessages.mockImplementation(async (_id: number) => chatPage(2, '任务二的消息'))
    runtimeEventsApi.list.mockResolvedValue({
      task_id: 2,
      items: [
        { id: 7, attempt_id: 'b', event_type: 'output', seq: 1, message: '新任务事件', event_timestamp: '2026-09-18T11:00:01' },
      ],
      last_id: 7,
    })

    rerender({ taskId: 2 })

    await waitFor(() => {
      expect(result.current.lines.some(l => l.text === '新任务事件')).toBe(true)
    })
    // 旧任务内容不残留
    expect(result.current.lines.some(l => l.text === '旧任务事件')).toBe(false)
    expect(result.current.lines.some(l => l.text === '任务一的消息')).toBe(false)
    // 新任务事件以 after_id=0 拉取（旧游标 501 会把 id=7 全部滤掉）
    const calls = runtimeEventsApi.list.mock.calls.filter(c => c[0] === 2)
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0][1]).toBe(0)
  })

  it('slow chat response from previous task does not overwrite current task', async () => {
    let resolveA: (v: any) => void = () => {}
    taskChatApi.getMessages.mockImplementation((id: number) => {
      if (id === 1) {
        return new Promise(resolve => { resolveA = resolve })
      }
      return Promise.resolve(chatPage(2, '任务二的消息'))
    })
    runtimeEventsApi.list.mockResolvedValue({ task_id: 2, items: [], last_id: 0 })

    const { result, rerender } = renderHook(({ taskId }) => useAgentTimeline(taskId), {
      initialProps: { taskId: 1 as number | null },
    })
    // 不等任务一的慢响应，直接切走
    rerender({ taskId: 2 })
    await waitFor(() => expect(result.current.lines.some(l => l.text === '任务二的消息')).toBe(true))

    // 旧任务慢响应此时才回来——不得覆盖任务二
    await act(async () => {
      resolveA(chatPage(1, '迟到的任务一消息'))
      await new Promise(r => setTimeout(r, 10))
    })
    expect(result.current.lines.some(l => l.text === '迟到的任务一消息')).toBe(false)
  })

  it('上翻浏览时新事件计入 newBelow；回到底部清零后可继续累计', async () => {
    taskChatApi.getMessages.mockImplementation(async (_id: number) => chatPage(1, '任务一的消息'))
    runtimeEventsApi.list.mockResolvedValue({ task_id: 1, items: [], last_id: 0 })

    const { result } = renderHook(() => useAgentTimeline(1))
    await waitFor(() => expect(result.current.lines.length).toBeGreaterThan(0))

    // 用户上翻（模拟滚动离开底部）
    act(() => {
      // @ts-expect-error 测试桩：只关心滚动位置计算
      result.current.scrollRef.current = { scrollHeight: 500, scrollTop: 0, clientHeight: 100 }
      result.current.handleScroll()
    })
    expect(result.current.atBottom).toBe(false)

    // 新事件到达 → 计入 newBelow
    act(() => {
      result.current.appendEvents([
        { id: 11, attempt_id: 'a', event_type: 'output', seq: 1, message: '新输出A', event_timestamp: '2026-09-18T10:01:00' },
        { id: 12, attempt_id: 'a', event_type: 'output', seq: 2, message: '新输出B', event_timestamp: '2026-09-18T10:01:01' },
      ])
    })
    await waitFor(() => expect(result.current.newBelow).toBe(2))

    // 回到底部 → 清零
    act(() => result.current.scrollToBottom())
    expect(result.current.newBelow).toBe(0)

    // 再上翻 → 新输出继续累计
    act(() => {
      // @ts-expect-error 测试桩
      result.current.scrollRef.current = { scrollHeight: 500, scrollTop: 0, clientHeight: 100 }
      result.current.handleScroll()
    })
    act(() => {
      result.current.appendEvents([
        { id: 13, attempt_id: 'a', event_type: 'output', seq: 3, message: '新输出C', event_timestamp: '2026-09-18T10:01:02' },
      ])
    })
    await waitFor(() => expect(result.current.newBelow).toBe(1))
  })
})
