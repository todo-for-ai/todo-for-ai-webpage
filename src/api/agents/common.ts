export type AgentStatus = 'active' | 'paused' | 'offline' | 'disabled'
export type AgentKind = 'assistant' | 'autonomous' | 'coordinator' | 'external'
export type TaskAssignmentState =
  | 'assigned'
  | 'claimed'
  | 'running'
  | 'waiting_human'
  | 'review'
  | 'done'
  | 'failed'
  | 'cancelled'
  | 'expired'

export interface Pagination {
  page: number
  per_page: number
  total: number
  pages: number
  has_next: boolean
  has_prev: boolean
  next_num?: number | null
  prev_num?: number | null
}
