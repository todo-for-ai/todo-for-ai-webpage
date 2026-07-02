import { apiClient } from './client/index.js'
import { getApiBaseUrl } from '../utils/apiConfig'
import type { Task } from './tasks'

export type AgentStatus = 'active' | 'paused' | 'offline' | 'disabled'
export type AgentKind = 'assistant' | 'autonomous' | 'coordinator' | 'external'
export type TaskAssignmentState =
  | 'assigned'
  | 'claimed'
  | 'running'
  | 'waiting_human'
  | 'review'
  | 'done'
  | 'failed'
  | 'cancelled'
  | 'expired'

export interface Pagination {
  page: number
  per_page: number
  total: number
  pages: number
  has_next: boolean
  has_prev: boolean
  next_num?: number | null
  prev_num?: number | null
}

export interface Agent {
  id: number
  owner_id: number
  name: string
  description?: string
  kind: AgentKind
  status: AgentStatus
  provider?: string
  model?: string
  capabilities: string[]
  config: Record<string, unknown>
  collaboration_role?: 'leader' | 'follower' | 'standalone'
  last_seen_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  stats?: {
    active_assignments: number
    total_runs: number
  }
}

export interface TaskAssignment {
  id: number
  task_id: number
  agent_id: number
  assigned_by_user_id?: number
  state: TaskAssignmentState
  lease_expires_at?: string
  claimed_at?: string
  completed_at?: string
  last_heartbeat_at?: string
  progress_rate: number
  notes?: string
  created_at: string
  updated_at: string
  task?: Task
  agent?: Pick<Agent, 'id' | 'name' | 'kind' | 'status'>
  runs?: Array<{ id: number; status: string }>
}

export interface AgentRun {
  id: number
  task_id: number
  agent_id: number
  assignment_id?: number
  status: 'running' | 'waiting_human' | 'succeeded' | 'failed' | 'cancelled' | 'expired'
  started_at: string
  ended_at?: string
  output_summary?: string
  error?: string
  input_snapshot: Record<string, unknown>
  run_metadata: Record<string, unknown>
}

