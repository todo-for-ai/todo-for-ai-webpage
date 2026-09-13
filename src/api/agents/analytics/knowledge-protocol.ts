// 分析类型 · knowledge-protocol（由 analytics-types.ts 按块原样迁移）
export interface KnowledgePropagationNode {
  agent_id: number
  agent_name: string
  shared_experiences: number
  total_reuses: number
  domains: string[]
}

export interface KnowledgePropagationEdge {
  source: number
  target: number
  weight: number
}

export interface KnowledgePropagationNetwork {
  nodes: KnowledgePropagationNode[]
  edges: KnowledgePropagationEdge[]
  days: number
  total_shared_experiences: number
  total_reuses: number
}

// ── Protocol decision latency ────────────────────────────────────────

export interface ProtocolLatencyType {
  protocol_type: string
  count: number
  avg_seconds: number
  median_seconds: number
  min_seconds: number
  max_seconds: number
}

export interface ProtocolDecisionLatency {
  types: ProtocolLatencyType[]
  days: number
  total: number
}

// ── Specialization evolution ─────────────────────────────────────────

export interface SpecializationEvolutionAgent {
  agent_id: number
  agent_name: string
  series: number[]
  peak_domains: number
  peak_week_idx: number
  total_domains: number
  domains: string[]
}

export interface AgentSpecializationEvolution {
  agents: SpecializationEvolutionAgent[]
  weeks: number
  week_labels: string[]
}

// ── Agent health ─────────────────────────────────────────────────────
