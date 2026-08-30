import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Row, Col, Statistic, Spin, message, List, Tag, Select, Table, Tooltip, Empty, Space, Button, Popconfirm, Modal, DatePicker, Segmented, Input, InputNumber, Dropdown, Checkbox, Slider, Badge, Alert } from 'antd'
import {
  ProjectOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SwapOutlined,
  DashboardOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  WarningOutlined,
  HistoryOutlined,
  DownloadOutlined,
  DownOutlined,
  LineChartOutlined,
  ShareAltOutlined,
  SearchOutlined,
  ExpandOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { dashboardApi, type DashboardStats } from '../api/dashboard'
import { tasksApi, type TaskDependencyChainAnalysis, type TaskCommentSentimentTrend, type TaskReworkAnalysis } from '../api/tasks'
import { agentsApi, type OrchestrationResult, type OrchestratorStatus, type OrchestratorHistoryResult, type OrchestratorDailyTrend, type SecurityDailyTrend, type SecurityByAgent, type CollaborationGraph, type CollaborationGraphTimeline, type TaskAllocationFairness, type AgentRunResourceTrend, type SandboxViolationTrend, type SandboxViolationsByAgent, type SandboxTemplateUsage, type AgentSkillMatching, type AgentTaskHandoffStats, type AgentWorkloadForecast, type KnowledgePropagationNetwork, type ProtocolDecisionLatency, type AgentSpecializationEvolution, type AgentExperiencesDecayAlerts, type AgentCrossProjectEfficiency, type AgentCapabilitySupplyDemand, type AgentIdleRanking } from '../api/agents'
import ActivityHeatmap from '../components/ActivityHeatmap'
import MiniTrendChart from '../components/MiniTrendChart'
import SecurityTrendSection from '../components/SecurityTrendSection'
import SecurityEventListItem from '../components/SecurityEventListItem'
import SecurityEventDetailModal from '../components/SecurityEventDetailModal'
import CollaborationGraphView from '../components/CollaborationGraphView'
import ReputationTrendPopover from '../components/ReputationTrendPopover'
import PlatformActivityTrendSection from '../components/PlatformActivityTrendSection'
import ExperiencesSection from './dashboard/ExperiencesSection'
import TaskAnalyticsSection from './dashboard/TaskAnalyticsSection'
import AgentAnalyticsSection from './dashboard/AgentAnalyticsSection'
import ConflictSection from './dashboard/ConflictSection'
import CollaborationMetricsCard from './dashboard/CollaborationMetricsCard'
import AgentMonitorCard from './dashboard/AgentMonitorCard'
import SandboxMonitorCard from './dashboard/SandboxMonitorCard'
import OrchestrationCard from './dashboard/OrchestrationCard'
import SecurityEventsCard from './dashboard/SecurityEventsCard'
import CollaborationGraphCard from './dashboard/CollaborationGraphCard'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { useCollaborationSSE } from '../hooks/useCollaborationSSE'

const { Title, Paragraph, Text } = Typography

const _formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
  return `${(seconds / 3600).toFixed(1)}小时`
}

const _KIND_LABELS: Record<string, string> = {
  assistant: '助手',
  autonomous: '自主',
  coordinator: '协调者',
  external: '外部',
}

