/**
 * Agent API — workflow-related type definitions.
 *
 * Workflow items, step runs, run console, triggers, versions, templates,
 * and all workflow analytics types (step stats, duration histograms, failure
 * rates, cofailure matrices, retry topology, etc.).
 */
import type { Task } from '../tasks'
import type {
  Agent,
  TaskAssignment,
  AgentRun,
  ConflictItem,
  SandboxExecutionItem,
} from './types'

// ── Workflow definition ──────────────────────────────────────────────

export interface WorkflowStepItem {
  id: number
  workflow_id: number
  step_key: string
  name: string
  description: string
  order: number
  required_capabilities: string[]
  agent_id?: number
  task_template_id?: number
  depends_on: string[]
  condition?: { step_key: string; operator: string; value?: string | boolean } | null
  sub_workflow_id?: number | null
  timeout_seconds?: number
  retry_count: number
  on_failure: string
}

export interface WorkflowItem {
  id: number
  owner_id: number
  name: string
  description: string
  version: number
  definition: Record<string, unknown>
  is_active: boolean
  max_parallel_steps?: number
  steps: WorkflowStepItem[]
  created_at: string
  updated_at: string
}

export interface CreateWorkflowStepData {
  step_key: string
  name?: string
  description?: string
  order?: number
  required_capabilities?: string[]
  agent_id?: number
  task_template_id?: number
  depends_on?: string[]
  condition?: { step_key: string; operator: string; value?: string | boolean } | null
  sub_workflow_id?: number | null
  timeout_seconds?: number
  retry_count?: number
  on_failure?: 'abort' | 'skip' | 'continue'
}

export interface CreateWorkflowData {
  name: string
  description?: string
  definition?: Record<string, unknown>
  is_active?: boolean
  max_parallel_steps?: number
  steps: CreateWorkflowStepData[]
}

// ── Workflow runs ────────────────────────────────────────────────────

export interface WorkflowStepRunItem {
  id: number
  run_id: number
  step_key: string
  name?: string
  depends_on?: string[]
  task_id?: number
  assignment_id?: number
  agent_id?: number
  status: string
  started_at?: string
  finished_at?: string
  error?: string
  attempt: number
  runtime_overrides?: Record<string, unknown>
}

export interface WorkflowRunItem {
  id: number
  workflow_id: number
  root_task_id?: number
  project_id: number
  owner_id: number
  status: string
  context: Record<string, unknown>
  error?: string
  started_at?: string
  finished_at?: string
  step_runs: WorkflowStepRunItem[]
  created_at: string
  updated_at: string
}

// ── Workflow run console ─────────────────────────────────────────────

export interface RunLogItem {
  id: number
  run_id: number
  level: string
  message: string
  created_at: string
}

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

// ── Workflow analytics — step stats ──────────────────────────────────

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

export interface WorkflowRunDurationBucket {
  date: string
  count: number
  p50: number
  p90: number
  p95: number
  median: number
  avg: number
}

export interface WorkflowRunDurationPercentiles {
  buckets: WorkflowRunDurationBucket[]
  total_runs: number
  total_avg_duration: number
}

export interface WorkflowStepFailureRateItem {
  step_key: string
  total: number
  failed: number
  failure_rate: number
}

export interface WorkflowStepFailureRate {
  items: WorkflowStepFailureRateItem[]
  total_steps: number
  total_failed: number
}

export interface WorkflowStepCofailureKey {
  step_key: string
  failures: number
}

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

// ── Workflow analytics — run trends ──────────────────────────────────

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

// ── Workflow analytics — failure correlation ─────────────────────────

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

// ── Workflow analytics — bottleneck / similarity ─────────────────────

export interface WorkflowStepBottleneckStep {
  step_key: string
  name: string
  depends_on: string[]
  avg_duration: number
  bottleneck_score: number
}

export interface WorkflowStepBottleneckAllStep {
  step_key: string
  name: string
  depends_on: string[]
  avg_duration: number
  is_on_critical_path: boolean
}

export interface WorkflowStepBottleneckWorkflow {
  workflow_id: number
  workflow_name: string
  critical_path: WorkflowStepBottleneckStep[]
  critical_path_duration: number
  all_steps: WorkflowStepBottleneckAllStep[]
  total_steps: number
  active_steps: number
}

export interface WorkflowStepDependencyBottleneck {
  workflows: WorkflowStepBottleneckWorkflow[]
}

export interface WorkflowSimilarityPair {
  run_a: number
  run_b: number
  similarity: number
  shared_steps: number
  unique_a: number
  unique_b: number
}

export interface WorkflowSimilarityWorkflow {
  workflow_id: number
  workflow_name: string
  run_count: number
  matrix: number[][]
  run_ids: number[]
  most_similar: WorkflowSimilarityPair[]
  least_similar: WorkflowSimilarityPair[]
}

export interface WorkflowSimilarityMatrix {
  workflows: WorkflowSimilarityWorkflow[]
  days: number
}

export interface StepDurationBucket {
  range: string
  count: number
}

export interface StepDurationHistogramStep {
  step_key: string
  buckets: StepDurationBucket[]
  total: number
}

export interface StepDurationHistogramResult {
  steps: StepDurationHistogramStep[]
  days: number
}

export interface StepBottleneckTimelineStep {
  step_key: string
  series: number[]
  avg_duration: number
  sample_count: number
  change_pct: number
}

export interface WorkflowStepBottleneckTimeline {
  steps: StepBottleneckTimelineStep[]
  days: number
  date_range: string[]
}

export interface WorkflowStructuralComplexityItem {
  workflow_id: number
  workflow_name: string
  version: number
  step_count: number
  max_depth: number
  total_edges: number
  avg_fan_in: number
  avg_fan_out: number
  root_count: number
  leaf_count: number
  parallelism_budget: number | null
}

export interface WorkflowStructuralComplexity {
  workflows: WorkflowStructuralComplexityItem[]
  total_workflows: number
  avg_steps: number
  avg_depth: number
}
