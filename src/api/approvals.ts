import { apiClient } from './client/index.js'

export interface PendingApproval {
  event_id: number
  interaction_id: string
  task_id: number
  task_title: string | null
  agent_id: string
  agent_name: string | null
  interaction_type: string
  risk_tier: string
  sensitivity_level: string
  description: string
  created_at: string
}

export interface ApprovalListResponse {
  items: PendingApproval[]
  total: number
  page: number
  per_page: number
}

export interface ApprovalStats {
  pending: number
  approved_today: number
}

class ApprovalsApi {
  async getPending(workspaceId: number, page = 1): Promise<ApprovalListResponse> {
    return await apiClient.get<ApprovalListResponse>(
      `/workspaces/${workspaceId}/approvals/pending?page=${page}`
    )
  }

  async getStats(workspaceId: number): Promise<ApprovalStats> {
    return await apiClient.get<ApprovalStats>(
      `/workspaces/${workspaceId}/approvals/stats`
    )
  }

  async approve(workspaceId: number, taskId: number, interactionId: string, reason?: string): Promise<any> {
    return await apiClient.post(
      `/workspaces/${workspaceId}/tasks/${taskId}/interactions/${interactionId}/approval`,
      { decision: 'approved', reason: reason || '' }
    )
  }

  async reject(workspaceId: number, taskId: number, interactionId: string, reason: string): Promise<any> {
    return await apiClient.post(
      `/workspaces/${workspaceId}/tasks/${taskId}/interactions/${interactionId}/approval`,
      { decision: 'rejected', reason }
    )
  }
}

export const approvalsApi = new ApprovalsApi()
