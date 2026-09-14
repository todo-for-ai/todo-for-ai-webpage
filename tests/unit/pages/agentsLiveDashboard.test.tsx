import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { agentsApi, dashboardApi, notification, useCollaborationSSE, policyMocks } = vi.hoisted(() => ({
  agentsApi: {
    dispatchTasks: vi.fn(async () => ({})),
  },
  dashboardApi: {
    getStats: vi.fn(async () => ({ total_agents: 3 })),
  },
  notification: {
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
  useCollaborationSSE: vi.fn(),
  policyMocks: {
    getAgentDispatchPolicy: vi.fn(() => ({ auto_dispatch_enabled: true })),
    normalizeDispatchOptions: vi.fn(() => ({ mode: 'auto' })),
  },
}))

vi.mock('../../../src/api/agents', () => ({ agentsApi }))
vi.mock('../../../src/api/dashboard', () => ({ dashboardApi }))
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  return { ...actual, notification }
})
vi.mock('../../../src/hooks/useCollaborationSSE', () => ({ useCollaborationSSE }))
vi.mock('../../../src/pages/agents/utils', () => ({ getAgentDispatchPolicy: policyMocks.getAgentDispatchPolicy, normalizeDispatchOptions: policyMocks.normalizeDispatchOptions }))

import { useAgentLiveDashboard } from '../../../src/pages/agents/hooks/useAgentLiveDashboard'

const baseCtx = () => ({
  agents: [
    { id: 1, kind: 'coordinator', status: 'active' },
    { id: 2, kind: 'worker', status: 'active' },
  ] as any,
  statusFilter: 'all' as const,
  searchText: '',
  reviewActionFilter: 'all' as const,
  drawerOpen: false,
  selectedAgent: null,
  loadAgents: vi.fn(async () => {}),
  loadReviewQueue: vi.fn(async () => {}),
  loadAssignments: vi.fn(async () => {}),
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useAgentLiveDashboard', () => {
  it('loadDashboardStats 成功与静默失败', async () => {
    const { result } = renderHook(() => useAgentLiveDashboard(baseCtx()))
    expect(result.current.liveMode).toBe(true)
    await act(async () => {
      await result.current.loadDashboardStats()
    })
    expect(result.current.dashboardStats).toEqual({ total_agents: 3 })
    dashboardApi.getStats.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.loadDashboardStats()
    })
    expect(result.current.dashboardStats).toEqual({ total_agents: 3 })
  })

  it('10s 定时刷新：liveMode 开启时静默拉取并刷新选中 Drawer；关闭时不拉', async () => {
    const ctx = baseCtx()
    const { result } = renderHook(() => useAgentLiveDashboard(ctx))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(ctx.loadAgents).toHaveBeenCalledWith({ silent: true })
    expect(ctx.loadReviewQueue).toHaveBeenCalledWith({ silent: true })
    expect(ctx.loadAssignments).not.toHaveBeenCalled()
    act(() => {
      result.current.setLiveMode(false)
    })
    act(() => {
      vi.advanceTimersByTime(30000)
    })
    expect(ctx.loadAgents).toHaveBeenCalledTimes(1)
  })

  it('10s 定时刷新：Drawer 打开时同步刷新 assignments', async () => {
    const ctx = { ...baseCtx(), drawerOpen: true, selectedAgent: { id: 9 } as any }
    renderHook(() => useAgentLiveDashboard(ctx))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(ctx.loadAssignments).toHaveBeenCalledWith(ctx.selectedAgent, { silent: true })
  })

  it('60s 自动派活：仅对开启策略的活跃 coordinator 派发，失败静默', async () => {
    const ctx = baseCtx()
    ctx.agents = [
      { id: 1, kind: 'coordinator', status: 'active' },
      { id: 2, kind: 'coordinator', status: 'active' },
      { id: 3, kind: 'coordinator', status: 'offline' },
      { id: 4, kind: 'worker', status: 'active' },
    ] as any
    policyMocks.getAgentDispatchPolicy.mockImplementation((a: any) =>
      a.id === 1 ? { auto_dispatch_enabled: true } : { auto_dispatch_enabled: false })
    agentsApi.dispatchTasks.mockRejectedValueOnce(new Error('no claimable'))
    renderHook(() => useAgentLiveDashboard(ctx))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000)
    })
    expect(agentsApi.dispatchTasks).toHaveBeenCalledTimes(1)
    expect(agentsApi.dispatchTasks).toHaveBeenCalledWith(1, { mode: 'auto' })
  })

  it('SSE：Drawer 打开时同步刷新 assignments', async () => {
    const ctx = { ...baseCtx(), drawerOpen: true, selectedAgent: { id: 8 } as any }
    renderHook(() => useAgentLiveDashboard(ctx))
    const onEvent = useCollaborationSSE.mock.calls[0][0].onEvent
    act(() => {
      onEvent({ event_type: 'other', payload: {} })
    })
    expect(ctx.loadAssignments).toHaveBeenCalledWith(ctx.selectedAgent, { silent: true })
  })

  it('SSE：各事件类型通知 + 追加实时事件列表（上限 30）', async () => {
    const ctx = baseCtx()
    const { result } = renderHook(() => useAgentLiveDashboard(ctx))
    expect(useCollaborationSSE).toHaveBeenCalled()
    const config = useCollaborationSSE.mock.calls[0][0]
    expect(config.enabled).toBe(true)
    const onEvent = config.onEvent
    act(() => {
      onEvent({ event_type: 'sandbox_violation', payload: { execution_id: 5, violation_type: 'tool' } })
    })
    expect(notification.warning).toHaveBeenCalledWith(expect.objectContaining({ message: '沙盒策略违规' }))
    act(() => {
      onEvent({ event_type: 'sandbox_step_violation', payload: { step_key: 's', run_id: 6, terminated: true } })
    })
    act(() => {
      onEvent({ event_type: 'sandbox_execution_revoked', payload: { execution_id: 7 } })
    })
    expect(notification.info).toHaveBeenCalledWith(expect.objectContaining({ message: '沙盒执行已吊销' }))
    act(() => {
      onEvent({ event_type: 'conflicts_detected', payload: { count: 2 } })
    })
    expect(notification.warning).toHaveBeenLastCalledWith(expect.objectContaining({ message: '检测到协作冲突' }))
    act(() => {
      onEvent({ event_type: 'conflict_resolved', payload: { conflict_id: 3, strategy: 'reassign' } })
    })
    expect(notification.success).toHaveBeenCalledWith(expect.objectContaining({ message: '冲突已解决' }))
    act(() => {
      onEvent({ event_type: 'conflicts_auto_resolved', payload: { count: 4 } })
    })
    expect(notification.success).toHaveBeenLastCalledWith(expect.objectContaining({ message: '冲突自动解决完成' }))
    act(() => {
      onEvent({ event_type: 'other', payload: {} })
    })
    // 空载荷事件也有默认值分支
    act(() => {
      onEvent({ event_type: 'sandbox_violation', payload: undefined })
    })
    // 事件列表追加
    expect(result.current.liveEvents.length).toBeGreaterThanOrEqual(7)
    expect(result.current.liveEvents[0].type).toBe('sandbox_violation')
    // 上限裁剪：追加 40 条仅留最近 30
    act(() => {
      for (let i = 0; i < 40; i++) onEvent({ event_type: `e${i}`, payload: {} })
    })
    expect(result.current.liveEvents).toHaveLength(30)
    expect(result.current.liveEvents[0].type).toBe('e39')
  })
})
