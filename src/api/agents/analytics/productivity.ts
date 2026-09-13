// 分析类型 · productivity（由 analytics-types.ts 按块原样迁移）
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
