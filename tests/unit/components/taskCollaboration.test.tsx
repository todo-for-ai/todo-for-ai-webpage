import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { message } from 'antd'

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
    handoffTask: vi.fn(async () => ({ ok: true })),
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

describe('useTaskAssignmentActions 动作分支补全', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const withActions = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('openFeedbackModal + submitHumanFeedback 成功后清空反馈态', async () => {
    const { result } = withActions()
    await waitFor(() => expect(result.current.assignments).toHaveLength(1))
    const assignment = result.current.assignments[0]
    act(() => {
      result.current.openFeedbackModal(assignment as never)
    })
    expect(result.current.feedbackAssignment).toBeTruthy()
    await act(async () => {
      await result.current.submitHumanFeedback()
    })
    expect(agentsApi.updateTaskAssignment).toHaveBeenCalled()
    expect(result.current.feedbackAssignment).toBeNull()
    expect(result.current.feedbackSubmitting).toBe(false)
  })

  it('postMessage 无内容早退、成功后清空并刷新', async () => {
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = withActions()
    await waitFor(() => expect(result.current.loadCollaboration).toBeTruthy())
    await act(async () => {
      await result.current.postMessage()
    })
    expect(agentsApi.postTaskEvent).not.toHaveBeenCalled()
    act(() => {
      result.current.setComposerContent('hello')
    })
    await act(async () => {
      await result.current.postMessage()
    })
    expect(agentsApi.postTaskEvent).toHaveBeenCalledWith(42, { content: 'hello', event_type: 'message', to_agent_id: undefined })
    expect(result.current.composerContent).toBe('')
    expect(successSpy).toHaveBeenCalled()
    successSpy.mockRestore()
  })

  it('postMessage 失败给出错误提示', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.postTaskEvent.mockRejectedValueOnce(new Error('net down'))
    const { result } = withActions()
    await waitFor(() => expect(result.current.loadCollaboration).toBeTruthy())
    act(() => {
      result.current.setComposerContent('hi')
    })
    await act(async () => {
      await result.current.postMessage()
    })
    expect(errorSpy).toHaveBeenCalledWith('net down')
    expect(result.current.posting).toBe(false)
    errorSpy.mockRestore()
  })

  it('loadDispatchAgents 拉取派发候选并打开弹窗', async () => {
    const { result } = withActions()
    await waitFor(() => expect(result.current.loadDispatchAgents).toBeTruthy())
    await act(async () => {
      await result.current.loadDispatchAgents()
    })
    expect(agentsApi.getAgents).toHaveBeenCalled()
    act(() => {
      result.current.openDispatchModal()
    })
    expect(result.current.dispatchOpen).toBe(true)
  })

  it('openHandoffModal + submitHandoff 成功后清空交接态', async () => {
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = withActions()
    await waitFor(() => expect(result.current.assignments).toHaveLength(1))
    const assignment = result.current.assignments[0]
    act(() => {
      result.current.openHandoffModal(assignment as never)
    })
    expect(result.current.handoffAssignment).toBeTruthy()
    await act(async () => {
      await result.current.submitHandoff()
    })
    expect(agentsApi.handoffTask).toHaveBeenCalled()
    expect(result.current.handoffAssignment).toBeNull()
    expect(result.current.handoffSubmitting).toBe(false)
    successSpy.mockRestore()
  })
})

describe('useTaskAssignmentActions 失败路径', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const withActions = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('postMessage 失败给出错误提示并复位 posting', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.postTaskEvent.mockRejectedValueOnce(new Error('net down'))
    const { result } = withActions()
    await waitFor(() => expect(result.current.loadCollaboration).toBeTruthy())
    act(() => {
      result.current.setComposerContent('hi')
    })
    await act(async () => {
      await result.current.postMessage()
    })
    expect(errorSpy).toHaveBeenCalledWith('net down')
    expect(result.current.posting).toBe(false)
    errorSpy.mockRestore()
  })

  it('submitHandoff 失败给出错误提示并复位', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.handoffTask.mockRejectedValueOnce(new Error('x'))
    const { result } = withActions()
    await waitFor(() => expect(result.current.assignments).toHaveLength(1))
    const assignment = result.current.assignments[0]
    act(() => {
      result.current.openHandoffModal(assignment as never)
    })
    await act(async () => {
      await result.current.submitHandoff()
    })
    expect(errorSpy).toHaveBeenCalled()
    expect(result.current.handoffSubmitting).toBe(false)
    errorSpy.mockRestore()
  })
})

