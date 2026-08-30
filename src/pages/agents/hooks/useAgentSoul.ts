import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { agentSoulApi, type AgentSoulVersion, type Agent } from '../../../api/agents'

export function useAgentSoul(workspaceId: number | null, agentId: number | null) {
  const [versions, setVersions] = useState<AgentSoulVersion[]>([])
  const [loading, setLoading] = useState(false)

  const loadVersions = useCallback(async () => {
    if (!workspaceId || !agentId) {
      setVersions([])
      return
    }

    try {
      setLoading(true)
      const data = await agentSoulApi.getSoulVersions(workspaceId, agentId, { page: 1, per_page: 50 })
      setVersions(data.items || [])
    } catch (error: any) {
      message.error(error?.message || 'Failed to load SOUL versions')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId])

  const rollback = useCallback(
    async (version: number, changeSummary?: string): Promise<Agent | null> => {
      if (!workspaceId || !agentId) {
        return null
      }

      try {
        setLoading(true)
        const updated = await agentSoulApi.rollbackSoul(workspaceId, agentId, {
          version,
          change_summary: changeSummary,
        })
        message.success(`Rolled back to v${version}`)
        await loadVersions()
        return updated
      } catch (error: any) {
        message.error(error?.message || 'Failed to rollback SOUL')
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId, loadVersions]
  )

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  return {
    versions,
    loading,
    reloadVersions: loadVersions,
    rollback,
  }
}
