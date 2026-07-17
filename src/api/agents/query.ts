import type { Pagination, TaskAssignmentState, AgentStatus, AgentKind } from './common'
import type { Agent, AgentRun } from './agent'
import type { TaskAssignment, RunLogLevel } from './assignment'

export interface ListResult<T> {
  items: T[]
  pagination: Pagination
}

export interface PaginatedResponse<T> {
  data?: T[]
  items?: T[]
  pagination?: Pagination
  message?: string
  success?: boolean
  timestamp?: string
}

export interface AgentQueryParams {
  page?: number
  per_page?: number
  search?: string
  status?: AgentStatus | 'all'
  sort_by?: 'created_at' | 'name' | 'last_seen_at'
  sort_order?: 'asc' | 'desc'
}

export interface AssignmentQueryParams {
  page?: number
  per_page?: number
  state?: TaskAssignmentState | 'all'
}

export interface TaskAssignmentQueryParams {
  page?: number
  per_page?: number
  state?: TaskAssignmentState | 'active' | 'all'
}

export interface CreateAgentData {
  name: string
  description?: string
  kind?: AgentKind
  status?: AgentStatus
  provider?: string
  model?: string
  capabilities?: string[]
  config?: Record<string, unknown>
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