const IDLE_STAGE_COLOR: Record<string, string> = { active: '#52c41a', idle: '#1890ff', stale: '#faad14', dormant: '#ff4d4f', never: '#8c8c8c' }
const IDLE_STAGE_ZH: Record<string, string> = { active: '活跃', idle: '空闲', stale: '陈旧', dormant: '休眠', never: '从未' }
const stageColor = (s: string) => IDLE_STAGE_COLOR[s] || '#8c8c8c'
const stageZh = (s: string) => IDLE_STAGE_ZH[s] || s

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { tp, tc, pageTitle } = usePageTranslation('dashboard')

  // Collaboration metrics state
  const [collabMetrics, setCollabMetrics] = useState<any>(null)
  const [collabLoading, setCollabLoading] = useState(false)
  const [collabDays, setCollabDays] = useState(7)

  // Agent monitor state
  const [monitorData, setMonitorData] = useState<any>(null)
  const [monitorLoading, setMonitorLoading] = useState(false)
  const [monitorHours, setMonitorHours] = useState(24)

  // Sandbox monitor state
  const [sandboxData, setSandboxData] = useState<any>(null)
  const [sandboxLoading, setSandboxLoading] = useState(false)
  const [sandboxViolationTrend, setSandboxViolationTrend] = useState<SandboxViolationTrend | null>(null)
  const [sandboxViolationsByAgent, setSandboxViolationsByAgent] = useState<SandboxViolationsByAgent | null>(null)
  const [sandboxTemplateUsage, setSandboxTemplateUsage] = useState<SandboxTemplateUsage | null>(null)
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityTrend, setSecurityTrend] = useState<SecurityDailyTrend | null>(null)
  const [securityByAgent, setSecurityByAgent] = useState<SecurityByAgent | null>(null)
  const [securityFilter, setSecurityFilter] = useState<string>('')
  const [securitySeverity, setSecuritySeverity] = useState<string>('')
  const [securitySearch, setSecuritySearch] = useState<string>('')
  const [securitySince, setSecuritySince] = useState<string>('')
  const [securityUntil, setSecurityUntil] = useState<string>('')
  const [exporting, setExporting] = useState(false)
  // Global orchestrator state
  const [orchestration, setOrchestration] = useState<OrchestrationResult | null>(null)
  const [orchestrationLoading, setOrchestrationLoading] = useState(false)
  const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatus | null>(null)
  // Orchestrator history
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyData, setHistoryData] = useState<OrchestratorHistoryResult | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<string>('')
  const [orchDailyTrend, setOrchDailyTrend] = useState<OrchestratorDailyTrend | null>(null)
  const [eventDetail, setEventDetail] = useState<any>(null)
  const [collabGraph, setCollabGraph] = useState<CollaborationGraph | null>(null)
  const [collabTimeline, setCollabTimeline] = useState<CollaborationGraphTimeline | null>(null)
  const [collabTimelineIdx, setCollabTimelineIdx] = useState(0)
  const [taskAllocationFairness, setTaskAllocationFairness] = useState<TaskAllocationFairness | null>(null)
  const [agentRunResourceTrend, setAgentRunResourceTrend] = useState<AgentRunResourceTrend | null>(null)
  const [depChain, setDepChain] = useState<TaskDependencyChainAnalysis | null>(null)
  const [skillMatching, setSkillMatching] = useState<AgentSkillMatching | null>(null)
  const [commentSentiment, setCommentSentiment] = useState<TaskCommentSentimentTrend | null>(null)
  const [reworkAnalysis, setReworkAnalysis] = useState<TaskReworkAnalysis | null>(null)
  const [handoffStats, setHandoffStats] = useState<AgentTaskHandoffStats | null>(null)
  const [workloadForecast, setWorkloadForecast] = useState<AgentWorkloadForecast | null>(null)
  const [specializationEvo, setSpecializationEvo] = useState<AgentSpecializationEvolution | null>(null)
  const [decayAlerts, setDecayAlerts] = useState<AgentExperiencesDecayAlerts | null>(null)
  const [crossProjEff, setCrossProjEff] = useState<AgentCrossProjectEfficiency | null>(null)
  const [capSupplyDemand, setCapSupplyDemand] = useState<AgentCapabilitySupplyDemand | null>(null)
  const [idleRanking, setIdleRanking] = useState<AgentIdleRanking | null>(null)
  const [propagationNet, setPropagationNet] = useState<KnowledgePropagationNetwork | null>(null)
  const [protocolLatency, setProtocolLatency] = useState<ProtocolDecisionLatency | null>(null)
  const [collabGraphLoading, setCollabGraphLoading] = useState(false)
  const collabSvgRef = useRef<SVGSVGElement>(null)
  // 节点点击展开的协作明细 Modal
  const [collabDetail, setCollabDetail] = useState<{ agentId: number; name: string; list: any[]; loading: boolean } | null>(null)

  const agentCollaboration = stats?.agent_collaboration
  const reviewOrExpiredAssignments =
    (agentCollaboration?.assignments.review || 0) + (agentCollaboration?.assignments.expired_leases || 0)
  const hasExpiredLeases = (agentCollaboration?.assignments.expired_leases || 0) > 0

  // 设置网页标题
  useEffect(() => {
    document.title = `${pageTitle} - Todo for AI`

    // 组件卸载时恢复默认标题
    return () => {
      document.title = 'Todo for AI'
    }
  }, [pageTitle])

  // 全屏协作图尺寸随窗口自适应
  useEffect(() => {
    const update = () => {
      const s = Math.min(window.innerWidth - 80, window.innerHeight - 160, 900)
      setGraphFullscreenSize(Math.max(360, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // 加载仪表盘数据
  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
      message.error(tc('messages.error.general'))
    } finally {
      setLoading(false)
    }
  }

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

  const loadSandboxData = useCallback(async () => {
    setSandboxLoading(true)
    try {
      const result = await agentsApi.getSandboxDashboard()
      setSandboxData(result)
      agentsApi.getSandboxViolationTrend(30).then(setSandboxViolationTrend).catch(() => {})
      agentsApi.getSandboxViolationsByAgent(30, 8).then(setSandboxViolationsByAgent).catch(() => {})
      agentsApi.getSandboxTemplateUsage().then(setSandboxTemplateUsage).catch(() => {})
      agentsApi.getCollaborationGraphTimeline(14, 'day', 30).then(setCollabTimeline).catch(() => {})
    } catch {
      // silent
    } finally {
      setSandboxLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSandboxData()
  }, [loadSandboxData])


  const buildSecurityParams = useCallback((filter?: string) => ({
    per_page: 50,
    event_type: filter || undefined,
    severity: securitySeverity || undefined,
    search: securitySearch || undefined,
    since: securitySince || undefined,
    until: securityUntil || undefined,
  }), [securitySeverity, securitySearch, securitySince, securityUntil])

  const loadSecurityEvents = useCallback(async (filter?: string) => {
    setSecurityLoading(true)
    try {
      const params = buildSecurityParams(filter)
      const [result, trend, byAgent] = await Promise.all([
        agentsApi.getSecurityEvents(params),
        agentsApi.getSecurityEventsDailyTrend(params).catch(() => null),
        agentsApi.getSecurityEventsByAgent(params).catch(() => null),
      ])
      setSecurityEvents(result.items)
      setSecurityTrend(trend)
      setSecurityByAgent(byAgent)
    } catch {
      // silent
    } finally {
      setSecurityLoading(false)
    }
  }, [buildSecurityParams])

  useEffect(() => {
    loadSecurityEvents()
  }, [loadSecurityEvents])

  // 平台活动统一趋势：编排按天趋势 + 安全事件按天趋势，受 trendWindow 驱动
  const [trendWindow, setTrendWindow] = useState<string>('30')
  const [trendSeverity, setTrendSeverity] = useState<string>('')
  const [trendEventType, setTrendEventType] = useState<string>('')
  const [unifiedSecTrend, setUnifiedSecTrend] = useState<SecurityDailyTrend | null>(null)
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

  // Agent 协作关系图
  const [graphWindow, setGraphWindow] = useState<string>('30')
  const [graphLayout, setGraphLayout] = useState<'circular' | 'grid' | 'force'>('circular')
  // 力导向参数：从 localStorage 恢复，变更时持久化
  const FORCE_PARAMS_KEY = 'collabGraphForceParams'
  const loadForceParams = (): { repulsion: number; linkDistance: number } => {
    try {
      const raw = localStorage.getItem(FORCE_PARAMS_KEY)
      if (raw) {
        const p = JSON.parse(raw)
        return {
          repulsion: typeof p.repulsion === 'number' ? p.repulsion : 1,
          linkDistance: typeof p.linkDistance === 'number' ? p.linkDistance : 1,
        }
      }
    } catch { /* ignore */ }
    return { repulsion: 1, linkDistance: 1 }
  }
  const [initialForceParams] = useState(loadForceParams)
  const [forceRepulsion, setForceRepulsion] = useState(initialForceParams.repulsion)
  const [forceLinkDistance, setForceLinkDistance] = useState(initialForceParams.linkDistance)
  useEffect(() => {
    try { localStorage.setItem(FORCE_PARAMS_KEY, JSON.stringify({ repulsion: forceRepulsion, linkDistance: forceLinkDistance })) } catch { /* ignore */ }
  }, [forceRepulsion, forceLinkDistance])
  const [graphKinds, setGraphKinds] = useState<string[]>([])
  const [graphSearch, setGraphSearch] = useState('')
  const [graphMinCount, setGraphMinCount] = useState<number | null>(null)
  const [graphResetKey, setGraphResetKey] = useState(0)
  const [graphShowLabels, setGraphShowLabels] = useState(false)
  const [graphFullscreen, setGraphFullscreen] = useState(false)
  const [graphFullscreenSize, setGraphFullscreenSize] = useState(720)

  // 协作图摘要（反映 kind 筛选 + minCount）：节点数/边数/最活跃协作对
  const collabSummary = useMemo(() => {
    if (!collabGraph) return null
    const kindSet = graphKinds.length > 0 ? new Set(graphKinds) : null
    const kindNodes = kindSet ? collabGraph.nodes.filter((n) => n.kind && kindSet.has(n.kind)) : collabGraph.nodes
    const kindIds = new Set(kindNodes.map((n) => n.id))
    const minC = graphMinCount && graphMinCount > 0 ? graphMinCount : 0
    const edges = collabGraph.edges.filter((e) => {
      if (kindSet && !(kindIds.has(e.source) && kindIds.has(e.target))) return false
      if (minC && e.count < minC) return false
      return true
    })
    const usedIds = new Set<number>()
    edges.forEach((e) => { usedIds.add(e.source); usedIds.add(e.target) })
    const nodes = kindNodes.filter((n) => usedIds.has(n.id))
    if (edges.length === 0) return { nodeCount: nodes.length, edgeCount: 0, topPair: null }
    const top = edges.reduce((m, e) => (e.count > m.count ? e : m), edges[0])
    const topPair = { source: nodes.find((n) => n.id === top.source)?.name, target: nodes.find((n) => n.id === top.target)?.name, count: top.count }
    return { nodeCount: nodes.length, edgeCount: edges.length, topPair }
  }, [collabGraph, graphKinds, graphMinCount])

  // 协作明细 Modal 内嵌迷你子图：以选中 Agent 为中心
  const collabDetailGraph = useMemo<CollaborationGraph | null>(() => {
    if (!collabDetail || collabDetail.list.length === 0) return null
    const center = collabDetail
    const nodes = [
      { id: center.agentId, name: center.name, kind: undefined, messages: 0 },
      ...collabDetail.list.map((c: any) => ({ id: c.agent_id, name: c.name, kind: undefined, messages: c.total })),
    ]
    nodes[0].messages = collabDetail.list.reduce((s: number, c: any) => s + (c.total || 0), 0)
    const edges = collabDetail.list.map((c: any) => ({
      source: Math.min(center.agentId, c.agent_id),
      target: Math.max(center.agentId, c.agent_id),
      count: c.total,
      ...(center.agentId < c.agent_id
        ? { source_to_target: c.sent, target_to_source: c.received }
        : { source_to_target: c.received, target_to_source: c.sent }),
    }))
    return { nodes, edges, total_edges: edges.length }
  }, [collabDetail])
  const loadCollabGraph = useCallback(async (window: string) => {
    setCollabGraphLoading(true)
    try {
      const since = window === 'all' ? undefined : dayjs().subtract(Number(window), 'day').toISOString()
      const g = await agentsApi.getCollaborationGraph(since ? { limit: 50, since } : { limit: 50 }).catch(() => null)
      setCollabGraph(g)
    } catch {
      // silent
    } finally {
      setCollabGraphLoading(false)
    }
  }, [])

  // 点击协作图节点：加载该 Agent 的 top 协作者明细
  const loadCollabDetail = useCallback(async (agentId: number, name: string) => {
    setCollabDetail({ agentId, name, list: [], loading: true })
    try {
      const result = await agentsApi.getAgentCollaborators(agentId, { limit: 10 })
      setCollabDetail({ agentId, name, list: result?.collaborators || [], loading: false })
    } catch {
      setCollabDetail({ agentId, name, list: [], loading: false })
    }
  }, [])

  useEffect(() => {
    loadCollabGraph(graphWindow)
  }, [loadCollabGraph, graphWindow])

  // 时间范围变化时重新加载（loadSecurityEvents 因依赖 buildSecurityParams 而重建，触发上面的 effect）

  // SSE-driven live refresh of the security event aggregation card
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

  // 导出当前筛选条件下的安全事件为 CSV
  const exportSecurityEvents = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    setExporting(true)
    try {
      const params = buildSecurityParams(securityFilter || undefined)
      const text = await agentsApi.exportSecurityEvents({ ...params, format })
      const mime = format === 'json' ? 'application/json;charset=utf-8;' : 'text/csv;charset=utf-8;'
      const blob = new Blob([text], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security_events_${new Date().toISOString().slice(0, 10)}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success(`安全事件已导出为 ${format.toUpperCase()}`)
    } catch {
      message.error('导出安全事件失败')
    } finally {
      setExporting(false)
    }
  }, [buildSecurityParams, securityFilter])

  // 导出协作关系图为 CSV（节点段 + 边段，反映当前 kind 筛选）
  const exportCollabGraph = useCallback(() => {
    if (!collabGraph || (!collabGraph.nodes.length && !collabGraph.edges.length)) {
      message.warning('暂无协作关系数据可导出')
      return
    }
    const kindSet = graphKinds.length > 0 ? new Set(graphKinds) : null
    const kindNodes = kindSet ? collabGraph.nodes.filter((n) => n.kind && kindSet.has(n.kind)) : collabGraph.nodes
    const kindIds = new Set(kindNodes.map((n) => n.id))
    const minC = graphMinCount && graphMinCount > 0 ? graphMinCount : 0
    const edges = collabGraph.edges.filter((e) => {
      if (kindSet && !(kindIds.has(e.source) && kindIds.has(e.target))) return false
      if (minC && e.count < minC) return false
      return true
    })
    const usedIds = new Set<number>()
    edges.forEach((e) => { usedIds.add(e.source); usedIds.add(e.target) })
    const nodes = kindNodes.filter((n) => usedIds.has(n.id))
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines: string[] = []
    lines.push('# 节点')
    lines.push(['id', 'name', 'kind', 'messages'].map(esc).join(','))
    nodes.forEach((n) => lines.push([n.id, n.name, n.kind ?? '', n.messages].map(esc).join(',')))
    lines.push('')
    lines.push('# 边')
    lines.push(['source', 'target', 'count', 'source_to_target', 'target_to_source'].map(esc).join(','))
    edges.forEach((e) => lines.push([e.source, e.target, e.count, e.source_to_target ?? 0, e.target_to_source ?? 0].map(esc).join(',')))
    const text = '﻿' + lines.join('\n')
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collaboration_graph_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('协作关系图已导出为 CSV')
  }, [collabGraph, graphKinds, graphMinCount])

  // 导出协作关系图为 SVG 图片（保留可视化形态）
  const exportCollabGraphSvg = useCallback(() => {
    const svg = collabSvgRef.current
    if (!svg) {
      message.warning('暂无可导出的图形')
      return
    }
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const text = new XMLSerializer().serializeToString(clone)
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + text], { type: 'image/svg+xml;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collaboration_graph_${new Date().toISOString().slice(0, 10)}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('协作关系图已导出为 SVG')
  }, [])

  // 导出协作关系图为 PNG（SVG → Canvas → PNG）
  const exportCollabGraphPng = useCallback(() => {
    const svg = collabSvgRef.current
    if (!svg) {
      message.warning('暂无可导出的图形')
      return
    }
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(svg.viewBox.baseVal.width || svg.clientWidth || 380))
    clone.setAttribute('height', String(svg.viewBox.baseVal.height || svg.clientHeight || 380))
    const text = new XMLSerializer().serializeToString(clone)
    const svgBlob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + text], { type: 'image/svg+xml;charset=utf-8;' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const w = Number(clone.getAttribute('width')) || 380
      const h = Number(clone.getAttribute('height')) || 380
      const scale = 2 // 2x 提升清晰度
      const canvas = document.createElement('canvas')
      canvas.width = w * scale
      canvas.height = h * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); message.error('PNG 导出失败'); return }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { message.error('PNG 导出失败'); return }
        const pngUrl = URL.createObjectURL(pngBlob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = `collaboration_graph_${new Date().toISOString().slice(0, 10)}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(pngUrl)
        message.success('协作关系图已导出为 PNG')
      }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); message.error('PNG 导出失败：SVG 渲染失败') }
    img.src = url
  }, [])

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

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  // 获取任务状态标签颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'todo': 'default',
      'in_progress': 'processing',
      'review': 'warning',
      'done': 'success',
      'cancelled': 'error'
    }
    return colors[status] || 'default'
  }

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

  const owned = stats?.scopes?.owned || {
    projects: stats?.projects || { total: 0, active: 0 },
    tasks: stats?.tasks || { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, ai_executing: 0 },
  }
  const participated = stats?.scopes?.participated || owned
  const orgSummary = stats?.organizations?.summary || { total: 0, total_agents: 0, active_agents_7d: 0 }
  const topOrganizations = stats?.organizations?.top_organizations || []

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          {pageTitle}
        </Title>
        <Paragraph className="page-description">
          {tp('subtitle')}
        </Paragraph>
      </div>

      <Title level={4} style={{ marginTop: 0 }}>
        {tp('sections.ownedScope')}
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.ownedProjects')}
              value={owned.projects.total || 0}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.ownedTasks')}
              value={owned.tasks.total || 0}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.ownedInProgress')}
              value={(owned.tasks.in_progress || 0) + (owned.tasks.review || 0)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.ownedAiExecuting')}
              value={owned.tasks.ai_executing || 0}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Agent 协作概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('agentCollaboration.activeAgents')}
              value={agentCollaboration?.agents.active || 0}
              prefix={<TeamOutlined />}
              suffix={`/ ${agentCollaboration?.agents.total || 0}`}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('agentCollaboration.activeAssignments')}
              value={agentCollaboration?.assignments.active || 0}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('agentCollaboration.waitingHuman')}
              value={agentCollaboration?.assignments.waiting_human || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('agentCollaboration.reviewAndExpired')}
              value={reviewOrExpiredAssignments}
              prefix={hasExpiredLeases ? <FieldTimeOutlined /> : <SafetyCertificateOutlined />}
              valueStyle={{ color: hasExpiredLeases ? '#cf1322' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Title level={4}>{tp('sections.organizationAgentStats')}</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.totalOrganizations')}
              value={orgSummary.total || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.totalAgents')}
              value={orgSummary.total_agents || 0}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#531dab' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.activeAgents7d')}
              value={orgSummary.active_agents_7d || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#389e0d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card title={tp('sections.topOrganizations')} variant="borderless" loading={loading}>
            {topOrganizations.length > 0 ? (
              <List
                dataSource={topOrganizations}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<TeamOutlined style={{ color: '#1677ff' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{item.organization_name}</span>
                          <Tag color="blue">
                            {tp('labels.myRole')}: {item.my_role}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div>
                            {tp('stats.activeAgents7d')}: <strong>{item.active_agents_7d}</strong> / {tp('stats.totalAgents')}:{' '}
                            <strong>{item.total_agents}</strong>
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            <CalendarOutlined style={{ marginRight: '4px' }} />
                            {tp('labels.lastAgentActivity')}: {formatDateTime(item.last_agent_activity_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <TeamOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>{tp('empty.noOrganizations')}</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 活跃度热力图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <ActivityHeatmap />
        </Col>
      </Row>

      {/* 协作指标 */}
      <CollaborationMetricsCard
        collabMetrics={collabMetrics}
        collabLoading={collabLoading}
        collabDays={collabDays}
        onDaysChange={setCollabDays}
        onRefresh={loadCollabMetrics}
      />

      {/* Agent 协作关系图 */}
      <Card
        title={
          <Space>
            <ShareAltOutlined /> Agent 协作关系图
            {collabSummary && (
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                {collabSummary.nodeCount} 节点 · {collabSummary.edgeCount} 边
                {collabSummary.topPair && ` · 最活跃: ${collabSummary.topPair.source} ↔ ${collabSummary.topPair.target} (${collabSummary.topPair.count})`}
              </Text>
            )}
          </Space>
        }
        style={{ marginBottom: 24 }}
        extra={
          <Space wrap>
            <Segmented
              size="small"
              value={graphLayout}
              onChange={(v) => setGraphLayout(v as 'circular' | 'grid' | 'force')}
              options={[
                { value: 'circular', label: '环形' },
                { value: 'grid', label: '网格' },
                { value: 'force', label: '力导向' },
              ]}
            />
            {graphLayout === 'force' && (
              <Space size={8}>
                <Tooltip title="斥力强度（越大越分散）">
                  <Space size={4}><Text type="secondary" style={{ fontSize: 11 }}>斥力</Text><Slider min={0.2} max={3} step={0.1} value={forceRepulsion} onChange={setForceRepulsion} style={{ width: 80, margin: 0 }} /></Space>
                </Tooltip>
                <Tooltip title="链接距离（越大边越长）">
                  <Space size={4}><Text type="secondary" style={{ fontSize: 11 }}>距离</Text><Slider min={0.2} max={3} step={0.1} value={forceLinkDistance} onChange={setForceLinkDistance} style={{ width: 80, margin: 0 }} /></Space>
                </Tooltip>
              </Space>
            )}
            <Segmented
              size="small"
              value={graphWindow}
              onChange={(v) => setGraphWindow(v as string)}
              options={[
                { value: '7', label: '7天' },
                { value: '30', label: '30天' },
                { value: 'all', label: '全部' },
              ]}
            />
            <Select
              size="small"
              mode="multiple"
              maxTagCount="responsive"
              style={{ minWidth: 140 }}
              placeholder="全部类型"
              value={graphKinds}
              onChange={setGraphKinds}
              options={[
                { value: 'coordinator', label: '协调者' },
                { value: 'autonomous', label: '自主型' },
                { value: 'assistant', label: '助手型' },
                { value: 'external', label: '外部' },
              ]}
            />
            <Dropdown menu={{
              items: [
                { key: 'csv', label: '导出 CSV', onClick: exportCollabGraph },
                { key: 'svg', label: '导出 SVG', onClick: exportCollabGraphSvg },
                { key: 'png', label: '导出 PNG', onClick: exportCollabGraphPng },
              ],
            }}>
              <Button size="small" icon={<DownloadOutlined />}>导出</Button>
            </Dropdown>
            <Input
              size="small"
              allowClear
              style={{ width: 140 }}
              placeholder="搜索 Agent 名称"
              prefix={<SearchOutlined />}
              value={graphSearch}
              onChange={(e) => setGraphSearch(e.target.value)}
            />
            <InputNumber
              size="small"
              min={1}
              placeholder="最低消息量"
              value={graphMinCount}
              onChange={(v) => setGraphMinCount(v ?? null)}
            />
            <Button size="small" icon={<ReloadOutlined />} onClick={() => { try { localStorage.removeItem('collabGraphPositions') } catch { /* ignore */ } setGraphResetKey((k) => k + 1) }}>重置布局</Button>
            <Checkbox checked={graphShowLabels} onChange={(e) => setGraphShowLabels(e.target.checked)}>边标签</Checkbox>
            <Button size="small" icon={<ExpandOutlined />} onClick={() => setGraphFullscreen(true)}>全屏</Button>
          </Space>
        }
      >
        <Spin spinning={collabGraphLoading}>
          <CollaborationGraphView
            key={graphResetKey}
            ref={collabSvgRef}
            data={collabGraph}
            size={380}
            layout={graphLayout}
            filterKinds={graphKinds.length > 0 ? graphKinds : undefined}
            searchTerm={graphSearch || undefined}
            minCount={graphMinCount ?? undefined}
            showEdgeLabels={graphShowLabels}
            storageKey="collabGraphPositions"
            forceRepulsion={forceRepulsion}
            forceLinkDistance={forceLinkDistance}
            onNodeClick={(agentId) => {
              const node = collabGraph?.nodes.find((n) => n.id === agentId)
              loadCollabDetail(agentId, node?.name || `Agent#${agentId}`)
            }}
          />
        </Spin>
      </Card>

      {/* Collaboration Graph Timeline Replay */}
      {collabTimeline && collabTimeline.snapshots.length > 0 && (
        <Card
          title={<Space><HistoryOutlined /> 协作图时段回放</Space>}
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {collabTimeline.snapshots[collabTimelineIdx]?.date} · {collabTimeline.snapshots[collabTimelineIdx]?.active_agents ?? 0} Agent · {collabTimeline.snapshots[collabTimelineIdx]?.total_edges ?? 0} 边
              </Text>
            </Space>
          }
        >
          <div>
            <Slider
              min={0}
              max={Math.max(0, collabTimeline.snapshots.length - 1)}
              value={collabTimelineIdx}
              onChange={setCollabTimelineIdx}
              marks={collabTimeline.snapshots.length <= 14 ? Object.fromEntries(
                collabTimeline.snapshots.map((s, i) => [i, { label: <span style={{ fontSize: 9 }}>{s.date.slice(5)}</span> }])
              ) : undefined}
              tooltip={{ formatter: (v) => collabTimeline.snapshots[v ?? 0]?.date ?? '' }}
            />
            {(() => {
              const snap = collabTimeline.snapshots[collabTimelineIdx]
              if (!snap || snap.edges.length === 0) return <Empty description="该时段无协作记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              const maxCount = Math.max(1, ...snap.edges.map(e => e.count))
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
                  {snap.edges.slice(0, 15).map((e, ei) => (
                    <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <span style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={e.source_name}>{e.source_name}</span>
                      <span style={{ color: '#bfbfbf' }}>↔</span>
                      <span style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={e.target_name}>{e.target_name}</span>
                      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 2, height: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${(e.count / maxCount) * 100}%`, height: '100%', background: `hsl(${210 - (e.count / maxCount) * 60}, 70%, 50%)`, borderRadius: 2 }} />
                      </div>
                      <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{e.count}</span>
                    </div>
                  ))}
                  {snap.edges.length > 15 && (
                    <Text type="secondary" style={{ fontSize: 10 }}>还有 {snap.edges.length - 15} 条边...</Text>
                  )}
                </div>
              )
            })()}
          </div>
        </Card>
      )}

      {/* 平台活动统一趋势：编排活动 + 安全事件同时间轴 */}
      <Card
        title={<Space><LineChartOutlined /> 平台活动统一趋势</Space>}
        style={{ marginBottom: 24 }}
        extra={
          <Space wrap>
            <Segmented
              size="small"
              value={trendEventType || 'all'}
              onChange={(v) => setTrendEventType(v === 'all' ? '' : v as string)}
              options={[
                { value: 'all', label: '全类型' },
                { value: 'sandbox_violation', label: '沙盒' },
                { value: 'conflict', label: '冲突' },
                { value: 'audit', label: '审计' },
              ]}
            />
            <Segmented
              size="small"
              value={trendSeverity || 'all'}
              onChange={(v) => setTrendSeverity(v === 'all' ? '' : v as string)}
              options={[
                { value: 'all', label: '全部' },
                { value: 'CRITICAL', label: '高危' },
                { value: 'WARNING', label: '警告' },
                { value: 'INFO', label: '普通' },
              ]}
            />
            <Segmented
              size="small"
              value={trendWindow}
              onChange={(v) => setTrendWindow(v as string)}
              options={[
                { value: '7', label: '7天' },
                { value: '30', label: '30天' },
                { value: 'all', label: '全部' },
              ]}
            />
          </Space>
        }
      >
        <PlatformActivityTrendSection
          orchestratorTrend={orchDailyTrend}
          securityTrend={unifiedSecTrend}
        />
      </Card>

      {/* Agent Real-time Monitor */}
      <AgentMonitorCard
        monitorData={monitorData}
        monitorLoading={monitorLoading}
        monitorHours={monitorHours}
        onHoursChange={setMonitorHours}
        onRefresh={loadMonitorData}
      />

      {/* Sandbox Security Monitor */}
      <SandboxMonitorCard
        sandboxData={sandboxData}
        sandboxLoading={sandboxLoading}
        sandboxViolationTrend={sandboxViolationTrend}
        sandboxViolationsByAgent={sandboxViolationsByAgent}
        sandboxTemplateUsage={sandboxTemplateUsage}
        onRefresh={loadSandboxData}
      />

      {/* Experience Library Stats */}
      <ExperiencesSection />
      {/* Task Lifecycle Stats */}
      <TaskAnalyticsSection />
      {/* Agent Composite Health */}
      <AgentAnalyticsSection />
      {/* Conflict Monitor */}
      <ConflictSection />

      {/* Security Event Aggregation */}
      <SecurityEventsCard
        securityEvents={securityEvents}
        securityLoading={securityLoading}
        securityTrend={securityTrend}
        securityByAgent={securityByAgent}
        securityFilter={securityFilter}
        securitySeverity={securitySeverity}
        securitySearch={securitySearch}
        exporting={exporting}
        onFilterChange={(filter) => { setSecurityFilter(filter || ''); loadSecurityEvents(filter) }}
        onSeverityChange={(severity) => setSecuritySeverity(severity)}
        onSearch={(search) => setSecuritySearch(search)}
        onDateRangeChange={(since, until) => { setSecuritySince(since); setSecurityUntil(until) }}
        onExport={exportSecurityEvents}
        onRefresh={() => loadSecurityEvents(securityFilter || undefined)}
        onShowDetail={(ev) => setEventDetail(ev)}
      />

      {/* Global Collaboration Orchestrator */}
      <OrchestrationCard
        orchestration={orchestration}
        orchestratorStatus={orchestratorStatus}
        orchestrationLoading={orchestrationLoading}
        onRun={runOrchestration}
        onOpenHistory={openHistory}
      />

      {/* 编排运行历史 */}
      <Modal
        title="编排运行历史"
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        width={760}
      >
        <Spin spinning={historyLoading}>
          <div style={{ marginBottom: 12 }}>
            <Space wrap size={[8, 8]}>
              <Select
                size="small"
                style={{ width: 140 }}
                placeholder="按触发来源筛选"
                value={historyFilter || undefined}
                allowClear
                onChange={(v) => {
                  setHistoryFilter(v || '')
                  loadOrchestratorHistory(v || '')
                }}
                options={[
                  { value: 'manual', label: '手动' },
                  { value: 'scheduler', label: '调度器' },
                ]}
              />
              <Button size="small" onClick={() => loadOrchestratorHistory(historyFilter)}>刷新</Button>
            </Space>
          </div>
          {historyData && (
            <div style={{ marginBottom: 12 }}>
              <Space wrap size={[8, 4]}>
                <Tag color="blue">共 {historyData.trend?.total_runs ?? 0} 次</Tag>
                <Tag>均耗时 {historyData.trend?.avg_duration ?? 0}s</Tag>
                <Tag color="purple">累计触发 {historyData.trend?.total_triggers_fired ?? 0}</Tag>
                <Tag color="green">累计解决冲突 {historyData.trend?.total_conflicts_resolved ?? 0}</Tag>
                <Tag color={historyData.trend?.total_errors ? 'error' : 'default'}>累计错误 {historyData.trend?.total_errors ?? 0}</Tag>
              </Space>
            </div>
          )}
          {/* 趋势折线图：按时间正序展示触发数/冲突解决/耗时 */}
          {historyData && historyData.items && historyData.items.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {(() => {
                const chrono = [...historyData.items].reverse() // 后端按时间倒序，反转回正序绘制
                const labels = chrono.map((r) => {
                  const d = new Date(r.created_at)
                  return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                })
                return (
                  <MiniTrendChart
                    labels={labels}
                    series={[
                      { key: 'triggers', label: '触发数', color: '#1890ff', values: chrono.map((r) => r.triggers_fired || 0) },
                      { key: 'resolved', label: '冲突解决', color: '#52c41a', values: chrono.map((r) => r.conflicts_auto_resolved || 0) },
                      { key: 'duration', label: '耗时(s)', color: '#faad14', values: chrono.map((r) => Math.round(r.duration_seconds || 0)) },
                    ]}
                    height={140}
                  />
                )
              })()}
            </div>
          )}
          {historyData && historyData.items && historyData.items.length > 0 ? (
            <List
              size="small"
              dataSource={historyData.items}
              renderItem={(run) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space size={[6, 4]}>
                        <Tag color={run.triggered_by === 'scheduler' ? 'processing' : 'blue'}>
                          {run.triggered_by === 'scheduler' ? '调度器' : '手动'}
                        </Tag>
                        <Text style={{ fontSize: 12 }}>{run.created_at}</Text>
                        {run.error_count > 0 && <Tag color="error">⚠ {run.error_count} 错误</Tag>}
                      </Space>
                    }
                    description={
                      <div style={{ fontSize: 12 }}>
                        <div>{run.summary}</div>
                        <Space size={[4, 4]} style={{ marginTop: 4 }}>
                          <Tag>离线 {run.stale_agents}</Tag>
                          <Tag>过期 {run.expired_leases}</Tag>
                          <Tag>升级 {run.escalated_tasks}</Tag>
                          <Tag>超时 {run.timed_out_steps}</Tag>
                          <Tag color="blue">触发 {run.triggers_fired}</Tag>
                          <Tag color="green">解决 {run.conflicts_auto_resolved}</Tag>
                          <Tag>耗时 {run.duration_seconds}s</Tag>
                          {run.trigger_run_ids && run.trigger_run_ids.length > 0 && (
                            <Dropdown
                              menu={{
                                items: run.trigger_run_ids.map((rid: number) => ({ key: String(rid), label: `Run #${rid}` })),
                                onClick: ({ key }) => navigate(`/todo-for-ai/pages/workflows?run_id=${key}`),
                              }}
                            >
                              <Tag color="purple" style={{ cursor: 'pointer' }}>查看运行 →</Tag>
                            </Dropdown>
                          )}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无编排历史记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Modal>

      {/* 最近项目和任务 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={tp('sections.recentProjects')} variant="borderless" loading={loading}>
            {stats?.recent_projects && stats.recent_projects.length > 0 ? (
              <List
                dataSource={stats.recent_projects}
                renderItem={(project) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<ProjectOutlined style={{ color: '#1890ff' }} />}
                      title={project.name}
                      description={
                        <div>
                          <div>{project.description || tp('misc.noDescription')}</div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            <CalendarOutlined style={{ marginRight: '4px' }} />
                            {formatDate(project.updated_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <ProjectOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>{tc('empty.noProjects')}</div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={tp('sections.recentTasks')} variant="borderless" loading={loading}>
            {stats?.recent_tasks && stats.recent_tasks.length > 0 ? (
              <List
                dataSource={stats.recent_tasks}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CheckSquareOutlined style={{ color: '#52c41a' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{task.title}</span>
                          <Tag color={getStatusColor(task.status)}>
                            {getStatusText(task.status)}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ color: '#666' }}>
                            {task.project?.name || tp('misc.unknownProject')}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            <CalendarOutlined style={{ marginRight: '4px' }} />
                            {formatDate(task.updated_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <CheckSquareOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>{tc('empty.noTasks')}</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 安全事件详情 Modal */}
      <SecurityEventDetailModal
        event={eventDetail}
        onClose={() => setEventDetail(null)}
        onRunClick={(runId) => navigate(`/todo-for-ai/pages/workflows?run_id=${runId}`)}
      />

      {/* 协作图节点点击：协作明细 Modal */}
      <Modal
        title={`${collabDetail?.name || ''} 的协作伙伴`}
        open={!!collabDetail}
        onCancel={() => setCollabDetail(null)}
        footer={[
          <Button key="detail" type="link" onClick={() => { if (collabDetail) navigate(`/todo-for-ai/pages/agents?agent_id=${collabDetail.agentId}`) }}>
            查看 Agent 详情
          </Button>,
          <Button key="close" onClick={() => setCollabDetail(null)}>关闭</Button>,
        ]}
      >
        <Spin spinning={collabDetail?.loading}>
          {collabDetail && collabDetail.list.length > 0 ? (
            <>
              {collabDetailGraph && (
                <div style={{ marginBottom: 12 }}>
                  <CollaborationGraphView
                    data={collabDetailGraph}
                    size={260}
                    layout="grid"
                    centerNodeId={collabDetail.agentId}
                    storageKey={`collabGraphDetail_${collabDetail.agentId}`}
                  />
                </div>
              )}
              <List
                size="small"
                dataSource={collabDetail.list}
                renderItem={(c: any) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#1890ff' }}>{c.name}</Text>
                      <Space size={4}>
                        <Tag>发 {c.sent}</Tag>
                        <Tag>收 {c.received}</Tag>
                        <Tag color="blue">合计 {c.total}</Tag>
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            </>
          ) : (
            <Text type="secondary">暂无协作伙伴记录</Text>
          )}
        </Spin>
      </Modal>

      {/* 协作关系图全屏 Modal */}
      <Modal
        title="Agent 协作关系图（全屏）"
        open={graphFullscreen}
        onCancel={() => setGraphFullscreen(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        destroyOnClose
      >
        <CollaborationGraphView
          data={collabGraph}
          size={graphFullscreenSize}
          layout={graphLayout}
          filterKinds={graphKinds.length > 0 ? graphKinds : undefined}
          searchTerm={graphSearch || undefined}
          minCount={graphMinCount ?? undefined}
          showEdgeLabels={graphShowLabels}
          storageKey="collabGraphPositions"
          forceRepulsion={forceRepulsion}
          forceLinkDistance={forceLinkDistance}
          onNodeClick={(agentId) => {
            const node = collabGraph?.nodes.find((n) => n.id === agentId)
            setGraphFullscreen(false)
            loadCollabDetail(agentId, node?.name || `Agent#${agentId}`)
          }}
        />
      </Modal>
    </div>
  )
}

export default Dashboard
