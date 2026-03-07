import { apiClient } from '../client/index.js'
import type {
  AgentRunnerConfig,
  UpdateAgentRunnerConfigRequest,
  AgentTrigger,
  AgentTriggerListResponse,
  CreateAgentTriggerRequest,
  UpdateAgentTriggerRequest,
  AgentRun,
  AgentRunListResponse,
  NotificationChannel,
  NotificationChannelListResponse,
  CreateNotificationChannelRequest,
  UpdateNotificationChannelRequest,
  EffectiveChannelsResponse,
} from './automationTypes'

export class AgentAutomationApi {
  async getRunnerConfig(workspaceId: number, agentId: number) {
    return apiClient.get<AgentRunnerConfig>(`/workspaces/${workspaceId}/agents/${agentId}/runner-config`)
  }

  async updateRunnerConfig(workspaceId: number, agentId: number, data: UpdateAgentRunnerConfigRequest) {
    return apiClient.request<AgentRunnerConfig>(`/workspaces/${workspaceId}/agents/${agentId}/runner-config`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async listTriggers(workspaceId: number, agentId: number) {
    return apiClient.get<AgentTriggerListResponse>(`/workspaces/${workspaceId}/agents/${agentId}/triggers`)
  }

  async createTrigger(workspaceId: number, agentId: number, data: CreateAgentTriggerRequest) {
    return apiClient.post<AgentTrigger>(`/workspaces/${workspaceId}/agents/${agentId}/triggers`, data)
  }

  async updateTrigger(workspaceId: number, agentId: number, triggerId: number, data: UpdateAgentTriggerRequest) {
    return apiClient.request<AgentTrigger>(`/workspaces/${workspaceId}/agents/${agentId}/triggers/${triggerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async deleteTrigger(workspaceId: number, agentId: number, triggerId: number) {
    return apiClient.delete(`/workspaces/${workspaceId}/agents/${agentId}/triggers/${triggerId}`)
  }

  async listRuns(workspaceId: number, agentId: number, params?: { page?: number; per_page?: number; state?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.per_page) query.set('per_page', String(params.per_page))
    if (params?.state) query.set('state', params.state)
    const qs = query.toString()
    return apiClient.get<AgentRunListResponse>(`/workspaces/${workspaceId}/agents/${agentId}/runs${qs ? `?${qs}` : ''}`)
  }

  async getRun(workspaceId: number, agentId: number, runId: string) {
    return apiClient.get<AgentRun>(`/workspaces/${workspaceId}/agents/${agentId}/runs/${runId}`)
  }

  async listUserChannels(userId: number) {
    return apiClient.get<NotificationChannelListResponse>(`/users/${userId}/channels`)
  }

  async createUserChannel(userId: number, data: CreateNotificationChannelRequest) {
    return apiClient.post<NotificationChannel>(`/users/${userId}/channels`, data)
  }

  async listOrganizationChannels(organizationId: number) {
    return apiClient.get<NotificationChannelListResponse>(`/organizations/${organizationId}/channels`)
  }

  async createOrganizationChannel(organizationId: number, data: CreateNotificationChannelRequest) {
    return apiClient.post<NotificationChannel>(`/organizations/${organizationId}/channels`, data)
  }

  async listProjectChannels(projectId: number) {
    return apiClient.get<NotificationChannelListResponse>(`/projects/${projectId}/channels`)
  }

  async createProjectChannel(projectId: number, data: CreateNotificationChannelRequest) {
    return apiClient.post<NotificationChannel>(`/projects/${projectId}/channels`, data)
  }

  async updateChannel(channelId: number, data: UpdateNotificationChannelRequest) {
    return apiClient.request<NotificationChannel>(`/channels/${channelId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async deleteChannel(channelId: number) {
    return apiClient.delete(`/channels/${channelId}`)
  }

  async getProjectEffectiveChannels(projectId: number, eventType?: string) {
    const qs = eventType ? `?event_type=${encodeURIComponent(eventType)}` : ''
    return apiClient.get<EffectiveChannelsResponse>(`/projects/${projectId}/effective-channels${qs}`)
  }
}

export const agentAutomationApi = new AgentAutomationApi()
