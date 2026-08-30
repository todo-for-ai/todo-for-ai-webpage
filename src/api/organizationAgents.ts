import { apiClient } from './client/index.js'
import type { Agent } from './agents'

export interface OrganizationAgentMember {
  id: number
  organization_id: number
  agent_id: number
  invited_by_user_id?: number | null
  status: 'invited' | 'active' | 'removed' | 'rejected'
  joined_at?: string | null
  responded_at?: string | null
  created_at: string
  updated_at: string
  agent?: Agent
}

export class OrganizationAgentsApi {
  async getOrganizationAgentMembers(organizationId: number) {
    return apiClient.get<{ organization_id: number; items: OrganizationAgentMember[] }>(
      `/organizations/${organizationId}/agent-members`
    )
  }

  async createOrganizationAgent(
    organizationId: number,
    data: {
      name: string
      description?: string
      capability_tags?: string[]
      allowed_project_ids?: number[]
    }
  ) {
    return apiClient.post<{ member: OrganizationAgentMember; agent: Agent }>(`/organizations/${organizationId}/agents`, data)
  }

  async inviteOrganizationAgentMember(organizationId: number, agentId: number) {
    return apiClient.post<OrganizationAgentMember>(`/organizations/${organizationId}/agent-members/invite`, {
      agent_id: agentId,
    })
  }

  async removeOrganizationAgentMember(organizationId: number, membershipId: number) {
    return apiClient.delete(`/organizations/${organizationId}/agent-members/${membershipId}`)
  }
}

export const organizationAgentsApi = new OrganizationAgentsApi()
