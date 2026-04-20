import { apiClient } from './client/index.js'

export interface AgentTeam {
  id: number
  name: string
  description?: string
  avatar_url?: string
  status: string
  config?: Record<string, any>
  default_strategy?: string
  members?: AgentTeamMember[]
  created_at: string
  updated_at: string
}

export interface AgentTeamMember {
  id: number
  agent_id: number
  agent_name?: string
  role?: string
  responsibility?: string
  config?: Record<string, any>
  order_index: number
}

export interface TeamOrchestration {
  id: number
  team_id: number
  task_id: number
  strategy: string
  status: string
  subtasks?: TeamSubtask[]
  result?: any
  created_at: string
}

export interface TeamSubtask {
  id: number
  orchestration_id: number
  agent_id?: number
  title: string
  description?: string
  status: string
  output?: string
  error?: string
}

class AgentTeamsApi {
  private baseUrl(workspaceId: number) {
    return `/workspaces/${workspaceId}/agent-teams`
  }

  async list(workspaceId: number, params?: Record<string, any>): Promise<{ items: AgentTeam[]; total: number }> {
    return await apiClient.get(this.baseUrl(workspaceId), params)
  }

  async get(workspaceId: number, teamId: number): Promise<AgentTeam> {
    return await apiClient.get(`${this.baseUrl(workspaceId)}/${teamId}`)
  }

  async create(workspaceId: number, data: Partial<AgentTeam>): Promise<AgentTeam> {
    return await apiClient.post(this.baseUrl(workspaceId), data)
  }

  async update(workspaceId: number, teamId: number, data: Partial<AgentTeam>): Promise<AgentTeam> {
    return await apiClient.put(`${this.baseUrl(workspaceId)}/${teamId}`, data)
  }

  async delete(workspaceId: number, teamId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl(workspaceId)}/${teamId}`)
  }

  async listMembers(workspaceId: number, teamId: number): Promise<AgentTeamMember[]> {
    return await apiClient.get(`${this.baseUrl(workspaceId)}/${teamId}/members`)
  }

  async addMember(workspaceId: number, teamId: number, data: Partial<AgentTeamMember>): Promise<AgentTeamMember> {
    return await apiClient.post(`${this.baseUrl(workspaceId)}/${teamId}/members`, data)
  }

  async updateMember(workspaceId: number, teamId: number, memberId: number, data: Partial<AgentTeamMember>): Promise<AgentTeamMember> {
    return await apiClient.put(`${this.baseUrl(workspaceId)}/${teamId}/members/${memberId}`, data)
  }

  async removeMember(workspaceId: number, teamId: number, memberId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl(workspaceId)}/${teamId}/members/${memberId}`)
  }

  async orchestrate(workspaceId: number, taskId: number, data: { team_id: number; strategy: string; participating_agent_ids?: number[] }): Promise<TeamOrchestration> {
    return await apiClient.post(`/workspaces/${workspaceId}/tasks/${taskId}/orchestrate`, data)
  }

  async getOrchestration(workspaceId: number, orchestrationId: number): Promise<TeamOrchestration> {
    return await apiClient.get(`/workspaces/${workspaceId}/orchestrations/${orchestrationId}`)
  }

  async startOrchestration(workspaceId: number, orchestrationId: number): Promise<TeamOrchestration> {
    return await apiClient.post(`/workspaces/${workspaceId}/orchestrations/${orchestrationId}/start`)
  }

  async cancelOrchestration(workspaceId: number, orchestrationId: number): Promise<TeamOrchestration> {
    return await apiClient.post(`/workspaces/${workspaceId}/orchestrations/${orchestrationId}/cancel`)
  }
}

export const agentTeamsApi = new AgentTeamsApi()
