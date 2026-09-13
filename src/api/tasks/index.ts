/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { apiClient } from '../client/index.js'
import { getApiBaseUrl } from '../../utils/apiConfig'
import type {
  PaginatedResponse,
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskQueryParams,
  TaskLog,
  TaskEvidenceResult,
  PendingPrApproval,
  PrApprovalDecision,
  TaskAttachment,
} from './types'
import { TasksAnalyticsApi } from './analytics'

export * from './types'
export * from './analytics-types'
export { TasksAnalyticsApi } from './analytics'

/**
 * 任务 API 聚合门面：CRUD/历史/证据/PR 审批/附件/日志/批量/子任务（本类）
 * + 分析统计（继承 TasksAnalyticsApi）。由单文件 tasks.ts 拆分，方法签名与
 * URL 不变；24 个消费方经目录 index 解析无感迁移。
 */
export class TasksApi extends TasksAnalyticsApi {
  // 获取任务列表
  async getTasks(params?: TaskQueryParams) {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }

    const url = `/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<PaginatedResponse<Task>>(url)
  }

  // 获取单个任务
  async getTask(id: number) {
    return apiClient.get<Task>(`/tasks/${id}`)
  }

  // 创建任务
  async createTask(data: CreateTaskData) {
    return apiClient.post<Task>('/tasks', data)
  }

  // 更新任务
  async updateTask(id: number, data: UpdateTaskData) {
    return apiClient.put<Task>(`/tasks/${id}`, data)
  }

  // 删除任务
  async deleteTask(id: number) {
    return apiClient.delete(`/tasks/${id}`)
  }

  // 更新任务状态
  async updateTaskStatus(id: number, status: Task['status']) {
    return apiClient.put<Task>(`/tasks/${id}`, { status })
  }

  // 更新任务进度
  async updateTaskProgress(id: number, completion_rate: number) {
    return apiClient.put<Task>(`/tasks/${id}`, { completion_rate })
  }

  // 获取任务历史
  async getTaskHistory(id: number) {
    return apiClient.get(`/tasks/${id}/history`)
  }

  // 获取任务的 DoD 与验证证据（P1.2 验证门）
  // 获取任务附件
  async getTaskEvidence(id: number): Promise<TaskEvidenceResult> {
    return apiClient.get<TaskEvidenceResult>(`/tasks/${id}/evidence`)
  }

  // 待审批的 PR 交互请求（L0 审批队列）
  async getPendingPrApprovals(): Promise<PendingPrApproval[]> {
    return apiClient.get<PendingPrApproval[]>(`/tasks/pull-request/approvals/pending`)
  }

  // 审批决定：批准执行（pr_create/pr_merge）或拒绝
  async approvePrInteraction(taskId: number, decision: PrApprovalDecision) {
    return apiClient.post(`/tasks/${taskId}/pull-request/approve`, decision)
  }

  async getTaskAttachments(id: number) {
    return apiClient.get<TaskAttachment[]>(`/tasks/${id}/attachments`)
  }

  // 上传任务附件
  async uploadTaskAttachment(id: number, file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload<TaskAttachment>(`/tasks/${id}/attachments`, formData)
  }

  // 删除任务附件
  async deleteTaskAttachment(taskId: number, attachmentId: number) {
    return apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`)
  }

  getTaskAttachmentDownloadUrl(taskId: number, attachmentId: number) {
    return `${getApiBaseUrl()}/tasks/${taskId}/attachments/${attachmentId}/download`
  }

  async getTaskLogs(taskId: number, params?: { page?: number; per_page?: number }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', String(params.page))
    if (params?.per_page) queryParams.append('per_page', String(params.per_page))
    const suffix = queryParams.toString() ? `?${queryParams.toString()}` : ''
    return apiClient.get<{ items: TaskLog[]; pagination?: any }>(`/tasks/${taskId}/logs${suffix}`)
  }

  async appendTaskLog(taskId: number, content: string, contentType = 'text/markdown') {
    return apiClient.post<TaskLog>(`/tasks/${taskId}/logs`, { content, content_type: contentType })
  }

  // 批量删除任务
  async batchDeleteTasks(taskIds: number[]) {
    return apiClient.post('/tasks/batch/delete', { task_ids: taskIds })
  }

  // 批量更新任务状态
  async batchUpdateTaskStatus(taskIds: number[], status: Task['status']) {
    return apiClient.post('/tasks/batch/update-status', { 
      task_ids: taskIds, 
      status 
    })
  }

  // 批量更新任务优先级
  async batchUpdateTaskPriority(taskIds: number[], priority: Task['priority']) {
    return apiClient.post('/tasks/batch/update-priority', {
      task_ids: taskIds,
      priority
    })
  }

  // 批量指派任务
  async batchAssignTasks(taskIds: number[], assignees: Array<{ type: 'human' | 'agent'; id: number }>) {
    return apiClient.post('/tasks/batch/assign', {
      task_ids: taskIds,
      assignees
    })
  }

  // 获取子任务列表
  async getSubtasks(parentTaskId: number) {
    return apiClient.get<Task[]>(`/tasks/${parentTaskId}/subtasks`)
  }
}

// 导出单例实例
export const tasksApi = new TasksApi()
