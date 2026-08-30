/**
 * Agent API — core methods mixin.
 *
 * Agent CRUD, assignments, inbox, notifications, shared context,
 * run logs, task templates, and dispatch.
 */
import type { ApiClient } from '../client/index.js'
import type {
  Agent,
  ListResult,
  AgentQueryParams,
  AssignmentQueryParams,
  TaskAssignmentQueryParams,
  CreateAgentData,
  UpdateAgentData,
  ClaimTaskData,
  ClaimTaskResult,
  UpdateAssignmentData,
  TaskAssignment,
  TaskEvent,
  PostTaskEventData,
  HandoffTaskData,
  HandoffTaskResult,
  DispatchTasksData,
  DispatchPolicy,
  DispatchTasksResult,
  DispatchPreviewResult,
  AgentInboxResult,
  ListNotificationsResult,
  SharedContextEntry,
  RunLogLevel,
  RunLogEntry,
  ReviewQueueAction,
  ReviewQueueItem,
  AgentStatus,
} from './types'
import { unwrapData, unwrapList, buildQuery } from './helpers'

export interface CoreMethods {
  getAgents(params?: AgentQueryParams): Promise<ListResult<Agent>>
  getReviewQueue(params?: { action?: ReviewQueueAction; page?: number; per_page?: number }): Promise<ListResult<ReviewQueueItem>>
  getAgent(id: number): Promise<Agent>
  createAgent(data: CreateAgentData): Promise<Agent>
  updateAgent(id: number, data: UpdateAgentData): Promise<Agent>
  heartbeatAgent(id: number, status?: AgentStatus): Promise<Agent>
  getAgentAssignments(id: number, params?: AssignmentQueryParams): Promise<ListResult<TaskAssignment>>
  claimTask(id: number, data?: ClaimTaskData): Promise<ClaimTaskResult | null>
  updateAssignment(agentId: number, assignmentId: number, data: UpdateAssignmentData): Promise<{ assignment: TaskAssignment; run: { id: number; status: string } | null }>
  getTaskAssignments(taskId: number, params?: TaskAssignmentQueryParams): Promise<ListResult<TaskAssignment>>
  updateTaskAssignment(taskId: number, assignmentId: number, data: UpdateAssignmentData): Promise<{ assignment: TaskAssignment; run: { id: number; status: string } | null }>
  getTaskEvents(taskId: number, params?: { page?: number; per_page?: number }): Promise<ListResult<TaskEvent>>
  postTaskEvent(taskId: number, data: PostTaskEventData): Promise<TaskEvent>
  handoffTask(taskId: number, data: HandoffTaskData): Promise<HandoffTaskResult>
  dispatchTasks(agentId: number, data?: DispatchTasksData): Promise<DispatchTasksResult>
  getDispatchPolicy(agentId: number): Promise<{ policy: DispatchPolicy }>
  updateDispatchPolicy(agentId: number, policy: DispatchTasksData): Promise<{ policy: DispatchPolicy; coordinator: Agent }>
  previewDispatchTasks(agentId: number, data?: DispatchTasksData): Promise<DispatchPreviewResult>
  getAgentInbox(agentId: number, params?: { since_id?: number; per_page?: number; include_self?: boolean }): Promise<AgentInboxResult>
  getNotifications(params?: { since_id?: number; unread_only?: boolean; per_page?: number }): Promise<ListNotificationsResult>
  markNotificationsRead(data: { ids?: number[]; all?: boolean }): Promise<{ marked_count: number }>
  getSharedContext(taskId: number, key?: string): Promise<SharedContextEntry[]>
  setSharedContext(taskId: number, data: { key: string; value: string; agent_id?: number }): Promise<SharedContextEntry>
  deleteSharedContext(taskId: number, entryId: number): Promise<void>
  getRunLogs(runId: number, params?: { since_id?: number; level?: RunLogLevel; per_page?: number }): Promise<{ items: RunLogEntry[]; latest_id: number; since_id?: number; run_id: number }>
  getTaskTemplates(): Promise<unknown[]>
  createTaskTemplate(data: { name: string; description?: string; title_template?: string; content_template?: string; priority?: string; tags?: string[]; is_ai_task?: boolean; capabilities?: string[] }): Promise<unknown>
  deleteTaskTemplate(id: number): Promise<void>
  instantiateTaskTemplate(templateId: number, data: { project_id: number; title?: string; content?: string }): Promise<unknown>
}

