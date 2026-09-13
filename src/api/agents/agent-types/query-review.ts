// Agent 类型 · query-review（由 types.ts 按块原样迁移）
import type { Agent, AgentStatus, TaskAssignment, TaskAssignmentState, Pagination } from './core'
import type { Task } from '../../tasks'
export type ReviewQueueAction = 'all' | 'human_feedback' | 'final_review'

export interface ReviewQueueItem {
  assignment: TaskAssignment
  task?: Task
  agent?: Agent
  action: Exclude<ReviewQueueAction, 'all'> | 'review'
  available_actions: string[]
}

// ── Generic list / pagination ────────────────────────────────────────

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

// ── Query / mutation params ──────────────────────────────────────────

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
