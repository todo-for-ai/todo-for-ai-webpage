export interface AgentInsightsPagination {
  page: number
  per_page: number
  total: number
  has_prev: boolean
  has_next: boolean
}

export interface AgentActivityItem {
  id: string
  entity_id?: number
  source: string
  event_type: string
  level: 'info' | 'warn' | 'error' | string
  message?: string
  payload?: Record<string, any>
  occurred_at: string
  state?: string
  trigger_reason?: string
  failure_code?: string
  failure_reason?: string
  risk_score?: number
  correlation_id?: string
  request_id?: string
  attempt_id?: string
  lease_id?: string
  seq?: number
  content_type?: string
  actor_type?: string
  actor_id?: string
  actor_user_id?: number
  actor_agent_id?: number
  target_type?: string
  target_id?: string
  target_agent_id?: number
  duration_ms?: number
  error_code?: string
  run_id?: string
  agent_id?: number
  agent_name?: string
  agent_display_name?: string
  task_id?: number
  task_title?: string
  project_id?: number
  project_name?: string
}

export interface AgentActivityListResponse {
  items: AgentActivityItem[]
  summary?: {
    sources?: Record<string, number>
    levels?: Record<string, number>
    event_types?: Record<string, number>
    scan_limit?: number
  }
  pagination: AgentInsightsPagination
}

export interface AgentProjectInsightItem {
  project_id: number
  project_name: string
  project_status: string
  project_color?: string
  is_explicitly_allowed: boolean
  touched_task_count: number
  committed_task_count: number
  interaction_log_count: number
  last_activity_at?: string | null
  interaction_days: number
  submission_rate: number
  activity_score: number
}

export interface AgentProjectInsightListResponse {
  items: AgentProjectInsightItem[]
  pagination: AgentInsightsPagination
}

export interface AgentInteractionInsightItem {
  user_id: number
  display_name: string
  email?: string
  avatar_url?: string
  interaction_count: number
  task_count: number
  last_interaction_at?: string | null
}

export interface AgentInteractionInsightListResponse {
  items: AgentInteractionInsightItem[]
  pagination: AgentInsightsPagination
}

export interface AgentTaskInsightAttempt {
  attempt_id: string
  state: string
  started_at?: string | null
  ended_at?: string | null
  failure_code?: string
  failure_reason?: string
}

export interface AgentTaskInsightItem {
  task_id: number
  title: string
  status: string
  priority: string
  project_id: number
  project_name?: string
  updated_at?: string
  completed_at?: string | null
  last_activity_at?: string | null
  last_attempt?: AgentTaskInsightAttempt | null
  agent_log_count: number
}

export interface AgentTaskInsightListResponse {
  items: AgentTaskInsightItem[]
  pagination: AgentInsightsPagination
}


export interface WorkspaceAgentActivityListResponse extends AgentActivityListResponse {}
