import { apiClient } from './client/index.js'

export interface TaskDependencies {
  blocking: number[]
  blocked_by: number[]
}

class TaskDependenciesApi {
  async get(taskId: number): Promise<TaskDependencies> {
    return await apiClient.get<TaskDependencies>(`/tasks/${taskId}/dependencies`)
  }

  async update(taskId: number, data: Partial<TaskDependencies>): Promise<any> {
    return await apiClient.put(`/tasks/${taskId}/dependencies`, data)
  }
}

export const taskDependenciesApi = new TaskDependenciesApi()
