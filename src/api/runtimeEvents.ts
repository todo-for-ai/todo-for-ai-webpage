import { apiClient } from './client/index.js'

export interface RuntimeEventItem {
  id: number
  attempt_id: string
  event_type: string
  seq: number
  message: string
  payload?: Record<string, any>
  event_timestamp?: string
}

export interface RuntimeEventsPage {
  task_id: number
  items: RuntimeEventItem[]
  last_id: number
}

export interface StopAgentResult {
  task_id: number
  attempt_id: string
  agent_id: number
  task_status?: string
  transport: 'ws_command' | 'lease_poll'
}

/**
 * 交互式会话 API：Agent 运行事件流（控制台）+ 停止执行
 */
class RuntimeEventsApi {
  async list(taskId: number, afterId = 0, limit = 200): Promise<RuntimeEventsPage> {
    return await apiClient.get(`/tasks/${taskId}/runtime-events?after_id=${afterId}&limit=${limit}`)
  }

  async stopAgent(taskId: number): Promise<StopAgentResult> {
    return await apiClient.post(`/tasks/${taskId}/agent/stop`)
  }
}

export const runtimeEventsApi = new RuntimeEventsApi()
