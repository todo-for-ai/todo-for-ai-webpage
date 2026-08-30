/**
 * Agent API — sandbox, conflict, security, and orchestration methods mixin.
 */
import type { ApiClient } from '../client/index.js'
import type { ListResult } from './types'
import type {
  SandboxViolationTrend,
  SandboxViolationsByAgent,
  SandboxTemplateUsage,
  ConflictsDashboard,
  ConflictsTrend,
  ConflictsByAgent,
  ConflictsStrategyStats,
  SecurityDailyTrend,
  SecurityByAgent,
  OrchestrationResult,
  OrchestratorStatus,
  OrchestratorHistoryResult,
  OrchestratorDailyTrend,
  ReputationHistory,
  SecurityEventItem,
} from './sandbox-conflict-types'
import { unwrapData, unwrapList, buildQuery } from './helpers'

export interface SandboxConflictMethods {
  listSandboxes(params?: Record<string, string>): Promise<unknown>
  createSandbox(data: Record<string, unknown>): Promise<unknown>
  getSandbox(sandboxId: number): Promise<unknown>
  updateSandbox(sandboxId: number, data: Record<string, unknown>): Promise<unknown>
  deleteSandbox(sandboxId: number): Promise<unknown>
  bindAgentSandbox(agentId: number, sandboxId: number): Promise<unknown>
  getAgentSandbox(agentId: number): Promise<unknown>
  checkSandboxAction(sandboxId: number, action: string, target: string): Promise<unknown>
  startSandboxExecution(sandboxId: number, data: Record<string, unknown>): Promise<unknown>
  completeSandboxExecution(executionId: number, data: Record<string, unknown>): Promise<unknown>
  revokeSandboxExecution(executionId: number): Promise<unknown>
  reportSandboxViolation(executionId: number, data: Record<string, unknown>): Promise<unknown>
  getSandboxExecution(executionId: number): Promise<unknown>
  listSandboxExecutions(sandboxId: number, params?: Record<string, string>): Promise<unknown>
  getSandboxDashboard(): Promise<unknown>
  getSandboxViolationTrend(days?: number): Promise<SandboxViolationTrend>
  getSandboxViolationsByAgent(days?: number, limit?: number): Promise<SandboxViolationsByAgent>
  getSandboxTemplateUsage(): Promise<SandboxTemplateUsage>
  getStepSandboxExecution(runId: number, stepKey: string): Promise<unknown>
  reportStepSandboxViolation(runId: number, stepKey: string, data: Record<string, unknown>): Promise<unknown>
  setStepRuntimeOverride(runId: number, stepKey: string, data: Record<string, unknown>): Promise<unknown>
  clearStepRuntimeOverride(runId: number, stepKey: string): Promise<unknown>
  getStepEffectiveParams(runId: number, stepKey: string): Promise<unknown>
  listSandboxTemplates(): Promise<unknown>
  instantiateSandboxTemplate(templateKey: string, data: Record<string, unknown>): Promise<unknown>
  scanConflicts(): Promise<unknown>
  listConflicts(params?: Record<string, string>): Promise<unknown>
  getConflict(conflictId: number): Promise<unknown>
  resolveConflict(conflictId: number, strategy: string, description?: string): Promise<unknown>
  acknowledgeConflict(conflictId: number): Promise<unknown>
  ignoreConflict(conflictId: number): Promise<unknown>
  getConflictsDashboard(): Promise<ConflictsDashboard>
  getConflictsTrend(days?: number): Promise<ConflictsTrend>
  getConflictsByAgent(limit?: number): Promise<ConflictsByAgent>
  getConflictsStrategyStats(): Promise<ConflictsStrategyStats>
  autoResolveConflicts(): Promise<unknown>
  getSecurityEvents(params?: Record<string, unknown>): Promise<ListResult<SecurityEventItem>>
  exportSecurityEvents(params?: Record<string, unknown>): Promise<string>
  getSecurityEventsDailyTrend(params?: Record<string, unknown>): Promise<SecurityDailyTrend>
  getSecurityEventsByAgent(params?: Record<string, unknown>): Promise<SecurityByAgent>
  orchestrate(): Promise<OrchestrationResult>
  getOrchestratorStatus(): Promise<OrchestratorStatus>
  listOrchestratorHistory(params?: { limit?: number; triggered_by?: string }): Promise<OrchestratorHistoryResult>
  getOrchestratorDailyTrend(params?: { triggered_by?: string; since?: string; until?: string }): Promise<OrchestratorDailyTrend>
  getAgentReputation(agentId: number): Promise<unknown>
  listReputations(): Promise<unknown[]>
  recalculateReputation(agentId: number): Promise<unknown>
  getAgentReputationHistory(agentId: number, params?: { since?: string; until?: string; limit?: number }): Promise<ReputationHistory>
}

