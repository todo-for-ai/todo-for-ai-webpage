// 分析类型 · failure-capability（由 analytics-types.ts 按块原样迁移）
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
