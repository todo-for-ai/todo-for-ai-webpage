import { apiClient } from './client/index.js'

export interface AgentPerformance {
  agent_id: number
  period_days: number
  tasks_completed: number
  tasks_total: number
  success_rate: number
  avg_duration_ms: number | null
  error_rate: number
  error_count: number
  daily_activity: { date: string; count: number }[]
}

class AgentPerformanceApi {
  async get(workspaceId: number, agentId: number, days = 30): Promise<AgentPerformance> {
    return await apiClient.get(`/workspaces/${workspaceId}/agents/${agentId}/performance?days=${days}`)
  }
}

export const agentPerformanceApi = new AgentPerformanceApi()
