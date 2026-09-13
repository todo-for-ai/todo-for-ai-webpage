import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { message } from 'antd'

// vi.mock 会被提升到文件顶部，被工厂引用的桩必须经 vi.hoisted 创建
const { agentsApi, dashboardApi, tp, sseOptionsHistory } = vi.hoisted(() => ({
  agentsApi: {
    getCollaborationMetrics: vi.fn(async () => ({ metrics: true })),
    getSandboxDashboard: vi.fn(async () => ({ sandbox: true })),
    getSandboxViolationTrend: vi.fn(async () => ({ trend: true })),
    getSandboxViolationsByAgent: vi.fn(async () => ({ byAgent: true })),
    getSandboxTemplateUsage: vi.fn(async () => ({ usage: true })),
    getCollaborationGraphTimeline: vi.fn(async () => ({ timeline: true })),
    getSecurityEvents: vi.fn(async () => ({ items: [{ id: 1 }] })),
    getSecurityEventsDailyTrend: vi.fn(async () => ({ secTrend: true })),
    getSecurityEventsByAgent: vi.fn(async () => ({ secByAgent: true })),
    getOrchestratorDailyTrend: vi.fn(async () => ({ orchTrend: true })),
    getOrchestratorStatus: vi.fn(async () => ({ status: true })),
    orchestrate: vi.fn(async () => ({ duration_seconds: 1.2 })),
    listOrchestratorHistory: vi.fn(async () => ({ history: true })),
    getCollaborationGraph: vi.fn(async () => ({
      nodes: [
        { id: 1, name: 'alice', kind: 'assistant', messages: 10 },
        { id: 2, name: 'bob', kind: 'coordinator', messages: 8 },
      ],
      edges: [{ source: 1, target: 2, count: 5, source_to_target: 3, target_to_source: 2 }],
      total_edges: 1,
    })),
    getAgentCollaborators: vi.fn(async () => ({ collaborators: [{ agent_id: 2, name: 'bob', total: 5, sent: 3, received: 2 }] })),
    exportSecurityEvents: vi.fn(async () => 'csv-text'),
  },
  dashboardApi: {
    getStats: vi.fn(async () => ({
      agent_collaboration: { assignments: { review: 2, expired_leases: 3 } },
      scopes: { owned: { projects: { total: 1, active: 1 } } },
      organizations: { summary: { total: 2, total_agents: 5, active_agents_7d: 3 }, top_organizations: [{ id: 9 }] },
    })),
    getAgentMonitor: vi.fn(async () => ({ monitor: true })),
  },
  tp: vi.fn((k: string) => k),
  sseOptionsHistory: [] as Array<any>,
}))

// mock 路由/i18n/SSE，避免 jsdom 下真实订阅
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('../../../src/i18n/hooks/useTranslation', () => ({
  usePageTranslation: () => ({ tp, tc: tp, pageTitle: '仪表板' }),
}))
vi.mock('../../../src/hooks/useCollaborationSSE', () => ({
  useCollaborationSSE: (options: any) => { sseOptionsHistory.push(options) },
}))
vi.mock('../../../src/api/agents', () => ({ agentsApi }))
vi.mock('../../../src/api/dashboard', () => ({ dashboardApi }))

import { useDashboardData } from '../../../src/pages/dashboard/useDashboardData'


