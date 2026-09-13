// Agent 类型 · events-inbox（由 types.ts 按块原样迁移）

import type { Task } from '../../tasks'
import type { TaskEvent } from './core'
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
