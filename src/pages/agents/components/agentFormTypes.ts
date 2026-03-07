import type { CreateAgentRequest, UpdateAgentRequest } from '../../../api/agents'

export type AgentFormPayload = Omit<UpdateAgentRequest, 'name'> & Omit<CreateAgentRequest, 'name'> & { name: string }

export interface AgentFormValues {
  name: string
  display_name?: string
  avatar_url?: string
  homepage_url?: string
  contact_email?: string
  description?: string
  status?: 'active' | 'inactive' | 'revoked'
  capability_tags_text?: string
  allowed_project_ids_text?: string
  llm_provider?: string
  llm_model?: string
  temperature?: number
  top_p?: number
  max_output_tokens?: number
  context_window_tokens?: number
  reasoning_mode?: string
  max_concurrency?: number
  max_retry?: number
  timeout_seconds?: number
  heartbeat_interval_seconds?: number
  system_prompt?: string
  soul_markdown?: string
  response_style_json?: string
  tool_policy_json?: string
  memory_policy_json?: string
  handoff_policy_json?: string
  execution_mode?: 'external_pull' | 'managed_runner' | string
  runner_enabled?: boolean
  sandbox_profile?: string
  sandbox_policy_json?: string
  change_summary?: string
}
