import { apiClient } from './client/index.js'

export interface TaskHistoryEntry {
  id: number
  task_id: number
  action: string
  field_name: string | null
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
  comment: string | null
}

class TaskHistoryApi {
  async getHistory(taskId: number): Promise<TaskHistoryEntry[]> {
    return await apiClient.get<TaskHistoryEntry[]>(`/tasks/${taskId}/history`)
  }
}

export const taskHistoryApi = new TaskHistoryApi()
