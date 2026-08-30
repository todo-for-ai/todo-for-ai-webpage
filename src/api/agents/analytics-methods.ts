/**
 * Agent API — analytics methods mixin.
 *
 * Productivity, failure, collaboration, capability, health, and all
 * advanced analytics methods.
 */
import type { ApiClient } from '../client/index.js'
import type {
  AgentCapabilityGapAnalysis,
  CollaborationGraphTimeline,
  TaskAllocationFairness,
  AgentRunResourceTrend,
  AgentSkillMatching,
  AgentTaskHandoffStats,
  ChannelActivityTrend,
  AgentWorkloadForecast,
  KnowledgePropagationNetwork,
  ProtocolDecisionLatency,
  AgentSpecializationEvolution,
  AgentCrossProjectEfficiency,
  AgentCapabilitySupplyDemand,
  AgentIdleRanking,
  ConflictsSandboxCorrelation,
  AgentHealth,
  AgentHealthTrend,
  AgentHealthStateTransitions,
  AgentHealthAlerts,
  HealthWeights,
  AgentProductivity,
  AgentRunResourceUsage,
  AgentProductivityWeeklyComparison,
  AgentProductivityTrend,
  AgentProductivityAlerts,
  AgentProductivityByKind,
  AgentProductivityHourlyHeatmap,
  AgentProductivityCalendarHeatmap,
  AgentFailureReasons,
  AgentFailureErrorPatterns,
  AgentCollaboratorsResult,
  CollaborationGraph,
} from './analytics-types'
import { unwrapData } from './helpers'

export interface AnalyticsMethods {
  getAgentProductivity(days?: number, limit?: number): Promise<AgentProductivity>
  getAgentRunResourceUsage(days?: number, limit?: number): Promise<AgentRunResourceUsage>
  getAgentProductivityWeeklyComparison(limit?: number): Promise<AgentProductivityWeeklyComparison>
  getAgentProductivityTrend(days?: number): Promise<AgentProductivityTrend>
  getAgentProductivityAlerts(): Promise<AgentProductivityAlerts>
  getAgentProductivityByKind(days?: number): Promise<AgentProductivityByKind>
  getAgentProductivityHourlyHeatmap(days?: number, limit?: number): Promise<AgentProductivityHourlyHeatmap>
  getAgentProductivityCalendarHeatmap(days?: number, limit?: number): Promise<AgentProductivityCalendarHeatmap>
  getAgentFailureReasons(days?: number, limit?: number): Promise<AgentFailureReasons>
  getAgentFailureErrorPatterns(days?: number, limit?: number, prefixLen?: number): Promise<AgentFailureErrorPatterns>
  getAgentCapabilityGapAnalysis(limit?: number, minConfidence?: number): Promise<AgentCapabilityGapAnalysis>
  getCollaborationGraphTimeline(days?: number, bucket?: string, limit?: number): Promise<CollaborationGraphTimeline>
  getTaskAllocationFairness(days?: number): Promise<TaskAllocationFairness>
  getAgentRunResourceTrend(days?: number, limit?: number): Promise<AgentRunResourceTrend>
  getAgentSkillMatching(limit?: number): Promise<AgentSkillMatching>
  getAgentTaskHandoffStats(days?: number, limit?: number): Promise<AgentTaskHandoffStats>
  getChannelActivityTrend(days?: number, limit?: number): Promise<ChannelActivityTrend>
  getAgentWorkloadForecast(days?: number, horizon?: number, limit?: number): Promise<AgentWorkloadForecast>
  getKnowledgePropagationNetwork(days?: number, limit?: number): Promise<KnowledgePropagationNetwork>
  getProtocolDecisionLatency(days?: number): Promise<ProtocolDecisionLatency>
  getAgentSpecializationEvolution(weeks?: number, limit?: number): Promise<AgentSpecializationEvolution>
  getAgentCrossProjectEfficiency(days?: number, limit?: number): Promise<AgentCrossProjectEfficiency>
  getAgentCapabilitySupplyDemand(limit?: number): Promise<AgentCapabilitySupplyDemand>
  getAgentIdleRanking(limit?: number): Promise<AgentIdleRanking>
  getConflictsSandboxCorrelation(days?: number, windowHours?: number): Promise<ConflictsSandboxCorrelation>
  getAgentHealth(days?: number): Promise<AgentHealth>
  getAgentHealthTrend(days?: number, agentId?: number): Promise<AgentHealthTrend>
  getAgentHealthStateTransitions(days?: number): Promise<AgentHealthStateTransitions>
  getAgentHealthAlerts(weights?: HealthWeights): Promise<AgentHealthAlerts>
  getAgentCollaborators(agentId: number, params?: { limit?: number }): Promise<AgentCollaboratorsResult>
  getCollaborationGraph(params?: { limit?: number; since?: string; until?: string }): Promise<CollaborationGraph>
}

