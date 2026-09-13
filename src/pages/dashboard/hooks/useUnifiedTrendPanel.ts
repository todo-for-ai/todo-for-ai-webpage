import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { agentsApi, type OrchestratorDailyTrend, type SecurityDailyTrend } from '../../../api/agents'

/**
 * 平台活动统一趋势面板：编排按天趋势 + 安全事件按天趋势，受 trendWindow/trendSeverity/trendEventType 驱动。
 * 从 useDashboardData 原样拆出。
 */
export function useUnifiedTrendPanel() {
  const [trendWindow, setTrendWindow] = useState<string>('30')
  const [trendSeverity, setTrendSeverity] = useState<string>('')
  const [trendEventType, setTrendEventType] = useState<string>('')
  const [unifiedSecTrend, setUnifiedSecTrend] = useState<SecurityDailyTrend | null>(null)
  const [orchDailyTrend, setOrchDailyTrend] = useState<OrchestratorDailyTrend | null>(null)

  const loadUnifiedTrend = useCallback(async (window: string, severity: string, eventType: string) => {
    const since = window === 'all' ? undefined : dayjs().subtract(Number(window), 'day').toISOString()
    const params: any = since ? { since } : {}
    if (severity) params.severity = severity
    if (eventType) params.event_type = eventType
    try {
      const [orch, sec] = await Promise.all([
        agentsApi.getOrchestratorDailyTrend(since ? { since } : {}).catch(() => null),
        agentsApi.getSecurityEventsDailyTrend(params).catch(() => null),
      ])
      setOrchDailyTrend(orch)
      setUnifiedSecTrend(sec)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    loadUnifiedTrend(trendWindow, trendSeverity, trendEventType)
  }, [loadUnifiedTrend, trendWindow, trendSeverity, trendEventType])

  return {
    trendWindow,
    setTrendWindow,
    trendSeverity,
    setTrendSeverity,
    trendEventType,
    setTrendEventType,
    unifiedSecTrend,
    setUnifiedSecTrend,
    orchDailyTrend,
    setOrchDailyTrend,
    loadUnifiedTrend,
  }
}
