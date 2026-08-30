import { apiClient } from './client'
import type {
  NotificationEventCatalogResponse,
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from './notificationTypes'

export class NotificationsApi {
  async listNotifications(params?: { unreadOnly?: boolean; category?: string; page?: number; perPage?: number }) {
    const query = new URLSearchParams()
    if (params?.unreadOnly) query.set('unread_only', 'true')
    if (params?.category) query.set('category', params.category)
    if (params?.page) query.set('page', String(params.page))
    if (params?.perPage) query.set('per_page', String(params.perPage))
    const qs = query.toString()
    return apiClient.get<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ''}`)
  }

  async getUnreadCount() {
    return apiClient.get<NotificationUnreadCountResponse>('/notifications/unread-count')
  }

  async markAsRead(notificationId: number) {
    return apiClient.post(`/notifications/${notificationId}/read`)
  }

  async markAllAsRead() {
    return apiClient.post('/notifications/read-all')
  }

  async getEventCatalog() {
    return apiClient.get<NotificationEventCatalogResponse>('/notifications/notification-event-catalog')
  }
}

export const notificationsApi = new NotificationsApi()
