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

export interface WorkflowSimilarityPair {
  run_a: number
  run_b: number
  similarity: number
  shared_steps: number
  unique_a: number
  unique_b: number
}

export interface WorkflowSimilarityWorkflow {
  workflow_id: number
  workflow_name: string
  run_count: number
  matrix: number[][]
  run_ids: number[]
  most_similar: WorkflowSimilarityPair[]
  least_similar: WorkflowSimilarityPair[]
}

export interface WorkflowSimilarityMatrix {
  workflows: WorkflowSimilarityWorkflow[]
  days: number
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

/** 技能匹配推荐候选人 */
export interface SkillMatchCandidate {
  agent_id: number
  agent_name: string
  match_score: number
  matched_capabilities: string[]
}

/** 技能匹配推荐任务 */
export interface SkillMatchingTask {
  task_id: number
  task_title: string
  recommendations: SkillMatchCandidate[]
}

/** Agent 技能匹配推荐 */
export interface AgentSkillMatching {
  tasks: SkillMatchingTask[]
}

/** 步骤耗时直方图桶 */
export interface StepDurationBucket {
  range: string
  count: number
}

/** 步骤耗时直方图步骤 */
export interface StepDurationHistogramStep {
  step_key: string
  buckets: StepDurationBucket[]
  total: number
}

/** 工作流步骤耗时分布直方图（增量267） */
export interface StepDurationHistogramResult {
  steps: StepDurationHistogramStep[]
  days: number
}

/** Agent 任务交接对 */
export interface AgentTaskHandoffPair {
  from_agent: string
  to_agent: string
  count: number
  avg_duration_seconds: number | null
}

/** Agent 任务交接统计 */
export interface AgentTaskHandoffStats {
  handoffs: AgentTaskHandoffPair[]
  days: number
}

/** 频道活跃度趋势 */
export interface ChannelActivityItem {
  channel_id: number
  channel_name: string
  daily_counts: number[]
  active_members: number
  date_range: string[]
}

/** 频道活跃度趋势 */
export interface ChannelActivityTrend {
  channels: ChannelActivityItem[]
  days: number
}

/** Agent 工作负载预测（单 Agent） */
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

/** Agent 工作负载预测结果 */
export interface AgentWorkloadForecast {
  agents: WorkloadForecastAgent[]
  days: number
  horizon: number
  date_range: string[]
}

/** 知识传播网络节点 */
export interface KnowledgePropagationNode {
  agent_id: number
  agent_name: string
  shared_experiences: number
  total_reuses: number
  domains: string[]
}

/** 知识传播网络边 */
export interface KnowledgePropagationEdge {
  source: number
  target: number
  weight: number
}

/** 跨 Agent 知识传播网络 */
export interface KnowledgePropagationNetwork {
  nodes: KnowledgePropagationNode[]
  edges: KnowledgePropagationEdge[]
  days: number
  total_shared_experiences: number
  total_reuses: number
}

/** 步骤瓶颈时序（单步） */
export interface StepBottleneckTimelineStep {
  step_key: string
  series: number[]
  avg_duration: number
  sample_count: number
  change_pct: number
}

/** 工作流步骤瓶颈时序分析 */
export interface WorkflowStepBottleneckTimeline {
  steps: StepBottleneckTimelineStep[]
  days: number
  date_range: string[]
}

/** 协议决策延迟（按类型） */
export interface ProtocolLatencyType {
  protocol_type: string
  count: number
  avg_seconds: number
  median_seconds: number
  min_seconds: number
  max_seconds: number
}

/** 协议决策延迟分析 */
export interface ProtocolDecisionLatency {
  types: ProtocolLatencyType[]
  days: number
  total: number
}

/** Agent 专长演化（单 Agent） */
export interface SpecializationEvolutionAgent {
  agent_id: number
  agent_name: string
  series: number[]
  peak_domains: number
  peak_week_idx: number
  total_domains: number
  domains: string[]
}

/** Agent 专长演化分析 */
export interface AgentSpecializationEvolution {
  agents: SpecializationEvolutionAgent[]
  weeks: number
  week_labels: string[]
}

/** 单条经验置信度衰减告警 */
export interface ExperiencesDecayAlert {
  agent_id: number
  agent_name: string
  older_avg_confidence: number
  newer_avg_confidence: number
  drop: number
  older_count: number
  newer_count: number
  current_confidence: number
  recommendation: 'review_recent_experiences' | 'monitor'
}

/** Agent 经验置信度衰减告警 */
export interface AgentExperiencesDecayAlerts {
  alerts: ExperiencesDecayAlert[]
  total_alerts: number
  days: number
  min_drop: number
}

/** 单条跨项目授权效率记录 */
export interface CrossProjectAuthEfficiency {
  authorization_id: number
  agent_id: number
  agent_name: string
  host_project_id: number
  host_project_name: string
  tasks_completed_in_host: number
  is_active: boolean
  expires_at: string | null
  utilized: boolean
}

/** 跨项目 Agent 借调效率 */
export interface AgentCrossProjectEfficiency {
  authorizations: CrossProjectAuthEfficiency[]
  total_authorizations: number
  active_count: number
  utilized_count: number
  idle_count: number
  utilization_rate: number
  days: number
}

export type CapabilityStatus = 'missing' | 'bottleneck' | 'surplus' | 'unused_supply' | 'balanced'

/** 单项能力供需记录 */
export interface CapabilitySupplyDemandItem {
  capability: string
  supply: number
  demand: number
  gap: number
  ratio: number | null
  status: CapabilityStatus
}

/** Agent 能力供需匹配度 */
export interface AgentCapabilitySupplyDemand {
  capabilities: CapabilitySupplyDemandItem[]
  total_capabilities: number
  bottleneck_count: number
  agent_total: number
  active_task_total: number
}

/** 单个工作流结构复杂度记录 */
export interface WorkflowStructuralComplexityItem {
  workflow_id: number
  workflow_name: string
  version: number
  step_count: number
  max_depth: number
  total_edges: number
  avg_fan_in: number
  avg_fan_out: number
  root_count: number
  leaf_count: number
  parallelism_budget: number | null
}

/** 工作流结构复杂度分析 */
export interface WorkflowStructuralComplexity {
  workflows: WorkflowStructuralComplexityItem[]
  total_workflows: number
  avg_steps: number
  avg_depth: number
}

export type AgentIdleStage = 'active' | 'idle' | 'stale' | 'dormant' | 'never'

/** 单个 Agent 闲置记录 */
export interface AgentIdleItem {
  agent_id: number
  agent_name: string
  status: string | null
  last_seen_at: string | null
  last_activity_at: string | null
  idle_hours: number | null
  stage: AgentIdleStage
}

/** Agent 闲置时长排行 */
export interface AgentIdleRanking {
  agents: AgentIdleItem[]
  total_agents: number
  stage_counts: Record<string, number>
}

export interface ConflictsSandboxCorrelationTypeItem {
  total: number
  with_violation: number
  rate: number
}

export interface ConflictsSandboxCorrelationAgent {
  agent_id: number
  name: string
  conflicts: number
  with_violation: number
}

export interface ConflictsSandboxCorrelation {
  days: number
  window_hours: number
  total_conflicts: number
  with_violation: number
  violation_rate: number
  by_conflict_type: Record<string, ConflictsSandboxCorrelationTypeItem>
  top_agents: ConflictsSandboxCorrelationAgent[]
}
