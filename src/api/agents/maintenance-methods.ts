/**
 * Agent API — maintenance and admin methods mixin.
 *
 * Health check, audit logs, escalate overdue tasks, mark offline agents,
 * timeout workflow steps, and other administrative operations.
 */
import type { ApiClient } from '../client/index.js'
import type { ListResult } from './types'
import { unwrapData, unwrapList, buildQuery } from './helpers'

export interface MaintenanceMethods {
  healthCheck(): Promise<{ stale_agents: number; stale_agent_ids: number[]; expired_leases: number; escalated_tasks: number; escalated_task_ids: number[] }>
  escalateOverdueTasks(data?: { overdue_after_days?: number }): Promise<{ escalated_count: number; task_ids: number[] }>
  getAuditLogs(params?: { action?: string; resource_type?: string; resource_id?: number; actor_type?: string; project_id?: number; page?: number; per_page?: number }): Promise<ListResult<unknown>>
  markOfflineAgents(): Promise<{ marked_offline: number; agent_ids: number[] }>
  timeoutWorkflowSteps(): Promise<{ timed_out: number; steps: unknown[] }>
}

export function createMaintenanceMethods(apiClient: ApiClient): MaintenanceMethods {
  return {
    async healthCheck(): Promise<{ stale_agents: number; stale_agent_ids: number[]; expired_leases: number; escalated_tasks: number; escalated_task_ids: number[] }> {
      return unwrapData(await apiClient.get('/agents/health-check'))
    },

    async escalateOverdueTasks(data?: { overdue_after_days?: number }): Promise<{ escalated_count: number; task_ids: number[] }> {
      return unwrapData<{ escalated_count: number; task_ids: number[] }>(await apiClient.post('/agents/escalate-overdue', data || {}))
    },

    async getAuditLogs(params?: { action?: string; resource_type?: string; resource_id?: number; actor_type?: string; project_id?: number; page?: number; per_page?: number }): Promise<ListResult<unknown>> {
      const response = await apiClient.get(`/agents/audit-logs${buildQuery(params as Record<string, string>)}`)
      return unwrapList<unknown>(response)
    },

    async markOfflineAgents(): Promise<{ marked_offline: number; agent_ids: number[] }> {
      return unwrapData<{ marked_offline: number; agent_ids: number[] }>(await apiClient.post('/agents/mark-offline'))
    },

    async timeoutWorkflowSteps(): Promise<{ timed_out: number; steps: unknown[] }> {
      return unwrapData<{ timed_out: number; steps: unknown[] }>(await apiClient.post('/agents/timeout-workflow-steps'))
    },
  }
}
