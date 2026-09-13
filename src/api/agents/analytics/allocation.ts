// 分析类型 · allocation（由 analytics-types.ts 按块原样迁移）
export interface TaskAllocationFairnessAgent {
  name: string
  total: number
  completed: number
  in_progress: number
  assigned: number
}

export interface TaskAllocationLorenzPoint {
  agent_percent: number
  task_percent: number
}

export interface TaskAllocationFairness {
  gini: number
  fairness_level: string
  agents: TaskAllocationFairnessAgent[]
  lorenz_curve: TaskAllocationLorenzPoint[]
  days: number
  total_tasks: number
}

// ── Agent handoff / skill matching ───────────────────────────────────

export interface AgentTaskHandoffPair {
  from_agent: string
  to_agent: string
  count: number
  avg_duration_seconds: number | null
}

export interface AgentTaskHandoffStats {
  handoffs: AgentTaskHandoffPair[]
  days: number
}

export interface SkillMatchCandidate {
  agent_id: number
  agent_name: string
  match_score: number
  matched_capabilities: string[]
}

export interface SkillMatchingTask {
  task_id: number
  task_title: string
  recommendations: SkillMatchCandidate[]
}

export interface AgentSkillMatching {
  tasks: SkillMatchingTask[]
}

// ── Channel activity / workload forecast ─────────────────────────────
