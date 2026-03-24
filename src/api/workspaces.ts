/**
 * Workspaces API
 *
 * Alias for organizations API for backward compatibility
 */
import { apiClient } from './client/index.js'
import type { Organization } from './organizations'

export interface Workspace extends Organization {}

export interface WorkspaceListResponse {
  items: Workspace[]
  total: number
  page: number
  per_page: number
}

export const workspacesApi = {
  async getWorkspaces(params?: { page?: number; per_page?: number; search?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.per_page) query.set('per_page', String(params.per_page))
    if (params?.search) query.set('search', params.search)
    const qs = query.toString()
    return apiClient.get<WorkspaceListResponse>(`/organizations${qs ? `?${qs}` : ''}`)
  },

  async getWorkspace(id: number) {
    return apiClient.get<Workspace>(`/organizations/${id}`)
  },
}