describe('useTaskCollaborationData 轮询/SSE/失败分支', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const withData = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('loadRunLogs 失败静默复位', async () => {
    agentsApi.getRunLogs.mockRejectedValueOnce(new Error('x'))
    const { result } = withData()
    await act(async () => {
      await result.current.loadRunLogs(9)
    })
    expect(result.current.runLogsLoading).toBe(false)
  })

  it('轮询：8 秒间隔静默刷新', async () => {
    const { result } = withData()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000)
    })
    const calls = agentsApi.getTaskEvents.mock.calls.length
    expect(calls).toBeGreaterThanOrEqual(1)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000)
    })
    expect(agentsApi.getTaskEvents.mock.calls.length).toBeGreaterThan(calls)
  })

  it('SSE onEvent 触发静默刷新', async () => {
    vi.useRealTimers()
    const { result } = withData()
    await waitFor(() => expect(result.current.loadCollaboration).toBeTruthy())
    const before = agentsApi.getTaskEvents.mock.calls.length
    act(() => {
      result.current.loadCollaboration({ silent: true })
    })
    await waitFor(() => expect(agentsApi.getTaskEvents.mock.calls.length).toBeGreaterThan(before))
  })
})

describe('useTaskCollaborationData 轮询守卫与失败分支', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const withData = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('taskId 缺失时 loadCollaboration 早退（覆盖守卫行）', async () => {
    const r0 = renderHook(() => useTaskCollaborationData(0))
    await act(async () => {
      await r0.result.current.loadCollaboration()
    })
    expect(agentsApi.getTaskEvents).not.toHaveBeenCalled()
    r0.unmount()
  })

  it('document.hidden 时轮询跳过', async () => {
    const original = document.hidden
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    try {
      const before = agentsApi.getTaskEvents.mock.calls.length
      await act(async () => {
        await vi.advanceTimersByTimeAsync(24000)
      })
      expect(agentsApi.getTaskEvents.mock.calls.length).toBe(before)
    } finally {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    }
  })
})

describe('useTaskCollaborationData 非静默失败', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const withData = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('loadCollaboration 失败置 loadFailed', async () => {
    agentsApi.getTaskEvents.mockRejectedValue('x')
    const { result } = withData()
    await waitFor(() => expect(result.current.loadFailed).toBe(true))
    agentsApi.getTaskEvents.mockRestore()
  })
})

describe('useTaskCollaborationData SSE 静默刷新', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sseOptions.length = 0
  })

  const withData = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('SSE onEvent 触发静默刷新', async () => {
    const { result } = withData()
    await waitFor(() => expect(result.current.loadCollaboration).toBeTruthy())
    const before = agentsApi.getTaskEvents.mock.calls.length
    const options = sseOptions[sseOptions.length - 1]
    await act(async () => {
      options.onEvent({ event_type: 'task.updated' })
    })
    await waitFor(() => expect(agentsApi.getTaskEvents.mock.calls.length).toBeGreaterThan(before))
  })
})

describe('useTaskCollaborationData 轮询守卫与 SSE 静默刷新（覆盖补齐）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sseOptions.length = 0
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const withData = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('document.hidden 时轮询跳过', async () => {
    const original = document.hidden
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    try {
      const { result } = withData()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      const before = agentsApi.getTaskEvents.mock.calls.length
      await act(async () => {
        await vi.advanceTimersByTimeAsync(24000)
      })
      expect(agentsApi.getTaskEvents.mock.calls.length).toBe(before)
    } finally {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    }
  })

  it('document.hidden 可见时 8 秒轮询静默刷新', async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    const { result } = withData()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const before = agentsApi.getTaskEvents.mock.calls.length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000)
    })
    expect(agentsApi.getTaskEvents.mock.calls.length).toBeGreaterThan(before)
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  it('SSE onEvent 触发静默刷新', async () => {
    const { result } = withData()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    const before = agentsApi.getTaskEvents.mock.calls.length
    const options = sseOptions[sseOptions.length - 1]
    await act(async () => {
      options.onEvent({ event_type: 'task.updated' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })
    expect(agentsApi.getTaskEvents.mock.calls.length).toBeGreaterThan(before)
  })
})

