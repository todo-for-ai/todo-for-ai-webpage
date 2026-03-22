/**
 * Events 数据 Hook
 */

import { useCallback, useState } from 'react'
import { message } from 'antd'
import { organizationEventsApi, type OrganizationEvent } from '../../../api/organizationEvents'
import type { EventsPagination } from '../types'

interface UseEventsReturn {
  events: OrganizationEvent[]
  loading: boolean
  pagination: EventsPagination | null
  loadEvents: (page?: number, perPage?: number) => Promise<void>
}

export const useEvents = (
  organizationId: number,
  tp: (key: string, options?: { defaultValue?: string }) => string
): UseEventsReturn => {
  const [events, setEvents] = useState<OrganizationEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<EventsPagination | null>(null)

  const loadEvents = useCallback(async (page = 1, perPage = 20) => {
    if (!organizationId) return
    try {
      setLoading(true)
      const response = await organizationEventsApi.getOrganizationEvents(organizationId, {
        page,
        per_page: perPage,
      })
      setEvents(response.items || [])
      setPagination(response.pagination || null)
    } catch (error: any) {
      message.error(error?.message || tp('detail.activity.loadFailed', { defaultValue: '加载活动失败' }))
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [organizationId, tp])

  return {
    events,
    loading,
    pagination,
    loadEvents,
  }
}