export interface TaskEvent {
  id: number
  task_id: number
  actor_type: 'human' | 'agent' | 'system'
  actor_user_id?: number
  actor_agent_id?: number
  actor_agent?: Pick<Agent, 'id' | 'name' | 'kind' | 'status'>
  actor_user?: {
    id: number
    name?: string
    email?: string
  }
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export type PostableTaskEventType =
  | 'message'
  | 'note'
  | 'question'
  | 'answer'
  | 'handoff'
  | 'blocker'
  | 'decision'
  | 'info'

export interface PostTaskEventData {
  content?: string
  event_type?: PostableTaskEventType
  agent_id?: number
  to_agent_id?: number
  payload?: Record<string, unknown>
}

export interface AgentInboxResult {
  items: TaskEvent[]
  agent_id: number
  count?: number
  latest_id?: number
  since_id?: number
}

export interface NotificationItem {
  id: number
  user_id: number
  event_type: string
  task_id?: number
  agent_id?: number
  payload: Record<string, unknown>
  is_read: boolean
  read_at?: string
  agent_name?: string
  task_title?: string
  created_at: string
  updated_at: string
}

export interface ListNotificationsResult {
  items: NotificationItem[]
  unread_count: number
  since_id?: number
}

export interface SharedContextEntry {
  id: number
  task_id: number
  key: string
  value: string
  author_agent_id?: number
  author_user_id?: number
  author_agent_name?: string
  author_user_name?: string
  created_at: string
  updated_at: string
}

export type RunLogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface RunLogEntry {
  id: number
  run_id: number
  level: RunLogLevel
  message: string
  meta: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface HandoffTaskData {
  to_agent_id: number
  from_assignment_id?: number
  lease_seconds?: number
  reason?: string
  notes?: string
}

export interface HandoffTaskResult {
  from_assignment: TaskAssignment | null
  assignment: TaskAssignment
  run: AgentRun
}

export interface DispatchTasksData {
  project_id?: number
  max_assignments?: number
  lease_seconds?: number
  match_capabilities?: boolean
  require_capability_match?: boolean
  candidate_agent_ids?: number[]
  include_self?: boolean
}

export interface DispatchAssignment {
  assignment: TaskAssignment
  run: AgentRun
  agent: Agent
  strategy: 'capability_match' | 'priority_fifo'
  score: number
  matched_capabilities: string[]
}

export interface DispatchTasksResult {
  coordinator: Agent
  assignments: DispatchAssignment[]
  summary: {
    claimable_tasks: number
    available_agents: number
    dispatched: number
    skipped_no_match: number
  }
}

export type ReviewQueueAction = 'all' | 'human_feedback' | 'final_review'

export interface ReviewQueueItem {
  assignment: TaskAssignment
  task?: Task
  agent?: Agent
  action: Exclude<ReviewQueueAction, 'all'> | 'review'
  available_actions: string[]
}

// Workflow types

export interface WorkflowStepItem {
  id: number
  workflow_id: number
  step_key: string
  name: string
  description: string
  order: number
  required_capabilities: string[]
  agent_id?: number
  task_template_id?: number
  depends_on: string[]
  condition?: { step_key: string; operator: string; value?: string | boolean } | null
  sub_workflow_id?: number | null
  timeout_seconds?: number
  retry_count: number
  on_failure: string
}

export interface WorkflowItem {
  id: number
  owner_id: number
  name: string
  description: string
  version: number
  definition: Record<string, unknown>
  is_active: boolean
  max_parallel_steps?: number
  steps: WorkflowStepItem[]
  created_at: string
  updated_at: string
}

export interface CreateWorkflowStepData {
  step_key: string
  name?: string
  description?: string
  order?: number
  required_capabilities?: string[]
  agent_id?: number
  task_template_id?: number
  depends_on?: string[]
  condition?: { step_key: string; operator: string; value?: string | boolean } | null
  sub_workflow_id?: number | null
  timeout_seconds?: number
  retry_count?: number
  on_failure?: 'abort' | 'skip' | 'continue'
}

export interface CreateWorkflowData {
  name: string
  description?: string
  definition?: Record<string, unknown>
  is_active?: boolean
  max_parallel_steps?: number
  steps: CreateWorkflowStepData[]
}

export interface WorkflowStepRunItem {
  id: number
  run_id: number
  step_key: string
  name?: string
  depends_on?: string[]
  task_id?: number
  assignment_id?: number
  agent_id?: number
  status: string
  started_at?: string
  finished_at?: string
  error?: string
  attempt: number
  runtime_overrides?: Record<string, unknown>
}

export interface WorkflowRunItem {
  id: number
  workflow_id: number
  root_task_id?: number
  project_id: number
  owner_id: number
  status: string
  context: Record<string, unknown>
  error?: string
  started_at?: string
  finished_at?: string
  step_runs: WorkflowStepRunItem[]
  created_at: string
  updated_at: string
}

export interface SandboxExecutionItem {
  id: number
  sandbox_id: number
  agent_id?: number
  step_run_id?: number
  status: string
  policy_snapshot?: Record<string, unknown>
  started_at?: string
  ended_at?: string
  violations?: Array<Record<string, unknown>>
  termination_reason?: string
  error?: string
}

export interface RunLogItem {
  id: number
  run_id: number
  level: string
  message: string
  created_at: string
}

export interface ConflictItem {
  id: number
  conflict_type: string
  severity: string
  status: string
  title?: string
  description?: string
  suggested_strategy?: string
  resolution?: string
}

export interface SecurityEventItem {
  event_type: string
  occurred_at?: string
  severity: string
  agent_id?: number
  title: string
  detail?: string
  source: string
  source_id: number
  workflow_run_id?: number
  extra?: Record<string, unknown>
}

export interface SecurityDailyTrendDay {
  date: string
  sandbox_violation: number
  conflict: number
  audit: number
  total: number
}

export interface SecurityDailyTrend {
  days: SecurityDailyTrendDay[]
  totals: {
    sandbox_violation: number
    conflict: number
    audit: number
    total: number
  }
}

export interface SecurityByAgentItem {
  agent_id: number | null
  name: string
  total: number
  sandbox_violation: number
  conflict: number
  audit: number
  CRITICAL: number
  WARNING: number
  INFO: number
}

export interface SecurityByAgent {
  agents: SecurityByAgentItem[]
}

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
  /** Agent 声誉分（0-100，可能为 null 表示未计算） */
  reputation?: number | null
}

export interface CollaborationGraphEdge {
  source: number
  target: number
  count: number
  /** source -> target 方向消息数（source 为较小 id 端） */
  source_to_target?: number
  /** target -> source 方向消息数 */
  target_to_source?: number
}

export interface CollaborationGraph {
  nodes: CollaborationGraphNode[]
  edges: CollaborationGraphEdge[]
  total_edges: number
}

/** 声誉历史单个变化点 */
export interface ReputationHistoryPoint {
  /** ISO 时间戳 */
  at: string | null
  /** 审计记录 ID */
  audit_id?: number
  /** 变化后的声誉分 */
  new_score?: number | null
  /** 本次分值增量 */
  score_delta?: number | null
  /** 质量反馈增量 */
  quality_delta?: number | null
  /** 该次任务是否成功 */
  success?: boolean | null
  /** 累计任务数 */
  total_tasks?: number | null
  /** 触发该次结果的来源任务 ID（若可回溯） */
  task_id?: number | null
  /** 工作流步骤键 */
  step_key?: string | null
  /** 工作流运行 ID */
  workflow_run_id?: number | null
  /** 父工作流运行 ID（子工作流场景） */
  parent_workflow_run_id?: number | null
  /** 子工作流运行 ID */
  sub_workflow_run_id?: number | null
  /** 任务耗时秒 */
  duration_sec?: number | null
}

export interface ReputationHistory {
  agent_id: number
  /** 当前最新声誉分 */
  current_score: number
  /** 时间升序的变化点列表 */
  points: ReputationHistoryPoint[]
}

/** 冲突仪表盘聚合统计 */
export interface ConflictsDashboard {
  total: number
  active: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  by_severity: Record<string, number>
  resolution_latency?: {
    count: number
    avg_seconds: number | null
    median_seconds: number | null
    max_seconds: number | null
    by_bucket: { under_1h: number; '1h_to_24h': number; '1d_to_7d': number; over_7d: number }
  }
}

/** 冲突时间趋势单日桶 */
export interface ConflictsTrendBucket {
  date: string
  detected: number
  resolved: number
}

export interface ConflictsTrend {
  days: number
  trend: ConflictsTrendBucket[]
}

/** 冲突按 Agent 分布单项 */
export interface ConflictByAgentItem {
  agent_id: number
  name: string | null
  kind: string | null
  total: number
  active: number
}

export interface ConflictsByAgent {
  items: ConflictByAgentItem[]
}

/** 冲突解决策略效果单项 */
export interface ConflictStrategyStat {
  strategy: string
  uses: number
  with_task: number
  recurrences: number
  recurrence_rate: number
}

export interface ConflictsStrategyStats {
  items: ConflictStrategyStat[]
}

/** 沙盒违规时间趋势单日桶 */
export interface SandboxViolationTrendBucket {
  date: string
  count: number
}

export interface SandboxViolationTrend {
  days: number
  trend: SandboxViolationTrendBucket[]
  by_type: Record<string, number>
}

/** 沙盒违规按 Agent 分布单项 */
export interface SandboxViolationByAgentItem {
  agent_id: number
  name: string | null
  kind: string | null
  total: number
  by_type: Record<string, number>
}

export interface SandboxViolationsByAgent {
  days: number
  items: SandboxViolationByAgentItem[]
}

/** 沙盒模板使用统计单项 */
export interface SandboxTemplateUsageItem {
  template_key: string
  uses: number
  bound_to_agent: number
}

export interface SandboxTemplateUsage {
  items: SandboxTemplateUsageItem[]
}

export interface OrchestrationResult {
  stale_agents: number
  stale_agent_ids: number[]
  expired_leases: number
  escalated_tasks: number
  escalated_task_ids: number[]
  timed_out_steps: number
  triggers_fired: number
  trigger_run_ids: number[]
  conflicts_detected: number
  conflicts_auto_resolved: number
  conflicts_skipped: number
  errors: string[]
  duration_seconds: number
}

export interface OrchestratorLastRun {
  summary: string
  duration_seconds: number
  stale_agents: number
  timed_out_steps: number
  triggers_fired: number
  trigger_run_ids?: number[]
  conflicts_auto_resolved: number
  error_count: number
}

export interface OrchestratorStatus {
  enabled: boolean
  last_run: OrchestratorLastRun | null
}

export interface OrchestrationRunItem {
  id: number
  owner_id: number
  triggered_by: string
  stale_agents: number
  expired_leases: number
  escalated_tasks: number
  timed_out_steps: number
  triggers_fired: number
  trigger_run_ids: number[]
  conflicts_detected: number
  conflicts_auto_resolved: number
  conflicts_skipped: number
  error_count: number
  error_details: string[]
  duration_seconds: number
  summary: string
  created_at: string
}

export interface OrchestratorHistoryResult {
  items: OrchestrationRunItem[]
  count: number
  trend: {
    total_runs: number
    manual_runs: number
    scheduler_runs: number
    avg_duration: number
    total_errors: number
    total_conflicts_resolved: number
    total_triggers_fired: number
  }
}

export interface OrchestratorDailyTrendDay {
  date: string
  runs: number
  manual_runs: number
  scheduler_runs: number
  triggers_fired: number
  conflicts_resolved: number
  errors: number
  avg_duration: number
}

export interface OrchestratorDailyTrend {
  days: OrchestratorDailyTrendDay[]
  totals: {
    runs: number
    manual_runs: number
    scheduler_runs: number
    triggers_fired: number
    conflicts_resolved: number
    errors: number
  }
}

export interface WorkflowRunConsoleStep {
  step_run: WorkflowStepRunItem
  effective_params: Record<string, unknown>
  sandbox_execution?: SandboxExecutionItem | null
  sandbox_policy?: Record<string, unknown> | null
  recent_logs: RunLogItem[]
  duration_seconds?: number | null
}

export interface WorkflowRunConsoleSummary {
  total_steps: number
  status_counts: Record<string, number>
  progress_percent: number
  running_count: number
  failed_count: number
  pending_count: number
}

export interface WorkflowRunConsoleResult {
  workflow_run: WorkflowRunItem
  steps: WorkflowRunConsoleStep[]
  conflicts: ConflictItem[]
  summary: WorkflowRunConsoleSummary
}

/** 工作流步骤执行统计单项（按 step_key 聚合） */
export interface WorkflowStepStat {
  step_key: string
  total: number
  succeeded: number
  failed: number
  skipped: number
  success_rate: number
  avg_duration_seconds: number | null
  sample_size_duration: number
  retries: number
  avg_retries: number
}

export interface WorkflowStepStats {
  items: WorkflowStepStat[]
}

/** 工作流运行结果趋势单日桶 */
export interface WorkflowRunTrendBucket {
  date: string
  succeeded: number
  failed: number
}

export interface WorkflowRunTrend {
  days: number
  trend: WorkflowRunTrendBucket[]
  total_succeeded: number
  total_failed: number
}

/** 失败步骤与冲突/沙盒违规的跨维度关联 */
export interface WorkflowFailureCorrelationAgent {
  agent_id: number
  name: string
  failed_steps: number
  with_conflict: number
  with_violation: number
}

export interface WorkflowFailureCorrelation {
  days: number
  window_hours: number
  total_failed_steps: number
  with_conflict: number
  with_violation: number
  with_both: number
  conflict_rate: number
  violation_rate: number
  both_rate: number
  top_agents: WorkflowFailureCorrelationAgent[]
}

export interface WorkflowFailureCorrelationByStepItem {
  step_key: string
  failed: number
  with_conflict: number
  with_violation: number
  conflict_rate: number
  violation_rate: number
}

export interface WorkflowFailureCorrelationByStep {
  days: number
  window_hours: number
  items: WorkflowFailureCorrelationByStepItem[]
}

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
}

