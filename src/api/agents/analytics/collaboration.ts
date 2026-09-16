// 分析类型 · collaboration（由 analytics-types.ts 按块原样迁移）
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
  avatar_url?: string | null
  display_name?: string | null
  messages: number
  reputation?: number | null
}

export interface CollaborationGraphEdge {
  source: number
  target: number
  count: number
  source_to_target?: number
  target_to_source?: number
}

export interface CollaborationGraph {
  nodes: CollaborationGraphNode[]
  edges: CollaborationGraphEdge[]
  total_edges: number
}

export interface CollaborationTimelineEdge {
  source: number
  target: number
  source_name: string
  target_name: string
  count: number
  source_to_target: number
  target_to_source: number
}

export interface CollaborationTimelineSnapshot {
  date: string
  edges: CollaborationTimelineEdge[]
  total_edges: number
  active_agents: number
}

export interface CollaborationGraphTimeline {
  bucket_type: string
  days: number
  snapshots: CollaborationTimelineSnapshot[]
}

// ── Task allocation fairness ─────────────────────────────────────────
