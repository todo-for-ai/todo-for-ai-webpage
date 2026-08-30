/**
 * Agent API — experience methods mixin.
 *
 * Experiences CRUD, knowledge entries, decay, confidence analysis,
 * cross-project authorization, and skill coverage.
 */
import type { ApiClient } from '../client/index.js'
import type { PaginatedResponse } from './types'
import type {
  ExperiencesStats,
  ExperiencesLowConfidence,
  ExperiencesScatter,
  ExperiencesReuseTrend,
  ExperiencesConfidenceDecayForecast,
  ExperiencesDecayByDomain,
  ExperiencesDecayByTaskType,
  ExperiencesConfidenceDistribution,
  ExperiencesSourceDistribution,
  ExperiencesPropagationChain,
  ExperiencesSkillCoverageRadar,
  AgentExperiencesDecayAlerts,
} from './experience-types'
import { unwrapData, buildQuery } from './helpers'

export interface ExperienceMethods {
  getExperiencesStats(): Promise<ExperiencesStats>
  getExperiencesLowConfidence(maxConfidence?: number, limit?: number): Promise<ExperiencesLowConfidence>
  getExperiencesScatter(limit?: number): Promise<ExperiencesScatter>
  getExperiencesReuseTrend(days?: number): Promise<ExperiencesReuseTrend>
  getExperiencesConfidenceDecayForecast(days?: number): Promise<ExperiencesConfidenceDecayForecast>
  getExperiencesDecayByDomain(limit?: number): Promise<ExperiencesDecayByDomain>
  getExperiencesDecayByTaskType(limit?: number): Promise<ExperiencesDecayByTaskType>
  getExperiencesConfidenceDistribution(): Promise<ExperiencesConfidenceDistribution>
  getExperiencesSourceDistribution(): Promise<ExperiencesSourceDistribution>
  getExperiencesPropagationChain(limit?: number): Promise<ExperiencesPropagationChain>
  getExperiencesSkillCoverageRadar(limit?: number, domains?: number): Promise<ExperiencesSkillCoverageRadar>
  getAgentExperiencesDecayAlerts(days?: number, minDrop?: number, limit?: number): Promise<AgentExperiencesDecayAlerts>
  listAgentExperiences(agentId: number, params?: Record<string, string>): Promise<PaginatedResponse<unknown>>
  createAgentExperience(agentId: number, data: Record<string, unknown>): Promise<unknown>
  getAgentExperience(agentId: number, experienceId: number): Promise<unknown>
  updateAgentExperience(agentId: number, experienceId: number, data: Record<string, unknown>): Promise<unknown>
  deleteAgentExperience(agentId: number, experienceId: number): Promise<unknown>
  recommendExperiences(agentId: number, params?: Record<string, string>): Promise<unknown[]>
  shareAgentExperience(agentId: number, experienceId: number): Promise<unknown>
  learnFromExperience(agentId: number, experienceId: number): Promise<unknown>
  listSharedExperiences(agentId: number, params?: Record<string, string>): Promise<PaginatedResponse<unknown>>
  autoExtractExperiences(agentId: number): Promise<unknown[]>
  applyExperienceDecay(agentId: number, params?: Record<string, unknown>): Promise<unknown>
  validateExperience(agentId: number, experienceId: number, data: { is_accurate: boolean }): Promise<unknown>
  getExperienceValidationStats(agentId: number): Promise<unknown>
  decayAllExperiences(params?: Record<string, unknown>): Promise<unknown>
  suggestCapabilityAdaptation(agentId: number): Promise<unknown>
  applyCapabilityAdaptation(agentId: number, data: Record<string, unknown>): Promise<unknown>
  authorizeCrossProjectAgent(data: { agent_id: number; project_id: number; role_in_project?: string; capabilities_override?: string[]; max_concurrent_tasks?: number }): Promise<unknown>
  revokeCrossProjectAgent(agentId: number, projectId: number): Promise<unknown>
  listAgentCrossProjects(agentId: number): Promise<unknown[]>
  listProjectExternalAgents(projectId: number): Promise<PaginatedResponse<unknown>>
  discoverCrossProjectAgents(params?: Record<string, string>): Promise<unknown[]>
  findCapableAgentsCrossProject(params: Record<string, string>): Promise<unknown[]>
  findCrossProjectTasks(agentId: number, params?: Record<string, string>): Promise<unknown[]>
  claimCrossProjectTask(agentId: number, taskId: number, data?: Record<string, unknown>): Promise<unknown>
  listKnowledgeEntries(agentId: number, params?: Record<string, unknown>): Promise<unknown>
  createKnowledgeEntry(agentId: number, data: Record<string, unknown>): Promise<unknown>
  getKnowledgeEntry(agentId: number, entryId: number): Promise<unknown>
  updateKnowledgeEntry(agentId: number, entryId: number, data: Record<string, unknown>): Promise<unknown>
  deleteKnowledgeEntry(agentId: number, entryId: number): Promise<unknown>
  searchKnowledge(agentId: number, params?: Record<string, unknown>): Promise<unknown[]>
  listSharedKnowledge(params?: Record<string, unknown>): Promise<unknown>
  autoExtractKnowledge(agentId: number, limit?: number): Promise<unknown>
}

