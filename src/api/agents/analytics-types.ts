/**
 * Agent API — analytics-related type definitions.
 *
 * Productivity, failure analysis, collaboration, capability gap, task allocation,
 * health metrics, and all other advanced analytics types.
 */
import type { Agent } from './types'

// ── Productivity analytics ───────────────────────────────────────────

export interface AgentProductivityItem {
  agent_id: number
  name: string
  total: number
  done: number
  failed: number
  cancelled: number
  expired: number
  in_progress: number
  completion_rate: number
  avg_completion_hours: number | null
}

export interface AgentProductivity {
  days: number
  items: AgentProductivityItem[]
}

export interface AgentProductivityTrendBucket {
  date: string
  done: number
  failed: number
  by_kind?: Record<string, { done: number; failed: number }>
}

export interface AgentProductivityTrend {
  days: number
  trend: AgentProductivityTrendBucket[]
  total_done: number
  total_failed: number
  by_kind_totals?: Record<string, { done: number; failed: number }>
}

export interface AgentProductivityAlertItem {
  agent_id: number
  name: string
  total: number
  done: number
  failed: number
  cancelled: number
  expired: number
  in_progress: number
  completion_rate: number
  failure_rate: number
  avg_completion_hours: number | null
  reasons: string[]
}

export interface AgentProductivityAlerts {
  days: number
  min_completion_rate: number
  max_failure_rate: number
  min_assignments: number
  items: AgentProductivityAlertItem[]
}

export interface AgentRunResourceUsageItem {
  agent_id: number
  name: string
  total_runs: number
  total_hours: number
  avg_run_minutes: number
}

export interface AgentRunResourceUsage {
  items: AgentRunResourceUsageItem[]
  total_runs: number
}

export interface AgentProductivityWeeklyItem {
  agent_id: number
  name: string
  this_week: number
  last_week: number
  change_pct: number
}

export interface AgentProductivityWeeklyComparison {
  agents: AgentProductivityWeeklyItem[]
  total_this_week: number
  total_last_week: number
}

export interface AgentProductivityByKindItem {
  kind: string
  agent_count: number
  total: number
  done: number
  failed: number
  cancelled: number
  expired: number
  in_progress: number
  completion_rate: number
  failure_rate: number
  avg_completion_hours: number | null
}

export interface AgentProductivityByKind {
  days: number
  items: AgentProductivityByKindItem[]
}

export interface AgentProductivityHourlyHeatmapAgent {
  agent_id: number
  name: string
  done: number
}

export interface AgentProductivityHourlyHeatmap {
  days: number
  agents: AgentProductivityHourlyHeatmapAgent[]
  matrix: Record<string, Record<string, number>>
  hour_totals: number[]
  max_cell: number
  peak_hour: number | null
}

export interface AgentProductivityCalendarHeatmap {
  days: number
  agents: AgentProductivityHourlyHeatmapAgent[]
  matrix: Record<string, Record<string, number>>
  max_cell: number
  date_range: string[]
}

// ── Failure analytics ────────────────────────────────────────────────

export interface AgentFailureReasonItem {
  reason: string
  count: number
  affected_agents: number[]
  affected_agent_names: string[]
}

export interface AgentFailureReasons {
  days: number
  total_failed_runs: number
  items: AgentFailureReasonItem[]
}

export interface FailureErrorPatternAgent {
  agent_id: number
  name: string
}

export interface FailureErrorPattern {
  pattern: string
  count: number
  affected_agents: FailureErrorPatternAgent[]
  peak_hour: number | null
  hour_distribution: Record<string, number>
}

export interface AgentFailureErrorPatterns {
  days: number
  patterns: FailureErrorPattern[]
  total_failed: number
}

// ── Capability gap analysis ──────────────────────────────────────────

export interface CapabilityGapItem {
  domain: string
  success_count: number
  avg_confidence: number
  failure_count: number
}

