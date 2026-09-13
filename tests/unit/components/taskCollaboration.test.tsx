import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { agentsApi } = vi.hoisted(() => ({
  agentsApi: {
    getRunLogs: vi.fn(async () => ({ items: [{ id: 1, level: 'info' }] })),
    getTaskAssignments: vi.fn(async () => ({ items: [{ id: 11, state: 'active' }] })),
    getTaskEvents: vi.fn(async () => ({ items: [{ id: 21, type: 'message' }] })),
    updateTaskAssignment: vi.fn(async () => ({ id: 11 })),
    getAgents: vi.fn(async () => ({ items: [{ id: 5, name: 'agent-5' }] })),
    dispatchTask: vi.fn(async () => ({ ok: true })),
    submitAssignmentFeedback: vi.fn(async () => ({ ok: true })),
    dispatchTaskToAgent: vi.fn(async () => ({ ok: true })),
    claimTask: vi.fn(async () => ({ ok: true, actions: [] })),
    postTaskEvent: vi.fn(async () => ({ id: 31 })),
  },
}))

vi.mock('../../../src/api/agents', () => ({ agentsApi }))
const sseOptions: Array<any> = []
vi.mock('../../../src/hooks/useCollaborationSSE', () => ({
  useCollaborationSSE: (options: any) => { sseOptions.push(options) },
}))

import { useTaskCollaborationData } from '../../../src/pages/components/TaskDetail/useTaskCollaborationData'
import { useTaskAssignmentActions } from '../../../src/pages/components/TaskDetail/useTaskAssignmentActions'

describe('useTaskCollaborationData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sseOptions.length = 0
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('装载事件/指派与轮询定时器', async () => {
    const { result } = renderHook(() => useTaskCollaborationData(42))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(agentsApi.getTaskEvents).toHaveBeenCalledWith(42, { per_page: 50 })
    expect(agentsApi.getTaskAssignments).toHaveBeenCalledWith(42, { state: 'active', per_page: 10 })
    expect(result.current.events).toHaveLength(1)
    expect(result.current.assignments).toHaveLength(1)
    expect(result.current.loading).toBe(false)
  })

  it('loadRunLogs 按 runId 缓存日志', async () => {
    const { result } = renderHook(() => useTaskCollaborationData(42))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    await act(async () => {
      await result.current.loadRunLogs(77)
    })
    expect(agentsApi.getRunLogs).toHaveBeenCalledWith(77, { per_page: 200 })
    expect(result.current.runLogs[77]).toHaveLength(1)
    await act(async () => {
      await result.current.loadRunLogs(77)
    })
    expect(agentsApi.getRunLogs).toHaveBeenCalledTimes(2)
  })

  it('liveMode 关闭后停止轮询', async () => {
    const { result } = renderHook(() => useTaskCollaborationData(42))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const callsBefore = agentsApi.getTaskEvents.mock.calls.length
    act(() => {
      result.current.setLiveMode(false)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120000)
    })
    expect(agentsApi.getTaskEvents.mock.calls.length).toBe(callsBefore)
  })
})

describe('useTaskAssignmentActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sseOptions.length = 0
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const withData = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('updateAssignment 更新指派后静默刷新', async () => {
    const { result } = withData()
    await waitFor(() => expect(result.current.assignments).toHaveLength(1))
    await act(async () => {
      await result.current.updateAssignment({ id: 11 } as never, { state: 'done' } as never)
    })
    expect(agentsApi.updateTaskAssignment).toHaveBeenCalled()
  })

  it('发帖走 postTaskEvent 并追加事件', async () => {
    const { result } = withData()
    await waitFor(() => expect(result.current.events).toHaveLength(1))
    act(() => {
      result.current.setComposerContent('hello')
    })
    const eventsBefore = agentsApi.getTaskEvents.mock.calls.length
    await act(async () => {
      await result.current.postMessage()
    })
    expect(agentsApi.postTaskEvent).toHaveBeenCalled()
    expect(result.current.composerContent).toBe('')
    void eventsBefore
  })

  it('submitDispatch 提交派发并关闭弹窗', async () => {
    const { result } = withData()
    await waitFor(() => expect(result.current.loadDispatchAgents).toBeTruthy())
    await act(async () => {
      await result.current.loadDispatchAgents()
    })
    expect(agentsApi.getAgents).toHaveBeenCalled()
    act(() => {
      result.current.setDispatchOpen(true)
    })
    await act(async () => {
      await result.current.submitDispatch()
    })
    expect(result.current.dispatchOpen).toBe(false)
  })
})
