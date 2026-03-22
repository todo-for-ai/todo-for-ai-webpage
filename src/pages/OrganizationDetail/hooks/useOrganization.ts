/**
 * Organization 数据 Hook
 */

import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { organizationsApi, type Organization } from '../../../api/organizations'

interface UseOrganizationReturn {
  organization: Organization | null
  loading: boolean
  loadOrganization: () => Promise<void>
}

export const useOrganization = (organizationId: number): UseOrganizationReturn => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(false)

  const loadOrganization = useCallback(async () => {
    if (!organizationId) {
      return
    }
    try {
      setLoading(true)
      const data = await organizationsApi.getOrganization(organizationId)
      setOrganization(data)
    } catch (error: any) {
      message.error(error?.message || '加载组织失败')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (!organizationId || Number.isNaN(organizationId)) {
      return
    }
    void loadOrganization()
  }, [organizationId, loadOrganization])

  return {
    organization,
    loading,
    loadOrganization,
  }
}
