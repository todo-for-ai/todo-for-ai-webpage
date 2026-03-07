export interface AgentSoulVersion {
  id: number
  agent_id: number
  workspace_id: number
  version: number
  soul_markdown: string
  change_summary?: string
  edited_by_user_id: number
  created_at: string
  updated_at: string
  created_by?: string
  editor?: {
    id: number
    name?: string
    email?: string
    avatar_url?: string
  } | null
}

export interface AgentSoulVersionListResponse {
  items: AgentSoulVersion[]
  pagination: {
    page: number
    per_page: number
    total: number
    has_prev: boolean
    has_next: boolean
  }
}

export interface RollbackAgentSoulRequest {
  version: number
  change_summary?: string
}
