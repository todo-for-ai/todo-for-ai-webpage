import { apiClient } from './client/index.js'

export interface OrganizationEvent {
  id: number
  organization_id: number
  event_type: string
  source?: string
  level?: string
  actor_type?: string
  actor_id?: string
  actor_name?: string
  target_type?: string
  target_id?: string
  project_id?: number | null
  task_id?: number | null
  message?: string | null
  payload?: Record<string, any>
  occurred_at?: string | null
  created_at?: string | null
}

export interface OrganizationEventQueryParams {
  page?: number
  per_page?: number
  event_type?: string
  actor_type?: string
  project_id?: number
  task_id?: number
  from?: string
  to?: string
}

export interface OrganizationEventsResponse {
  items: OrganizationEvent[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
    has_prev: boolean
    has_next: boolean
    prev_num?: number
    next_num?: number
  }
}

export class OrganizationEventsApi {
  async getOrganizationEvents(organizationId: number, params?: OrganizationEventQueryParams) {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }

    const url = `/organizations/${organizationId}/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<OrganizationEventsResponse>(url)
  }
}

export const organizationEventsApi = new OrganizationEventsApi()