export function createCoreMethods(apiClient: ApiClient): CoreMethods {
  return {
    async getAgents(params?: AgentQueryParams): Promise<ListResult<Agent>> {
      const response = await apiClient.get(`/agents${buildQuery(params)}`)
      return unwrapList<Agent>(response)
    },

    async getReviewQueue(params?: { action?: ReviewQueueAction; page?: number; per_page?: number }): Promise<ListResult<ReviewQueueItem>> {
      const response = await apiClient.get(`/agents/review-queue${buildQuery(params)}`)
      return unwrapList<ReviewQueueItem>(response)
    },

    async getAgent(id: number): Promise<Agent> {
      return unwrapData<Agent>(await apiClient.get(`/agents/${id}`))
    },

    async createAgent(data: CreateAgentData): Promise<Agent> {
      return unwrapData<Agent>(await apiClient.post('/agents', data))
    },

    async updateAgent(id: number, data: UpdateAgentData): Promise<Agent> {
      return unwrapData<Agent>(await apiClient.put(`/agents/${id}`, data))
    },

    async heartbeatAgent(id: number, status?: AgentStatus): Promise<Agent> {
      return unwrapData<Agent>(await apiClient.post(`/agents/${id}/heartbeat`, status ? { status } : {}))
    },

    async getAgentAssignments(id: number, params?: AssignmentQueryParams): Promise<ListResult<TaskAssignment>> {
      const response = await apiClient.get(`/agents/${id}/assignments${buildQuery(params)}`)
      return unwrapList<TaskAssignment>(response)
    },

    async claimTask(id: number, data: ClaimTaskData = {}): Promise<ClaimTaskResult | null> {
      return unwrapData<ClaimTaskResult | null>(await apiClient.post(`/agents/${id}/claim`, data))
    },

    async updateAssignment(agentId: number, assignmentId: number, data: UpdateAssignmentData) {
      return unwrapData<{ assignment: TaskAssignment; run: { id: number; status: string } | null }>(
        await apiClient.put(`/agents/${agentId}/assignments/${assignmentId}`, data)
      )
    },

    async getTaskAssignments(taskId: number, params?: TaskAssignmentQueryParams): Promise<ListResult<TaskAssignment>> {
      const response = await apiClient.get(`/agents/tasks/${taskId}/assignments${buildQuery(params)}`)
      return unwrapList<TaskAssignment>(response)
    },

    async updateTaskAssignment(taskId: number, assignmentId: number, data: UpdateAssignmentData) {
      return unwrapData<{ assignment: TaskAssignment; run: { id: number; status: string } | null }>(
        await apiClient.put(`/agents/tasks/${taskId}/assignments/${assignmentId}`, data)
      )
    },

    async getTaskEvents(taskId: number, params?: { page?: number; per_page?: number }): Promise<ListResult<TaskEvent>> {
      const response = await apiClient.get(`/agents/tasks/${taskId}/events${buildQuery(params)}`)
      return unwrapList<TaskEvent>(response)
    },

    async postTaskEvent(taskId: number, data: PostTaskEventData): Promise<TaskEvent> {
      return unwrapData<TaskEvent>(await apiClient.post(`/agents/tasks/${taskId}/events`, data))
    },

    async handoffTask(taskId: number, data: HandoffTaskData): Promise<HandoffTaskResult> {
      return unwrapData<HandoffTaskResult>(await apiClient.post(`/agents/tasks/${taskId}/handoff`, data))
    },

    async dispatchTasks(agentId: number, data: DispatchTasksData = {}): Promise<DispatchTasksResult> {
      return unwrapData<DispatchTasksResult>(await apiClient.post(`/agents/${agentId}/dispatch`, data))
    },

    async getDispatchPolicy(agentId: number): Promise<{ policy: DispatchPolicy }> {
      return unwrapData<{ policy: DispatchPolicy }>(await apiClient.get(`/agents/${agentId}/dispatch-policy`))
    },

    async updateDispatchPolicy(agentId: number, policy: DispatchTasksData): Promise<{ policy: DispatchPolicy; coordinator: Agent }> {
      return unwrapData<{ policy: DispatchPolicy; coordinator: Agent }>(await apiClient.put(`/agents/${agentId}/dispatch-policy`, policy))
    },

    async previewDispatchTasks(agentId: number, data: DispatchTasksData = {}): Promise<DispatchPreviewResult> {
      return unwrapData<DispatchPreviewResult>(await apiClient.post(`/agents/${agentId}/dispatch/preview`, data))
    },

    async getAgentInbox(agentId: number, params?: { since_id?: number; per_page?: number; include_self?: boolean }): Promise<AgentInboxResult> {
      return unwrapData<AgentInboxResult>(await apiClient.get(`/agents/${agentId}/inbox${buildQuery(params)}`))
    },

    async getNotifications(params?: { since_id?: number; unread_only?: boolean; per_page?: number }): Promise<ListNotificationsResult> {
      return unwrapData<ListNotificationsResult>(await apiClient.get(`/notifications${buildQuery(params)}`))
    },

    async markNotificationsRead(data: { ids?: number[]; all?: boolean }): Promise<{ marked_count: number }> {
      return unwrapData<{ marked_count: number }>(await apiClient.post('/notifications/read', data))
    },

    async getSharedContext(taskId: number, key?: string): Promise<SharedContextEntry[]> {
      return unwrapData<SharedContextEntry[]>(await apiClient.get(`/agents/tasks/${taskId}/shared-context${buildQuery(key ? { key } : undefined)}`))
    },

    async setSharedContext(taskId: number, data: { key: string; value: string; agent_id?: number }): Promise<SharedContextEntry> {
      return unwrapData<SharedContextEntry>(await apiClient.post(`/agents/tasks/${taskId}/shared-context`, data))
    },

    async deleteSharedContext(taskId: number, entryId: number): Promise<void> {
      await apiClient.delete(`/agents/tasks/${taskId}/shared-context/${entryId}`)
    },

    async getRunLogs(runId: number, params?: { since_id?: number; level?: RunLogLevel; per_page?: number }): Promise<{ items: RunLogEntry[]; latest_id: number; since_id?: number; run_id: number }> {
      return unwrapData(await apiClient.get(`/agents/runs/${runId}/logs${buildQuery(params)}`))
    },

    async getTaskTemplates(): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get('/agents/task-templates'))
    },

    async createTaskTemplate(data: { name: string; description?: string; title_template?: string; content_template?: string; priority?: string; tags?: string[]; is_ai_task?: boolean; capabilities?: string[] }): Promise<unknown> {
      return unwrapData(await apiClient.post('/agents/task-templates', data))
    },

    async deleteTaskTemplate(id: number): Promise<void> {
      await apiClient.delete(`/agents/task-templates/${id}`)
    },

    async instantiateTaskTemplate(templateId: number, data: { project_id: number; title?: string; content?: string }): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/task-templates/${templateId}/instantiate`, data))
    },
  }
}
