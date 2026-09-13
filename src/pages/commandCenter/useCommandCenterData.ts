import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Row, Col, Statistic, Spin, message, List, Tag, Space, Button, Tooltip, Empty, Badge, Alert, Popconfirm, Modal, Form, Select, Input, InputNumber, Segmented, Dropdown, Checkbox, Slider } from 'antd'
import {
  ReloadOutlined,
  ApiOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  ControlOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineChartOutlined,
  ShareAltOutlined,
  SearchOutlined,
  ExpandOutlined,
} from '@ant-design/icons'
import { dashboardApi } from '../../api/dashboard'
import { agentsApi, type OrchestratorStatus, type ConflictsTrend, type ConflictsByAgent, type ConflictsStrategyStats } from '../../api/agents'
import dayjs from 'dayjs'
import SecurityTrendSection from '../../components/SecurityTrendSection'
import SecurityEventListItem from '../../components/SecurityEventListItem'
import SecurityEventDetailModal from '../../components/SecurityEventDetailModal'
import CollaborationGraphView from '../../components/CollaborationGraphView'
import PlatformActivityTrendSection from '../../components/PlatformActivityTrendSection'
import ConflictsTrendChart from '../../components/ConflictsTrendChart'
import { useCollaborationSSE } from '../../hooks/useCollaborationSSE'
import { useTranslation } from '../../i18n/hooks/useTranslation'
import { CommandCenterStatsRow, SecurityEventTrendAlert, QuickActionsCard, AgentMonitorCard, SecurityEventsCard, OrchestratorStatusCard, PRApprovalsCard } from '../command-center'
import { PageIntro } from '../../components/common/PageIntro'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Title, Text, Paragraph } = Typography

/**
 * Agent 协作指挥中心：单一页面聚合 Agent 监控、安全事件、冲突、编排状态
 * 四大数据源，作为统一指挥入口。支持手动刷新与 SSE 实时刷新。
 */

/**
指挥中心数据面板：监控/冲突/安全/编排器状态、统一趋势筛选、解决冲突与导出动作。由 CommandCenter 原样拆出。
 */
