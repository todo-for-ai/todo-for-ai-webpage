/**
 * Agent API — core type definitions.
 *
 * Fundamental types shared across all agent submodules: Agent, TaskAssignment,
 * AgentRun, TaskEvent, dispatch, inbox, notifications, shared-context, etc.
 */
import type { Task } from '../tasks'

// ── Status / Kind enums ──────────────────────────────────────────────

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

// ── Pagination ───────────────────────────────────────────────────────

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

// ── Core entities ────────────────────────────────────────────────────

export interface Agent {
  id: number
  owner_id: number
  name: string
  description?: string
  kind: AgentKind
  status: AgentStatus
  provider?: string
  model?: string
  capabilities: string[]
  config: Record<string, unknown>
  collaboration_role?: 'leader' | 'follower' | 'standalone'
  last_seen_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  stats?: {
    active_assignments: number
    total_runs: number
  }
}

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

// ── Task event posting ───────────────────────────────────────────────

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

// ── Inbox / Notifications ────────────────────────────────────────────

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

// ── Shared context ───────────────────────────────────────────────────

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

// ── Run logs ─────────────────────────────────────────────────────────

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

// ── Handoff / Dispatch ───────────────────────────────────────────────

export interface HandoffTaskData {
  to_agent_id: number
  from_assignment_id?: number
  lease_seconds?: number
  reason?: string
  notes?: string
}

export interface HandoffTaskResult {
  from_assignment: TaskAssignment | null
  assignment: TaskAssignment
  run: AgentRun
}

export interface DispatchTasksData {
  auto_dispatch_enabled?: boolean
  project_id?: number | null
  max_assignments?: number
  lease_seconds?: number
  match_capabilities?: boolean
  require_capability_match?: boolean
  candidate_agent_ids?: number[]
  include_self?: boolean
}

export interface DispatchPolicy extends DispatchTasksData {
  auto_dispatch_enabled: boolean
  project_id?: number | null
  max_assignments: number
  lease_seconds: number
  match_capabilities: boolean
  require_capability_match: boolean
  candidate_agent_ids: number[]
  include_self: boolean
}

export interface DispatchAssignment {
  assignment: TaskAssignment
  run: AgentRun
  agent: Agent
  strategy: 'capability_match' | 'priority_fifo'
  score: number
  matched_capabilities: string[]
}

export interface DispatchTasksResult {
  coordinator: Agent
  assignments: DispatchAssignment[]
  policy?: DispatchPolicy
  options?: DispatchPolicy
  summary: {
    claimable_tasks: number
    available_agents: number
    dispatched: number
    skipped_no_match: number
  }
}

export interface DispatchPreviewCandidate {
  agent: Agent
  score: number
  strategy: 'capability_match' | 'priority_fifo'
  matched_capabilities: string[]
  matched_tags: string[]
  matched_text: string[]
  missing_required: string[]
  experience_bonus?: number
}

export interface DispatchPreviewAssignment extends DispatchPreviewCandidate {
  task: Task
}

export interface DispatchPreviewTaskCandidates {
  task: Task
  candidates: DispatchPreviewCandidate[]
}

export interface DispatchPreviewUnmatchedTask {
  task: Task
  reason: 'no_matching_agent' | 'agent_capacity_exhausted'
  candidate_count: number
  best_candidate?: DispatchPreviewCandidate | null
}

export interface DispatchPreviewResult {
  coordinator: Agent
  proposed_assignments: DispatchPreviewAssignment[]
  task_candidates: DispatchPreviewTaskCandidates[]
  unmatched_tasks: DispatchPreviewUnmatchedTask[]
  policy?: DispatchPolicy
  options?: DispatchPolicy
  summary: {
    claimable_tasks: number
    available_agents: number
    planned: number
    skipped_no_match: number
    skipped_capacity: number
    max_assignments: number
  }
}

// ── Review queue ─────────────────────────────────────────────────────

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
