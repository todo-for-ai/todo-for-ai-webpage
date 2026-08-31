/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client/index.js'

export type BudgetScopeType = 'agent' | 'project' | 'workspace'
export type BudgetResource = 'tokens' | 'duration_minutes' | 'concurrent'
export type BudgetPeriod = 'total' | 'daily' | 'weekly' | 'monthly'

export interface BudgetUsage {
  used: number
  not_tracked: boolean
}

export interface Budget {
  id: number
  scope_type: BudgetScopeType
  agent_id: number | null
  project_id: number | null
  workspace_id: number
  resource: BudgetResource
  limit_value: number
  period: BudgetPeriod
  is_active: boolean
  created_at: string
  updated_at: string
  usage?: BudgetUsage
  usage_ratio?: number | null
}

export interface BudgetCreateInput {
  scope_type: BudgetScopeType
  resource: BudgetResource
  limit_value: number
  period?: BudgetPeriod
  agent_id?: number
  project_id?: number
  is_active?: boolean
}

export interface BudgetUpdateInput {
  limit_value?: number
  is_active?: boolean
}

class BudgetsApi {
  async list(workspaceId: number, scopeType?: BudgetScopeType): Promise<{ budgets: Budget[] }> {
    const query = scopeType ? `?scope_type=${scopeType}` : ''
    return await apiClient.get<{ budgets: Budget[] }>(
      `/workspaces/${workspaceId}/budgets${query}`
    )
  }

  async create(workspaceId: number, data: BudgetCreateInput): Promise<Budget> {
    return await apiClient.post<Budget>(`/workspaces/${workspaceId}/budgets`, data)
  }

  async update(workspaceId: number, budgetId: number, data: BudgetUpdateInput): Promise<Budget> {
    return await apiClient.put<Budget>(`/workspaces/${workspaceId}/budgets/${budgetId}`, data)
  }

  async delete(workspaceId: number, budgetId: number): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/budgets/${budgetId}`)
  }

  async usage(workspaceId: number, budgetId: number): Promise<Budget & { violating: boolean }> {
    return await apiClient.get<Budget & { violating: boolean }>(
      `/workspaces/${workspaceId}/budgets/${budgetId}/usage`
    )
  }
}

export const budgetsApi = new BudgetsApi()