export function createExperienceMethods(apiClient: ApiClient): ExperienceMethods {
  return {
    async getExperiencesStats(): Promise<ExperiencesStats> {
      return unwrapData<ExperiencesStats>(await apiClient.get('/agents/experiences/stats'))
    },

    async getExperiencesLowConfidence(maxConfidence = 0.5, limit = 20): Promise<ExperiencesLowConfidence> {
      return unwrapData<ExperiencesLowConfidence>(await apiClient.get(`/agents/experiences/low-confidence${buildQuery({ max_confidence: maxConfidence, limit })}`))
    },

    async getExperiencesScatter(limit = 200): Promise<ExperiencesScatter> {
      return unwrapData<ExperiencesScatter>(await apiClient.get(`/agents/experiences/scatter${buildQuery({ limit })}`))
    },

    async getExperiencesReuseTrend(days = 30): Promise<ExperiencesReuseTrend> {
      return unwrapData<ExperiencesReuseTrend>(await apiClient.get(`/agents/experiences/reuse-trend${buildQuery({ days })}`))
    },

    async getExperiencesConfidenceDecayForecast(days = 30): Promise<ExperiencesConfidenceDecayForecast> {
      return unwrapData<ExperiencesConfidenceDecayForecast>(await apiClient.get(`/agents/experiences/confidence-decay-forecast${buildQuery({ days })}`))
    },

    async getExperiencesDecayByDomain(limit = 15): Promise<ExperiencesDecayByDomain> {
      return unwrapData<ExperiencesDecayByDomain>(await apiClient.get(`/agents/experiences/decay-by-domain${buildQuery({ limit })}`))
    },

    async getExperiencesDecayByTaskType(limit = 15): Promise<ExperiencesDecayByTaskType> {
      return unwrapData<ExperiencesDecayByTaskType>(await apiClient.get(`/agents/experiences/decay-by-task-type${buildQuery({ limit })}`))
    },

    async getExperiencesConfidenceDistribution(): Promise<ExperiencesConfidenceDistribution> {
      return unwrapData<ExperiencesConfidenceDistribution>(await apiClient.get('/agents/experiences/confidence-distribution'))
    },

    async getExperiencesSourceDistribution(): Promise<ExperiencesSourceDistribution> {
      return unwrapData<ExperiencesSourceDistribution>(await apiClient.get('/agents/experiences/source-distribution'))
    },

    async getExperiencesPropagationChain(limit = 10): Promise<ExperiencesPropagationChain> {
      return unwrapData<ExperiencesPropagationChain>(await apiClient.get(`/agents/experiences/propagation-chain${buildQuery({ limit })}`))
    },

    async getExperiencesSkillCoverageRadar(limit = 6, domains = 8): Promise<ExperiencesSkillCoverageRadar> {
      return unwrapData<ExperiencesSkillCoverageRadar>(await apiClient.get(`/agents/experiences/skill-coverage-radar${buildQuery({ limit, domains })}`))
    },

    async getAgentExperiencesDecayAlerts(days = 30, minDrop = 0.1, limit = 10): Promise<AgentExperiencesDecayAlerts> {
      return unwrapData<AgentExperiencesDecayAlerts>(await apiClient.get(`/agents/experiences/decay-alerts${buildQuery({ days, min_drop: minDrop, limit })}`))
    },

    async listAgentExperiences(agentId: number, params?: Record<string, string>): Promise<PaginatedResponse<unknown>> {
      return unwrapData<PaginatedResponse<unknown>>(await apiClient.get(`/agents/${agentId}/experiences${buildQuery(params)}`))
    },

    async createAgentExperience(agentId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/experiences`, data))
    },

    async getAgentExperience(agentId: number, experienceId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/${agentId}/experiences/${experienceId}`))
    },

    async updateAgentExperience(agentId: number, experienceId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.put(`/agents/${agentId}/experiences/${experienceId}`, data))
    },

    async deleteAgentExperience(agentId: number, experienceId: number): Promise<unknown> {
      return unwrapData(await apiClient.delete(`/agents/${agentId}/experiences/${experienceId}`))
    },

    async recommendExperiences(agentId: number, params?: Record<string, string>): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/${agentId}/experiences/recommend${buildQuery(params)}`))
    },

    async shareAgentExperience(agentId: number, experienceId: number): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/experiences/${experienceId}/share`))
    },

    async learnFromExperience(agentId: number, experienceId: number): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/experiences/${experienceId}/learn`))
    },

    async listSharedExperiences(agentId: number, params?: Record<string, string>): Promise<PaginatedResponse<unknown>> {
      return unwrapData<PaginatedResponse<unknown>>(await apiClient.get(`/agents/${agentId}/shared-experiences${buildQuery(params)}`))
    },

    async autoExtractExperiences(agentId: number): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.post(`/agents/${agentId}/experiences/auto-extract`))
    },

    async applyExperienceDecay(agentId: number, params?: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/experiences/decay${buildQuery(params as Record<string, string>)}`))
    },

    async validateExperience(agentId: number, experienceId: number, data: { is_accurate: boolean }): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/experiences/${experienceId}/validate`, data))
    },

    async getExperienceValidationStats(agentId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/${agentId}/experiences/validation-stats`))
    },

    async decayAllExperiences(params?: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/experiences/decay-all${buildQuery(params as Record<string, string>)}`))
    },

    async suggestCapabilityAdaptation(agentId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/${agentId}/capability-adaptation/suggest`))
    },

    async applyCapabilityAdaptation(agentId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/capability-adaptation/apply`, data))
    },

    async authorizeCrossProjectAgent(data: { agent_id: number; project_id: number; role_in_project?: string; capabilities_override?: string[]; max_concurrent_tasks?: number }): Promise<unknown> {
      return unwrapData(await apiClient.post('/agents/cross-project/authorize', data))
    },

    async revokeCrossProjectAgent(agentId: number, projectId: number): Promise<unknown> {
      return unwrapData(await apiClient.delete(`/agents/cross-project/authorize/${agentId}/${projectId}`))
    },

    async listAgentCrossProjects(agentId: number): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/${agentId}/cross-projects`))
    },

    async listProjectExternalAgents(projectId: number): Promise<PaginatedResponse<unknown>> {
      return unwrapData<PaginatedResponse<unknown>>(await apiClient.get(`/agents/cross-project/project/${projectId}/external-agents`))
    },

    async discoverCrossProjectAgents(params?: Record<string, string>): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/cross-project/discover${buildQuery(params)}`))
    },

    async findCapableAgentsCrossProject(params: Record<string, string>): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/cross-project/find-capable${buildQuery(params)}`))
    },

    async findCrossProjectTasks(agentId: number, params?: Record<string, string>): Promise<unknown[]> {
      return unwrapData<unknown[]>(await apiClient.get(`/agents/${agentId}/cross-project-tasks${buildQuery(params)}`))
    },

    async claimCrossProjectTask(agentId: number, taskId: number, data?: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/cross-project-tasks/${taskId}/claim`, data || {}))
    },

    async listKnowledgeEntries(agentId: number, params?: Record<string, unknown>): Promise<unknown> {
      const stringParams: Record<string, string> = {}
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) stringParams[k] = String(v)
        })
      }
      return unwrapData(await apiClient.get(`/agents/${agentId}/knowledge${buildQuery(stringParams)}`))
    },

    async createKnowledgeEntry(agentId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/knowledge`, data))
    },

    async getKnowledgeEntry(agentId: number, entryId: number): Promise<unknown> {
      return unwrapData(await apiClient.get(`/agents/${agentId}/knowledge/${entryId}`))
    },

    async updateKnowledgeEntry(agentId: number, entryId: number, data: Record<string, unknown>): Promise<unknown> {
      return unwrapData(await apiClient.put(`/agents/${agentId}/knowledge/${entryId}`, data))
    },

    async deleteKnowledgeEntry(agentId: number, entryId: number): Promise<unknown> {
      return unwrapData(await apiClient.delete(`/agents/${agentId}/knowledge/${entryId}`))
    },

    async searchKnowledge(agentId: number, params?: Record<string, unknown>): Promise<unknown[]> {
      const stringParams: Record<string, string> = {}
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) stringParams[k] = String(v)
        })
      }
      return unwrapData<unknown[]>(await apiClient.get(`/agents/${agentId}/knowledge/search${buildQuery(stringParams)}`))
    },

    async listSharedKnowledge(params?: Record<string, unknown>): Promise<unknown> {
      const stringParams: Record<string, string> = {}
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined) stringParams[k] = String(v)
        })
      }
      return unwrapData(await apiClient.get(`/agents/knowledge/shared${buildQuery(stringParams)}`))
    },

    async autoExtractKnowledge(agentId: number, limit?: number): Promise<unknown> {
      return unwrapData(await apiClient.post(`/agents/${agentId}/knowledge/auto-extract${limit ? `?limit=${limit}` : ''}`))
    },
  }
}
