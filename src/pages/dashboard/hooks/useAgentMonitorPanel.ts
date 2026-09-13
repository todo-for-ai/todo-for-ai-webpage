import { useCallback, useEffect, useState } from 'react'
import { dashboardApi } from '../../../api/dashboard'

/** Agent 监控面板：按小时窗口拉取监控数据。从 useDashboardData 原样拆出。 */
export function useAgentMonitorPanel() {
  const [monitorData, setMonitorData] = useState<any>(null)
  const [monitorLoading, setMonitorLoading] = useState(false)
  const [monitorHours, setMonitorHours] = useState(24)

  const loadMonitorData = useCallback(async () => {
    setMonitorLoading(true)
    try {
      const result = await dashboardApi.getAgentMonitor({ hours: String(monitorHours) })
      setMonitorData(result)
    } catch {
      // silent
    } finally {
      setMonitorLoading(false)
    }
  }, [monitorHours])

  useEffect(() => {
    loadMonitorData()
  }, [loadMonitorData])

  return {
    monitorData,
    setMonitorData,
    monitorLoading,
    setMonitorLoading,
    monitorHours,
    setMonitorHours,
    loadMonitorData,
  }
}