export function createSandboxConflictMethods(apiClient: ApiClient): SandboxConflictMethods {
  return {
    async listSandboxes(params?: Record<string, string>): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/sandboxes${buildQuery(params)}`))
    },

    async createSandbox(data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post('/agents/sandboxes', data))
    },

    async getSandbox(sandboxId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/sandboxes/${sandboxId}`))
    },

    async updateSandbox(sandboxId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.put(`/agents/sandboxes/${sandboxId}`, data))
    },

    async deleteSandbox(sandboxId: number): Promise<unknown> {
      return unwrapData(await apiClient.delete(`/agents/sandboxes/${sandboxId}`))
    },

    async bindAgentSandbox(agentId: number, sandboxId: number): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/sandbox/${sandboxId}/bind`))
    },

    async getAgentSandbox(agentId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/${agentId}/sandbox`))
    },

    async checkSandboxAction(sandboxId: number, action: string, target: string): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/sandboxes/${sandboxId}/check`, { action, target }))
    },

    async startSandboxExecution(sandboxId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/sandboxes/${sandboxId}/executions`, data))
    },

    async completeSandboxExecution(executionId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/sandbox-executions/${executionId}/complete`, data))
    },

    async revokeSandboxExecution(executionId: number): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/sandbox-executions/${executionId}/revoke`))
    },

    async reportSandboxViolation(executionId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/sandbox-executions/${executionId}/violation`, data))
    },

    async getSandboxExecution(executionId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/sandbox-executions/${executionId}`))
    },

    async listSandboxExecutions(sandboxId: number, params?: Record<string, string>): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/sandboxes/${sandboxId}/executions${buildQuery(params)}`))
    },

    async getSandboxDashboard(): Promise<unknown> {
      return unwrapData(await apiClient.get('/agents/sandbox-dashboard'))
    },

    async getSandboxViolationTrend(days = 30): Promise<SandboxViolationTrend> {
      return unwrapData<SandboxViolationTrend>(await apiClient.get(`/agents/sandbox-analytics/violation-trend${buildQuery({ days })}`))
    },

    async getSandboxViolationsByAgent(days = 30, limit = 10): Promise<SandboxViolationsByAgent> {
      return unwrapData<SandboxViolationsByAgent>(await apiClient.get(`/agents/sandbox-analytics/violations-by-agent${buildQuery({ days, limit })}`))
    },

    async getSandboxTemplateUsage(): Promise<SandboxTemplateUsage> {
      return unwrapData<SandboxTemplateUsage>(await apiClient.get('/agents/sandbox-analytics/template-usage'))
    },

    async getStepSandboxExecution(runId: number, stepKey: string): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/workflow-runs/${runId}/steps/${stepKey}/sandbox-execution`))
    },

    async reportStepSandboxViolation(runId: number, stepKey: string, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/workflow-runs/${runId}/steps/${stepKey}/sandbox-violation`, data))
    },

    async setStepRuntimeOverride(runId: number, stepKey: string, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/workflow-runs/${runId}/steps/${stepKey}/runtime-override`, data))
    },

    async clearStepRuntimeOverride(runId: number, stepKey: string): Promise<unknown> {
      return unwrapData(await apiClient.delete(`/agents/workflow-runs/${runId}/steps/${stepKey}/runtime-override`))
    },

    async getStepEffectiveParams(runId: number, stepKey: string): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/workflow-runs/${runId}/steps/${stepKey}/effective-params`))
    },

    async listSandboxTemplates(): Promise<unknown> {
      return unwrapData(await apiClient.get('/agents/sandbox-templates'))
    },

    async instantiateSandboxTemplate(templateKey: string, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/sandbox-templates/${templateKey}/instantiate`, data))
    },

    async scanConflicts(): Promise<unknown> {
      return unwrapData(await apiClient.post('/agents/conflicts/scan'))
    },

    async listConflicts(params?: Record<string, string>): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/conflicts${buildQuery(params)}`))
    },

    async getConflict(conflictId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/conflicts/${conflictId}`))
    },

    async resolveConflict(conflictId: number, strategy: string, description?: string): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/conflicts/${conflictId}/resolve`, { strategy, description }))
    },

    async acknowledgeConflict(conflictId: number): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/conflicts/${conflictId}/acknowledge`))
    },

    async ignoreConflict(conflictId: number): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/conflicts/${conflictId}/ignore`))
    },

    async getConflictsDashboard(): Promise<ConflictsDashboard> {
      return unwrapData<ConflictsDashboard>(await apiClient.get('/agents/conflicts/dashboard'))
    },

    async getConflictsTrend(days = 30): Promise<ConflictsTrend> {
      return unwrapData<ConflictsTrend>(await apiClient.get(`/agents/conflicts-analytics/trend${buildQuery({ days })}`))
    },

    async getConflictsByAgent(limit = 10): Promise<ConflictsByAgent> {
      return unwrapData<ConflictsByAgent>(await apiClient.get(`/agents/conflicts-analytics/by-agent${buildQuery({ limit })}`))
    },

    async getConflictsStrategyStats(): Promise<ConflictsStrategyStats> {
      return unwrapData<ConflictsStrategyStats>(await apiClient.get('/agents/conflicts-analytics/strategy-stats'))
    },

    async autoResolveConflicts(): Promise<unknown> {
      return unwrapData(await apiClient.post('/agents/conflicts/auto-resolve'))
    },

    async getSecurityEvents(params?: Record<string, unknown>): Promise<ListResult<SecurityEventItem>> {
      const stringParams: Record<string, string> = {}
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) stringParams[k] = String(v)
        })
      }
      const response = await apiClient.get(`/agents/security-events${buildQuery(stringParams)}`)
      return unwrapList<SecurityEventItem>(response)
    },

    async exportSecurityEvents(params?: Record<string, unknown>): Promise<string> {
      const stringParams: Record<string, string> = { format: 'csv' }
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) stringParams[k] = String(v)
        })
      }
      return unwrapData<string>(await apiClient.get(`/agents/security-events/export${buildQuery(stringParams)}`))
    },

    async getSecurityEventsDailyTrend(params?: Record<string, unknown>): Promise<SecurityDailyTrend> {
      const stringParams: Record<string, string> = {}
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) stringParams[k] = String(v)
        })
      }
      return unwrapData<SecurityDailyTrend>(await apiClient.get(`/agents/security-events/daily-trend${buildQuery(stringParams)}`))
    },

    async getSecurityEventsByAgent(params?: Record<string, unknown>): Promise<SecurityByAgent> {
      const stringParams: Record<string, string> = {}
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) stringParams[k] = String(v)
        })
      }
      return unwrapData<SecurityByAgent>(await apiClient.get(`/agents/security-events/by-agent${buildQuery(stringParams)}`))
    },

    async orchestrate(): Promise<OrchestrationResult> {
      return unwrapData<OrchestrationResult>(await apiClient.post('/agents/orchestrate'))
    },

    async getOrchestratorStatus(): Promise<OrchestratorStatus> {
      return unwrapData<OrchestratorStatus>(await apiClient.get('/agents/orchestrator/status'))
    },

    async listOrchestratorHistory(params?: { limit?: number; triggered_by?: string }): Promise<OrchestratorHistoryResult> {
      return unwrapData<OrchestratorHistoryResult>(await apiClient.get(`/agents/orchestrator/history${buildQuery(params as Record<string, string>)}`))
    },

    async getOrchestratorDailyTrend(params?: { triggered_by?: string; since?: string; until?: string }): Promise<OrchestratorDailyTrend> {
      return unwrapData<OrchestratorDailyTrend>(await apiClient.get(`/agents/orchestrator/daily-trend${buildQuery(params as Record<string, string>)}`))
    },

    async getAgentReputation(agentId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/${agentId}/reputation`))
    },

    async listReputations(): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get('/agents/reputations'))
    },

    async recalculateReputation(agentId: number): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/reputation/recalculate`))
    },

    async getAgentReputationHistory(agentId: number, params?: { since?: string; until?: string; limit?: number }): Promise<ReputationHistory> {
      return unwrapData<ReputationHistory>(await apiClient.get(`/agents/${agentId}/reputation/history${buildQuery(params as Record<string, string>)}`))
    },
  }
}
