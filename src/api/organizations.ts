import { apiClient } from './client/index.js'

export interface Organization {
  id: number
  owner_id: number
  name: string
  slug: string
  description?: string
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
  current_user_role?: 'owner' | 'admin' | 'member' | 'viewer' | null
  member_count?: number
  project_count?: number
}

export interface OrganizationMember {
  id: number
  organization_id: number
  user_id: number
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'invited' | 'removed'
  invited_by?: number | null
  joined_at?: string
  created_at: string
  updated_at: string
  user?: {
    id: number
    username?: string
    nickname?: string
    full_name?: string
    avatar_url?: string
    bio?: string
    created_at?: string
  }
}

export interface OrganizationQueryParams {
  page?: number
  per_page?: number
  search?: string
  status?: 'active' | 'archived'
  sort_by?: 'name' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface CreateOrganizationData {
  name: string
  slug?: string
  description?: string
}

export interface UpdateOrganizationData {
  name?: string
  slug?: string
  description?: string
  status?: 'active' | 'archived'
}

export class OrganizationsApi {
  async getOrganizations(params?: OrganizationQueryParams) {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }

    const url = `/organizations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<{ items: Organization[]; pagination: any }>(url)
  }

  async getOrganization(id: number) {
    return apiClient.get<Organization>(`/organizations/${id}`)
  }

  async createOrganization(data: CreateOrganizationData) {
    return apiClient.post<Organization>('/organizations', data)
  }

  async updateOrganization(id: number, data: UpdateOrganizationData) {
    return apiClient.put<Organization>(`/organizations/${id}`, data)
  }

  async getOrganizationMembers(id: number) {
    return apiClient.get<{ items: OrganizationMember[]; organization_id: number }>(`/organizations/${id}/members`)
  }

  async inviteOrganizationMember(
    id: number,
    data: {
      email: string
      role?: 'admin' | 'member' | 'viewer'
    }
  ) {
    return apiClient.post<OrganizationMember>(`/organizations/${id}/members/invite`, data)
  }

  async updateOrganizationMember(
    id: number,
    userId: number,
    data: {
      role?: 'admin' | 'member' | 'viewer'
      status?: 'active' | 'invited' | 'removed'
    }
  ) {
    return apiClient.put<OrganizationMember>(`/organizations/${id}/members/${userId}`, data)
  }

  async removeOrganizationMember(id: number, userId: number) {
    return apiClient.delete(`/organizations/${id}/members/${userId}`)
  }
}

export const organizationsApi = new OrganizationsApi()
