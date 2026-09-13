// Agent 类型 · schedule-crud（由 types.ts 按块原样迁移）

import type { Agent, AgentKind, AgentStatus, TaskAssignment, AgentRun, TaskAssignmentState } from './core'
import type { Task } from '../../tasks'
export interface CreateAgentData {
  name: string
  description?: string
  kind?: AgentKind
  status?: AgentStatus
  provider?: string
  model?: string
  capabilities?: string[]
  config?: Record<string, unknown>
  working_schedule?: AgentWorkingSchedule
}

/** 工作时间区间配置（结构见 api-server services/agent_working_schedule.py） */
export interface AgentWorkingScheduleWindow {
  label?: string
  enabled?: boolean
  type: 'daily' | 'weekly' | 'monthly' | 'dates'
  start_time?: string
  end_time?: string
  days_of_week?: number[]
  days_of_month?: number[]
  months?: number[]
  start_date?: string
  end_date?: string
}

export interface AgentWorkingSchedule {
  enabled?: boolean
  timezone?: string
  includes?: AgentWorkingScheduleWindow[]
  excludes?: AgentWorkingScheduleWindow[]
}

export interface WorkingScheduleEvaluation {
  enabled: boolean
  in_window: boolean
  next_window_at?: string | null
  timezone: string
}

export type UpdateAgentData = Partial<CreateAgentData>

export interface ClaimTaskData {
  task_id?: number
  project_id?: number
  lease_seconds?: number
  match_capabilities?: boolean
  dispatch_source?: 'human'
  run_metadata?: Record<string, unknown>
}

export interface ClaimTaskResult {
  agent: Agent
  assignment: TaskAssignment
  run: AgentRun
}

export interface UpdateAssignmentData {
  state?: TaskAssignmentState
  progress_rate?: number
  notes?: string
  feedback_content?: string
  output_summary?: string
  error?: string
  lease_seconds?: number
  task_status?: Task['status']
  run_metadata?: Record<string, unknown>
}

// ── Workspace-based agent types (from origin/main) ────────────────
export type WorkspaceAgentStatus = 'active' | 'inactive' | 'revoked'
export type WorkspaceAgentReasoningMode = 'balanced' | 'fast' | 'deep'

export interface WorkspaceAgent {
  id: number
  workspace_id: number
  creator_user_id: number
  name: string
  display_name?: string
  avatar_url?: string
  homepage_url?: string
  contact_email?: string
  description?: string
  status: WorkspaceAgentStatus
  capability_tags: string[]
  allowed_project_ids: number[]
  llm_provider?: string
  llm_model?: string
  temperature?: number | null
  top_p?: number | null
  max_output_tokens?: number | null
  context_window_tokens?: number | null
  reasoning_mode?: WorkspaceAgentReasoningMode | string
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
  working_schedule?: AgentWorkingSchedule
  created_at: string
  updated_at: string
  created_by?: string
  is_owner?: boolean
}

export interface WorkspaceAgentListResponse {
  items: WorkspaceAgent[]
  pagination: {
    page: number
    per_page: number
    total: number
    has_prev: boolean
    has_next: boolean
  }
}

export interface CreateWorkspaceAgentRequest {
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
  reasoning_mode?: WorkspaceAgentReasoningMode | string
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
  working_schedule?: AgentWorkingSchedule
}

export interface UpdateWorkspaceAgentRequest {
  name?: string
  display_name?: string
  avatar_url?: string
  homepage_url?: string
  contact_email?: string
  description?: string
  status?: WorkspaceAgentStatus
  capability_tags?: string[]
  allowed_project_ids?: number[]
  llm_provider?: string
  llm_model?: string
  temperature?: number
  top_p?: number
  max_output_tokens?: number
  context_window_tokens?: number
  reasoning_mode?: WorkspaceAgentReasoningMode | string
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
  working_schedule?: AgentWorkingSchedule
}
