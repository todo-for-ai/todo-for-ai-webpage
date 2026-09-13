// Agent 类型 · core（由 types.ts 按块原样迁移）

import type { AgentWorkingSchedule } from './schedule-crud'
import type { Task } from '../../tasks'
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
  working_schedule?: AgentWorkingSchedule
  last_seen_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  stats?: {
    active_assignments: number
    total_runs: number
  }

  // ── 以下与后端 models/agent.py to_dict 对齐 ──
  // 归属
  workspace_id?: number | null
  creator_user_id?: number | null

  // 展示
  display_name?: string
  avatar_url?: string
  homepage_url?: string
  contact_email?: string

  // 能力与项目边界
  capability_tags?: string[]
  allowed_project_ids?: number[]

  // LLM 参数（平台侧调参）
  llm_provider?: string
  llm_model?: string
  temperature?: number | null
  top_p?: number | null
  max_output_tokens?: number | null
  context_window_tokens?: number | null
  reasoning_mode?: string
  system_prompt?: string
  soul_markdown?: string
  response_style?: Record<string, unknown> | null
  tool_policy?: Record<string, unknown> | null
  memory_policy?: Record<string, unknown> | null
  handoff_policy?: Record<string, unknown> | null

  // 执行与运行时
  execution_mode: string
  runner_enabled: boolean
  sandbox_profile: string
  sandbox_policy?: { network_mode?: string; allowed_domains?: string[] } | null
  max_concurrency?: number
  max_retry?: number
  timeout_seconds?: number
  heartbeat_interval_seconds?: number
  soul_version?: number
  config_version?: number
  runner_config_version?: number
  notification_channels?: Record<string, unknown> | null

  // 角色模板与画像
  role_template_id?: number | null
  role?: {
    id: number
    name: string
    display_name?: string
    category?: string
  } | null
  skill_profile?: Record<string, unknown> | null
  is_system?: boolean
  is_owner?: boolean
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
  // 运行时链路字段（调度/触发/失败归因）
  run_id?: string
  attempt?: number
  trigger_reason?: string
  failure_reason?: string
  failure_code?: string
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
