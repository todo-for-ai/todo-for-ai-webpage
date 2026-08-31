import { apiClient } from './client/index.js'

export interface ChatMessage {
  id: number
  task_id: number
  actor_type: 'HUMAN' | 'AGENT' | 'SYSTEM'
  actor_user_id?: number
  actor_agent_id?: number
  content: string
  content_type: string
  parent_id?: number
  replies?: ChatMessage[]
  created_at: string
}

class TaskChatApi {
  async getMessages(taskId: number, page = 1, perPage = 20): Promise<{ items: ChatMessage[]; total: number; page: number }> {
    return await apiClient.get(`/tasks/${taskId}/chat?page=${page}&per_page=${perPage}`)
  }

  async sendMessage(taskId: number, content: string, parentId?: number): Promise<ChatMessage> {
    return await apiClient.post(`/tasks/${taskId}/chat`, { content, parent_id: parentId })
  }
}

export const taskChatApi = new TaskChatApi()
