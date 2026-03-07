import { apiClient } from '../client/index.js'
import type {
  AgentKeyListResponse,
  CreateAgentKeyRequest,
  CreateAgentKeyResponse,
  RevealAgentKeyResponse,
  ConnectLinkResponse,
  AgentKey,
} from './keyTypes'

export class AgentKeysApi {
  async getAgentKeys(workspaceId: number, agentId: number) {
    return apiClient.get<AgentKeyListResponse>(`/workspaces/${workspaceId}/agents/${agentId}/keys`)
  }

  async createAgentKey(workspaceId: number, agentId: number, data: CreateAgentKeyRequest) {
    return apiClient.post<CreateAgentKeyResponse>(`/workspaces/${workspaceId}/agents/${agentId}/keys`, data)
  }

  async revealAgentKey(workspaceId: number, agentId: number, keyId: number) {
    return apiClient.post<RevealAgentKeyResponse>(`/workspaces/${workspaceId}/agents/${agentId}/keys/${keyId}/reveal`)
  }

  async revokeAgentKey(workspaceId: number, agentId: number, keyId: number) {
    return apiClient.post<AgentKey>(`/workspaces/${workspaceId}/agents/${agentId}/keys/${keyId}/revoke`)
  }

  async createConnectLink(workspaceId: number, agentId: number, ttlSeconds = 600) {
    return apiClient.post<ConnectLinkResponse>(`/workspaces/${workspaceId}/agents/${agentId}/connect-link`, {
      ttl_seconds: ttlSeconds,
    })
  }
}

export const agentKeysApi = new AgentKeysApi()
