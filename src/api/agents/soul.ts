import { apiClient } from '../client/index.js'
import type { AgentSoulVersion, AgentSoulVersionListResponse, RollbackAgentSoulRequest } from './soulTypes'
import type { Agent } from './types'

export class AgentSoulApi {
  async getSoulVersions(workspaceId: number, agentId: number, params?: { page?: number; per_page?: number }) {
    const query = new URLSearchParams()
    if (params?.page) {
      query.set('page', String(params.page))
    }
    if (params?.per_page) {
      query.set('per_page', String(params.per_page))
    }

    const qs = query.toString()
    const url = `/workspaces/${workspaceId}/agents/${agentId}/soul/versions${qs ? `?${qs}` : ''}`
    return apiClient.get<AgentSoulVersionListResponse>(url)
  }

  async getSoulVersion(workspaceId: number, agentId: number, version: number) {
    return apiClient.get<AgentSoulVersion>(`/workspaces/${workspaceId}/agents/${agentId}/soul/versions/${version}`)
  }

  async rollbackSoul(workspaceId: number, agentId: number, data: RollbackAgentSoulRequest) {
    return apiClient.post<Agent>(`/workspaces/${workspaceId}/agents/${agentId}/soul/rollback`, data)
  }
}

export const agentSoulApi = new AgentSoulApi()
