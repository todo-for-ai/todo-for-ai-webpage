export type AgentSecretType = 'api_key' | 'oauth_token' | 'session_cookie' | 'webhook_secret' | 'custom'
export type AgentSecretScopeType = 'agent_private' | 'project_shared' | 'workspace_shared'
export type AgentSecretSource = 'owned' | 'shared'
export type AgentSecretTargetSelector = 'manual' | 'project_agents' | 'workspace_active'

export interface AgentSecret {
  id: number
  agent_id: number
  workspace_id: number
  name: string
  secret_type?: AgentSecretType | string
  scope_type?: AgentSecretScopeType | string
  project_id?: number | null
  description?: string | null
  prefix: string
  is_active: boolean
  last_used_at?: string
  usage_count: number
  source?: AgentSecretSource | string
  owner_agent_id?: number
  owner_agent_name?: string | null
  share_id?: number
  access_mode?: string
  share_expires_at?: string | null
  shared_to_agent_count?: number | null
  created_by_user_id: number
  updated_by_user_id: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface AgentSecretListResponse {
  items: AgentSecret[]
}

export interface CreateAgentSecretRequest {
  name: string
  secret_value: string
  secret_type?: AgentSecretType
  scope_type?: AgentSecretScopeType
  project_id?: number
  description?: string
}

export interface RevealAgentSecretResponse {
  id: number
  name: string
  secret_value: string
}

export interface RotateAgentSecretRequest {
  secret_value: string
}

export interface AgentSecretShare {
  id: number
  secret_id: number
  workspace_id: number
  owner_agent_id: number
  owner_agent_name?: string | null
  target_agent_id: number
  target_agent_name?: string | null
  access_mode: string
  expires_at?: string | null
  is_active: boolean
  is_expired?: boolean
  granted_reason?: string | null
  granted_by_user_id: number
  revoked_by_user_id?: number | null
  created_at: string
  updated_at: string
}

export interface AgentSecretShareListResponse {
  items: AgentSecretShare[]
}

export interface CreateAgentSecretShareRequest {
  target_agent_id?: number
  target_agent_ids?: number[]
  target_selector?: AgentSecretTargetSelector
  selector_project_id?: number
  access_mode?: string
  expires_at?: string
  granted_reason?: string
}

export interface AgentSecretCollaborationStats {
  agent_id: number
  project_id?: number | null
  include_inactive: boolean
  outgoing_share_count: number
  incoming_share_count: number
  outgoing_agent_count: number
  incoming_agent_count: number
  edge_count: number
  active_edge_count: number
}

export interface AgentSecretCollaborator {
  agent_id: number
  agent_name?: string | null
  direction: 'outgoing' | 'incoming' | string
  share_count: number
  active_share_count: number
  expired_share_count: number
  secret_count: number
  secret_ids: number[]
  last_granted_at?: string | null
  last_updated_at?: string | null
}

export interface AgentSecretCollaborationEdge {
  id: number
  direction: 'outgoing' | 'incoming' | string
  secret_id: number
  secret_name: string
  secret_type?: AgentSecretType | string
  scope_type?: AgentSecretScopeType | string
  project_id?: number | null
  secret_is_active: boolean
  owner_agent_id: number
  target_agent_id: number
  access_mode: string
  is_active: boolean
  is_expired: boolean
  expires_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface AgentSecretCollaborationResponse {
  stats: AgentSecretCollaborationStats
  outgoing_collaborators: AgentSecretCollaborator[]
  incoming_collaborators: AgentSecretCollaborator[]
  edges: AgentSecretCollaborationEdge[]
}

export interface RevealSharedAgentSecretResponse {
  id: number
  name: string
  secret_value: string
  owner_agent_id: number
  owner_agent_name?: string | null
  share_id: number
}
