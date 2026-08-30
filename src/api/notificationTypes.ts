export interface NotificationItem {
  id: number
  user_id: number
  event_id: string
  event_type: string
  category: string
  title: string
  body?: string
  level: string
  link_url?: string
  resource_type: string
  resource_id?: number
  actor_user_id?: number
  project_id?: number
  organization_id?: number
  extra_payload: Record<string, any>
  read_at?: string | null
  archived_at?: string | null
  dedup_key: string
  created_at: string
  updated_at: string
  is_read: boolean
}

export interface NotificationListResponse {
  items: NotificationItem[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
    has_prev: boolean
    has_next: boolean
  }
}

export interface NotificationUnreadCountResponse {
  count: number
}

export interface NotificationEventCatalogItem {
  event_type: string
  title: string
  description: string
  category: string
  default_level: string
  supports_in_app: boolean
  supports_external: boolean
}

export interface NotificationEventCatalogResponse {
  items: NotificationEventCatalogItem[]
}
