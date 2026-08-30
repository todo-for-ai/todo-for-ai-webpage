/**
 * Agent API — workflow methods mixin.
 *
 * Workflow CRUD, runs, triggers, versions, templates, and all
 * workflow analytics methods.
 */
import type { ApiClient } from '../client/index.js'
import type { ListResult, Agent } from './types'
import type {
  WorkflowItem,
  CreateWorkflowData,
  WorkflowRunItem,
  WorkflowStepStats,
  WorkflowStepDurationHistogram,
  WorkflowRunDurationPercentiles,
  WorkflowStepFailureRate,
  WorkflowStepCofailureMatrix,
  WorkflowStepRetryTopology,
  WorkflowStepHourlyDistribution,
  WorkflowFailedStepsByDuration,
  WorkflowRunTrend,
  WorkflowSuccessRateByWorkflow,
  WorkflowFailureCorrelation,
  WorkflowFailureCorrelationByStep,
  WorkflowRunConsoleResult,
  WorkflowStepDependencyBottleneck,
  WorkflowSimilarityMatrix,
  StepDurationHistogramResult,
  WorkflowStepBottleneckTimeline,
  WorkflowStructuralComplexity,
} from './workflow-types'
import { unwrapData, unwrapList, buildQuery } from './helpers'

export interface WorkflowMethods {
  getWorkflows(params?: { is_active?: boolean; page?: number; per_page?: number }): Promise<ListResult<WorkflowItem>>
  getWorkflow(id: number): Promise<WorkflowItem>
  createWorkflow(data: CreateWorkflowData): Promise<WorkflowItem>
  updateWorkflow(id: number, data: Partial<CreateWorkflowData>): Promise<WorkflowItem>
  deleteWorkflow(id: number): Promise<void>
  launchWorkflow(workflowId: number, data: { project_id: number; root_task_id?: number; context?: Record<string, unknown> }): Promise<WorkflowRunItem>
  getWorkflowRuns(params?: { workflow_id?: number; status?: string; page?: number; per_page?: number }): Promise<ListResult<WorkflowRunItem>>
  getWorkflowStepStats(limit?: number): Promise<WorkflowStepStats>
  getWorkflowStepDurationHistogram(limit?: number): Promise<WorkflowStepDurationHistogram>
  getWorkflowRunDurationPercentiles(days?: number): Promise<WorkflowRunDurationPercentiles>
  getWorkflowStepFailureRate(days?: number, limit?: number): Promise<WorkflowStepFailureRate>
  getWorkflowStepCofailureMatrix(days?: number, limit?: number): Promise<WorkflowStepCofailureMatrix>
  getWorkflowStepRetryTopology(days?: number, limit?: number): Promise<WorkflowStepRetryTopology>
  getWorkflowStepHourlyDistribution(days?: number, limit?: number): Promise<WorkflowStepHourlyDistribution>
  getWorkflowFailedStepsByDuration(days?: number, limit?: number): Promise<WorkflowFailedStepsByDuration>
  getWorkflowRunTrend(days?: number): Promise<WorkflowRunTrend>
  getWorkflowSuccessRateByWorkflow(days?: number, limit?: number): Promise<WorkflowSuccessRateByWorkflow>
  getWorkflowFailureCorrelation(days?: number, windowHours?: number): Promise<WorkflowFailureCorrelation>
  getWorkflowFailureCorrelationByStep(days?: number, windowHours?: number): Promise<WorkflowFailureCorrelationByStep>
  getWorkflowRun(runId: number): Promise<WorkflowRunItem>
  getWorkflowRunConsole(runId: number, params?: { log_limit?: number }): Promise<WorkflowRunConsoleResult>
  cancelWorkflowRun(runId: number): Promise<WorkflowRunItem>
  pauseWorkflowRun(runId: number): Promise<WorkflowRunItem>
  resumeWorkflowRun(runId: number): Promise<WorkflowRunItem>
  retryWorkflowRun(runId: number): Promise<WorkflowRunItem>
  completeWorkflowStep(runId: number, stepKey: string, data: { success?: boolean; error?: string }): Promise<WorkflowRunItem>
  getWorkflowTriggers(params?: { workflow_id?: number; is_active?: boolean; page?: number; per_page?: number }): Promise<ListResult<unknown>>
  createWorkflowTrigger(data: { workflow_id: number; name: string; cron_expr?: string; one_shot_at?: string; is_active?: boolean; project_id?: number; root_task_id?: number; context_override?: Record<string, unknown> }): Promise<unknown>
  updateWorkflowTrigger(triggerId: number, data: { name?: string; cron_expr?: string; one_shot_at?: string; is_active?: boolean; project_id?: number; root_task_id?: number; context_override?: Record<string, unknown> }): Promise<unknown>
  deleteWorkflowTrigger(triggerId: number): Promise<void>
  fireDueTriggers(): Promise<{ fired_count: number; fired: unknown[] }>
  getWorkflowTemplates(params?: { category?: string }): Promise<unknown[]>
  getWorkflowTemplate(templateKey: string): Promise<unknown>
  instantiateWorkflowTemplate(templateKey: string, data?: { name?: string; project_id?: number; root_task_id?: number }): Promise<unknown>
  listWorkflowVersions(workflowId: number): Promise<unknown>
  getWorkflowVersion(workflowId: number, versionNumber: number): Promise<unknown>
  rollbackWorkflow(workflowId: number, version: number): Promise<unknown>
  diffWorkflowVersions(workflowId: number, v1: number, v2: number): Promise<unknown>
  getWorkflowStepDependencyBottleneck(days?: number, limit?: number): Promise<WorkflowStepDependencyBottleneck>
  getWorkflowSimilarityMatrix(days?: number, limit?: number, maxRuns?: number): Promise<WorkflowSimilarityMatrix>
  getStepDurationHistogram(days?: number): Promise<StepDurationHistogramResult>
  getWorkflowStepBottleneckTimeline(days?: number, limit?: number): Promise<WorkflowStepBottleneckTimeline>
  getWorkflowStructuralComplexity(limit?: number): Promise<WorkflowStructuralComplexity>
}

