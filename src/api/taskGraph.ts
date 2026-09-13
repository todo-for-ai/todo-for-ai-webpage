import { apiClient } from './client/index.js'

// 项目任务图（DAG）：节点/边/就绪态/环组
// 后端：GET /tasks/projects/<id>/task-graph（services/task_graph.py）
/** 指派对象：后端写侧为 {type,id,name}（routes_delegation），容忍历史脏数据 */
export interface TaskGraphAssignee {
  type?: string
  id?: number
  name?: string
}

export interface TaskGraphNode {
  id: number
  title: string
  status: string | null
  /** done / cancelled / blocked / ready（与派发依赖门同语义） */
  readiness: 'done' | 'cancelled' | 'blocked' | 'ready'
  priority: string | null
  is_ai_task: boolean
  epic_id: number | null
  assignees: Array<TaskGraphAssignee | number | string>
  /** 原样透出的 blocked_by 引用（可能含失效 id） */
  blocked_by: number[]
  /** 未解除（阻塞者未到终态）的依赖 id */
  unresolved_blockers: number[]
}

export interface TaskGraphEdge {
  from: number
  to: number
}

export interface TaskGraphData {
  project_id: number
  nodes: TaskGraphNode[]
  edges: TaskGraphEdge[]
  /** 成环的节点组（Tarjan SCC，大小>1 或自环） */
  cycles: number[][]
  stats: {
    total: number
    ready: number
    blocked: number
    done: number
    cancelled: number
  }
  truncated: boolean
}

export class TaskGraphApi {
  async getProjectTaskGraph(projectId: number): Promise<TaskGraphData> {
    // apiClient 自动剥后端 {code, data, message} 信封
    return apiClient.get<TaskGraphData>(`/tasks/projects/${projectId}/task-graph`)
  }
}

export const taskGraphApi = new TaskGraphApi()