export function useCommandCenterData() {
  const [loading, setLoading] = useState(false)
  const [monitorData, setMonitorData] = useState<any>(null)
  const [conflictData, setConflictData] = useState<any>(null)
  const [conflictList, setConflictList] = useState<any[]>([])
  const [conflictTrend, setConflictTrend] = useState<ConflictsTrend | null>(null)
  const [conflictsByAgent, setConflictsByAgent] = useState<ConflictsByAgent | null>(null)
  const [conflictStrategyStats, setConflictStrategyStats] = useState<ConflictsStrategyStats | null>(null)
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [securityTrend, setSecurityTrend] = useState<any>(null)
  const [securityByAgent, setSecurityByAgent] = useState<any>(null)
  const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatus | null>(null)
  const [orchDailyTrend, setOrchDailyTrend] = useState<any>(null)
  // 节点点击展开的协作明细 Modal
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveForm, setResolveForm] = useState<any>({ conflict_id: 0, strategy: 'manual', description: '' })
  const [eventDetail, setEventDetail] = useState<any>(null)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string>('')  // 'orchestrate' | 'resolve' | 'export'
  const [trendWindow, setTrendWindow] = useState<string>('30')
  const [trendSeverity, setTrendSeverity] = useState<string>('')
  const [trendEventType, setTrendEventType] = useState<string>('')
  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const trendSince = trendWindow === 'all' ? undefined : dayjs().subtract(Number(trendWindow), 'day').toISOString()
      const trendParams: any = trendSince ? { since: trendSince } : {}
      if (trendSeverity) trendParams.severity = trendSeverity
      if (trendEventType) trendParams.event_type = trendEventType
      const [monitor, conflicts, conflictList, events, trend, byAgent, status, orchTrend, confTrend, confByAgent, confStrat] = await Promise.all([
        dashboardApi.getAgentMonitor({ hours: '24' }).catch(() => null),
        agentsApi.getConflictsDashboard().catch(() => null),
        agentsApi.listConflicts({ active_only: 'true' }).catch(() => ({ items: [] })),
        agentsApi.getSecurityEvents({ per_page: 10 }).catch(() => ({ items: [] })),
        agentsApi.getSecurityEventsDailyTrend(trendParams).catch(() => null),
        agentsApi.getSecurityEventsByAgent({}).catch(() => null),
        agentsApi.getOrchestratorStatus().catch(() => null),
        agentsApi.getOrchestratorDailyTrend(trendParams).catch(() => null),
        agentsApi.getConflictsTrend(30).catch(() => null),
        agentsApi.getConflictsByAgent(10).catch(() => null),
        agentsApi.getConflictsStrategyStats().catch(() => null),
      ])
      setMonitorData(monitor)
      setConflictData(conflicts)
      setConflictList(conflictList?.items || [])
      setConflictTrend(confTrend)
      setConflictsByAgent(confByAgent)
      setConflictStrategyStats(confStrat)
      setSecurityEvents(events?.items || [])
      setSecurityTrend(trend)
      setSecurityByAgent(byAgent)
      setOrchestratorStatus(status)
      setOrchDailyTrend(orchTrend)
      setLastRefresh(new Date().toLocaleTimeString('zh-CN'))
    } catch {
      if (!silent) message.error('加载指挥中心数据失败')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [trendWindow, trendSeverity, trendEventType])

  useEffect(() => {
    loadAll()
    // 每 60 秒自动刷新一次
    const id = setInterval(() => loadAll(true), 60000)
    return () => clearInterval(id)
  }, [loadAll])
  // 快捷操作：立即编排
  const runOrchestration = useCallback(async () => {
    setActionLoading('orchestrate')
    try {
      const result = await agentsApi.orchestrate()
      message.success(`编排完成（${result.duration_seconds}s，触发 ${result.triggers_fired}，解决冲突 ${result.conflicts_auto_resolved}）`)
      await loadAll(true)
    } catch {
      message.error('执行编排失败')
    } finally {
      setActionLoading('')
    }
  }, [loadAll])

  // 快捷操作：自动解决低严重度冲突
  const autoResolveConflicts = useCallback(async () => {
    setActionLoading('resolve')
    try {
      const result = await agentsApi.autoResolveConflicts()
      const resolved = result?.resolved || 0
      message.success(resolved > 0 ? `已自动解决 ${resolved} 个冲突` : '无符合条件的冲突可自动解决')
      await loadAll(true)
    } catch {
      message.error('自动解决冲突失败')
    } finally {
      setActionLoading('')
    }
  }, [loadAll])

  // 打开单个冲突解决 Modal
  const openResolveConflict = (c: any) => {
    setResolveForm({ conflict_id: c.id, strategy: c.suggested_strategy || 'manual', description: '' })
    setResolveOpen(true)
  }

  // 提交解决冲突
  const submitResolveConflict = async () => {
    try {
      const result = await agentsApi.resolveConflict(resolveForm.conflict_id, resolveForm.strategy, resolveForm.description)
      message.success('冲突已解决')
      setResolveOpen(false)
      await loadAll(true)
      if (result?.actions?.length) message.info(`执行 ${result.actions.length} 项动作`, 4)
    } catch {
      message.error('解决失败')
    }
  }

  // 快捷操作：导出安全事件 CSV
  const exportSecurityEvents = useCallback(async () => {
    setActionLoading('export')
    try {
      const csv = await agentsApi.exportSecurityEvents({})
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security_events_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('安全事件已导出')
    } catch {
      message.error('导出安全事件失败')
    } finally {
      setActionLoading('')
    }
  }, [])

  const monitorSummary = monitorData?.summary || {}
  const activeAgents = monitorSummary.active || 0
  const totalAgents = monitorSummary.total || 0
  const busyAgents = monitorSummary.busy || 0
  const offlineAgents = monitorSummary.offline || 0

  const conflictTotal = conflictData?.total || 0
  const conflictActive = conflictData?.active || 0

  const criticalEvents = securityEvents.filter((e: any) => e.severity === 'CRITICAL').length

  // 安全事件最近环比（基于按天趋势的最后两天）
  const trendDays = securityTrend?.days || []
  const trendTotal = securityTrend?.totals?.total ?? 0
  const lastDay = trendDays.length > 0 ? trendDays[trendDays.length - 1].total : 0
  const prevDay = trendDays.length > 1 ? trendDays[trendDays.length - 2].total : 0
  const dayDelta = lastDay - prevDay
  const dayDeltaPct = prevDay > 0 ? Math.round((dayDelta / prevDay) * 100) : (dayDelta > 0 ? 100 : 0)
  return {
    loading,
    setLoading,
    monitorData,
    setMonitorData,
    conflictData,
    setConflictData,
    conflictList,
    setConflictList,
    conflictTrend,
    setConflictTrend,
    conflictsByAgent,
    setConflictsByAgent,
    conflictStrategyStats,
    setConflictStrategyStats,
    securityEvents,
    setSecurityEvents,
    securityTrend,
    setSecurityTrend,
    securityByAgent,
    setSecurityByAgent,
    orchestratorStatus,
    setOrchestratorStatus,
    orchDailyTrend,
    setOrchDailyTrend,
    resolveOpen,
    setResolveOpen,
    resolveForm,
    setResolveForm,
    eventDetail,
    setEventDetail,
    lastRefresh,
    setLastRefresh,
    actionLoading,
    setActionLoading,
    trendWindow,
    setTrendWindow,
    trendSeverity,
    setTrendSeverity,
    trendEventType,
    setTrendEventType,
    loadAll,
    runOrchestration,
    autoResolveConflicts,
    openResolveConflict,
    submitResolveConflict,
    exportSecurityEvents,
    monitorSummary,
    activeAgents,
    totalAgents,
    busyAgents,
    offlineAgents,
    conflictTotal,
    conflictActive,
    criticalEvents,
    trendDays,
    trendTotal,
    lastDay,
    prevDay,
    dayDelta,
    dayDeltaPct,
  }
}