export interface CapabilityOverclaimItem {
  capability: string
  failure_count: number
  risk: 'high' | 'medium' | 'low'
}

export interface CapabilityMatchedItem {
  capability: string
  domain: string
  success_count: number
  avg_confidence: number
}

export interface CapabilityGapAgent {
  agent_id: number
  agent_name: string
  total_capabilities: number
  coverage_score: number
  gaps: CapabilityGapItem[]
  overclaims: CapabilityOverclaimItem[]
  matched: CapabilityMatchedItem[]
}

export interface AgentCapabilityGapAnalysis {
  agents: CapabilityGapAgent[]
}

export type CapabilityStatus = 'missing' | 'bottleneck' | 'surplus' | 'unused_supply' | 'balanced'

export interface CapabilitySupplyDemandItem {
  capability: string
  supply: number
  demand: number
  gap: number
  ratio: number | null
  status: CapabilityStatus
}

export interface AgentCapabilitySupplyDemand {
  capabilities: CapabilitySupplyDemandItem[]
  total_capabilities: number
  bottleneck_count: number
  agent_total: number
  active_task_total: number
}

// ── Collaboration analytics ──────────────────────────────────────────

export interface AgentCollaborator {
  agent_id: number
  name: string
  sent: number
  received: number
  total: number
}

export interface AgentCollaboratorsResult {
  collaborators: AgentCollaborator[]
  total_partners: number
}

export interface CollaborationGraphNode {
  id: number
  name: string
  kind?: string | null
  messages: number
  reputation?: number | null
}

export interface CollaborationGraphEdge {
  source: number
  target: number
  count: number
  source_to_target?: number
  target_to_source?: number
}

export interface CollaborationGraph {
  nodes: CollaborationGraphNode[]
  edges: CollaborationGraphEdge[]
  total_edges: number
}

export interface CollaborationTimelineEdge {
  source: number
  target: number
  source_name: string
  target_name: string
  count: number
  source_to_target: number
  target_to_source: number
}

export interface CollaborationTimelineSnapshot {
  date: string
  edges: CollaborationTimelineEdge[]
  total_edges: number
  active_agents: number
}

export interface CollaborationGraphTimeline {
  bucket_type: string
  days: number
  snapshots: CollaborationTimelineSnapshot[]
}

// ── Task allocation fairness ─────────────────────────────────────────

export interface TaskAllocationFairnessAgent {
  name: string
  total: number
  completed: number
  in_progress: number
  assigned: number
}

export interface TaskAllocationLorenzPoint {
  agent_percent: number
  task_percent: number
}

export interface TaskAllocationFairness {
  gini: number
  fairness_level: string
  agents: TaskAllocationFairnessAgent[]
  lorenz_curve: TaskAllocationLorenzPoint[]
  days: number
  total_tasks: number
}

// ── Agent handoff / skill matching ───────────────────────────────────

export interface AgentTaskHandoffPair {
  from_agent: string
  to_agent: string
  count: number
  avg_duration_seconds: number | null
}

export interface AgentTaskHandoffStats {
  handoffs: AgentTaskHandoffPair[]
  days: number
}

export interface SkillMatchCandidate {
  agent_id: number
  agent_name: string
  match_score: number
  matched_capabilities: string[]
}

export interface SkillMatchingTask {
  task_id: number
  task_title: string
  recommendations: SkillMatchCandidate[]
}

export interface AgentSkillMatching {
  tasks: SkillMatchingTask[]
}

// ── Channel activity / workload forecast ─────────────────────────────

export interface ChannelActivityItem {
  channel_id: number
  channel_name: string
  daily_counts: number[]
  active_members: number
  date_range: string[]
}

export interface ChannelActivityTrend {
  channels: ChannelActivityItem[]
  days: number
}

export interface WorkloadForecastAgent {
  agent_id: number
  agent_name: string
  total: number
  recent_avg: number
  slope: number
  trend: 'up' | 'down' | 'flat'
  series: number[]
  forecast: number[]
  forecast_total: number
}

