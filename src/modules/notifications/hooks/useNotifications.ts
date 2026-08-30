import { useCallback, useEffect, useState } from 'react'
import { notificationsApi } from '../../../api/notifications'
import type { NotificationItem } from '../../../api/notificationTypes'

export const useNotifications = (options?: { unreadOnly?: boolean; page?: number; perPage?: number }) => {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      const [listResponse, unreadResponse] = await Promise.all([
        notificationsApi.listNotifications({
          unreadOnly: options?.unreadOnly,
          page: options?.page || 1,
          perPage: options?.perPage || 50,
        }),
        notificationsApi.getUnreadCount(),
      ])
      setItems(listResponse.items || [])
      setUnreadCount(unreadResponse.count || 0)
    } finally {
      setLoading(false)
    }
  }, [options?.page, options?.perPage, options?.unreadOnly])

  const markAsRead = useCallback(async (notificationId: number) => {
    await notificationsApi.markAsRead(notificationId)
    await reload()
  }, [reload])

  const markAllAsRead = useCallback(async () => {
    await notificationsApi.markAllAsRead()
    await reload()
  }, [reload])

  useEffect(() => {
    void reload().catch((error) => {
      console.error('Failed to load notifications:', error)
    })
  }, [reload])

  return {
    loading,
    items,
    unreadCount,
    reload,
    markAsRead,
    markAllAsRead,
  }
}
