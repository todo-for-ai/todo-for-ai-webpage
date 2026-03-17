import { apiClient } from '../client/index.js'
import type {
  AgentActivityListResponse,
  AgentInteractionInsightListResponse,
  AgentProjectInsightListResponse,
  AgentTaskInsightListResponse,
  WorkspaceAgentActivityListResponse,
} from './insightsTypes'

export interface AgentActivityQuery {
  page?: number
  per_page?: number
  source?: string
  level?: string
  event_type?: string
  q?: string
  task_id?: number
  project_id?: number
  run_id?: string
  attempt_id?: string
  actor_type?: string
  min_risk_score?: number
  max_risk_score?: number
  from?: string
  to?: string
}

export interface AgentProjectQuery {
  page?: number
  per_page?: number
  search?: string
  sort_by?: 'project_id' | 'project_name' | 'touched_task_count' | 'committed_task_count' | 'interaction_log_count' | 'interaction_days' | 'submission_rate' | 'activity_score' | 'last_activity_at'
  sort_order?: 'asc' | 'desc'
}

export interface AgentInteractionQuery {
  page?: number
  per_page?: number
  search?: string
  min_interactions?: number
  max_interactions?: number
  min_tasks?: number
  max_tasks?: number
  from?: string
  to?: string
  sort_by?: 'user_id' | 'interaction_count' | 'task_count' | 'project_count' | 'last_interaction_at' | 'first_interaction_at'
  sort_order?: 'asc' | 'desc'
}

export interface AgentTaskInsightQuery {
  page?: number
  per_page?: number
  search?: string
  status?: string
  project_id?: number
}

export interface WorkspaceActivityQuery {
  page?: number
  per_page?: number
  agent_id?: number
  source?: string
  level?: string
  event_type?: string
  q?: string
  task_id?: number
  project_id?: number
  run_id?: string
  attempt_id?: string
  actor_type?: string
  min_risk_score?: number
  max_risk_score?: number
  from?: string
  to?: string
}

function buildQuery(params?: Record<string, any>) {
  const query = new URLSearchParams()
  if (!params) {
    return ''
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

export class AgentInsightsApi {
  async getActivity(workspaceId: number, agentId: number, params?: AgentActivityQuery) {
    const qs = buildQuery(params)
    return apiClient.get<AgentActivityListResponse>(`/workspaces/${workspaceId}/agents/${agentId}/insights/activity${qs}`)
  }

  async getProjects(workspaceId: number, agentId: number, params?: AgentProjectQuery) {
    const qs = buildQuery(params)
    return apiClient.get<AgentProjectInsightListResponse>(`/workspaces/${workspaceId}/agents/${agentId}/insights/projects${qs}`)
  }

  async getInteractions(workspaceId: number, agentId: number, params?: AgentInteractionQuery) {
    const qs = buildQuery(params)
    return apiClient.get<AgentInteractionInsightListResponse>(`/workspaces/${workspaceId}/agents/${agentId}/insights/interactions${qs}`)
  }

  async getTasks(workspaceId: number, agentId: number, params?: AgentTaskInsightQuery) {
    const qs = buildQuery(params)
    return apiClient.get<AgentTaskInsightListResponse>(`/workspaces/${workspaceId}/agents/${agentId}/insights/tasks${qs}`)
  }

  async getWorkspaceActivity(workspaceId: number, params?: WorkspaceActivityQuery) {
    const qs = buildQuery(params)
    return apiClient.get<WorkspaceAgentActivityListResponse>(`/workspaces/${workspaceId}/insights/activities${qs}`)
  }
}

export const agentInsightsApi = new AgentInsightsApi()