export function createWorkflowMethods(apiClient: ApiClient): WorkflowMethods {
  return {
    async getWorkflows(params?: { is_active?: boolean; page?: number; per_page?: number }): Promise<ListResult<WorkflowItem>> {
      const response = await apiClient.get(`/agents/workflows${buildQuery(params)}`)
      return unwrapList<WorkflowItem>(response)
    },

    async getWorkflow(id: number): Promise<WorkflowItem> {
      return unwrapData<WorkflowItem>(await apiClient.get(`/agents/workflows/${id}`))
    },

    async createWorkflow(data: CreateWorkflowData): Promise<WorkflowItem> {
      return unwrapData<WorkflowItem>(await apiClient.post('/agents/workflows', data))
    },

    async updateWorkflow(id: number, data: Partial<CreateWorkflowData>): Promise<WorkflowItem> {
      return unwrapData<WorkflowItem>(await apiClient.put(`/agents/workflows/${id}`, data))
    },

    async deleteWorkflow(id: number): Promise<void> {
      await apiClient.delete(`/agents/workflows/${id}`)
    },

    async launchWorkflow(workflowId: number, data: { project_id: number; root_task_id?: number; context?: Record<string, unknown> }): Promise<WorkflowRunItem> {
      return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflows/${workflowId}/launch`, data))
    },

    async getWorkflowRuns(params?: { workflow_id?: number; status?: string; page?: number; per_page?: number }): Promise<ListResult<WorkflowRunItem>> {
      const response = await apiClient.get(`/agents/workflow-runs${buildQuery(params)}`)
      return unwrapList<WorkflowRunItem>(response)
    },

    async getWorkflowStepStats(limit = 30): Promise<WorkflowStepStats> {
      return unwrapData<WorkflowStepStats>(await apiClient.get(`/agents/workflow-analytics/step-stats${buildQuery({ limit })}`))
    },

    async getWorkflowStepDurationHistogram(limit = 10): Promise<WorkflowStepDurationHistogram> {
      return unwrapData<WorkflowStepDurationHistogram>(await apiClient.get(`/agents/workflow-analytics/step-duration-histogram${buildQuery({ limit })}`))
    },

    async getWorkflowRunDurationPercentiles(days = 30): Promise<WorkflowRunDurationPercentiles> {
      return unwrapData<WorkflowRunDurationPercentiles>(await apiClient.get(`/agents/workflow-analytics/run-duration-percentiles${buildQuery({ days })}`))
    },

    async getWorkflowStepFailureRate(days = 30, limit = 15): Promise<WorkflowStepFailureRate> {
      return unwrapData<WorkflowStepFailureRate>(await apiClient.get(`/agents/workflow-analytics/step-failure-rate${buildQuery({ days, limit })}`))
    },

    async getWorkflowStepCofailureMatrix(days = 30, limit = 8): Promise<WorkflowStepCofailureMatrix> {
      return unwrapData<WorkflowStepCofailureMatrix>(await apiClient.get(`/agents/workflow-analytics/step-cofailure-matrix${buildQuery({ days, limit })}`))
    },

    async getWorkflowStepRetryTopology(days = 30, limit = 15): Promise<WorkflowStepRetryTopology> {
      return unwrapData<WorkflowStepRetryTopology>(await apiClient.get(`/agents/workflow-analytics/step-retry-topology${buildQuery({ days, limit })}`))
    },

    async getWorkflowStepHourlyDistribution(days = 30, limit = 10): Promise<WorkflowStepHourlyDistribution> {
      return unwrapData<WorkflowStepHourlyDistribution>(await apiClient.get(`/agents/workflow-analytics/step-hourly-distribution${buildQuery({ days, limit })}`))
    },

    async getWorkflowFailedStepsByDuration(days = 30, limit = 20): Promise<WorkflowFailedStepsByDuration> {
      return unwrapData<WorkflowFailedStepsByDuration>(await apiClient.get(`/agents/workflow-analytics/failed-steps-by-duration${buildQuery({ days, limit })}`))
    },

    async getWorkflowRunTrend(days = 30): Promise<WorkflowRunTrend> {
      return unwrapData<WorkflowRunTrend>(await apiClient.get(`/agents/workflow-analytics/run-trend${buildQuery({ days })}`))
    },

    async getWorkflowSuccessRateByWorkflow(days = 30, limit = 10): Promise<WorkflowSuccessRateByWorkflow> {
      return unwrapData<WorkflowSuccessRateByWorkflow>(await apiClient.get(`/agents/workflow-analytics/success-rate-by-workflow${buildQuery({ days, limit })}`))
    },

    async getWorkflowFailureCorrelation(days = 30, windowHours = 2): Promise<WorkflowFailureCorrelation> {
      return unwrapData<WorkflowFailureCorrelation>(await apiClient.get(`/agents/workflow-analytics/failure-correlation${buildQuery({ days, window_hours: windowHours })}`))
    },

    async getWorkflowFailureCorrelationByStep(days = 30, windowHours = 2): Promise<WorkflowFailureCorrelationByStep> {
      return unwrapData<WorkflowFailureCorrelationByStep>(await apiClient.get(`/agents/workflow-analytics/failure-correlation-by-step${buildQuery({ days, window_hours: windowHours })}`))
    },

    async getWorkflowRun(runId: number): Promise<WorkflowRunItem> {
      return unwrapData<WorkflowRunItem>(await apiClient.get(`/agents/workflow-runs/${runId}`))
    },

    async getWorkflowRunConsole(runId: number, params?: { log_limit?: number }): Promise<WorkflowRunConsoleResult> {
      return unwrapData<WorkflowRunConsoleResult>(await apiClient.get(`/agents/workflow-runs/${runId}/console${buildQuery(params)}`))
    },

    async cancelWorkflowRun(runId: number): Promise<WorkflowRunItem> {
      return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/cancel`))
    },

    async pauseWorkflowRun(runId: number): Promise<WorkflowRunItem> {
      return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/pause`))
    },

    async resumeWorkflowRun(runId: number): Promise<WorkflowRunItem> {
      return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/resume`))
    },

    async retryWorkflowRun(runId: number): Promise<WorkflowRunItem> {
      return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/retry`))
    },

    async completeWorkflowStep(runId: number, stepKey: string, data: { success?: boolean; error?: string }): Promise<WorkflowRunItem> {
      return unwrapData<WorkflowRunItem>(await apiClient.post(`/agents/workflow-runs/${runId}/steps/${stepKey}/complete`, data))
    },

    async getWorkflowTriggers(params?: { workflow_id?: number; is_active?: boolean; page?: number; per_page?: number }): Promise<ListResult<unknown>> {
      const response = await apiClient.get(`/agents/workflow-triggers${buildQuery(params)}`)
      return unwrapList<unknown>(response)
    },

    async createWorkflowTrigger(data: { workflow_id: number; name: string; cron_expr?: string; one_shot_at?: string; is_active?: boolean; project_id?: number; root_task_id?: number; context_override?: Record<string, unknown> }): Promise<unknown> {
      return unwrapData(await apiClient.post('/agents/workflow-triggers', data))
    },

    async updateWorkflowTrigger(triggerId: number, data: { name?: string; cron_expr?: string; one_shot_at?: string; is_active?: boolean; project_id?: number; root_task_id?: number; context_override?: Record<string, unknown> }): Promise<unknown> {
      return unwrapData(await apiClient.put(`/agents/workflow-triggers/${triggerId}`, data))
    },

    async deleteWorkflowTrigger(triggerId: number): Promise<void> {
      await apiClient.delete(`/agents/workflow-triggers/${triggerId}`)
    },

    async fireDueTriggers(): Promise<{ fired_count: number; fired: unknown[] }> {
      return unwrapData(await apiClient.post('/agents/workflow-triggers/fire-due'))
    },

    async getWorkflowTemplates(params?: { category?: string }): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/workflow-templates${buildQuery(params)}`))
    },

    async getWorkflowTemplate(templateKey: string): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/workflow-templates/${templateKey}`))
    },

    async instantiateWorkflowTemplate(templateKey: string, data?: { name?: string; project_id?: number; root_task_id?: number }): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/workflow-templates/${templateKey}/instantiate`, data))
    },

    async listWorkflowVersions(workflowId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/workflows/${workflowId}/versions`))
    },

    async getWorkflowVersion(workflowId: number, versionNumber: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/workflows/${workflowId}/versions/${versionNumber}`))
    },

    async rollbackWorkflow(workflowId: number, version: number): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/workflows/${workflowId}/versions/${version}/rollback`))
    },

    async diffWorkflowVersions(workflowId: number, v1: number, v2: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/workflows/${workflowId}/versions/diff${buildQuery({ v1, v2 })}`))
    },

    async getWorkflowStepDependencyBottleneck(days = 30, limit = 10): Promise<WorkflowStepDependencyBottleneck> {
      return unwrapData<WorkflowStepDependencyBottleneck>(await apiClient.get(`/agents/workflow-analytics/step-dependency-bottleneck${buildQuery({ days, limit })}`))
    },

    async getWorkflowSimilarityMatrix(days = 30, limit = 5, maxRuns = 20): Promise<WorkflowSimilarityMatrix> {
      return unwrapData<WorkflowSimilarityMatrix>(await apiClient.get(`/agents/workflow-analytics/similarity-matrix${buildQuery({ days, limit, max_runs: maxRuns })}`))
    },

    async getStepDurationHistogram(days = 30): Promise<StepDurationHistogramResult> {
      return unwrapData<StepDurationHistogramResult>(await apiClient.get(`/agents/workflow-analytics/step-duration-histogram-v2${buildQuery({ days })}`))
    },

    async getWorkflowStepBottleneckTimeline(days = 30, limit = 8): Promise<WorkflowStepBottleneckTimeline> {
      return unwrapData<WorkflowStepBottleneckTimeline>(await apiClient.get(`/agents/workflow-analytics/step-bottleneck-timeline${buildQuery({ days, limit })}`))
    },

    async getWorkflowStructuralComplexity(limit = 20): Promise<WorkflowStructuralComplexity> {
      return unwrapData<WorkflowStructuralComplexity>(await apiClient.get(`/agents/workflow-analytics/structural-complexity${buildQuery({ limit })}`))
    },
  }
}