export interface AgentWorkloadForecast {
  agents: WorkloadForecastAgent[]
  days: number
  horizon: number
  date_range: string[]
}

export interface AgentRunResourceTrendAgent {
  agent_id: number
  agent_name: string
  total_runs: number
  count_series: number[]
  duration_series: number[]
}

export interface AgentRunResourceTrend {
  agents: AgentRunResourceTrendAgent[]
  days: number
  date_range: string[]
}

// ── Knowledge propagation ────────────────────────────────────────────

export interface KnowledgePropagationNode {
  agent_id: number
  agent_name: string
  shared_experiences: number
  total_reuses: number
  domains: string[]
}

export interface KnowledgePropagationEdge {
  source: number
  target: number
  weight: number
}

export interface KnowledgePropagationNetwork {
  nodes: KnowledgePropagationNode[]
  edges: KnowledgePropagationEdge[]
  days: number
  total_shared_experiences: number
  total_reuses: number
}

// ── Protocol decision latency ────────────────────────────────────────

export interface ProtocolLatencyType {
  protocol_type: string
  count: number
  avg_seconds: number
  median_seconds: number
  min_seconds: number
  max_seconds: number
}

export interface ProtocolDecisionLatency {
  types: ProtocolLatencyType[]
  days: number
  total: number
}

// ── Specialization evolution ─────────────────────────────────────────

export interface SpecializationEvolutionAgent {
  agent_id: number
  agent_name: string
  series: number[]
  peak_domains: number
  peak_week_idx: number
  total_domains: number
  domains: string[]
}

export interface AgentSpecializationEvolution {
  agents: SpecializationEvolutionAgent[]
  weeks: number
  week_labels: string[]
}

// ── Agent health ─────────────────────────────────────────────────────

export interface AgentHealthSubScores {
  reputation: number
  completion: number
  conflict: number
  violation: number
}

export interface AgentHealthItem {
  agent_id: number
  name: string
  status: string | null
  health_score: number
  reputation_score: number
  completion_rate: number | null
  total_assignments: number
  done_assignments: number
  conflicts: number
  sandbox_violations: number
  sub_scores: AgentHealthSubScores
}

export interface AgentHealth {
  days: number
  items: AgentHealthItem[]
}

export interface AgentHealthTrendBucket {
  date: string
  avg_reputation: number | null
  positive: number
  negative: number
  conflicts: number
  sandbox_violations: number
  by_kind_avg?: Record<string, number>
}

export interface AgentHealthTrend {
  days: number
  trend: AgentHealthTrendBucket[]
  total_positive: number
  total_negative: number
  total_conflicts: number
  total_violations: number
  agent_id: number | null
  agent_name: string | null
  by_kind_overall?: Record<string, number>
}

export interface HealthStateTransitionFlow {
  source: string
  target: string
  value: number
}

export interface AgentHealthStateTransitions {
  days: number
  states: { name: string; count: number }[]
  flows: HealthStateTransitionFlow[]
  total_transitions: number
}

export interface AgentHealthAlertItem extends AgentHealthItem {
  reasons: string[]
  recommendations: string[]
}

export interface AgentHealthAlerts {
  days: number
  min_health_score: number
  items: AgentHealthAlertItem[]
}

export interface HealthWeights {
  w_reputation?: number
  w_completion?: number
  w_conflict?: number
  w_violation?: number
}

// ── Agent idle ranking ───────────────────────────────────────────────

export type AgentIdleStage = 'active' | 'idle' | 'stale' | 'dormant' | 'never'

export interface AgentIdleItem {
  agent_id: number
  agent_name: string
  status: string | null
  last_seen_at: string | null
  last_activity_at: string | null
  idle_hours: number | null
  stage: AgentIdleStage
}

export interface AgentIdleRanking {
  agents: AgentIdleItem[]
  total_agents: number
  stage_counts: Record<string, number>
}
