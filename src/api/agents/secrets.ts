import { apiClient } from '../client/index.js'
import type {
  AgentSecret,
  AgentSecretListResponse,
  AgentSecretCollaborationResponse,
  ApprovalRequestListResponse,
  AuditLogResponse,
  CreateAgentSecretRequest,
  CreateAgentSecretShareRequest,
  AgentSecretShareListResponse,
  RevealAgentSecretResponse,
  RevealSharedAgentSecretResponse,
  RotateAgentSecretRequest,
} from './secretTypes'

export class AgentSecretsApi {
  async getAgentSecrets(workspaceId: number, agentId: number, params?: { include_shared?: boolean }) {
    const query = new URLSearchParams()
    if (params?.include_shared) {
      query.set('include_shared', 'true')
    }
    const qs = query.toString()
    return apiClient.get<AgentSecretListResponse>(`/workspaces/${workspaceId}/agents/${agentId}/secrets${qs ? `?${qs}` : ''}`)
  }

  async getAgentSecretCollaboration(
    workspaceId: number,
    agentId: number,
    params?: { include_inactive?: boolean; project_id?: number }
  ) {
    const query = new URLSearchParams()
    if (params?.include_inactive) {
      query.set('include_inactive', 'true')
    }
    if (typeof params?.project_id === 'number' && Number.isFinite(params.project_id)) {
      query.set('project_id', String(params.project_id))
    }
    const qs = query.toString()
    return apiClient.get<AgentSecretCollaborationResponse>(
      `/workspaces/${workspaceId}/agents/${agentId}/secrets/collaboration${qs ? `?${qs}` : ''}`
    )
  }

  async createAgentSecret(workspaceId: number, agentId: number, data: CreateAgentSecretRequest) {
    return apiClient.post<AgentSecret>(`/workspaces/${workspaceId}/agents/${agentId}/secrets`, data)
  }

  async revealAgentSecret(workspaceId: number, agentId: number, secretId: number) {
    return apiClient.post<RevealAgentSecretResponse>(`/workspaces/${workspaceId}/agents/${agentId}/secrets/${secretId}/reveal`)
  }

  async rotateAgentSecret(workspaceId: number, agentId: number, secretId: number, data: RotateAgentSecretRequest) {
    return apiClient.post<AgentSecret>(`/workspaces/${workspaceId}/agents/${agentId}/secrets/${secretId}/rotate`, data)
  }

  async revokeAgentSecret(workspaceId: number, agentId: number, secretId: number) {
    return apiClient.post<AgentSecret>(`/workspaces/${workspaceId}/agents/${agentId}/secrets/${secretId}/revoke`)
  }

  async revealSharedAgentSecret(workspaceId: number, agentId: number, secretId: number) {
    return apiClient.post<RevealSharedAgentSecretResponse>(
      `/workspaces/${workspaceId}/agents/${agentId}/shared-secrets/${secretId}/reveal`
    )
  }

  async listAgentSecretShares(workspaceId: number, agentId: number, secretId: number, params?: { include_inactive?: boolean }) {
    const query = new URLSearchParams()
    if (params?.include_inactive) {
      query.set('include_inactive', 'true')
    }
    const qs = query.toString()
    return apiClient.get<AgentSecretShareListResponse>(
      `/workspaces/${workspaceId}/agents/${agentId}/secrets/${secretId}/shares${qs ? `?${qs}` : ''}`
    )
  }

  async createAgentSecretShares(workspaceId: number, agentId: number, secretId: number, data: CreateAgentSecretShareRequest) {
    return apiClient.post<AgentSecretShareListResponse>(`/workspaces/${workspaceId}/agents/${agentId}/secrets/${secretId}/shares`, data)
  }

  async revokeAgentSecretShare(workspaceId: number, agentId: number, secretId: number, shareId: number) {
    return apiClient.post(`/workspaces/${workspaceId}/agents/${agentId}/secrets/${secretId}/shares/${shareId}/revoke`)
  }

  // Approval APIs
  async getSecretApprovalRequests(
    workspaceId: number,
    params?: { status?: string; secretId?: number }
  ) {
    const query = new URLSearchParams()
    if (params?.status) {
      query.set('status', params.status)
    }
    if (params?.secretId) {
      query.set('secret_id', String(params.secretId))
    }
    const qs = query.toString()
    return apiClient.get<ApprovalRequestListResponse>(
      `/workspaces/${workspaceId}/secret-approvals${qs ? `?${qs}` : ''}`
    )
  }

  async approveSecretRequest(workspaceId: number, requestId: number, notes?: string) {
    return apiClient.post(`/workspaces/${workspaceId}/secret-approvals/${requestId}/approve`, { notes })
  }

  async rejectSecretRequest(workspaceId: number, requestId: number, notes?: string) {
    return apiClient.post(`/workspaces/${workspaceId}/secret-approvals/${requestId}/reject`, { notes })
  }

  // Audit Log APIs
  async getSecretAuditLog(
    workspaceId: number,
    params?: {
      secretId?: number
      agentId?: number
      action?: string
      actorType?: string
      page?: number
      perPage?: number
    }
  ) {
    const query = new URLSearchParams()
    query.set('source', 'agent_audit')
    if (params?.secretId) {
      query.set('secret_id', String(params.secretId))
    }
    if (params?.agentId) {
      query.set('agent_id', String(params.agentId))
    }
    if (params?.action) {
      query.set('event_type', params.action)
    }
    if (params?.actorType) {
      query.set('actor_type', params.actorType)
    }
    query.set('page', String(params?.page || 1))
    query.set('per_page', String(params?.perPage || 20))
    return apiClient.get<AuditLogResponse>(
      `/workspaces/${workspaceId}/insights/activities?${query.toString()}`
    )
  }
}

export const agentSecretsApi = new AgentSecretsApi()
