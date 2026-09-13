import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { message } from 'antd'

const { agentsApi, dashboardApi } = vi.hoisted(() => ({
  agentsApi: {
    getCollaborationMetrics: vi.fn(async () => ({})),
    getCollaborationGraph: vi.fn(async () => ({
      nodes: [
        { id: 1, name: 'alice', kind: 'assistant', messages: 10 },
        { id: 2, name: 'bob', kind: 'coordinator', messages: 8 },
      ],
      edges: [{ source: 1, target: 2, count: 5, source_to_target: 3, target_to_source: 2 }],
      total_edges: 1,
    })),
    getAgentCollaborators: vi.fn(async () => ({ collaborators: [{ agent_id: 2, name: 'bob', total: 5, sent: 3, received: 2 }] })),
    getSecurityEvents: vi.fn(async () => ({ items: [{ id: 1, severity: 'CRITICAL' }] })),
    getSecurityEventsDailyTrend: vi.fn(async () => ({ days: [{ total: 4 }, { total: 6 }], totals: { total: 10 } })),
    getSecurityEventsByAgent: vi.fn(async () => ({ byAgent: true })),
    getOrchestratorStatus: vi.fn(async () => ({ status: true })),
    getOrchestratorDailyTrend: vi.fn(async () => ({ orchTrend: true })),
    getConflictsDashboard: vi.fn(async () => ({ total: 9, active: 2 })),
    listConflicts: vi.fn(async () => ({ items: [{ id: 1 }] })),
    getConflictsTrend: vi.fn(async () => ({})),
    getConflictsByAgent: vi.fn(async () => ({})),
    getConflictsStrategyStats: vi.fn(async () => ({})),
    orchestrate: vi.fn(async () => ({ duration_seconds: 2 })),
    autoResolveConflicts: vi.fn(async () => ({ resolved: 3 })),
    resolveConflict: vi.fn(async () => ({ actions: [{ a: 1 }] })),
    exportSecurityEvents: vi.fn(async () => 'csv'),
    getSandboxDashboard: vi.fn(async () => ({})),
    getSandboxViolationTrend: vi.fn(async () => ({})),
    getSandboxViolationsByAgent: vi.fn(async () => ({})),
    getSandboxTemplateUsage: vi.fn(async () => ({})),
    getCollaborationGraphTimeline: vi.fn(async () => ({})),
  },
  dashboardApi: {
    getStats: vi.fn(async () => ({})),
    getAgentMonitor: vi.fn(async () => ({ summary: { active: 1, total: 4, busy: 2, offline: 1 } })),
  },
}))

vi.mock('../../../src/api/agents', () => ({ agentsApi }))
vi.mock('../../../src/api/dashboard', () => ({ dashboardApi }))

import { useCommandCenterCollabGraph } from '../../../src/pages/commandCenter/useCommandCenterCollabGraph'
import { useCommandCenterData } from '../../../src/pages/commandCenter/useCommandCenterData'

describe('useCommandCenterCollabGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('collabGraphForceParams')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem('collabGraphForceParams')
  })

  it('首屏按 30 天窗口拉图，all 窗口不带 since', async () => {
    const { result } = renderHook(() => useCommandCenterCollabGraph())
    await waitFor(() => expect(result.current.collabGraph).toBeTruthy())
    expect(agentsApi.getCollaborationGraph).toHaveBeenCalledWith({ limit: 50, since: expect.any(String) })
    act(() => {
      result.current.setGraphWindow('all')
    })
    await waitFor(() => expect(agentsApi.getCollaborationGraph).toHaveBeenLastCalledWith({ limit: 50 }))
  })

  it('collabSummary 汇总节点/边/最活跃对', async () => {
    const { result } = renderHook(() => useCommandCenterCollabGraph())
    await waitFor(() => expect(result.current.collabSummary).toEqual({
      nodeCount: 2, edgeCount: 1, topPair: { source: 'alice', target: 'bob', count: 5 },
    }))
  })

  it('loadCollabDetail 汇入明细', async () => {
    const { result } = renderHook(() => useCommandCenterCollabGraph())
    await act(async () => {
      await result.current.loadCollabDetail(1, 'alice')
    })
    expect(result.current.collabDetail?.loading).toBe(false)
    expect(result.current.collabDetailGraph?.edges[0]).toMatchObject({ source: 1, target: 2, count: 5 })
  })

  it('CSV 导出聚合完整数据走下载', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:u') as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL
    vi.spyOn(document.body, 'appendChild').mockImplementation(((n: Node) => n) as never)
    vi.spyOn(document.body, 'removeChild').mockImplementation(((n: Node) => n) as never)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useCommandCenterCollabGraph())
    await waitFor(() => expect(result.current.collabGraph).toBeTruthy())
    act(() => {
      result.current.exportCollabGraph()
    })
    expect(successSpy).toHaveBeenCalledWith('协作关系图已导出为 CSV')
    expect(clickSpy).toHaveBeenCalled()
  })
})

