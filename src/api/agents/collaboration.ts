export interface AgentCollaborator {
  agent_id: number
  name: string
  sent: number
  received: number
  total: number
}

export interface AgentCollaboratorsResult {
  collaborators: AgentCollaborator[]
  total_partners: number
}

export interface CollaborationGraphNode {
  id: number
  name: string
  kind?: string | null
  messages: number
  /** Agent 声誉分（0-100，可能为 null 表示未计算） */
  reputation?: number | null
}

export interface CollaborationGraphEdge {
  source: number
  target: number
  count: number
  /** source -> target 方向消息数（source 为较小 id 端） */
  source_to_target?: number
  /** target -> source 方向消息数 */
  target_to_source?: number
}

export interface CollaborationGraph {
  nodes: CollaborationGraphNode[]
  edges: CollaborationGraphEdge[]
  total_edges: number
}

/** 声誉历史单个变化点 */
export interface ReputationHistoryPoint {
  /** ISO 时间戳 */
  at: string | null
  /** 审计记录 ID */
  audit_id?: number
  /** 变化后的声誉分 */
  new_score?: number | null
  /** 本次分值增量 */
  score_delta?: number | null
  /** 质量反馈增量 */
  quality_delta?: number | null
  /** 该次任务是否成功 */
  success?: boolean | null
  /** 累计任务数 */
  total_tasks?: number | null
  /** 触发该次结果的来源任务 ID（若可回溯） */
  task_id?: number | null
  /** 工作流步骤键 */
  step_key?: string | null
  /** 工作流运行 ID */
  workflow_run_id?: number | null
  /** 父工作流运行 ID（子工作流场景） */
  parent_workflow_run_id?: number | null
  /** 子工作流运行 ID */
  sub_workflow_run_id?: number | null
  /** 任务耗时秒 */
  duration_sec?: number | null
}

export interface ReputationHistory {
  agent_id: number
  /** 当前最新声誉分 */
  current_score: number
  /** 时间升序的变化点列表 */
  points: ReputationHistoryPoint[]
}
