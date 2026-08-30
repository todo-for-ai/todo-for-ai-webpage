import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { organizationsApi, type Organization } from '../../../api/organizations'

export function useAgentWorkspaceOptions(initialWorkspaceId?: number | null) {
  const [workspaces, setWorkspaces] = useState<Organization[]>([])
  const [workspaceId, setWorkspaceId] = useState<number | null>(initialWorkspaceId || null)
  const [loading, setLoading] = useState(false)

  const loadWorkspaces = useCallback(async () => {
    try {
      setLoading(true)
      const data = await organizationsApi.getOrganizations({ page: 1, per_page: 200 })
      const items = data.items || []
      setWorkspaces(items)
      setWorkspaceId((current) => {
        if (current && items.some((item) => item.id === current)) {
          return current
        }
        return items.length > 0 ? items[0].id : null
      })
    } catch (error: any) {
      message.error(error?.message || 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  const workspaceOptions = useMemo(
    () => workspaces.map((item) => ({ label: item.name, value: item.id })),
    [workspaces]
  )

  return {
    loading,
    workspaces,
    workspaceId,
    setWorkspaceId,
    workspaceOptions,
    reloadWorkspaces: loadWorkspaces,
  }
}
