import type { AgentStatus, AgentKind } from './common'

export interface Agent {
  id: number
  owner_id: number
  name: string
  description?: string
  kind: AgentKind
  status: AgentStatus
  provider?: string
  model?: string
  capabilities: string[]
  config: Record<string, unknown>
  collaboration_role?: 'leader' | 'follower' | 'standalone'
  last_seen_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  stats?: {
    active_assignments: number
    total_runs: number
  }
}