export function createAnalyticsMethods(apiClient: ApiClient): AnalyticsMethods {
  return {
    async getAgentProductivity(days = 30, limit = 20): Promise<AgentProductivity> {
      return unwrapData<AgentProductivity>(await apiClient.get(`/agents/analytics/productivity${buildQuery({ days, limit })}`))
    },

    async getAgentRunResourceUsage(days = 30, limit = 10): Promise<AgentRunResourceUsage> {
      return unwrapData<AgentRunResourceUsage>(await apiClient.get(`/agents/analytics/run-resource-usage${buildQuery({ days, limit })}`))
    },

    async getAgentProductivityWeeklyComparison(limit = 10): Promise<AgentProductivityWeeklyComparison> {
      return unwrapData<AgentProductivityWeeklyComparison>(await apiClient.get(`/agents/analytics/productivity-weekly-comparison${buildQuery({ limit })}`))
    },

    async getAgentProductivityTrend(days = 30): Promise<AgentProductivityTrend> {
      return unwrapData<AgentProductivityTrend>(await apiClient.get(`/agents/analytics/productivity-trend${buildQuery({ days })}`))
    },

    async getAgentProductivityAlerts(): Promise<AgentProductivityAlerts> {
      return unwrapData<AgentProductivityAlerts>(await apiClient.get('/agents/analytics/productivity-alerts'))
    },

    async getAgentProductivityByKind(days = 30): Promise<AgentProductivityByKind> {
      return unwrapData<AgentProductivityByKind>(await apiClient.get(`/agents/analytics/productivity-by-kind${buildQuery({ days })}`))
    },

    async getAgentProductivityHourlyHeatmap(days = 30, limit = 15): Promise<AgentProductivityHourlyHeatmap> {
      return unwrapData<AgentProductivityHourlyHeatmap>(await apiClient.get(`/agents/analytics/productivity-hourly-heatmap${buildQuery({ days, limit })}`))
    },

    async getAgentProductivityCalendarHeatmap(days = 90, limit = 10): Promise<AgentProductivityCalendarHeatmap> {
      return unwrapData<AgentProductivityCalendarHeatmap>(await apiClient.get(`/agents/analytics/productivity-calendar-heatmap${buildQuery({ days, limit })}`))
    },

    async getAgentFailureReasons(days = 30, limit = 15): Promise<AgentFailureReasons> {
      return unwrapData<AgentFailureReasons>(await apiClient.get(`/agents/analytics/failure-reasons${buildQuery({ days, limit })}`))
    },

    async getAgentFailureErrorPatterns(days = 30, limit = 10, prefixLen = 40): Promise<AgentFailureErrorPatterns> {
      return unwrapData<AgentFailureErrorPatterns>(await apiClient.get(`/agents/analytics/failure-error-patterns${buildQuery({ days, limit, prefix_len: prefixLen })}`))
    },

    async getAgentCapabilityGapAnalysis(limit = 10, minConfidence = 0.5): Promise<AgentCapabilityGapAnalysis> {
      return unwrapData<AgentCapabilityGapAnalysis>(await apiClient.get(`/agents/analytics/capability-gap-analysis${buildQuery({ limit, min_confidence: minConfidence })}`))
    },

    async getCollaborationGraphTimeline(days = 14, bucket = 'day', limit = 50): Promise<CollaborationGraphTimeline> {
      return unwrapData<CollaborationGraphTimeline>(await apiClient.get(`/agents/analytics/collaboration-graph-timeline${buildQuery({ days, bucket, limit })}`))
    },

    async getTaskAllocationFairness(days = 30): Promise<TaskAllocationFairness> {
      return unwrapData<TaskAllocationFairness>(await apiClient.get(`/agents/analytics/task-allocation-fairness${buildQuery({ days })}`))
    },

    async getAgentRunResourceTrend(days = 14, limit = 10): Promise<AgentRunResourceTrend> {
      return unwrapData<AgentRunResourceTrend>(await apiClient.get(`/agents/analytics/run-resource-trend${buildQuery({ days, limit })}`))
    },

    async getAgentSkillMatching(limit = 10): Promise<AgentSkillMatching> {
      return unwrapData<AgentSkillMatching>(await apiClient.get(`/agents/analytics/skill-matching${buildQuery({ limit })}`))
    },

    async getAgentTaskHandoffStats(days = 30, limit = 10): Promise<AgentTaskHandoffStats> {
      return unwrapData<AgentTaskHandoffStats>(await apiClient.get(`/agents/analytics/task-handoff-stats${buildQuery({ days, limit })}`))
    },

    async getChannelActivityTrend(days = 14, limit = 10): Promise<ChannelActivityTrend> {
      return unwrapData<ChannelActivityTrend>(await apiClient.get(`/agents/analytics/channel-activity-trend${buildQuery({ days, limit })}`))
    },

    async getAgentWorkloadForecast(days = 30, horizon = 3, limit = 10): Promise<AgentWorkloadForecast> {
      return unwrapData<AgentWorkloadForecast>(await apiClient.get(`/agents/analytics/workload-forecast${buildQuery({ days, horizon, limit })}`))
    },

    async getKnowledgePropagationNetwork(days = 90, limit = 20): Promise<KnowledgePropagationNetwork> {
      return unwrapData<KnowledgePropagationNetwork>(await apiClient.get(`/agents/analytics/knowledge-propagation-network${buildQuery({ days, limit })}`))
    },

    async getProtocolDecisionLatency(days = 30): Promise<ProtocolDecisionLatency> {
      return unwrapData<ProtocolDecisionLatency>(await apiClient.get(`/agents/analytics/protocol-decision-latency${buildQuery({ days })}`))
    },

    async getAgentSpecializationEvolution(weeks = 12, limit = 8): Promise<AgentSpecializationEvolution> {
      return unwrapData<AgentSpecializationEvolution>(await apiClient.get(`/agents/analytics/specialization-evolution${buildQuery({ weeks, limit })}`))
    },

    async getAgentCrossProjectEfficiency(days = 30, limit = 20): Promise<AgentCrossProjectEfficiency> {
      return unwrapData<AgentCrossProjectEfficiency>(await apiClient.get(`/agents/analytics/cross-project-efficiency${buildQuery({ days, limit })}`))
    },

    async getAgentCapabilitySupplyDemand(limit = 20): Promise<AgentCapabilitySupplyDemand> {
      return unwrapData<AgentCapabilitySupplyDemand>(await apiClient.get(`/agents/analytics/capability-supply-demand${buildQuery({ limit })}`))
    },

    async getAgentIdleRanking(limit = 20): Promise<AgentIdleRanking> {
      return unwrapData<AgentIdleRanking>(await apiClient.get(`/agents/analytics/idle-ranking${buildQuery({ limit })}`))
    },

    async getConflictsSandboxCorrelation(days = 30, windowHours = 2): Promise<ConflictsSandboxCorrelation> {
      return unwrapData<ConflictsSandboxCorrelation>(await apiClient.get(`/agents/analytics/conflicts-sandbox-correlation${buildQuery({ days, window_hours: windowHours })}`))
    },

    async getAgentHealth(days = 30): Promise<AgentHealth> {
      return unwrapData<AgentHealth>(await apiClient.get(`/agents/analytics/health${buildQuery({ days })}`))
    },

    async getAgentHealthTrend(days = 30, agentId?: number): Promise<AgentHealthTrend> {
      return unwrapData<AgentHealthTrend>(await apiClient.get(`/agents/analytics/health-trend${buildQuery({ days, agent_id: agentId })}`))
    },

    async getAgentHealthStateTransitions(days = 30): Promise<AgentHealthStateTransitions> {
      return unwrapData<AgentHealthStateTransitions>(await apiClient.get(`/agents/analytics/health-state-transitions${buildQuery({ days })}`))
    },

    async getAgentHealthAlerts(weights: HealthWeights = {}): Promise<AgentHealthAlerts> {
      return unwrapData<AgentHealthAlerts>(await apiClient.get(`/agents/analytics/health-alerts${buildQuery(weights)}`))
    },

    async getAgentCollaborators(agentId: number, params?: { limit?: number }): Promise<AgentCollaboratorsResult> {
      return unwrapData<AgentCollaboratorsResult>(await apiClient.get(`/agents/${agentId}/collaborators${buildQuery(params)}`))
    },

    async getCollaborationGraph(params?: { limit?: number; since?: string; until?: string }): Promise<CollaborationGraph> {
      return unwrapData<CollaborationGraph>(await apiClient.get(`/agents/collaboration-graph${buildQuery(params)}`))
    },
  }
}

// Local helper to avoid import issues
function buildQuery(params?: object): string {
  const queryParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        queryParams.append(key, String(value))
      }
    })
  }
  const query = queryParams.toString()
  return query ? `?${query}` : ''
}
