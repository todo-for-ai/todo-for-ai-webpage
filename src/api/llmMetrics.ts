import { apiClient } from './client/index.js'

/** LLM API 调用指标（api-server services/llm_metrics.py） */

export interface LlmMetricsTotals {
  calls: number
  success: number
  failed: number
  timeout: number
  success_rate: number | null
  avg_duration_ms: number | null
  p50_duration_ms: number | null
  p95_duration_ms: number | null
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cache_read_tokens: number
  cost_usd: number | null
}

export interface LlmMetricsDayPoint {
  date: string
  calls: number
  total_tokens: number
  avg_duration_ms: number | null
}

export interface LlmMetricsAgentRow {
  agent_id: number | null
  agent_name: string
  calls: number
  total_tokens: number
  success_rate: number | null
  avg_duration_ms: number | null
}

export interface LlmMetricsModelRow {
  model: string
  calls: number
  total_tokens: number
}

export interface LlmMetricsFailureRow {
  created_at: string | null
  agent_id: number | null
  task_id: number | null
  engine: string
  model: string
  base_url: string
  status: string
  error_code: string | null
  error_message: string | null
}

export interface LlmMetricsSummary {
  window_hours: number
  totals: LlmMetricsTotals
  by_day: LlmMetricsDayPoint[]
  by_agent: LlmMetricsAgentRow[]
  by_model: LlmMetricsModelRow[]
  recent_failures: LlmMetricsFailureRow[]
}

/** LLM 调用指标 API：用户级 / 组织级 / 单 Agent 三视角 */
class LlmMetricsApi {
  /** 当前用户名下 Agent 的调用聚合 */
  mine(hours = 168): Promise<LlmMetricsSummary> {
    return apiClient.get(`/llm-metrics/mine?hours=${hours}`)
  }

  /** 组织（工作区）内全部 Agent 的调用聚合 */
  workspace(workspaceId: number, hours = 168): Promise<LlmMetricsSummary> {
    return apiClient.get(`/workspaces/${workspaceId}/llm-metrics?hours=${hours}`)
  }

  /** 单 Agent 的调用聚合 */
  agent(agentId: number, hours = 168): Promise<LlmMetricsSummary> {
    return apiClient.get(`/llm-metrics/agents/${agentId}?hours=${hours}`)
  }
}

export const llmMetricsApi = new LlmMetricsApi()
