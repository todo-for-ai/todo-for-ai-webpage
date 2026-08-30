/**
 * Agent API — messaging and collaboration methods mixin.
 *
 * Channels, messages, protocols, collaboration templates, discovery,
 * project members, and broadcast functionality.
 */
import type { ApiClient } from '../client/index.js'
import type { Agent, ListResult } from './types'
import { unwrapData, buildQuery } from './helpers'

export interface MessagingMethods {
  broadcastMessage(agentId: number, content: string): Promise<{ recipient_count: number }>
  getCollaborationMetrics(params?: { project_id?: number; days?: number }): Promise<unknown>
  getRecommendedTasks(agentId: number, params?: { limit?: number; project_id?: number }): Promise<unknown[]>
  listChannels(params?: { project_id?: number; task_id?: number }): Promise<unknown[]>
  createChannel(data: { name: string; description?: string; project_id?: number; task_id?: number; agent_ids?: number[] }): Promise<unknown>
  getChannel(channelId: number): Promise<unknown>
  updateChannel(channelId: number, data: { name?: string; description?: string; is_active?: boolean }): Promise<unknown>
  deleteChannel(channelId: number): Promise<unknown>
  addChannelMember(channelId: number, data: { agent_id: number; role?: string }): Promise<unknown>
  removeChannelMember(channelId: number, memberId: number): Promise<unknown>
  listChannelMessages(channelId: number, params?: { page?: number; per_page?: number }): Promise<unknown[]>
  sendChannelMessage(channelId: number, data: { agent_id?: number; content: string; message_type?: string }): Promise<unknown>
  selfRegisterAgent(data: { name: string; description?: string; kind?: string; provider?: string; model?: string; capabilities?: string[]; config?: Record<string, unknown>; collaboration_role?: string }): Promise<Agent>
  discoverAgents(params?: { capability?: string[]; collaboration_role?: string; kind?: string; status?: string }): Promise<Agent[]>
  sendAgentMessage(fromAgentId: number, toAgentId: number, data: { content: string; task_id?: number; message_type?: string; metadata?: Record<string, unknown> }): Promise<{ delivered: boolean; to_agent_id: number; to_agent_name: string }>
  getAgentMessages(agentId: number, params?: { page?: number; per_page?: number }): Promise<ListResult<unknown>>
  listProtocols(params?: { project_id?: number; status?: string; protocol_type?: string; initiator_agent_id?: number }): Promise<unknown>
  createProtocol(data: { protocol_type: string; title: string; initiator_agent_id: number; description?: string; channel_id?: number; project_id?: number; task_id?: number; config?: Record<string, unknown>; deadline?: string }): Promise<unknown>
  getProtocol(protocolId: number): Promise<unknown>
  respondToProtocol(protocolId: number, data: { agent_id: number; message_type: string; content?: string; payload?: Record<string, unknown> }): Promise<unknown>
  resolveProtocol(protocolId: number, data: { resolution: string; result?: Record<string, unknown> }): Promise<unknown>
  getProtocolAnalytics(params?: Record<string, string>): Promise<unknown>
  addDeliberationMessage(protocolId: number, data: Record<string, unknown>): Promise<unknown>
  listCollaborationTemplates(params?: { category?: string }): Promise<unknown[]>
  createCollaborationTemplate(data: { name: string; agent_specs: unknown[]; description?: string; category?: string; workflow_id?: number }): Promise<unknown>
  deleteCollaborationTemplate(templateId: number): Promise<unknown>
  instantiateCollaborationTemplate(templateKey: string, data?: { project_id?: number }): Promise<unknown>
  getProjectMembers(projectId: number): Promise<unknown[]>
  addProjectMember(projectId: number, data: { user_id: number; role: string }): Promise<unknown>
  updateProjectMember(projectId: number, memberId: number, data: { role: string }): Promise<unknown>
  removeProjectMember(projectId: number, memberId: number): Promise<void>
}