// 拆分前的完整返回契约（171 键）：组合根必须一个不少地暴露
const EXPECTED_KEYS = [
  'reviewOrExpiredAssignments',
  'agentCollaboration',
  'agentRunResourceTrend',
  'buildSecurityParams',
  'capSupplyDemand',
  'collabDays',
  'collabDetail',
  'collabDetailGraph',
  'collabGraph',
  'collabGraphLoading',
  'collabLoading',
  'collabMetrics',
  'collabSummary',
  'collabSvgRef',
  'collabTimeline',
  'collabTimelineIdx',
  'commentSentiment',
  'crossProjEff',
  'decayAlerts',
  'depChain',
  'eventDetail',
  'exportCollabGraph',
  'exportCollabGraphPng',
  'exportCollabGraphSvg',
  'exportSecurityEvents',
  'exporting',
  'forceLinkDistance',
  'forceRepulsion',
  'formatDate',
  'formatDateTime',
  'getStatusColor',
  'getStatusText',
  'graphFullscreen',
  'graphFullscreenSize',
  'graphKinds',
  'graphLayout',
  'graphMinCount',
  'graphResetKey',
  'graphSearch',
  'graphShowLabels',
  'graphWindow',
  'handoffStats',
  'hasExpiredLeases',
  'historyData',
  'historyFilter',
  'historyLoading',
  'historyOpen',
  'idleRanking',
  'loadCollabDetail',
  'loadCollabGraph',
  'loadCollabMetrics',
  'loadDashboardStats',
  'loadForceParams',
  'loadMonitorData',
  'loadOrchestratorHistory',
  'loadOrchestratorStatus',
  'loadSandboxData',
  'loadSecurityEvents',
  'loadUnifiedTrend',
  'loading',
  'monitorData',
  'monitorHours',
  'monitorLoading',
  'navigate',
  'openHistory',
  'orchDailyTrend',
  'orchestration',
  'orchestrationLoading',
  'orchestratorStatus',
  'orgSummary',
  'owned',
  'pageTitle',
  'participated',
  'propagationNet',
  'protocolLatency',
  'reworkAnalysis',
  'runOrchestration',
  'sandboxData',
  'sandboxLoading',
  'sandboxTemplateUsage',
  'sandboxViolationTrend',
  'sandboxViolationsByAgent',
  'securityByAgent',
  'securityEvents',
  'securityFilter',
  'securityLoading',
  'securitySearch',
  'securitySeverity',
  'securitySince',
  'securityTrend',
  'securityUntil',
  'setAgentRunResourceTrend',
  'setCapSupplyDemand',
  'setCollabDays',
  'setCollabDetail',
  'setCollabGraph',
  'setCollabGraphLoading',
  'setCollabLoading',
  'setCollabMetrics',
  'setCollabTimeline',
  'setCollabTimelineIdx',
  'setCommentSentiment',
  'setCrossProjEff',
  'setDecayAlerts',
  'setDepChain',
  'setEventDetail',
  'setExporting',
  'setForceLinkDistance',
  'setForceRepulsion',
  'setGraphFullscreen',
  'setGraphFullscreenSize',
  'setGraphKinds',
  'setGraphLayout',
  'setGraphMinCount',
  'setGraphResetKey',
  'setGraphSearch',
  'setGraphShowLabels',
  'setGraphWindow',
  'setHandoffStats',
  'setHistoryData',
  'setHistoryFilter',
  'setHistoryLoading',
  'setHistoryOpen',
  'setIdleRanking',
  'setLoading',
  'setMonitorData',
  'setMonitorHours',
  'setMonitorLoading',
  'setOrchDailyTrend',
  'setOrchestration',
  'setOrchestrationLoading',
  'setOrchestratorStatus',
  'setPropagationNet',
  'setProtocolLatency',
  'setReworkAnalysis',
  'setSandboxData',
  'setSandboxLoading',
  'setSandboxTemplateUsage',
  'setSandboxViolationTrend',
  'setSandboxViolationsByAgent',
  'setSecurityByAgent',
  'setSecurityEvents',
  'setSecurityFilter',
  'setSecurityLoading',
  'setSecuritySearch',
  'setSecuritySeverity',
  'setSecuritySince',
  'setSecurityTrend',
  'setSecurityUntil',
  'setSkillMatching',
  'setSpecializationEvo',
  'setStats',
  'setTaskAllocationFairness',
  'setTrendEventType',
  'setTrendSeverity',
  'setTrendWindow',
  'setUnifiedSecTrend',
  'setWorkloadForecast',
  'skillMatching',
  'specializationEvo',
  'stats',
  'taskAllocationFairness',
  'tc',
  'topOrganizations',
  'tp',
  'trendEventType',
  'trendSeverity',
  'trendWindow',
  'unifiedSecTrend',
  'workloadForecast',
]

