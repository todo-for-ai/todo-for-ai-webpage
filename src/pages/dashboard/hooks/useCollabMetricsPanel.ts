import { useCallback, useEffect, useState } from 'react'
import { agentsApi } from '../../../api/agents'

/** 协作指标面板：按天数窗口拉取 Agent 协作指标。从 useDashboardData 原样拆出。 */
export function useCollabMetricsPanel() {
  const [collabMetrics, setCollabMetrics] = useState<any>(null)
  const [collabLoading, setCollabLoading] = useState(false)
  const [collabDays, setCollabDays] = useState(7)

  const loadCollabMetrics = useCallback(async () => {
    setCollabLoading(true)
    try {
      const result = await agentsApi.getCollaborationMetrics({ days: collabDays })
      setCollabMetrics(result)
    } catch {
      // silent
    } finally {
      setCollabLoading(false)
    }
  }, [collabDays])

  useEffect(() => {
    loadCollabMetrics()
  }, [loadCollabMetrics])

  return {
    collabMetrics,
    setCollabMetrics,
    collabLoading,
    setCollabLoading,
    collabDays,
    setCollabDays,
    loadCollabMetrics,
  }
}