export interface AgentProductivityTrend {
  days: number
  trend: AgentProductivityTrendBucket[]
  total_done: number
  total_failed: number
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
}

export interface AgentHealthTrend {
  days: number
  trend: AgentHealthTrendBucket[]
  total_positive: number
  total_negative: number
  total_conflicts: number
  total_violations: number
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

export interface ExperiencesStats {
  total: number
  by_domain: Record<string, number>
  by_task_type: Record<string, number>
  by_experience_type: Record<string, number>
  shared: number
  total_reuses: number
  avg_confidence: number | null
  by_confidence_bucket: Record<string, number>
  top_reused: ExperiencesTopReusedItem[]
  by_domain_tasktype: Record<string, Record<string, number>>
}

export interface ExperiencesTopReusedItem {
  id: number
  domain: string
  task_type: string | null
  experience_type: string
  times_reused: number
  confidence: number | null
  key_learnings: string
}

export interface ExperiencesLowConfidenceItem {
  id: number
  agent_id: number
  domain: string
  task_type: string | null
  experience_type: string
  confidence: number | null
  times_reused: number
  key_learnings: string
}

export interface ExperiencesLowConfidence {
  max_confidence: number
  items: ExperiencesLowConfidenceItem[]
}

export interface ListResult<T> {
  items: T[]
  pagination: Pagination
}

export interface AgentQueryParams {
  page?: number
  per_page?: number
  search?: string
  status?: AgentStatus | 'all'
  sort_by?: 'created_at' | 'name' | 'last_seen_at'
  sort_order?: 'asc' | 'desc'
}

export interface AssignmentQueryParams {
  page?: number
  per_page?: number
  state?: TaskAssignmentState | 'all'
}

export interface TaskAssignmentQueryParams {
  page?: number
  per_page?: number
  state?: TaskAssignmentState | 'active' | 'all'
}

export interface CreateAgentData {
  name: string
  description?: string
  kind?: AgentKind
  status?: AgentStatus
  provider?: string
  model?: string
  capabilities?: string[]
  config?: Record<string, unknown>
}

export type UpdateAgentData = Partial<CreateAgentData>

export interface ClaimTaskData {
  task_id?: number
  project_id?: number
  lease_seconds?: number
  match_capabilities?: boolean
  dispatch_source?: 'human'
  run_metadata?: Record<string, unknown>
}

export interface ClaimTaskResult {
  agent: Agent
  assignment: TaskAssignment
  run: AgentRun
}

export interface UpdateAssignmentData {
  state?: TaskAssignmentState
  progress_rate?: number
  notes?: string
  feedback_content?: string
  output_summary?: string
  error?: string
  lease_seconds?: number
  task_status?: Task['status']
  run_metadata?: Record<string, unknown>
}

const unwrapData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T
  }
  return response as T
}

const unwrapList = <T>(response: any): ListResult<T> => {
  const payload = unwrapData<any>(response)
  const items = payload?.items || payload?.data || []
  const pagination = payload?.pagination || {
    page: 1,
    per_page: Array.isArray(items) ? items.length : 0,
    total: Array.isArray(items) ? items.length : 0,
    pages: 1,
    has_next: false,
    has_prev: false,
    next_num: null,
    prev_num: null,
  }

  return {
    items: Array.isArray(items) ? items : [],
    pagination,
  }
}

