// Agent 类型 · handoff-dispatch（由 types.ts 按块原样迁移）

import type { Agent, TaskAssignment, AgentRun } from './core'
import type { Task } from '../../tasks'
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
