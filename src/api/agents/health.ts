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
