export interface AgentRunnerConfig {
  execution_mode: 'external_pull' | 'managed_runner' | string
  runner_enabled: boolean
  sandbox_profile: string
  sandbox_policy: {
    network_mode?: string
    allowed_domains?: string[]
    [key: string]: any
  }
  runner_config_version: number
}

export interface UpdateAgentRunnerConfigRequest {
  execution_mode?: 'external_pull' | 'managed_runner' | string
  runner_enabled?: boolean
  sandbox_profile?: string
  sandbox_policy?: {
    network_mode?: string
    allowed_domains?: string[]
    [key: string]: any
  }
}

export interface AgentTrigger {
  id: number
  workspace_id: number
  agent_id: number
  name: string
  trigger_type: 'task_event' | 'cron'
  enabled: boolean
  priority: number
  task_event_types: string[]
  task_filter: Record<string, any>
  cron_expr?: string
  timezone?: string
  misfire_policy?: 'skip' | 'catch_up_once' | string
  catch_up_window_seconds?: number
  dedup_window_seconds?: number
  last_triggered_at?: string
  next_fire_at?: string
  created_at: string
  updated_at: string
}

export interface AgentTriggerListResponse {
  items: AgentTrigger[]
}

export interface CreateAgentTriggerRequest {
  name: string
  trigger_type: 'task_event' | 'cron'
  enabled?: boolean
  priority?: number
  task_event_types?: string[]
  task_filter?: Record<string, any>
  cron_expr?: string
  timezone?: string
  misfire_policy?: 'skip' | 'catch_up_once' | string
  catch_up_window_seconds?: number
  dedup_window_seconds?: number
}

export interface UpdateAgentTriggerRequest extends Partial<CreateAgentTriggerRequest> {}

export interface AgentRun {
  id: number
  run_id: string
  workspace_id: number
  agent_id: number
  trigger_id: number
  trigger_reason: string
  input_payload?: Record<string, any>
  state: 'queued' | 'leased' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'expired' | string
  scheduled_at: string
  started_at?: string
  ended_at?: string
  lease_id?: string
  lease_expires_at?: string
  attempt_count: number
  failure_code?: string
  failure_reason?: string
  idempotency_key: string
  created_at: string
  updated_at: string
}

export interface AgentRunListResponse {
  items: AgentRun[]
  pagination: {
    page: number
    per_page: number
    total: number
    has_prev: boolean
    has_next: boolean
  }
}

export interface NotificationChannel {
  id: number
  scope_type: 'user' | 'organization' | 'project' | string
  scope_id: number
  name: string
  channel_type: 'in_app' | 'webhook' | 'feishu' | 'wecom' | 'dingtalk' | string
  enabled: boolean
  is_default: boolean
  events: string[]
  config: Record<string, any>
  created_by_user_id: number
  updated_by_user_id: number
  created_at: string
  updated_at: string
}

export interface NotificationChannelListResponse {
  items: NotificationChannel[]
}

export interface CreateNotificationChannelRequest {
  name: string
  channel_type: 'in_app' | 'webhook' | 'feishu' | 'wecom' | 'dingtalk'
  enabled?: boolean
  is_default?: boolean
  events?: string[]
  config?: Record<string, any>
}

export interface UpdateNotificationChannelRequest extends Partial<CreateNotificationChannelRequest> {}

export interface EffectiveChannelsResponse {
  event_type?: string | null
  selected_scope: {
    scope_type: 'project' | 'organization' | 'user' | 'none' | string
    scope_id: number | null
  }
  items: NotificationChannel[]
}
