import { apiClient } from './client/index.js'

export interface DelegatableAgent {
  id: number
  name: string
  role?: string
  status: string
}

class TaskDelegationApi {
  async delegate(taskId: number, agentId: number): Promise<any> {
    return await apiClient.post(`/tasks/${taskId}/delegate`, { agent_id: agentId })
  }

  async reclaim(taskId: number): Promise<any> {
    return await apiClient.post(`/tasks/${taskId}/reclaim`)
  }

  async listAgents(workspaceId: number): Promise<DelegatableAgent[]> {
    const res = await apiClient.get(`/workspaces/${workspaceId}/delegatable-agents`)
    if (Array.isArray(res)) return res
    return (res as any)?.data || []
  }
}

export const taskDelegationApi = new TaskDelegationApi()
