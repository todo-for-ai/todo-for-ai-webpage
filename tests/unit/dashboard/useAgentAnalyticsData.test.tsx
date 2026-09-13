import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const { agentsApi, tasksApi } = vi.hoisted(() => ({
  agentsApi: {
    getAgentHealth: vi.fn(async () => ({ total: 3 })),
    getAgentHealthTrend: vi.fn(async () => ({ trend: [] })),
    getAgentHealthStateTransitions: vi.fn(async () => ({ flows: [] })),
    getAgentHealthAlerts: vi.fn(async () => ({ alerts: [] })),
    getAgentProductivity: vi.fn(async () => ({})),
    getAgentProductivityTrend: vi.fn(async () => ({})),
    getAgentProductivityAlerts: vi.fn(async () => ({})),
    getAgentProductivityByKind: vi.fn(async () => ({})),
    getAgentRunResourceUsage: vi.fn(async () => ({})),
    getAgentProductivityWeeklyComparison: vi.fn(async () => ({})),
    getAgentProductivityHourlyHeatmap: vi.fn(async () => ({})),
    getAgentProductivityCalendarHeatmap: vi.fn(async () => ({})),
    getAgentFailureReasons: vi.fn(async () => ({})),
    getAgentFailureErrorPatterns: vi.fn(async () => ({})),
    getAgentCapabilityGapAnalysis: vi.fn(async () => ({})),
    getTaskAllocationFairness: vi.fn(async () => ({})),
    getAgentRunResourceTrend: vi.fn(async () => ({})),
    getAgentSkillMatching: vi.fn(async () => ({})),
    getAgentTaskHandoffStats: vi.fn(async () => ({})),
    getAgentWorkloadForecast: vi.fn(async () => ({})),
    getAgentSpecializationEvolution: vi.fn(async () => ({})),
    getAgentExperiencesDecayAlerts: vi.fn(async () => ({})),
    getAgentCrossProjectEfficiency: vi.fn(async () => ({})),
    getAgentCapabilitySupplyDemand: vi.fn(async () => ({})),
    getAgentIdleRanking: vi.fn(async () => ({})),
    getKnowledgePropagationNetwork: vi.fn(async () => ({})),
    getProtocolDecisionLatency: vi.fn(async () => ({})),
  },
  tasksApi: {
    getDependencyChain: vi.fn(async () => ({})),
    getCommentSentimentTrend: vi.fn(async () => ({})),
    getReworkAnalysis: vi.fn(async () => ({})),
  },
}))
vi.mock('../../../src/api/agents', () => ({ agentsApi }))
vi.mock('../../../src/api/tasks', () => ({ tasksApi }))

import { useAgentAnalyticsData } from '../../../src/pages/dashboard/useAgentAnalyticsData'

describe('useAgentAnalyticsData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('挂载时按默认窗口并发拉取全部 30 个分析端点', async () => {
    const { result } = renderHook(() => useAgentAnalyticsData())
    await waitFor(() => expect(result.current.agentHealth).toEqual({ total: 3 }))
    expect(agentsApi.getAgentHealth).toHaveBeenCalledWith(30)
    expect(agentsApi.getAgentHealthTrend).toHaveBeenCalledWith(30)
    expect(agentsApi.getAgentHealthStateTransitions).toHaveBeenCalledWith(30)
    expect(agentsApi.getAgentHealthAlerts).toHaveBeenCalledWith({ w_reputation: 0.4, w_completion: 0.3, w_conflict: 0.15, w_violation: 0.15 })
    expect(agentsApi.getAgentProductivity).toHaveBeenCalledWith(30, 20)
    expect(agentsApi.getAgentProductivityTrend).toHaveBeenCalledWith(30)
    expect(agentsApi.getAgentProductivityAlerts).toHaveBeenCalled()
    expect(agentsApi.getAgentProductivityByKind).toHaveBeenCalledWith(30)
    expect(agentsApi.getAgentRunResourceUsage).toHaveBeenCalledWith(30, 8)
    expect(agentsApi.getAgentProductivityWeeklyComparison).toHaveBeenCalledWith(10)
    expect(agentsApi.getAgentProductivityHourlyHeatmap).toHaveBeenCalledWith(30, 15)
    expect(agentsApi.getAgentProductivityCalendarHeatmap).toHaveBeenCalledWith(90, 10)
    expect(agentsApi.getAgentFailureReasons).toHaveBeenCalledWith(30, 15)
    expect(agentsApi.getAgentFailureErrorPatterns).toHaveBeenCalledWith(30, 10, 40)
    expect(agentsApi.getAgentCapabilityGapAnalysis).toHaveBeenCalledWith(10, 0.5)
    expect(agentsApi.getTaskAllocationFairness).toHaveBeenCalledWith(30)
    expect(agentsApi.getAgentRunResourceTrend).toHaveBeenCalledWith(14, 10)
    expect(agentsApi.getAgentSkillMatching).toHaveBeenCalledWith(10)
    expect(agentsApi.getAgentTaskHandoffStats).toHaveBeenCalledWith(30, 10)
    expect(agentsApi.getAgentWorkloadForecast).toHaveBeenCalledWith(30, 3, 10)
    expect(agentsApi.getAgentSpecializationEvolution).toHaveBeenCalledWith(12, 8)
    expect(agentsApi.getAgentExperiencesDecayAlerts).toHaveBeenCalledWith(30, 0.1, 10)
    expect(agentsApi.getAgentCrossProjectEfficiency).toHaveBeenCalledWith(30, 20)
    expect(agentsApi.getAgentCapabilitySupplyDemand).toHaveBeenCalledWith(20)
    expect(agentsApi.getAgentIdleRanking).toHaveBeenCalledWith(20)
    expect(agentsApi.getKnowledgePropagationNetwork).toHaveBeenCalledWith(90, 20)
    expect(agentsApi.getProtocolDecisionLatency).toHaveBeenCalledWith(30)
    expect(tasksApi.getDependencyChain).toHaveBeenCalledWith(10)
    expect(tasksApi.getCommentSentimentTrend).toHaveBeenCalledWith(30)
    expect(tasksApi.getReworkAnalysis).toHaveBeenCalledWith(30, 15)
    expect(result.current.healthWeights).toEqual({ w_reputation: 0.4, w_completion: 0.3, w_conflict: 0.15, w_violation: 0.15 })
  })

  it('reloadHealthTrend 按 Agent 过滤并维护 loading', async () => {
    const { result } = renderHook(() => useAgentAnalyticsData())
    await waitFor(() => expect(result.current.agentHealth).toBeTruthy())
    await act(async () => {
      result.current.reloadHealthTrend(7)
      await vi.waitFor(() => expect(result.current.healthTrendLoading).toBe(false))
    })
    expect(agentsApi.getAgentHealthTrend).toHaveBeenLastCalledWith(30, 7)
  })

  it('reloadHealthAlerts 以自定义权重重载告警', async () => {
    const { result } = renderHook(() => useAgentAnalyticsData())
    await waitFor(() => expect(result.current.agentHealth).toBeTruthy())
    const weights = { w_reputation: 0.1, w_completion: 0.2, w_conflict: 0.3, w_violation: 0.4 }
    await act(async () => {
      result.current.reloadHealthAlerts(weights)
      await vi.waitFor(() => expect(result.current.healthAlertsLoading).toBe(false))
    })
    expect(agentsApi.getAgentHealthAlerts).toHaveBeenLastCalledWith(weights)
    act(() => {
      result.current.setHealthWeights(weights)
    })
    expect(result.current.healthWeights).toEqual(weights)
  })
})