describe('useCommandCenterData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loadAll 一次并发拉取 11 个端点并落状态', async () => {
    const { result } = renderHook(() => useCommandCenterData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(dashboardApi.getAgentMonitor).toHaveBeenCalledWith({ hours: '24' })
    expect(agentsApi.getConflictsDashboard).toHaveBeenCalled()
    expect(agentsApi.listConflicts).toHaveBeenCalledWith({ active_only: 'true' })
    expect(agentsApi.getSecurityEvents).toHaveBeenCalledWith({ per_page: 10 })
    expect(agentsApi.getSecurityEventsDailyTrend).toHaveBeenCalledWith({ since: expect.any(String) })
    expect(agentsApi.getConflictsTrend).toHaveBeenCalledWith(30)
    expect(result.current.conflictList).toHaveLength(1)
    expect(result.current.securityEvents).toHaveLength(1)
    expect(result.current.lastRefresh).not.toBe('')
    // 派生摘要（从组件体迁入的口径）
    expect(result.current.activeAgents).toBe(1)
    expect(result.current.totalAgents).toBe(4)
    expect(result.current.conflictTotal).toBe(9)
    expect(result.current.conflictActive).toBe(2)
    expect(result.current.criticalEvents).toBe(1)
    expect(result.current.trendTotal).toBe(10)
  })

  it('趋势筛选变化驱动 loadAll 以新参数重拉', async () => {
    const { result } = renderHook(() => useCommandCenterData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => {
      result.current.setTrendWindow('all')
      result.current.setTrendSeverity('high')
      result.current.setTrendEventType('conflict')
    })
    await waitFor(() => expect(agentsApi.getSecurityEventsDailyTrend).toHaveBeenLastCalledWith({ severity: 'high', event_type: 'conflict' }))
    expect(agentsApi.getOrchestratorDailyTrend).toHaveBeenLastCalledWith({ severity: 'high', event_type: 'conflict' })
  })

  it('runOrchestration 成功后刷新编排器状态', async () => {
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useCommandCenterData())
    await waitFor(() => expect(result.current.runOrchestration).toBeTruthy())
    await act(async () => {
      await result.current.runOrchestration()
    })
    expect(agentsApi.orchestrate).toHaveBeenCalledTimes(1)
    expect(successSpy).toHaveBeenCalledWith(expect.stringContaining('编排完成（2s'))
    expect(agentsApi.getOrchestratorStatus.mock.calls.length).toBeGreaterThanOrEqual(2)
    successSpy.mockRestore()
  })

  it('submitResolveConflict 成功后关 Modal 静默刷新', async () => {
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useCommandCenterData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    act(() => {
      result.current.setResolveForm({ conflict_id: 7, strategy: 'manual', description: 'd' })
      result.current.setResolveOpen(true)
    })
    await act(async () => {
      await result.current.submitResolveConflict()
    })
    expect(agentsApi.resolveConflict).toHaveBeenCalledWith(7, 'manual', 'd')
    expect(successSpy).toHaveBeenCalledWith('冲突已解决')
    expect(result.current.resolveOpen).toBe(false)
    successSpy.mockRestore()
  })

  it('autoResolveConflicts 失败提示', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.autoResolveConflicts.mockRejectedValueOnce(new Error('x'))
    const { result } = renderHook(() => useCommandCenterData())
    await waitFor(() => expect(result.current.autoResolveConflicts).toBeTruthy())
    await act(async () => {
      await result.current.autoResolveConflicts()
    })
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
