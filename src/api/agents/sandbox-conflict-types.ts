/**
 * Agent API — sandbox, conflict, security, and orchestration types.
 */

// ── Sandbox ──────────────────────────────────────────────────────────

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

export interface SandboxViolationTrendBucket {
  date: string
  count: number
}

export interface SandboxViolationTrend {
  days: number
  trend: SandboxViolationTrendBucket[]
  by_type: Record<string, number>
}

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

export interface SandboxTemplateUsageItem {
  template_key: string
  uses: number
  bound_to_agent: number
}

export interface SandboxTemplateUsage {
  items: SandboxTemplateUsageItem[]
}

// ── Conflicts ────────────────────────────────────────────────────────

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

export interface ConflictsTrendBucket {
  date: string
  detected: number
  resolved: number
}

export interface ConflictsTrend {
  days: number
  trend: ConflictsTrendBucket[]
}

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

// ── Security ─────────────────────────────────────────────────────────

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

// ── Orchestration ────────────────────────────────────────────────────

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
  interval_seconds?: number
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

// ── Reputation history ───────────────────────────────────────────────

export interface ReputationHistoryPoint {
  at: string | null
  audit_id?: number
  new_score?: number | null
  score_delta?: number | null
  quality_delta?: number | null
  success?: boolean | null
  total_tasks?: number | null
  task_id?: number | null
  step_key?: string | null
  workflow_run_id?: number | null
  parent_workflow_run_id?: number | null
  sub_workflow_run_id?: number | null
  duration_sec?: number | null
}

export interface ReputationHistory {
  agent_id: number
  current_score: number
  points: ReputationHistoryPoint[]
}