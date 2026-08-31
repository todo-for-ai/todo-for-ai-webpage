/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client/index.js'

export interface AuditEvent {
  id: number
  workspace_id: number
  event_type: string
  actor_type: string
  actor_id: string
  target_type: string
  target_id: string
  level: string
  risk_score: number
  correlation_id?: string
  task_id?: number
  actor_agent_id?: number
  target_agent_id?: number
  duration_ms?: number
  payload?: Record<string, any>
  occurred_at: string
}

export interface AuditStats {
  total: number
  by_level: Record<string, number>
  by_actor_type: Record<string, number>
}

class AuditEventsApi {
  async list(
    workspaceId: number,
    params?: Record<string, any>
  ): Promise<{ items: AuditEvent[]; total: number; page: number }> {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : ''
    return await apiClient.get(`/workspaces/${workspaceId}/audit-events${qs}`)
  }

  async stats(workspaceId: number): Promise<AuditStats> {
    return await apiClient.get(`/workspaces/${workspaceId}/audit-events/stats`)
  }
}

export const auditEventsApi = new AuditEventsApi()
