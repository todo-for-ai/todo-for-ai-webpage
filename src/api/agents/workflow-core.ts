import type { Pagination } from './common'
import type { Agent } from './agent'

// Workflow types

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

export interface SandboxExecutionItem {
  id: number
  sandbox_id: number
  agent_id?: number
  step_run_id?: number
  status: string
  policy_snapshot?: Record<string, unknown>
  started_at?: string
  ended_at?: string
  violations?: Array<Record<string, unknown>>
  termination_reason?: string
  error?: string
}

export interface RunLogItem {
  id: number
  run_id: number
  level: string
  message: string
  created_at: string
}
