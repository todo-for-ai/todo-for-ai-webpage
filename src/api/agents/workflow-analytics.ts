import type { Agent } from './agent'
import type { TaskAssignment, RunLogItem } from './assignment'
import type { WorkflowStepRunItem, WorkflowRunItem, SandboxExecutionItem } from './workflow-core'
import type { ConflictItem } from './conflict'

export interface WorkflowRunConsoleStep {
  step_run: WorkflowStepRunItem
  effective_params: Record<string, unknown>
  sandbox_execution?: SandboxExecutionItem | null
  sandbox_policy?: Record<string, unknown> | null
  recent_logs: RunLogItem[]
  duration_seconds?: number | null
}

export interface WorkflowRunConsoleSummary {
  total_steps: number
  status_counts: Record<string, number>
  progress_percent: number
  running_count: number
  failed_count: number
  pending_count: number
}

export interface WorkflowRunConsoleResult {
  workflow_run: WorkflowRunItem
  steps: WorkflowRunConsoleStep[]
  conflicts: ConflictItem[]
  summary: WorkflowRunConsoleSummary
}

/** 工作流步骤执行统计单项（按 step_key 聚合） */
export interface WorkflowStepStat {
  step_key: string
  total: number
  succeeded: number
  failed: number
  skipped: number
  success_rate: number
  avg_duration_seconds: number | null
  sample_size_duration: number
  retries: number
  avg_retries: number
}

export interface WorkflowStepStats {
  items: WorkflowStepStat[]
}

/** 步骤耗时分布直方图单项 */
export interface WorkflowStepDurationHistogramItem {
  step_key: string
  sample_size: number
  bins: Record<string, number>
  median_seconds: number
  p95_seconds: number
  min_seconds: number
  max_seconds: number
}

export interface WorkflowStepDurationHistogram {
  items: WorkflowStepDurationHistogramItem[]
  bin_labels: string[]
}

/** 工作流运行时长分位数日桶 */
export interface WorkflowRunDurationBucket {
  date: string
  count: number
  p50: number
  p90: number
  p95: number
  median: number
  avg: number
}

/** 工作流运行时长分位数趋势 */
export interface WorkflowRunDurationPercentiles {
  buckets: WorkflowRunDurationBucket[]
  total_runs: number
  total_avg_duration: number
}

/** 工作流步骤失败率条目 */
export interface WorkflowStepFailureRateItem {
  step_key: string
  total: number
  failed: number
  failure_rate: number
}

/** 工作流步骤失败率排行 */
export interface WorkflowStepFailureRate {
  items: WorkflowStepFailureRateItem[]
  total_steps: number
  total_failed: number
}

/** 步骤共失败矩阵条目 */
export interface WorkflowStepCofailureKey {
  step_key: string
  failures: number
}

/** 步骤共失败矩阵 */
export interface WorkflowStepCofailureMatrix {
  step_keys: WorkflowStepCofailureKey[]
  matrix: Record<string, Record<string, number>>
  max_cofailure: number
  total_runs_with_multi_failure: number
}

export interface WorkflowStepRetryItem {
  step_key: string
  total_runs: number
  retries: number
  retry_rate: number
  first_attempt_success_rate: number
  retry_success_rate: number
}

export interface WorkflowStepRetryTopology {
  days: number
  steps: WorkflowStepRetryItem[]
  total_retries: number
}

export interface WorkflowStepHourlyItem {
  step_key: string
  total: number
  hours: Record<string, number>
  peak_hour: number | null
  business_hours_ratio: number
}

export interface WorkflowStepHourlyDistribution {
  days: number
  steps: WorkflowStepHourlyItem[]
}

/** 失败步骤按耗时排行单项 */
export interface WorkflowFailedStepByDuration {
  step_key: string
  failures: number
  avg_duration_seconds: number
  median_duration_seconds: number
  max_duration_seconds: number
}

export interface WorkflowFailedStepsByDuration {
  days: number
  total_failed_steps: number
  items: WorkflowFailedStepByDuration[]
}

/** 工作流运行结果趋势单日桶 */
export interface WorkflowRunTrendBucket {
  date: string
  succeeded: number
  failed: number
  failed_steps: number
}

export interface WorkflowRunTrend {
  days: number
  trend: WorkflowRunTrendBucket[]
  total_succeeded: number
  total_failed: number
  total_failed_steps: number
}

export interface WorkflowSuccessRateItem {
  workflow_id: number
  name: string
  total: number
  succeeded: number
  failed: number
  cancelled: number
  success_rate: number
  avg_duration: number
}

export interface WorkflowSuccessRateByWorkflow {
  workflows: WorkflowSuccessRateItem[]
}

/** 失败步骤与冲突/沙盒违规的跨维度关联 */
export interface WorkflowFailureCorrelationAgent {
  agent_id: number
  name: string
  failed_steps: number
  with_conflict: number
  with_violation: number
}

export interface WorkflowFailureCorrelation {
  days: number
  window_hours: number
  total_failed_steps: number
  with_conflict: number
  with_violation: number
  with_both: number
  conflict_rate: number
  violation_rate: number
  both_rate: number
  top_agents: WorkflowFailureCorrelationAgent[]
}

export interface WorkflowFailureCorrelationByStepItem {
  step_key: string
  failed: number
  with_conflict: number
  with_violation: number
  conflict_rate: number
  violation_rate: number
  conflict_types: Record<string, number>
}

export interface WorkflowFailureCorrelationByStep {
  days: number
  window_hours: number
  items: WorkflowFailureCorrelationByStepItem[]
  step_conflict_type_matrix: Record<string, Record<string, number>>
}
