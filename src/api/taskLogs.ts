import { apiClient } from './client/index.js'

export interface TaskLogEntry {
  id: number
  task_id: number
  actor_type: 'HUMAN' | 'AGENT' | 'SYSTEM'
  actor_user_id: number | null
  actor_agent_id: string | null
  content: string
  content_type: string
  created_at: string
  actor_name?: string
  actor_avatar?: string
}

export interface TaskLogListResponse {
  items: TaskLogEntry[]
  pagination?: {
    page: number
    pages: number
    per_page: number
    total: number
    has_next: boolean
    has_prev: boolean
  }
}

class TaskLogsApi {
  async getLogs(taskId: number, page = 1, pageSize = 50): Promise<TaskLogListResponse> {
    return await apiClient.get<TaskLogListResponse>(
      `/task-logs/?task_id=${taskId}&page=${page}&per_page=${pageSize}`
    )
  }

  async addComment(taskId: number, content: string): Promise<TaskLogEntry> {
    return await apiClient.post<TaskLogEntry>(
      '/task-logs/', { task_id: taskId, content, content_type: 'text/markdown' }
    )
  }
}

export const taskLogsApi = new TaskLogsApi()
