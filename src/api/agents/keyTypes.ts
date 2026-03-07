export interface AgentKey {
  id: number
  agent_id: number
  workspace_id: number
  created_by_user_id: number
  name: string
  prefix: string
  is_active: boolean
  revoked_at?: string
  last_used_at?: string
  usage_count: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface AgentKeyListResponse {
  items: AgentKey[]
}

export interface CreateAgentKeyRequest {
  name: string
}

export interface CreateAgentKeyResponse extends AgentKey {
  token: string
}

export interface RevealAgentKeyResponse {
  key_id: number
  token: string
}

export interface ConnectLinkResponse {
  url: string
  expires_at: string
}
