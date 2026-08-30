import { useCallback, useEffect, useState } from 'react'
import { notificationsApi } from '../../../api/notifications'
import type { NotificationEventCatalogItem } from '../../../api/notificationTypes'

export const useNotificationCatalog = () => {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationEventCatalogItem[]>([])

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      const response = await notificationsApi.getEventCatalog()
      setItems(response.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload().catch((error) => {
      console.error('Failed to load notification catalog:', error)
    })
  }, [reload])

  return {
    loading,
    items,
    reload,
  }
}
