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
