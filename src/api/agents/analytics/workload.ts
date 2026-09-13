// 分析类型 · workload（由 analytics-types.ts 按块原样迁移）
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
