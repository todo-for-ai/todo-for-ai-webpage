import { apiClient } from './client/index.js'

export interface TaskLabel {
  id: number
  owner_id?: number | null
  project_id?: number | null
  name: string
  color: string
  description?: string
  is_builtin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TaskLabelQueryParams {
  project_id?: number
  include_inactive?: boolean
}

export class TaskLabelsApi {
  async getTaskLabels(params?: TaskLabelQueryParams) {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }

    const url = `/task-labels${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<{ items: TaskLabel[] }>(url)
  }

  async createTaskLabel(data: {
    name: string
    project_id?: number
    color?: string
    description?: string
  }) {
    return apiClient.post<TaskLabel>('/task-labels', data)
  }

  async updateTaskLabel(
    labelId: number,
    data: {
      name?: string
      color?: string
      description?: string
      is_active?: boolean
    }
  ) {
    return apiClient.put<TaskLabel>(`/task-labels/${labelId}`, data)
  }

  async deleteTaskLabel(labelId: number) {
    return apiClient.delete(`/task-labels/${labelId}`)
  }
}

export const taskLabelsApi = new TaskLabelsApi()
