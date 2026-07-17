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
