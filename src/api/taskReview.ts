/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client/index.js'

export interface ReviewTask {
  id: number
  title: string
  description?: string
  feedback_content?: string
  status: string
  creator_type?: string
  creator_identifier?: string
  updated_at: string
}

class TaskReviewApi {
  async listPending(workspaceId: number, page = 1, perPage = 10): Promise<{ items: ReviewTask[]; total: number }> {
    return await apiClient.get(`/workspaces/${workspaceId}/reviews/pending?page=${page}&per_page=${perPage}`)
  }

  async submitReview(taskId: number, decision: 'approve' | 'reject', comment?: string): Promise<any> {
    return await apiClient.post(`/tasks/${taskId}/review`, { decision, comment })
  }
}

export const taskReviewApi = new TaskReviewApi()
