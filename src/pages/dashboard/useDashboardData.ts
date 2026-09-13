import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { agentsApi } from '../../api/agents'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { useCollaborationSSE } from '../../hooks/useCollaborationSSE'
import { formatDate, getStatusColor } from './dashboardFormatters'
import { useDashboardStats } from './hooks/useDashboardStats'
import { useCollabMetricsPanel } from './hooks/useCollabMetricsPanel'
import { useAgentMonitorPanel } from './hooks/useAgentMonitorPanel'
import { useSecurityPanel } from './hooks/useSecurityPanel'
import { useUnifiedTrendPanel } from './hooks/useUnifiedTrendPanel'
import { useCollabGraphPanel } from './hooks/useCollabGraphPanel'
import { useOrchestrationPanel } from './hooks/useOrchestrationPanel'
import { useAdvancedAnalytics } from './hooks/useAdvancedAnalytics'

/**
 * 仪表盘数据组合根：按领域拆分的面板 hook 在此组装，跨面板联动（SSE 实时刷新、
 * 编排 → 安全事件刷新）也在此接线。对外返回键与拆分前完全一致（有契约测试钉住）。
 */
export function useDashboardData() {
  const navigate = useNavigate()
  const { tp, tc, pageTitle } = usePageTranslation('dashboard')

  const statsPanel = useDashboardStats(tc)
  const { loadDashboardStats } = statsPanel
  const collabMetricsPanel = useCollabMetricsPanel()
  const monitorPanel = useAgentMonitorPanel()
  const trendPanel = useUnifiedTrendPanel()
  const graphPanel = useCollabGraphPanel()
  const securityPanel = useSecurityPanel({ setCollabTimeline: graphPanel.setCollabTimeline })
  const orchestrationPanel = useOrchestrationPanel({
    loadSecurityEvents: securityPanel.loadSecurityEvents,
    securityFilter: securityPanel.securityFilter,
  })
  const analytics = useAdvancedAnalytics()

  // 设置网页标题
  useEffect(() => {
    document.title = `${pageTitle} - Todo for AI`

    // 组件卸载时恢复默认标题
    return () => {
      document.title = 'Todo for AI'
    }
  }, [pageTitle])

  // 加载仪表盘数据
  useEffect(() => {
    loadDashboardStats()
  }, [])

  // SSE-driven live refresh of the security event aggregation card
  // 注意：onEvent 的依赖必须是具体稳定值（面板返回的 setter/useCallback），
  // 不能用面板对象本身——那会让回调每渲染都重建，导致 SSE 反复重连。
  const { securityFilter, buildSecurityParams, setSecurityEvents, setSecurityTrend, setSecurityByAgent } = securityPanel
  const { loadCollabGraph, graphWindow } = graphPanel
  const { loadUnifiedTrend, trendWindow, trendSeverity, trendEventType } = trendPanel
  const SECURITY_SSE_EVENTS = new Set([
    'sandbox_violation', 'sandbox_step_violation', 'sandbox_execution_revoked',
    'sandbox_bound', 'sandbox_created', 'conflicts_detected', 'conflict_resolved',
    'conflicts_auto_resolved', 'workflow_step_overridden',
  ])
  useCollaborationSSE({
    enabled: true,
    onEvent: useCallback((event: any) => {
      const et = event.event_type || ''
      // Agent 直接消息事件刷新协作关系图
      if (et === 'agent.direct_message') {
        loadCollabGraph(graphWindow)
        return
      }
      if (!SECURITY_SSE_EVENTS.has(et)) return
      // Best-effort refresh, preserving the current filter and time range
      const params = buildSecurityParams(securityFilter)
      Promise.all([
        agentsApi.getSecurityEvents(params),
        agentsApi.getSecurityEventsDailyTrend(params).catch(() => null),
        agentsApi.getSecurityEventsByAgent(params).catch(() => null),
      ])
        .then(([r, t, ba]) => {
          setSecurityEvents(r.items)
          if (t) setSecurityTrend(t)
          if (ba) setSecurityByAgent(ba)
        })
        .catch(() => { /* silent: SSE refresh is best-effort */ })
      // 编排活动相关事件同步刷新统一趋势的编排序列
      if (et === 'conflicts_detected' || et === 'conflict_resolved' || et === 'conflicts_auto_resolved') {
        loadUnifiedTrend(trendWindow, trendSeverity, trendEventType)
      }
    }, [securityFilter, buildSecurityParams, loadUnifiedTrend, trendWindow, trendSeverity, trendEventType, loadCollabGraph, graphWindow]),
  })

  // 获取任务状态文本
  const getStatusText = (status: string) => {
    const statusKey = `taskStatus.${status}`
    try {
      return tp(statusKey)
    } catch {
      return status
    }
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) {
      return tp('labels.noRecentAgentActivity')
    }
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return {
    ...statsPanel,
    ...collabMetricsPanel,
    ...monitorPanel,
    ...securityPanel,
    ...trendPanel,
    ...graphPanel,
    ...orchestrationPanel,
    ...analytics,
    navigate,
    tp,
    tc,
    pageTitle,
    formatDate,
    formatDateTime,
    getStatusColor,
    getStatusText,
  }
}
