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
  /** 实际执行者（按步骤岗位要求路由分配） */
  agent_id?: number | null
  agent_name?: string | null
}

export interface GoalLoopStep {
  title: string
  content?: string
  /** 本步骤要求的执行岗位（可选，用于路由执行者） */
  role?: string
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
  /** 计划式拆解：规划器生成的有序步骤与进度 */
  plan?: GoalLoopStep[]
  plan_index?: number
  plan_revision?: number
  agent_name?: string
  agent_display_name?: string
  /** 指挥者（负责拆解与评审）；缺省时由执行 Agent 兼任 */
  director_agent_id?: number | null
  director_name?: string
  director_display_name?: string
  tasks: GoalLoopTask[]
}

export interface CreateGoalLoopPayload {
  title: string
  goal_text: string
  done_definition?: string
  rounds_limit?: number
  agent_id?: number | null
  director_agent_id?: number | null
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
