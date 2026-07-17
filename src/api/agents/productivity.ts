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

/** Agent 运行资源使用项 */
export interface AgentRunResourceUsageItem {
  agent_id: number
  name: string
  total_runs: number
  total_hours: number
  avg_run_minutes: number
}

/** Agent 运行资源使用排行 */
export interface AgentRunResourceUsage {
  items: AgentRunResourceUsageItem[]
  total_runs: number
}

/** Agent 产出效率周间对比条目 */
export interface AgentProductivityWeeklyItem {
  agent_id: number
  name: string
  this_week: number
  last_week: number
  change_pct: number
}

/** Agent 产出效率周间对比 */
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

export interface WorkflowStepBottleneckStep {
  step_key: string
  name: string
  depends_on: string[]
  avg_duration: number
  bottleneck_score: number
}

export interface WorkflowStepBottleneckAllStep {
  step_key: string
  name: string
  depends_on: string[]
  avg_duration: number
  is_on_critical_path: boolean
}

export interface WorkflowStepBottleneckWorkflow {
  workflow_id: number
  workflow_name: string
  critical_path: WorkflowStepBottleneckStep[]
  critical_path_duration: number
  all_steps: WorkflowStepBottleneckAllStep[]
  total_steps: number
  active_steps: number
}

export interface WorkflowStepDependencyBottleneck {
  workflows: WorkflowStepBottleneckWorkflow[]
}
