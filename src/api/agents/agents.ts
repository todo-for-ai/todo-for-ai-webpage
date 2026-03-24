import { apiClient } from '../client/index.js'
import type {
  Agent,
  AgentListResponse,
  CreateAgentRequest,
  UpdateAgentRequest,
} from './types'

export class AgentsApi {
  async getAgents(workspaceId: number, params?: {
    search?: string;
    status?: string;
    page?: number;
    per_page?: number;
    ownership?: 'all' | 'mine' | 'collaborating'  // 权限筛选: all-所有, mine-我创建的/拥有的, collaborating-我协作的
  }) {
    const query = new URLSearchParams()
    if (params?.search) {
      query.set('search', params.search)
    }
    if (params?.status) {
      query.set('status', params.status)
    }
    if (params?.page) {
      query.set('page', String(params.page))
    }
    if (params?.per_page) {
      query.set('per_page', String(params.per_page))
    }
    if (params?.ownership) {
      query.set('ownership', params.ownership)
    }

    const qs = query.toString()
    const url = `/workspaces/${workspaceId}/agents${qs ? `?${qs}` : ''}`
    return apiClient.get<AgentListResponse>(url)
  }

  async createAgent(workspaceId: number, data: CreateAgentRequest) {
    return apiClient.post<Agent>(`/workspaces/${workspaceId}/agents`, data)
  }

  async getAgent(workspaceId: number, agentId: number) {
    return apiClient.get<Agent>(`/workspaces/${workspaceId}/agents/${agentId}`)
  }

  async updateAgent(workspaceId: number, agentId: number, data: UpdateAgentRequest) {
    return apiClient.request<Agent>(`/workspaces/${workspaceId}/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async deleteAgent(workspaceId: number, agentId: number) {
    return apiClient.delete(`/workspaces/${workspaceId}/agents/${agentId}`)
  }

  async revokeAgent(workspaceId: number, agentId: number) {
    return apiClient.post(`/workspaces/${workspaceId}/agents/${agentId}/revoke`)
  }
}

export const agentsApi = new AgentsApi()