describe('useDashboardData 组合契约', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sseOptionsHistory.length = 0
  })

  it('返回键集合与拆分前完全一致', () => {
    const { result } = renderHook(() => useDashboardData())
    const actual = Object.keys(result.current).sort()
    const expected = [...EXPECTED_KEYS].sort()
    const missing = expected.filter((k) => !actual.includes(k))
    const extra = actual.filter((k) => !expected.includes(k))
    expect({ missing, extra, actualLen: actual.length, expectedLen: expected.length }).toEqual({ missing: [], extra: [], actualLen: expected.length, expectedLen: expected.length })
  })

  it('核心统计装载与派生口径', async () => {
    const { result } = renderHook(() => useDashboardData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(dashboardApi.getStats).toHaveBeenCalledTimes(1)
    expect(result.current.stats).toBeTruthy()
    expect(result.current.reviewOrExpiredAssignments).toBe(5)
    expect(result.current.hasExpiredLeases).toBe(true)
    expect(result.current.owned).toEqual({ projects: { total: 1, active: 1 } })
    expect(result.current.topOrganizations).toEqual([{ id: 9 }])
  })

  it('协作指标/监控/沙箱/安全/趋势/图/编排器首屏各拉取一次', async () => {
    renderHook(() => useDashboardData())
    await waitFor(() => expect(agentsApi.getOrchestratorStatus).toHaveBeenCalled())
    expect(agentsApi.getCollaborationMetrics).toHaveBeenCalledWith({ days: 7 })
    expect(dashboardApi.getAgentMonitor).toHaveBeenCalledWith({ hours: '24' })
    expect(agentsApi.getSandboxDashboard).toHaveBeenCalled()
    expect(agentsApi.getCollaborationGraphTimeline).toHaveBeenCalledWith(14, 'day', 30)
    expect(agentsApi.getSecurityEvents).toHaveBeenCalled()
    expect(agentsApi.getCollaborationGraph).toHaveBeenCalledWith({ limit: 50, since: expect.any(String) })
    expect(agentsApi.getOrchestratorDailyTrend).toHaveBeenCalled()
  })

  it('buildSecurityParams 汇集筛选态', async () => {
    const { result } = renderHook(() => useDashboardData())
    await act(async () => {
      result.current.setSecuritySeverity('high')
      result.current.setSecuritySearch('evil')
      result.current.setSecuritySince('2026-01-01')
    })
    expect(result.current.buildSecurityParams('sandbox_violation')).toEqual({
      per_page: 50,
      event_type: 'sandbox_violation',
      severity: 'high',
      search: 'evil',
      since: '2026-01-01',
      until: undefined,
    })
  })

  it('协作图摘要与明细子图联动', async () => {
    const { result } = renderHook(() => useDashboardData())
    await waitFor(() => expect(result.current.collabGraph).toBeTruthy())
    expect(result.current.collabSummary).toEqual({
      nodeCount: 2, edgeCount: 1, topPair: { source: 'alice', target: 'bob', count: 5 },
    })
    await act(async () => {
      await result.current.loadCollabDetail(2, 'bob')
    })
    expect(result.current.collabDetail?.loading).toBe(false)
    const sub = result.current.collabDetailGraph
    expect(sub?.nodes[0]).toEqual({ id: 2, name: 'bob', kind: undefined, messages: 5 })
    expect(sub?.edges[0]).toMatchObject({ source: 2, target: 2, count: 5 })
  })

  it('runOrchestration 成功后联动刷新安全事件与编排器状态', async () => {
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useDashboardData())
    await waitFor(() => expect(result.current.runOrchestration).toBeTruthy())
    const securityCallsBefore = agentsApi.getSecurityEvents
    await act(async () => {
      await result.current.runOrchestration()
    })
    expect(agentsApi.orchestrate).toHaveBeenCalledTimes(1)
    expect(successSpy).toHaveBeenCalled()
    expect(securityCallsBefore.mock.calls.length).toBeGreaterThanOrEqual(2)
    await waitFor(() => expect(agentsApi.getOrchestratorStatus.mock.calls.length).toBeGreaterThanOrEqual(2))
    successSpy.mockRestore()
  })

  it('SSE 订阅启用且直接消息事件触发协作图刷新', async () => {
    renderHook(() => useDashboardData())
    expect(sseOptionsHistory.length).toBeGreaterThan(0)
    expect(sseOptionsHistory[0].enabled).toBe(true)
    const callsBefore = agentsApi.getCollaborationGraph.mock.calls.length
    await act(async () => {
      sseOptionsHistory[sseOptionsHistory.length - 1].onEvent({ event_type: 'agent.direct_message' })
    })
    expect(agentsApi.getCollaborationGraph.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('SSE 安全类事件刷新事件列表，冲突类事件同步刷新编排趋势', async () => {
    renderHook(() => useDashboardData())
    const options = sseOptionsHistory[sseOptionsHistory.length - 1]
    const secBefore = agentsApi.getSecurityEvents.mock.calls.length
    const trendBefore = agentsApi.getOrchestratorDailyTrend.mock.calls.length
    await act(async () => {
      options.onEvent({ event_type: 'sandbox_violation' })
      options.onEvent({ event_type: 'unrelated' })
      options.onEvent({ event_type: 'conflicts_detected' })
    })
    await waitFor(() => expect(agentsApi.getSecurityEvents.mock.calls.length).toBeGreaterThan(secBefore))
    await waitFor(() => expect(agentsApi.getOrchestratorDailyTrend.mock.calls.length).toBeGreaterThan(trendBefore))
    expect(agentsApi.getCollaborationGraphTimeline).not.toHaveBeenCalledWith('unrelated')
  })

  it('格式化助手走 i18n 与状态映射', () => {
    const { result } = renderHook(() => useDashboardData())
    expect(result.current.getStatusText('done')).toBe('taskStatus.done')
    expect(result.current.getStatusColor('in_progress')).toBe('processing')
    expect(result.current.formatDateTime(null)).toBe('labels.noRecentAgentActivity')
    expect(typeof result.current.formatDateTime('2026-09-14T02:00:00Z')).toBe('string')
    expect(typeof result.current.formatDate('2026-09-14T00:00:00Z')).toBe('string')
  })

  it('tp 抛错时状态文本回退原始值', () => {
    const { result } = renderHook(() => useDashboardData())
    tp.mockImplementationOnce(() => {
      throw new Error('i18n boom')
    })
    expect(result.current.getStatusText('todo')).toBe('todo')
  })

  it('openHistory 打开 Modal 并按当前筛选拉取历史', async () => {
    const { result } = renderHook(() => useDashboardData())
    // openHistory 捕获所在渲染轮的 historyFilter：先设筛选，待重渲染后再触发
    act(() => {
      result.current.setHistoryFilter('manual')
    })
    await waitFor(() => expect(result.current.historyFilter).toBe('manual'))
    act(() => {
      result.current.openHistory()
    })
    expect(result.current.historyOpen).toBe(true)
    await waitFor(() => expect(agentsApi.listOrchestratorHistory).toHaveBeenCalledWith({ limit: 30, triggered_by: 'manual' }))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})