export function createMessagingMethods(apiClient: ApiClient): MessagingMethods {
  return {
    async broadcastMessage(agentId: number, content: string): Promise<{ recipient_count: number }> {
      return unwrapData<{ recipient_count: number }>(await apiClient.post(`/agents/${agentId}/broadcast`, { content }))
    },

    async getCollaborationMetrics(params?: { project_id?: number; days?: number }): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/collaboration-metrics${buildQuery(params as Record<string, string>)}`))
    },

    async getRecommendedTasks(agentId: number, params?: { limit?: number; project_id?: number }): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/${agentId}/recommended-tasks${buildQuery(params as Record<string, string>)}`))
    },

    async listChannels(params?: { project_id?: number; task_id?: number }): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/channels${buildQuery(params as Record<string, string>)}`))
    },

    async createChannel(data: { name: string; description?: string; project_id?: number; task_id?: number; agent_ids?: number[] }): Promise<unknown> {
      return unwrapData(await apiClient.post('/agents/channels', data))
    },

    async getChannel(channelId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/channels/${channelId}`))
    },

    async updateChannel(channelId: number, data: { name?: string; description?: string; is_active?: boolean }): Promise<unknown> {
      return unwrapData(await apiClient.put(`/agents/channels/${channelId}`, data))
    },

    async deleteChannel(channelId: number): Promise<unknown> {
      return unwrapData(await apiClient.delete(`/agents/channels/${channelId}`))
    },

    async addChannelMember(channelId: number, data: { agent_id: number; role?: string }): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/channels/${channelId}/members`, data))
    },

    async removeChannelMember(channelId: number, memberId: number): Promise<unknown> {
      return unwrapData(await apiClient.delete(`/agents/channels/${channelId}/members/${memberId}`))
    },

    async listChannelMessages(channelId: number, params?: { page?: number; per_page?: number }): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/channels/${channelId}/messages${buildQuery(params as Record<string, string>)}`))
    },

    async sendChannelMessage(channelId: number, data: { agent_id?: number; content: string; message_type?: string }): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/channels/${channelId}/messages`, data))
    },

    async selfRegisterAgent(data: { name: string; description?: string; kind?: string; provider?: string; model?: string; capabilities?: string[]; config?: Record<string, unknown>; collaboration_role?: string }): Promise<Agent> {
      return unwrapData<Agent>(await apiClient.post('/agents/self-register', data))
    },

    async discoverAgents(params?: { capability?: string[]; collaboration_role?: string; kind?: string; status?: string }): Promise<Agent[]> {
      const stringParams: Record<string, string> = {}
      if (params) {
        if (params.capability) stringParams.capability = params.capability.join(',')
        if (params.collaboration_role) stringParams.collaboration_role = params.collaboration_role
        if (params.kind) stringParams.kind = params.kind
        if (params.status) stringParams.status = params.status
      }
      return unwrapData<Agent[]>(await apiClient.get(`/agents/discover${buildQuery(stringParams)}`))
    },

    async sendAgentMessage(fromAgentId: number, toAgentId: number, data: { content: string; task_id?: number; message_type?: string; metadata?: Record<string, unknown> }): Promise<{ delivered: boolean; to_agent_id: number; to_agent_name: string }> {
      return unwrapData<{ delivered: boolean; to_agent_id: number; to_agent_name: string }>(await apiClient.post(`/agents/${fromAgentId}/messages/${toAgentId}`, data))
    },

    async getAgentMessages(agentId: number, params?: { page?: number; per_page?: number }): Promise<ListResult<unknown>> {
      const response = await apiClient.get(`/agents/${agentId}/messages${buildQuery(params as Record<string, string>)}`)
      const payload = unwrapData<Record<string, unknown>>(response)
      const items = (payload?.items || payload?.data || []) as unknown[]
      return { items, pagination: (payload?.pagination as any) || { page: 1, per_page: items.length, total: items.length, pages: 1, has_next: false, has_prev: false, next_num: null, prev_num: null } }
    },

    async listProtocols(params?: { project_id?: number; status?: string; protocol_type?: string; initiator_agent_id?: number }): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/protocols${buildQuery(params as Record<string, string>)}`))
    },

    async createProtocol(data: { protocol_type: string; title: string; initiator_agent_id: number; description?: string; channel_id?: number; project_id?: number; task_id?: number; config?: Record<string, unknown>; deadline?: string }): Promise<unknown> {
      return unwrapData(await apiClient.post('/agents/protocols', data))
    },

    async getProtocol(protocolId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/protocols/${protocolId}`))
    },

    async respondToProtocol(protocolId: number, data: { agent_id: number; message_type: string; content?: string; payload?: Record<string, unknown> }): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/protocols/${protocolId}/respond`, data))
    },

    async resolveProtocol(protocolId: number, data: { resolution: string; result?: Record<string, unknown> }): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/protocols/${protocolId}/resolve`, data))
    },

    async getProtocolAnalytics(params?: Record<string, string>): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/protocols/analytics${buildQuery(params)}`))
    },

    async addDeliberationMessage(protocolId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/protocols/${protocolId}/deliberation`, data))
    },

    async listCollaborationTemplates(params?: { category?: string }): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/collaboration-templates${buildQuery(params as Record<string, string>)}`))
    },

    async createCollaborationTemplate(data: { name: string; agent_specs: unknown[]; description?: string; category?: string; workflow_id?: number }): Promise<unknown> {
      return unwrapData(await apiClient.post('/agents/collaboration-templates', data))
    },

    async deleteCollaborationTemplate(templateId: number): Promise<unknown> {
      return unwrapData(await apiClient.delete(`/agents/collaboration-templates/${templateId}`))
    },

    async instantiateCollaborationTemplate(templateKey: string, data?: { project_id?: number }): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/collaboration-templates/${templateKey}/instantiate`, data || {}))
    },

    async getProjectMembers(projectId: number): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/projects/${projectId}/members`))
    },

    async addProjectMember(projectId: number, data: { user_id: number; role: string }): Promise<unknown> {
      return unwrapData(await apiClient.post(`/projects/${projectId}/members`, data))
    },

    async updateProjectMember(projectId: number, memberId: number, data: { role: string }): Promise<unknown> {
      return unwrapData(await apiClient.put(`/projects/${projectId}/members/${memberId}`, data))
    },

    async removeProjectMember(projectId: number, memberId: number): Promise<void> {
      await apiClient.delete(`/projects/${projectId}/members/${memberId}`)
    },
  }
}
