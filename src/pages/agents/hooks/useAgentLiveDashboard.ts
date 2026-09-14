/**
 * Agents.tsx 实时看板域：liveMode 开关、10s 静默刷新、60s 自动派活、SSE 事件流
 * （通知弹窗 + 实时事件列表）与看板统计加载。
 * 从 Agents.tsx 原样抽出（状态 + 效果），逻辑零改动；跨域依赖经 ctx 注入。
 */

import { useState, useEffect, useCallback } from 'react'
import { notification } from 'antd'
import { agentsApi } from '../../../api/agents'
import type { Agent, AgentStatus, ReviewQueueAction } from '../../../api/agents'
import { getAgentDispatchPolicy, normalizeDispatchOptions } from '../utils'
import { useCollaborationSSE } from '../../../hooks/useCollaborationSSE'
import { dashboardApi, type DashboardStats } from '../../../api/dashboard'

const MAX_LIVE_EVENTS = 30

interface UseAgentLiveDashboardOptions {
  agents: Agent[]
  statusFilter: AgentStatus | 'all'
  searchText: string
  reviewActionFilter: ReviewQueueAction
  drawerOpen: boolean
  selectedAgent: Agent | null
  loadAgents: (options?: { silent?: boolean }) => Promise<void>
  loadReviewQueue: (options?: { silent?: boolean }) => Promise<void>
  loadAssignments: (agent: Agent, options?: { silent?: boolean }) => Promise<void>
}

export function useAgentLiveDashboard({
  agents,
  statusFilter,
  searchText,
  reviewActionFilter,
  drawerOpen,
  selectedAgent,
  loadAgents,
  loadReviewQueue,
  loadAssignments,
}: UseAgentLiveDashboardOptions) {
  const [liveMode, setLiveMode] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [liveEvents, setLiveEvents] = useState<{ type: string; payload: any; time: number }[]>([])

  const loadDashboardStats = async () => {
    try {
      const stats = await dashboardApi.getStats()
      setDashboardStats(stats)
    } catch {
      // silent
    }
  }

  // 看板实时刷新：每 10s 静默拉取 Agent 列表与人工审核队列（页面隐藏时跳过）
  useEffect(() => {
    if (!liveMode) return
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      loadAgents({ silent: true })
      loadReviewQueue({ silent: true })
      if (drawerOpen && selectedAgent) {
        loadAssignments(selectedAgent, { silent: true })
      }
    }, 10000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode, statusFilter, reviewActionFilter, searchText, drawerOpen, selectedAgent])

  // 自动 dispatch：每 60s 对开启策略的活跃 coordinator 自动触发派活
  useEffect(() => {
    if (!liveMode) return
    const timer = window.setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      const coordinators = agents.filter(a => {
        if (a.kind !== 'coordinator' || a.status !== 'active') {
          return false
        }
        return getAgentDispatchPolicy(a).auto_dispatch_enabled === true
      })
      for (const coord of coordinators) {
        try {
          await agentsApi.dispatchTasks(coord.id, normalizeDispatchOptions(getAgentDispatchPolicy(coord)))
        } catch {
          // silent — may fail if no claimable tasks, that's fine
        }
      }
      loadAgents({ silent: true })
      loadReviewQueue({ silent: true })
    }, 60000)
    return () => window.clearInterval(timer)
  }, [liveMode, agents])

  // SSE: server pushes collaboration events → silent refresh + live feed
  useCollaborationSSE({
    enabled: liveMode,
    onEvent: useCallback((event: any) => {
      loadAgents({ silent: true })
      loadReviewQueue({ silent: true })
      if (drawerOpen && selectedAgent) {
        loadAssignments(selectedAgent, { silent: true })
      }
      // Sandbox violation alerts — surface immediately
      const et = event.event_type || ''
      if (et === 'sandbox_violation' || et === 'sandbox_step_violation') {
        const p = event.payload || {}
        notification.warning({
          key: `sandbox-${et}-${p.execution_id || p.run_id}-${Date.now()}`,
          message: '沙盒策略违规',
          description: `${et === 'sandbox_step_violation' ? `步骤 ${p.step_key} (运行 #${p.run_id})` : `执行 #${p.execution_id}`} — 违规类型: ${p.violation_type}${p.terminated ? ' (已终止)' : ''}`,
          placement: 'topRight',
          duration: 8,
        })
      } else if (et === 'sandbox_execution_revoked') {
        notification.info({
          message: '沙盒执行已吊销',
          description: `执行 #${(event.payload || {}).execution_id} 已被手动终止`,
          placement: 'topRight',
          duration: 5,
        })
      } else if (et === 'conflicts_detected') {
        notification.warning({
          message: '检测到协作冲突',
          description: `扫描发现 ${(event.payload || {}).count || 0} 个新冲突，请前往「冲突」面板处理`,
          placement: 'topRight',
          duration: 8,
        })
      } else if (et === 'conflict_resolved') {
        notification.success({
          message: '冲突已解决',
          description: `冲突 #${(event.payload || {}).conflict_id} 已通过 ${(event.payload || {}).strategy || ''} 策略解决`,
          placement: 'topRight',
          duration: 5,
        })
      } else if (et === 'conflicts_auto_resolved') {
        notification.success({
          message: '冲突自动解决完成',
          description: `维护扫描自动解决了 ${(event.payload || {}).count || 0} 个低严重度冲突`,
          placement: 'topRight',
          duration: 6,
        })
      }
      // Push to live event feed
      setLiveEvents(prev => [
        { type: event.event_type || 'unknown', payload: event.payload, time: Date.now() },
        ...prev,
      ].slice(0, MAX_LIVE_EVENTS))
    }, [drawerOpen, selectedAgent]),
  })

  return {
    liveMode, setLiveMode,
    dashboardStats, setDashboardStats,
    liveEvents, setLiveEvents,
    loadDashboardStats,
  }
}
