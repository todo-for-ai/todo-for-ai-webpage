/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client/index.js'

export interface GovernanceRule {
  id: string
  name: string
  description?: string
  interaction_type: string
  require_approval: boolean
  risk_threshold?: number
  auto_approve_conditions?: Record<string, any>
}

class GovernanceRulesApi {
  async list(workspaceId: number): Promise<{ rules: GovernanceRule[] }> {
    return await apiClient.get(`/workspaces/${workspaceId}/governance/rules`)
  }

  async update(workspaceId: number, rules: GovernanceRule[]): Promise<{ rules: GovernanceRule[] }> {
    return await apiClient.put(`/workspaces/${workspaceId}/governance/rules`, { rules })
  }
}

export const governanceRulesApi = new GovernanceRulesApi()
