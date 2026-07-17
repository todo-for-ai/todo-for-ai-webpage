import type { Pagination, TaskAssignmentState } from './common'
import type { Agent } from './agent'

export interface TaskAssignment {
  id: number
  task_id: number
  agent_id: number
  assigned_by_user_id?: number
  state: TaskAssignmentState
  lease_expires_at?: string
  claimed_at?: string
  completed_at?: string
  last_heartbeat_at?: string
  progress_rate: number
  notes?: string
  created_at: string
  updated_at: string
  task?: Task
  agent?: Pick<Agent, 'id' | 'name' | 'kind' | 'status'>
  runs?: Array<{ id: number; status: string }>
}

export interface AgentRun {
  id: number
  task_id: number
  agent_id: number
  assignment_id?: number
  status: 'running' | 'waiting_human' | 'succeeded' | 'failed' | 'cancelled' | 'expired'
  started_at: string
  ended_at?: string
  output_summary?: string
  error?: string
  input_snapshot: Record<string, unknown>
  run_metadata: Record<string, unknown>
}

export interface TaskEvent {
  id: number
  task_id: number
  actor_type: 'human' | 'agent' | 'system'
  actor_user_id?: number
  actor_agent_id?: number
  actor_agent?: Pick<Agent, 'id' | 'name' | 'kind' | 'status'>
  actor_user?: {
    id: number
    name?: string
    email?: string
  }
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}

export type PostableTaskEventType =
  | 'message'
  | 'note'
  | 'question'
  | 'answer'
  | 'handoff'
  | 'blocker'
  | 'decision'
  | 'info'

export interface PostTaskEventData {
  content?: string
  event_type?: PostableTaskEventType
  agent_id?: number
  to_agent_id?: number
  payload?: Record<string, unknown>
}

export interface AgentInboxResult {
  items: TaskEvent[]
  agent_id: number
  count?: number
  latest_id?: number
  since_id?: number
}

export interface NotificationItem {
  id: number
  user_id: number
  event_type: string
  task_id?: number
  agent_id?: number
  payload: Record<string, unknown>
  is_read: boolean
  read_at?: string
  agent_name?: string
  task_title?: string
  created_at: string
  updated_at: string
}

export interface ListNotificationsResult {
  items: NotificationItem[]
  unread_count: number
  since_id?: number
}

export interface SharedContextEntry {
  id: number
  task_id: number
  key: string
  value: string
  author_agent_id?: number
  author_user_id?: number
  author_agent_name?: string
  author_user_name?: string
  created_at: string
  updated_at: string
}

export type RunLogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface RunLogEntry {
  id: number
  run_id: number
  level: RunLogLevel
  message: string
  meta: Record<string, unknown>
  created_at: string
  updated_at: string
}
