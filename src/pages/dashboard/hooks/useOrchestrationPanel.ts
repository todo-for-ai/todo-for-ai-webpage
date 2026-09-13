import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { agentsApi, type OrchestrationResult, type OrchestratorHistoryResult, type OrchestratorStatus } from '../../../api/agents'

/**
 * 全局编排面板：一键编排、编排器状态轮询、历史 Modal 与事件明细。
 * 编排会改动安全事件/冲突数据，故 loadSecurityEvents 以依赖注入保持联动。
 * 从 useDashboardData 原样拆出。
 */
export function useOrchestrationPanel(deps: { loadSecurityEvents: (filter?: string) => void; securityFilter: string }) {
  const { loadSecurityEvents, securityFilter } = deps
  // Global orchestrator state
  const [orchestration, setOrchestration] = useState<OrchestrationResult | null>(null)
  const [orchestrationLoading, setOrchestrationLoading] = useState(false)
  const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatus | null>(null)
  // Orchestrator history
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyData, setHistoryData] = useState<OrchestratorHistoryResult | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<string>('')
  const [eventDetail, setEventDetail] = useState<any>(null)

  const runOrchestration = useCallback(async () => {
    setOrchestrationLoading(true)
    try {
      const result = await agentsApi.orchestrate()
      setOrchestration(result)
      message.success(`编排完成（${result.duration_seconds}s）`)
      // Refresh security events + conflict data since orchestration may have changed them
      loadSecurityEvents(securityFilter || undefined)
      // Also refresh scheduler status (last_run updated)
      agentsApi.getOrchestratorStatus().then(setOrchestratorStatus).catch(() => {})
    } catch {
      message.error('执行编排失败')
    } finally {
      setOrchestrationLoading(false)
    }
  }, [securityFilter, loadSecurityEvents])

  const loadOrchestratorStatus = useCallback(async () => {
    try {
      const status = await agentsApi.getOrchestratorStatus()
      setOrchestratorStatus(status)
    } catch {
      // silent: status is informational
    }
  }, [])

  useEffect(() => {
    loadOrchestratorStatus()
  }, [loadOrchestratorStatus])

  // 加载编排历史
  const loadOrchestratorHistory = useCallback(async (filter?: string) => {
    setHistoryLoading(true)
    try {
      const result = await agentsApi.listOrchestratorHistory({
        limit: 30,
        ...(filter ? { triggered_by: filter } : {}),
      })
      setHistoryData(result)
    } catch {
      message.error('加载编排历史失败')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const openHistory = useCallback(() => {
    setHistoryOpen(true)
    loadOrchestratorHistory(historyFilter)
  }, [loadOrchestratorHistory, historyFilter])

  return {
    orchestration,
    setOrchestration,
    orchestrationLoading,
    setOrchestrationLoading,
    orchestratorStatus,
    setOrchestratorStatus,
    historyOpen,
    setHistoryOpen,
    historyData,
    setHistoryData,
    historyLoading,
    setHistoryLoading,
    historyFilter,
    setHistoryFilter,
    eventDetail,
    setEventDetail,
    runOrchestration,
    loadOrchestratorStatus,
    loadOrchestratorHistory,
    openHistory,
  }
}
