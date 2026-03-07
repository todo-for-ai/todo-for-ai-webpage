import { apiClient } from '../client/index.js'
import type {
  AgentSecret,
  AgentSecretListResponse,
  AgentSecretCollaborationResponse,
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
}

export const agentSecretsApi = new AgentSecretsApi()
