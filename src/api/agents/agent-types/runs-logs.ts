// Agent 类型 · runs-logs（由 types.ts 按块原样迁移）
import type { TaskAssignment, AgentRun } from './core'
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
