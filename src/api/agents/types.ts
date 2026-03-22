export type AgentStatus = 'active' | 'inactive' | 'revoked'
export type AgentReasoningMode = 'balanced' | 'fast' | 'deep'

// Agent 权限角色类型
export type AgentRole = 'owner' | 'maintainer' | 'viewer'

// Agent 成员（Owner）信息
export interface AgentMember {
  user_id: number
  username: string
  email: string
  role: AgentRole
  joined_at: string
}

export interface Agent {
  id: number
  workspace_id: number
  creator_user_id: number
  name: string
  display_name?: string
  avatar_url?: string
  homepage_url?: string
  contact_email?: string
  description?: string
  status: AgentStatus
  capability_tags: string[]
  allowed_project_ids: number[]
  llm_provider?: string
  llm_model?: string
  temperature?: number | null
  top_p?: number | null
  max_output_tokens?: number | null
  context_window_tokens?: number | null
  reasoning_mode?: AgentReasoningMode | string
  system_prompt?: string
  soul_markdown?: string
  response_style?: Record<string, any>
  tool_policy?: Record<string, any>
  memory_policy?: Record<string, any>
  handoff_policy?: Record<string, any>
  execution_mode?: 'external_pull' | 'managed_runner' | string
  runner_enabled?: boolean
  sandbox_profile?: string
  sandbox_policy?: Record<string, any>
  max_concurrency?: number
  max_retry?: number
  timeout_seconds?: number
  heartbeat_interval_seconds?: number
  soul_version?: number
  config_version?: number
  runner_config_version?: number
  created_at: string
  updated_at: string
  created_by?: string
  // 权限相关字段
  current_user_role?: AgentRole  // 当前用户在该 Agent 中的角色
  is_owner?: boolean              // 当前用户是否是 Owner
  members?: AgentMember[]         // Agent 的所有成员
}

export interface AgentListResponse {
  items: Agent[]
  pagination: {
    page: number
    per_page: number
    total: number
    has_prev: boolean
    has_next: boolean
  }
}

export interface CreateAgentRequest {
  name: string
  display_name?: string
  avatar_url?: string
  homepage_url?: string
  contact_email?: string
  description?: string
  capability_tags?: string[]
  allowed_project_ids?: number[]
  llm_provider?: string
  llm_model?: string
  temperature?: number
  top_p?: number
  max_output_tokens?: number
  context_window_tokens?: number
  reasoning_mode?: AgentReasoningMode | string
  system_prompt?: string
  soul_markdown?: string
  response_style?: Record<string, any>
  tool_policy?: Record<string, any>
  memory_policy?: Record<string, any>
  handoff_policy?: Record<string, any>
  execution_mode?: 'external_pull' | 'managed_runner' | string
  runner_enabled?: boolean
  sandbox_profile?: string
  sandbox_policy?: Record<string, any>
  max_concurrency?: number
  max_retry?: number
  timeout_seconds?: number
  heartbeat_interval_seconds?: number
  change_summary?: string
}

export interface UpdateAgentRequest {
  name?: string
  display_name?: string
  avatar_url?: string
  homepage_url?: string
  contact_email?: string
  description?: string
  status?: AgentStatus
  capability_tags?: string[]
  allowed_project_ids?: number[]
  llm_provider?: string
  llm_model?: string
  temperature?: number
  top_p?: number
  max_output_tokens?: number
  context_window_tokens?: number
  reasoning_mode?: AgentReasoningMode | string
  system_prompt?: string
  soul_markdown?: string
  response_style?: Record<string, any>
  tool_policy?: Record<string, any>
  memory_policy?: Record<string, any>
  handoff_policy?: Record<string, any>
  execution_mode?: 'external_pull' | 'managed_runner' | string
  runner_enabled?: boolean
  sandbox_profile?: string
  sandbox_policy?: Record<string, any>
  max_concurrency?: number
  max_retry?: number
  timeout_seconds?: number
  heartbeat_interval_seconds?: number
  change_summary?: string
}