const buildQuery = (params?: object) => {
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

export class AgentsApi {
  async getAgents(params?: AgentQueryParams): Promise<ListResult<Agent>> {
    const response = await apiClient.get(`/agents${buildQuery(params)}`)
    return unwrapList<Agent>(response)
  }

  async getReviewQueue(params?: { action?: ReviewQueueAction; page?: number; per_page?: number }): Promise<ListResult<ReviewQueueItem>> {
    const response = await apiClient.get(`/agents/review-queue${buildQuery(params)}`)
    return unwrapList<ReviewQueueItem>(response)
  }

  async getAgent(id: number): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.get(`/agents/${id}`))
  }

  async createAgent(data: CreateAgentData): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.post('/agents', data))
  }

  async updateAgent(id: number, data: UpdateAgentData): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.put(`/agents/${id}`, data))
  }

  async heartbeatAgent(id: number, status?: AgentStatus): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.post(`/agents/${id}/heartbeat`, status ? { status } : {}))
  }

  async getAgentAssignments(id: number, params?: AssignmentQueryParams): Promise<ListResult<TaskAssignment>> {
    const response = await apiClient.get(`/agents/${id}/assignments${buildQuery(params)}`)
    return unwrapList<TaskAssignment>(response)
  }

  async claimTask(id: number, data: ClaimTaskData = {}): Promise<ClaimTaskResult | null> {
    return unwrapData<ClaimTaskResult | null>(await apiClient.post(`/agents/${id}/claim`, data))
  }

  async updateAssignment(agentId: number, assignmentId: number, data: UpdateAssignmentData) {
    return unwrapData<{ assignment: TaskAssignment; run: AgentRun | null }>(
      await apiClient.put(`/agents/${agentId}/assignments/${assignmentId}`, data)
    )
  }

  async getTaskAssignments(taskId: number, params?: TaskAssignmentQueryParams): Promise<ListResult<TaskAssignment>> {
    const response = await apiClient.get(`/agents/tasks/${taskId}/assignments${buildQuery(params)}`)
    return unwrapList<TaskAssignment>(response)
  }

  async updateTaskAssignment(taskId: number, assignmentId: number, data: UpdateAssignmentData) {
    return unwrapData<{ assignment: TaskAssignment; run: AgentRun | null }>(
      await apiClient.put(`/agents/tasks/${taskId}/assignments/${assignmentId}`, data)
    )
  }

  async getTaskEvents(taskId: number, params?: { page?: number; per_page?: number }): Promise<ListResult<TaskEvent>> {
    const response = await apiClient.get(`/agents/tasks/${taskId}/events${buildQuery(params)}`)
    return unwrapList<TaskEvent>(response)
  }

  async postTaskEvent(taskId: number, data: PostTaskEventData): Promise<TaskEvent> {
    return unwrapData<TaskEvent>(await apiClient.post(`/agents/tasks/${taskId}/events`, data))
  }

  async handoffTask(taskId: number, data: HandoffTaskData): Promise<HandoffTaskResult> {
    return unwrapData<HandoffTaskResult>(await apiClient.post(`/agents/tasks/${taskId}/handoff`, data))
  }

  async dispatchTasks(agentId: number, data: DispatchTasksData = {}): Promise<DispatchTasksResult> {
    return unwrapData<DispatchTasksResult>(await apiClient.post(`/agents/${agentId}/dispatch`, data))
  }

  async getAgentInbox(agentId: number, params?: { since_id?: number; per_page?: number; include_self?: boolean }): Promise<AgentInboxResult> {
    return unwrapData<AgentInboxResult>(await apiClient.get(`/agents/${agentId}/inbox${buildQuery(params)}`))
  }

  async getNotifications(params?: { since_id?: number; unread_only?: boolean; per_page?: number }): Promise<ListNotificationsResult> {
    return unwrapData<ListNotificationsResult>(await apiClient.get(`/agents/notifications${buildQuery(params)}`))
  }

  async markNotificationsRead(data: { ids?: number[]; all?: boolean }): Promise<{ marked_count: number }> {
    return unwrapData<{ marked_count: number }>(await apiClient.post('/agents/notifications/read', data))
  }

  async getSharedContext(taskId: number, key?: string): Promise<SharedContextEntry[]> {
    const params = key ? `?key=${encodeURIComponent(key)}` : ''
    return unwrapData<SharedContextEntry[]>(await apiClient.get(`/agents/tasks/${taskId}/shared-context${params}`))
  }

  async setSharedContext(taskId: number, data: { key: string; value: string; agent_id?: number }): Promise<SharedContextEntry> {
    return unwrapData<SharedContextEntry>(await apiClient.put(`/agents/tasks/${taskId}/shared-context`, data))
  }

  async deleteSharedContext(taskId: number, entryId: number): Promise<void> {
    await apiClient.delete(`/agents/tasks/${taskId}/shared-context/${entryId}`)
  }

  async getRunLogs(runId: number, params?: { since_id?: number; level?: RunLogLevel; per_page?: number }): Promise<{ items: RunLogEntry[]; latest_id: number; since_id?: number; run_id: number }> {
    const query = params ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])).toString()}` : ''
    return unwrapData<any>(await apiClient.get(`/agents/runs/${runId}/logs${query}`))
  }

  // Task templates
  async getTaskTemplates(): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get('/agents/task-templates'))
  }

  async createTaskTemplate(data: { name: string; description?: string; title_template?: string; content_template?: string; priority?: string; tags?: string[]; is_ai_task?: boolean; capabilities?: string[] }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/task-templates', data))
  }

  async deleteTaskTemplate(id: number): Promise<void> {
    await apiClient.delete(`/agents/task-templates/${id}`)
  }

  async instantiateTaskTemplate(templateId: number, data: { project_id: number; title?: string; content?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/task-templates/${templateId}/instantiate`, data))
  }

  // Workflows
  async getWorkflows(params?: { is_active?: boolean; page?: number; per_page?: number }): Promise<ListResult<WorkflowItem>> {
    const response = await apiClient.get(`/agents/workflows${buildQuery(params)}`)
    return unwrapList<WorkflowItem>(response)
  }

  async getWorkflow(id: number): Promise<WorkflowItem> {
    return unwrapData<WorkflowItem>(await apiClient.get(`/agents/workflows/${id}`))
  }

  async createWorkflow(data: CreateWorkflowData): Promise<WorkflowItem> {
    return unwrapData<WorkflowItem>(await apiClient.post('/agents/workflows', data))
  }

  async updateWorkflow(id: number, data: Partial<CreateWorkflowData>): Promise<WorkflowItem> {
    return unwrapData<WorkflowItem>(await apiClient.put(`/agents/workflows/${id}`, data))
  }

  async deleteWorkflow(id: number): Promise<void> {
    await apiClient.delete(`/agents/workflows/${id}`)
  }

  async launchWorkflow(workflowId: number, data: { project_id: number; root_task_id?: number; context?: Record<string, unknown> }): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflows/${workflowId}/runs`, data))
  }

  async getWorkflowRuns(params?: { workflow_id?: number; status?: string; page?: number; per_page?: number }): Promise<ListResult<WorkflowRunItem>> {
    const response = await apiClient.get(`/agents/workflow-runs${buildQuery(params)}`)
    return unwrapList<WorkflowRunItem>(response)
  }

  async getWorkflowStepStats(limit = 30): Promise<WorkflowStepStats> {
    return unwrapData<WorkflowStepStats>(await apiClient.get(`/agents/workflows/step-stats${buildQuery({ limit })}`))
  }

  async getWorkflowRunTrend(days = 30): Promise<WorkflowRunTrend> {
    return unwrapData<WorkflowRunTrend>(await apiClient.get(`/agents/workflows/run-trend${buildQuery({ days })}`))
  }

  async getExperiencesStats(): Promise<ExperiencesStats> {
    return unwrapData<ExperiencesStats>(await apiClient.get('/agents/experiences/stats'))
  }

  async getExperiencesLowConfidence(maxConfidence = 0.5, limit = 20): Promise<ExperiencesLowConfidence> {
    return unwrapData<ExperiencesLowConfidence>(await apiClient.get(`/agents/experiences/low-confidence${buildQuery({ max_confidence: maxConfidence, limit })}`))
  }

  async getWorkflowFailureCorrelation(days = 30, windowHours = 2): Promise<WorkflowFailureCorrelation> {
    return unwrapData<WorkflowFailureCorrelation>(await apiClient.get(`/agents/workflows/failure-correlation${buildQuery({ days, window_hours: windowHours })}`))
  }

  async getWorkflowFailureCorrelationByStep(days = 30, windowHours = 2): Promise<WorkflowFailureCorrelationByStep> {
    return unwrapData<WorkflowFailureCorrelationByStep>(await apiClient.get(`/agents/workflows/failure-correlation-by-step${buildQuery({ days, window_hours: windowHours })}`))
  }

  async getAgentProductivity(days = 30, limit = 20): Promise<AgentProductivity> {
    return unwrapData<AgentProductivity>(await apiClient.get(`/agents/productivity${buildQuery({ days, limit })}`))
  }

  async getAgentProductivityTrend(days = 30): Promise<AgentProductivityTrend> {
    return unwrapData<AgentProductivityTrend>(await apiClient.get(`/agents/productivity/trend${buildQuery({ days })}`))
  }

  async getAgentProductivityAlerts(): Promise<AgentProductivityAlerts> {
    return unwrapData<AgentProductivityAlerts>(await apiClient.get('/agents/productivity/alerts'))
  }

  async getAgentProductivityByKind(days = 30): Promise<AgentProductivityByKind> {
    return unwrapData<AgentProductivityByKind>(await apiClient.get(`/agents/productivity/by-kind${buildQuery({ days })}`))
  }

  async getConflictsSandboxCorrelation(days = 30, windowHours = 2): Promise<ConflictsSandboxCorrelation> {
    return unwrapData<ConflictsSandboxCorrelation>(await apiClient.get(`/agents/conflicts/sandbox-correlation${buildQuery({ days, window_hours: windowHours })}`))
  }

  async getAgentHealth(days = 30): Promise<AgentHealth> {
    return unwrapData<AgentHealth>(await apiClient.get(`/agents/health${buildQuery({ days })}`))
  }

  async getAgentHealthTrend(days = 30): Promise<AgentHealthTrend> {
    return unwrapData<AgentHealthTrend>(await apiClient.get(`/agents/health/trend${buildQuery({ days })}`))
  }

  async getAgentHealthAlerts(weights: HealthWeights = {}): Promise<AgentHealthAlerts> {
    return unwrapData<AgentHealthAlerts>(await apiClient.get(`/agents/health/alerts${buildQuery(weights)}`))
  }

  async getWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.get(`/agents/workflow-runs/${runId}`))
  }

  async getWorkflowRunConsole(runId: number, params?: { log_limit?: number }): Promise<WorkflowRunConsoleResult> {
    return unwrapData<WorkflowRunConsoleResult>(await apiClient.get(`/agents/workflow-runs/${runId}/console${buildQuery(params)}`))
  }

  async cancelWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/cancel`))
  }

  async pauseWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/pause`))
  }

  async resumeWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/resume`))
  }

  async retryWorkflowRun(runId: number): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/retry`))
  }

  async completeWorkflowStep(runId: number, stepKey: string, data: { success?: boolean; error?: string }): Promise<WorkflowRunItem> {
    return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/steps/${stepKey}/complete`, data))
  }

  async escalateOverdueTasks(data?: { overdue_after_days?: number }): Promise<{ escalated_count: number; task_ids: number[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/escalate-overdue', data || {}))
  }

  async getAuditLogs(params?: { action?: string; resource_type?: string; resource_id?: number; actor_type?: string; project_id?: number; page?: number; per_page?: number }): Promise<ListResult<any>> {
    const response = await apiClient.get(`/agents/audit-logs${buildQuery(params)}`)
    return unwrapList<any>(response)
  }

  async getSecurityEvents(params?: { agent_id?: number; workflow_run_id?: number; event_type?: string; severity?: string; since?: string; until?: string; page?: number; per_page?: number }): Promise<ListResult<SecurityEventItem>> {
    const response = await apiClient.get(`/agents/security/events${buildQuery(params)}`)
    return unwrapList<SecurityEventItem>(response)
  }

  /** Export unified security events as CSV or JSON. Returns the raw text.
   *  Uses a raw fetch (not apiClient) because the client forces JSON parsing. */
  async exportSecurityEvents(params?: { agent_id?: number; workflow_run_id?: number; event_type?: string; severity?: string; since?: string; until?: string; search?: string; format?: 'csv' | 'json' }): Promise<string> {
    const token = localStorage.getItem('access_token')
    const url = `${getApiBaseUrl()}/agents/security/events/export${buildQuery(params)}`
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      throw new Error(`Export failed: HTTP ${response.status}`)
    }
    return await response.text()
  }

  /** Daily aggregation of security events for trend visualization (same filters as list). */
  async getSecurityEventsDailyTrend(params?: { agent_id?: number; workflow_run_id?: number; event_type?: string; severity?: string; since?: string; until?: string; search?: string }): Promise<SecurityDailyTrend> {
    const response = await apiClient.get(`/agents/security/events/daily-trend${buildQuery(params)}`)
    return unwrapData<SecurityDailyTrend>(response)
  }

  /** Per-agent aggregation of security events for ranking (same filters as list). */
  async getSecurityEventsByAgent(params?: { agent_id?: number; workflow_run_id?: number; event_type?: string; severity?: string; since?: string; until?: string; search?: string }): Promise<SecurityByAgent> {
    const response = await apiClient.get(`/agents/security/events/by-agent${buildQuery(params)}`)
    return unwrapData<SecurityByAgent>(response)
  }

  async healthCheck(): Promise<{ stale_agents: number; stale_agent_ids: number[]; expired_leases: number; escalated_tasks: number; escalated_task_ids: number[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/health-check'))
  }

  // Project Members (RBAC)
  async getProjectMembers(projectId: number): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/projects/${projectId}/members`))
  }

  async addProjectMember(projectId: number, data: { user_id: number; role: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/projects/${projectId}/members`, data))
  }

  async updateProjectMember(projectId: number, memberId: number, data: { role: string }): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/projects/${projectId}/members/${memberId}`, data))
  }

  async removeProjectMember(projectId: number, memberId: number): Promise<void> {
    await apiClient.delete(`/agents/projects/${projectId}/members/${memberId}`)
  }

  // Agent Broadcast
  async broadcastMessage(agentId: number, content: string): Promise<{ recipient_count: number }> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/broadcast`, { content }))
  }

  // Collaboration Metrics
  async getCollaborationMetrics(params?: { project_id?: number; days?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/dashboard/metrics${buildQuery(params)}`))
  }

  // Workflow Triggers
  async getWorkflowTriggers(params?: { workflow_id?: number; is_active?: boolean; page?: number; per_page?: number }): Promise<ListResult<any>> {
    return unwrapList<any>(await apiClient.get(`/agents/workflow-triggers${buildQuery(params)}`))
  }

  async createWorkflowTrigger(data: { workflow_id: number; name: string; cron_expr?: string; one_shot_at?: string; is_active?: boolean; project_id?: number; root_task_id?: number; context_override?: Record<string, unknown> }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/workflow-triggers', data))
  }

  async updateWorkflowTrigger(triggerId: number, data: { name?: string; cron_expr?: string; one_shot_at?: string; is_active?: boolean; project_id?: number; root_task_id?: number; context_override?: Record<string, unknown> }): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/workflow-triggers/${triggerId}`, data))
  }

  async deleteWorkflowTrigger(triggerId: number): Promise<void> {
    await apiClient.delete(`/agents/workflow-triggers/${triggerId}`)
  }

  async fireDueTriggers(): Promise<{ fired_count: number; fired: any[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/fire-triggers'))
  }

  async markOfflineAgents(): Promise<{ marked_offline: number; agent_ids: number[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/mark-offline-agents'))
  }

  async timeoutWorkflowSteps(): Promise<{ timed_out: number; steps: any[] }> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/timeout-workflow-steps'))
  }

  async getRecommendedTasks(agentId: number, params?: { limit?: number; project_id?: number }): Promise<any[]> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/recommended-tasks${buildQuery(params)}`))
  }

  // Collaboration Channels
  async listChannels(params?: { project_id?: number; task_id?: number }): Promise<any[]> {
    return unwrapData<any>(await apiClient.get(`/agents/channels${buildQuery(params)}`))
  }

  async createChannel(data: { name: string; description?: string; project_id?: number; task_id?: number; agent_ids?: number[] }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/channels', data))
  }

  async getChannel(channelId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/channels/${channelId}`))
  }

  async updateChannel(channelId: number, data: { name?: string; description?: string; is_active?: boolean }): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/channels/${channelId}`, data))
  }

  async deleteChannel(channelId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/channels/${channelId}`))
  }

  async addChannelMember(channelId: number, data: { agent_id: number; role?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/channels/${channelId}/members`, data))
  }

  async removeChannelMember(channelId: number, memberId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/channels/${channelId}/members/${memberId}`))
  }

  async listChannelMessages(channelId: number, params?: { page?: number; per_page?: number }): Promise<any[]> {
    return unwrapData<any>(await apiClient.get(`/agents/channels/${channelId}/messages${buildQuery(params)}`))
  }

  async sendChannelMessage(channelId: number, data: { agent_id?: number; content: string; message_type?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/channels/${channelId}/messages`, data))
  }

  // Agent self-registration & discovery
  async selfRegisterAgent(data: { name: string; description?: string; kind?: string; provider?: string; model?: string; capabilities?: string[]; config?: Record<string, unknown>; collaboration_role?: string }): Promise<Agent> {
    return unwrapData<Agent>(await apiClient.post('/agents/self-register', data))
  }

  async discoverAgents(params?: { capability?: string[]; collaboration_role?: string; kind?: string; status?: string }): Promise<Agent[]> {
    return unwrapData<any>(await apiClient.get(`/agents/discover${buildQuery(params)}`))
  }

  // Agent Direct Messaging
  async sendAgentMessage(fromAgentId: number, toAgentId: number, data: { content: string; task_id?: number; message_type?: string; metadata?: Record<string, unknown> }): Promise<{ delivered: boolean; to_agent_id: number; to_agent_name: string }> {
    return unwrapData<any>(await apiClient.post(`/agents/${fromAgentId}/message/${toAgentId}`, data))
  }

  async getAgentMessages(agentId: number, params?: { page?: number; per_page?: number }): Promise<ListResult<any>> {
    return unwrapList<any>(await apiClient.get(`/agents/${agentId}/messages${buildQuery(params)}`))
  }

  async getAgentCollaborators(agentId: number, params?: { limit?: number }): Promise<AgentCollaboratorsResult> {
    return unwrapData<AgentCollaboratorsResult>(await apiClient.get(`/agents/${agentId}/collaborators${buildQuery(params)}`))
  }

  async getCollaborationGraph(params?: { limit?: number; since?: string; until?: string }): Promise<CollaborationGraph> {
    return unwrapData<CollaborationGraph>(await apiClient.get(`/agents/collaboration-graph${buildQuery(params)}`))
  }

  // Workflow Templates
  async getWorkflowTemplates(params?: { category?: string }): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/workflow-templates${buildQuery(params)}`))
  }

  async getWorkflowTemplate(templateKey: string): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflow-templates/${templateKey}`))
  }

  async instantiateWorkflowTemplate(templateKey: string, data?: { name?: string; project_id?: number; root_task_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/workflow-templates/${templateKey}/instantiate`, data || {}))
  }

  // Collaboration Templates
  async listCollaborationTemplates(params?: { category?: string }): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/collaboration-templates${buildQuery(params)}`))
  }

  async createCollaborationTemplate(data: { name: string; agent_specs: any[]; description?: string; category?: string; workflow_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/collaboration-templates', data))
  }

  async deleteCollaborationTemplate(templateId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/collaboration-templates/${templateId}`))
  }

  async instantiateCollaborationTemplate(templateKey: string, data?: { project_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/collaboration-templates/${templateKey}/instantiate`, data || {}))
  }

  // Knowledge Base
  async listKnowledgeEntries(agentId: number, params?: { domain?: string; entry_type?: string; tag?: string; search?: string; include_content?: boolean; page?: number; per_page?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/knowledge${buildQuery(params)}`))
  }

  async createKnowledgeEntry(agentId: number, data: { title: string; content: string; domain?: string; tags?: string[]; entry_type?: string; source_task_id?: number; confidence?: number; shared_with_project?: boolean; project_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/knowledge`, data))
  }

  async getKnowledgeEntry(agentId: number, entryId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/knowledge/${entryId}`))
  }

  async updateKnowledgeEntry(agentId: number, entryId: number, data: { title?: string; content?: string; domain?: string; tags?: string[]; confidence?: number; is_valid?: boolean; shared_with_project?: boolean }): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/${agentId}/knowledge/${entryId}`, data))
  }

  async deleteKnowledgeEntry(agentId: number, entryId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/${agentId}/knowledge/${entryId}`))
  }

  async searchKnowledge(agentId: number, params?: { q?: string; domain?: string; tags?: string; entry_type?: string; limit?: number }): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/${agentId}/knowledge/search${buildQuery(params)}`))
  }

  async listSharedKnowledge(params?: { domain?: string; entry_type?: string; search?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/knowledge/shared${buildQuery(params)}`))
  }

  async autoExtractKnowledge(agentId: number, limit?: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/knowledge/auto-extract`, { limit }))
  }

  // Workflow Version Management
  async listWorkflowVersions(workflowId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflows/${workflowId}/versions`))
  }

  async getWorkflowVersion(workflowId: number, versionNumber: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflows/${workflowId}/versions/${versionNumber}`))
  }

  async rollbackWorkflow(workflowId: number, version: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/workflows/${workflowId}/rollback`, { version }))
  }

  async diffWorkflowVersions(workflowId: number, v1: number, v2: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflows/${workflowId}/diff/${v1}/${v2}`))
  }

  // Collaboration Protocols
  async listProtocols(params?: { project_id?: number; status?: string; protocol_type?: string; initiator_agent_id?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/protocols${buildQuery(params)}`))
  }

  async createProtocol(data: { protocol_type: string; title: string; initiator_agent_id: number; description?: string; channel_id?: number; project_id?: number; task_id?: number; config?: Record<string, unknown>; deadline?: string }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/protocols', data))
  }

  async getProtocol(protocolId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/protocols/${protocolId}`))
  }

  async respondToProtocol(protocolId: number, data: { agent_id: number; message_type: string; content?: string; payload?: Record<string, unknown> }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/protocols/${protocolId}/respond`, data))
  }

  async resolveProtocol(protocolId: number, data: { resolution: string; result?: Record<string, unknown> }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/protocols/${protocolId}/resolve`, data))
  }

  // Agent Reputation
  async getAgentReputation(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/reputation`))
  }

  async listReputations(): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get('/agents/reputations'))
  }

  async recalculateReputation(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/reputation/recalculate`, {}))
  }

  async getAgentReputationHistory(
    agentId: number,
    params?: { limit?: number; since?: string; until?: string }
  ): Promise<ReputationHistory> {
    return unwrapData<ReputationHistory>(
      await apiClient.get(`/agents/${agentId}/reputation/history`, { params })
    )
  }

  // ---- Agent Experience (Collective Intelligence) ----

  async listAgentExperiences(agentId: number, params?: Record<string, string>): Promise<PaginatedResponse<any>> {
    const query = buildQuery(params)
    return unwrapData<PaginatedResponse<any>>(await apiClient.get(`/agents/${agentId}/experiences${query}`))
  }

  async createAgentExperience(agentId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences`, data))
  }

  async getAgentExperience(agentId: number, experienceId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/experiences/${experienceId}`))
  }

  async updateAgentExperience(agentId: number, experienceId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/${agentId}/experiences/${experienceId}`, data))
  }

  async deleteAgentExperience(agentId: number, experienceId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/${agentId}/experiences/${experienceId}`))
  }

  async recommendExperiences(agentId: number, params?: Record<string, string>): Promise<any[]> {
    const query = buildQuery(params)
    return unwrapData<any[]>(await apiClient.get(`/agents/${agentId}/experiences/recommend${query}`))
  }

  async shareAgentExperience(agentId: number, experienceId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences/${experienceId}/share`, {}))
  }

  async learnFromExperience(agentId: number, experienceId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences/${experienceId}/learn`, {}))
  }

  async listSharedExperiences(agentId: number, params?: Record<string, string>): Promise<PaginatedResponse<any>> {
    const query = buildQuery(params)
    return unwrapData<PaginatedResponse<any>>(await apiClient.get(`/agents/${agentId}/experiences/shared${query}`))
  }

  async autoExtractExperiences(agentId: number): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.post(`/agents/${agentId}/experiences/auto-extract`, {}))
  }

  // ---- Cross-Project Agent Collaboration ----

  async authorizeCrossProjectAgent(data: { agent_id: number; project_id: number; role_in_project?: string; capabilities_override?: string[]; max_concurrent_tasks?: number }): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/cross-project/authorize', data))
  }

  async revokeCrossProjectAgent(agentId: number, projectId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/cross-project/revoke', { agent_id: agentId, project_id: projectId }))
  }

  async listAgentCrossProjects(agentId: number): Promise<any[]> {
    return unwrapData<any[]>(await apiClient.get(`/agents/${agentId}/cross-project`))
  }

  async listProjectExternalAgents(projectId: number): Promise<PaginatedResponse<any>> {
    return unwrapData<PaginatedResponse<any>>(await apiClient.get(`/agents/projects/${projectId}/external-agents`))
  }

  async discoverCrossProjectAgents(params?: Record<string, string>): Promise<any[]> {
    const query = buildQuery(params)
    return unwrapData<any[]>(await apiClient.get(`/agents/cross-project/discover-agents${query}`))
  }

  async findCapableAgentsCrossProject(params: Record<string, string>): Promise<any[]> {
    const query = buildQuery(params)
    return unwrapData<any[]>(await apiClient.get(`/agents/cross-project/capable-agents${query}`))
  }

  // ---- Experience Decay & Validation ----

  async applyExperienceDecay(agentId: number, params?: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences/decay`, params || {}))
  }

  async validateExperience(agentId: number, experienceId: number, data: { is_accurate: boolean }): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/experiences/${experienceId}/validate`, data))
  }

  async getExperienceValidationStats(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/experiences/validation-stats`))
  }

  async decayAllExperiences(params?: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/decay-all-experiences', params || {}))
  }

  // ---- Adaptive Capabilities ----

  async suggestCapabilityAdaptation(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/adapt-capabilities`))
  }

  async applyCapabilityAdaptation(agentId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/adapt-capabilities`, data))
  }

  // ---- Cross-Project Task Discovery & Assignment ----

  async findCrossProjectTasks(agentId: number, params?: Record<string, string>): Promise<any[]> {
    const query = buildQuery(params)
    return unwrapData<any[]>(await apiClient.get(`/agents/${agentId}/cross-project-tasks${query}`))
  }

  async claimCrossProjectTask(agentId: number, taskId: number, data?: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/claim-cross-project-task/${taskId}`, data || {}))
  }

  // ---- Protocol Analytics & Deliberation ----

  async getProtocolAnalytics(params?: Record<string, string>): Promise<any> {
    const query = buildQuery(params)
    return unwrapData<any>(await apiClient.get(`/agents/protocols/analytics${query}`))
  }

  async addDeliberationMessage(protocolId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/protocols/${protocolId}/deliberate`, data))
  }

  // ---- Increment 85: Agent collaboration sandbox ----

  async listSandboxes(params?: Record<string, string>): Promise<any> {
    const query = buildQuery(params)
    return unwrapData<any>(await apiClient.get(`/agents/sandboxes${query}`))
  }

  async createSandbox(data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/sandboxes', data))
  }

  async getSandbox(sandboxId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/sandboxes/${sandboxId}`))
  }

  async updateSandbox(sandboxId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/sandboxes/${sandboxId}`, data))
  }

  async deleteSandbox(sandboxId: number): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/sandboxes/${sandboxId}`))
  }

  async bindAgentSandbox(agentId: number, sandboxId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/${agentId}/sandbox/bind`, { sandbox_id: sandboxId }))
  }

  async getAgentSandbox(agentId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/${agentId}/sandbox`))
  }

  async checkSandboxAction(sandboxId: number, action: string, target: string): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/sandboxes/${sandboxId}/check`, { action, target }))
  }

  async startSandboxExecution(sandboxId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/sandboxes/${sandboxId}/executions`, data))
  }

  async completeSandboxExecution(executionId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/executions/${executionId}/complete`, data))
  }

  async revokeSandboxExecution(executionId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/executions/${executionId}/revoke`, {}))
  }

  async reportSandboxViolation(executionId: number, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/executions/${executionId}/violation`, data))
  }

  async getSandboxExecution(executionId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/executions/${executionId}`))
  }

  async listSandboxExecutions(sandboxId: number, params?: Record<string, string>): Promise<any> {
    const query = buildQuery(params)
    return unwrapData<any>(await apiClient.get(`/agents/sandboxes/${sandboxId}/executions${query}`))
  }

  async getSandboxDashboard(): Promise<any> {
    return unwrapData<any>(await apiClient.get('/agents/sandboxes/dashboard'))
  }

  async getSandboxViolationTrend(days = 30): Promise<SandboxViolationTrend> {
    return unwrapData<SandboxViolationTrend>(await apiClient.get('/agents/sandboxes/violation-trend', { params: { days } }))
  }

  async getSandboxViolationsByAgent(days = 30, limit = 10): Promise<SandboxViolationsByAgent> {
    return unwrapData<SandboxViolationsByAgent>(await apiClient.get('/agents/sandboxes/violations-by-agent', { params: { days, limit } }))
  }

  async getSandboxTemplateUsage(): Promise<SandboxTemplateUsage> {
    return unwrapData<SandboxTemplateUsage>(await apiClient.get('/agents/sandboxes/template-usage'))
  }

  async getStepSandboxExecution(runId: number, stepKey: string): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/sandbox-execution`))
  }

  async reportStepSandboxViolation(runId: number, stepKey: string, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/sandbox-violation`, data))
  }

  async setStepRuntimeOverride(runId: number, stepKey: string, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.put(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/override`, data))
  }

  async clearStepRuntimeOverride(runId: number, stepKey: string): Promise<any> {
    return unwrapData<any>(await apiClient.delete(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/override`))
  }

  async getStepEffectiveParams(runId: number, stepKey: string): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/workflow-runs/${runId}/steps/${encodeURIComponent(stepKey)}/effective-params`))
  }

  // ---- Increment 89: Conflict detection & resolution ----

  async scanConflicts(): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/conflicts/scan', {}))
  }

  async listConflicts(params?: Record<string, string>): Promise<any> {
    const query = buildQuery(params)
    return unwrapData<any>(await apiClient.get(`/agents/conflicts${query}`))
  }

  async getConflict(conflictId: number): Promise<any> {
    return unwrapData<any>(await apiClient.get(`/agents/conflicts/${conflictId}`))
  }

  async resolveConflict(conflictId: number, strategy: string, description?: string): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/conflicts/${conflictId}/resolve`, { strategy, description }))
  }

  async acknowledgeConflict(conflictId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/conflicts/${conflictId}/acknowledge`, {}))
  }

  async ignoreConflict(conflictId: number): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/conflicts/${conflictId}/ignore`, {}))
  }

  async getConflictsDashboard(): Promise<ConflictsDashboard> {
    return unwrapData<ConflictsDashboard>(await apiClient.get('/agents/conflicts/dashboard'))
  }

  async getConflictsTrend(days = 30): Promise<ConflictsTrend> {
    return unwrapData<ConflictsTrend>(await apiClient.get('/agents/conflicts/trend', { params: { days } }))
  }

  async getConflictsByAgent(limit = 10): Promise<ConflictsByAgent> {
    return unwrapData<ConflictsByAgent>(await apiClient.get('/agents/conflicts/by-agent', { params: { limit } }))
  }

  async getConflictsStrategyStats(): Promise<ConflictsStrategyStats> {
    return unwrapData<ConflictsStrategyStats>(await apiClient.get('/agents/conflicts/strategy-stats'))
  }

  async listSandboxTemplates(): Promise<any> {
    return unwrapData<any>(await apiClient.get('/agents/sandbox-templates'))
  }

  async instantiateSandboxTemplate(templateKey: string, data: Record<string, any>): Promise<any> {
    return unwrapData<any>(await apiClient.post(`/agents/sandbox-templates/${encodeURIComponent(templateKey)}/instantiate`, data))
  }

  async autoResolveConflicts(): Promise<any> {
    return unwrapData<any>(await apiClient.post('/agents/maintenance/auto-resolve-conflicts', {}))
  }

  async orchestrate(): Promise<OrchestrationResult> {
    return unwrapData<OrchestrationResult>(await apiClient.post('/agents/maintenance/orchestrate', {}))
  }

  async getOrchestratorStatus(): Promise<OrchestratorStatus> {
    return unwrapData<OrchestratorStatus>(await apiClient.get('/agents/maintenance/orchestrator/status'))
  }

  async listOrchestratorHistory(params?: { limit?: number; triggered_by?: string }): Promise<OrchestratorHistoryResult> {
    const response = await apiClient.get(`/agents/maintenance/orchestrator/history${buildQuery(params)}`)
    return unwrapData<OrchestratorHistoryResult>(response)
  }

  async getOrchestratorDailyTrend(params?: { triggered_by?: string; since?: string; until?: string }): Promise<OrchestratorDailyTrend> {
    const response = await apiClient.get(`/agents/maintenance/orchestrator/daily-trend${buildQuery(params)}`)
    return unwrapData<OrchestratorDailyTrend>(response)
  }
}

export const agentsApi = new AgentsApi()
