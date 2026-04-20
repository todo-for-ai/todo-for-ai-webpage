import { apiClient } from './client/index.js'

export type AgentRuntimeStatusValue = 'running' | 'idle' | 'busy' | 'error' | 'inactive'

export interface AgentRuntimeStatus {
  agent_id: string
  agent_name: string
  status: AgentRuntimeStatusValue
  active_tasks: number
  uptime_seconds: number
  last_heartbeat: string | null
  cpu_usage: number | null
  memory_usage: number | null
}

export interface WorkspaceHealthSummary {
  total_agents: number
  active_agents: number
  idle_agents: number
  error_agents: number
  agents: AgentRuntimeStatus[]
}

class AgentStatusApi {
  async getWorkspaceHealth(workspaceId: number): Promise<WorkspaceHealthSummary> {
    return await apiClient.get<WorkspaceHealthSummary>(
      `/workspaces/${workspaceId}/agents/health/summary`
    )
  }
}

export const agentStatusApi = new AgentStatusApi()
