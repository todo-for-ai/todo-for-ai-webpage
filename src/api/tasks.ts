import { apiClient } from './client/index.js'
import { getApiBaseUrl } from '../utils/apiConfig'

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pages: number
    per_page: number
    total: number
    has_next: boolean
    has_prev: boolean
    next_num?: number
    prev_num?: number
  }
  message: string
  success: boolean
  timestamp: string
}

// 任务相关类型定义
export interface Task {
  id: number
  project_id: number
  title: string
  content: string
  description?: string  // 添加缺失的description属性
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  estimated_hours?: number
  completion_rate: number
  completed_at?: string
  tags: string[]
  assignees?: Array<{ type: 'human' | 'agent'; id: number }>
  mentions?: Array<{ type: 'human' | 'agent'; id: number }>
  revision?: number
  created_at: string
  updated_at: string
  created_by: string
  feedback_content?: string
  feedback_at?: string
  is_ai_task?: boolean  // 添加缺失的is_ai_task属性
  related_files?: string[]  // 添加缺失的related_files属性
  creator_type?: string  // 添加缺失的creator_type属性
  creator_identifier?: string  // 添加缺失的creator_identifier属性
  interaction_session_id?: string  // 交互式任务会话ID
  is_interactive?: boolean  // 是否为交互式任务
  ai_waiting_feedback?: boolean  // AI是否等待人类反馈
  project?: {
    id: number
    name: string
    color: string
  }
  stats?: {
    attachments_count: number
    history_count: number
    is_overdue: boolean
    days_until_due?: number
  }
}

export interface CreateTaskData {
  project_id: number
  title?: string
  content?: string
  description?: string  // 添加description属性
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  tags?: string[]
  assignees?: Array<{ type: 'human' | 'agent'; id: number }>
  mentions?: Array<{ type: 'human' | 'agent'; id: number }>
  is_ai_task?: boolean
  related_files?: string[]  // 添加related_files属性
  creator_type?: string  // 添加creator_type属性
  creator_identifier?: string  // 添加creator_identifier属性
}

export interface UpdateTaskData {
  title?: string
  content?: string
  description?: string  // 添加description属性
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  completion_rate?: number
  tags?: string[]
  assignees?: Array<{ type: 'human' | 'agent'; id: number }>
  mentions?: Array<{ type: 'human' | 'agent'; id: number }>
  expected_revision?: number
  is_ai_task?: boolean  // 添加is_ai_task属性
  related_files?: string[]  // 添加related_files属性
  created_by?: string  // 添加created_by属性
}

export interface TaskQueryParams {
  page?: number
  per_page?: number
  search?: string
  project_id?: number
  status?: string
  priority?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface TaskLog {
  id: number
  task_id: number
  actor_type: 'human' | 'agent' | 'system'
  actor_user_id?: number | null
  actor_agent_id?: number | null
  content: string
  content_type: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface TaskAttachment {
  id: number
  task_id: number
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type?: string
  is_image?: boolean
  uploaded_at?: string
  uploaded_by?: string
  file_size_human?: string
}

// 任务API服务
export class TasksApi {
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

  // 获取任务附件
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
}

// 导出单例实例
export const tasksApi = new TasksApi()
