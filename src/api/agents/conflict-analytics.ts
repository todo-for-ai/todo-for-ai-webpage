/** 冲突仪表盘聚合统计 */
export interface ConflictsDashboard {
  total: number
  active: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  by_severity: Record<string, number>
  resolution_latency?: {
    count: number
    avg_seconds: number | null
    median_seconds: number | null
    max_seconds: number | null
    by_bucket: { under_1h: number; '1h_to_24h': number; '1d_to_7d': number; over_7d: number }
  }
}

/** 冲突时间趋势单日桶 */
export interface ConflictsTrendBucket {
  date: string
  detected: number
  resolved: number
}

export interface ConflictsTrend {
  days: number
  trend: ConflictsTrendBucket[]
}

/** 冲突按 Agent 分布单项 */
export interface ConflictByAgentItem {
  agent_id: number
  name: string | null
  kind: string | null
  total: number
  active: number
}

export interface ConflictsByAgent {
  items: ConflictByAgentItem[]
}

/** 冲突解决策略效果单项 */
export interface ConflictStrategyStat {
  strategy: string
  uses: number
  with_task: number
  recurrences: number
  recurrence_rate: number
}

export interface ConflictsStrategyStats {
  items: ConflictStrategyStat[]
}

/** 沙盒违规时间趋势单日桶 */
export interface SandboxViolationTrendBucket {
  date: string
  count: number
}

export interface SandboxViolationTrend {
  days: number
  trend: SandboxViolationTrendBucket[]
  by_type: Record<string, number>
}

/** 沙盒违规按 Agent 分布单项 */
export interface SandboxViolationByAgentItem {
  agent_id: number
  name: string | null
  kind: string | null
  total: number
  by_type: Record<string, number>
}

export interface SandboxViolationsByAgent {
  days: number
  items: SandboxViolationByAgentItem[]
}

/** 沙盒模板使用统计单项 */
export interface SandboxTemplateUsageItem {
  template_key: string
  uses: number
  bound_to_agent: number
}

export interface SandboxTemplateUsage {
  items: SandboxTemplateUsageItem[]