describe('useTaskAssignmentActions 反馈与交接失败路径', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sseOptions.length = 0
  })

  const withData = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('submitHumanFeedback 成功走反馈更新并清空反馈态', async () => {
    const { result } = withData()
    await waitFor(() => expect(result.current.assignments).toHaveLength(1))
    const assignment = result.current.assignments[0]
    act(() => {
      result.current.openFeedbackModal(assignment as never)
    })
    await act(async () => {
      await result.current.submitHumanFeedback()
    })
    expect(agentsApi.updateTaskAssignment).toHaveBeenCalled()
    expect(result.current.feedbackAssignment).toBeNull()
    expect(result.current.feedbackSubmitting).toBe(false)
  })

  it('submitHandoff 失败给出错误提示并复位', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.handoffTask.mockRejectedValue(new Error('handoff boom'))
    const { result } = withData()
    await waitFor(() => expect(result.current.assignments).toHaveLength(1))
    const assignment = result.current.assignments[0]
    act(() => {
      result.current.openHandoffModal(assignment as never)
    })
    await act(async () => {
      await result.current.submitHandoff()
    })
    expect(errorSpy).toHaveBeenCalledWith('handoff boom')
    expect(result.current.handoffSubmitting).toBe(false)
    errorSpy.mockRestore()
  })
})

describe('useTaskAssignmentActions 守卫与非 Error 回退分支', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sseOptions.length = 0
  })

  const withActions = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('submitHumanFeedback 无反馈对象时早退', async () => {
    const { result } = withActions()
    await act(async () => {
      await result.current.submitHumanFeedback()
    })
    expect(result.current.feedbackSubmitting).toBe(false)
  })

  it('submitHandoff 无交接对象时早退', async () => {
    const { result } = withActions()
    await act(async () => {
      await result.current.submitHandoff()
    })
    expect(result.current.handoffSubmitting).toBe(false)
  })

  it('updateAssignment 非 Error 抛出走 tp 兜底', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.updateTaskAssignment.mockRejectedValueOnce('plain-reject')
    const { result } = withActions()
    await waitFor(() => expect(result.current.assignments).toHaveLength(1))
    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.updateAssignment(result.current.assignments[0], { state: 'done' } as never)
    })
    expect(ok).toBe(false)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})

describe('useTaskCollaborationData dispatch noTask 分支', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const withActions = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('claimTask 返回空时提示无任务并返回', async () => {
    const infoSpy = vi.spyOn(message, 'info').mockImplementation(() => undefined as never)
    agentsApi.claimTask.mockResolvedValueOnce(null as never)
    const { result } = withActions()
    await waitFor(() => expect(result.current.loadCollaboration).toBeTruthy())
    await act(async () => {
      await result.current.submitDispatch()
    })
    expect(infoSpy).toHaveBeenCalled()
    infoSpy.mockRestore()
  })
})

describe('useTaskAssignmentActions loadDispatchAgents 失败', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sseOptions.length = 0
  })

  const withActions = () => renderHook(() => {
    const data = useTaskCollaborationData(42)
    const actions = useTaskAssignmentActions(42, (k: string) => k, data)
    return { ...data, ...actions }
  })

  it('loadDispatchAgents 失败给出错误提示并复位', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.getAgents.mockRejectedValueOnce(new Error('agents boom'))
    const { result } = withActions()
    await waitFor(() => expect(result.current.loadDispatchAgents).toBeTruthy())
    await act(async () => {
      await result.current.loadDispatchAgents()
    })
    expect(errorSpy).toHaveBeenCalledWith('agents boom')
    expect(result.current.dispatchLoading).toBe(false)
    errorSpy.mockRestore()
  })
})
