/**
 * GoalLoop 目标循环 API
 *
 * 后端：api/projects/routes_goal_loops.py
 * - GET/POST /projects/{pid}/goal-loops
 * - GET /projects/goal-loops/{id}
 * - POST /projects/goal-loops/{id}/pause|resume|stop|kick
 */
import { apiClient } from './index'

export interface GoalLoopTask {
  id: number
  title: string
  status: string | null
}

export interface GoalLoop {
  id: number
  project_id: number
  agent_id: number
  title: string
  goal_text: string
  done_definition: string | null
  status: string
  rounds_done?: number
  rounds_limit: number
  stall_count: number
  last_error: string | null
  completion_summary: string | null
  agent_name?: string
  agent_display_name?: string
  tasks: GoalLoopTask[]
}

export interface CreateGoalLoopPayload {
  title: string
  goal_text: string
  done_definition?: string
  rounds_limit?: number
  agent_id?: number | null
}

export const goalLoopApi = {
  async list(projectId: number): Promise<GoalLoop[]> {
    const resp = (await apiClient.get(`/projects/${projectId}/goal-loops`)) as any
    return resp?.goal_loops || resp?.data?.goal_loops || []
  },

  async create(projectId: number, payload: CreateGoalLoopPayload): Promise<GoalLoop> {
    const resp = (await apiClient.post(`/projects/${projectId}/goal-loops`, payload)) as any
    return resp?.data ?? resp
  },

  async detail(loopId: number): Promise<GoalLoop> {
    const resp = (await apiClient.get(`/projects/goal-loops/${loopId}`)) as any
    return resp?.data ?? resp
  },

  async action(loopId: number, action: 'pause' | 'resume' | 'stop' | 'kick'): Promise<GoalLoop> {
    const resp = (await apiClient.post(`/projects/goal-loops/${loopId}/${action}`)) as any
    return resp?.data?.loop ?? resp?.loop ?? resp?.data ?? resp
  },
}
