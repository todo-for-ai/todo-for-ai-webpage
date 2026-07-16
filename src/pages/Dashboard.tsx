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
  RadarChartOutlined,
  AimOutlined,
  SwapOutlined,
  DashboardOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  WarningOutlined,
  BulbOutlined,
  HistoryOutlined,
  DownloadOutlined,
  DownOutlined,
  LineChartOutlined,
  ShareAltOutlined,
  SearchOutlined,
  ExpandOutlined,
  BookOutlined,
  FundOutlined,
  DotChartOutlined,
  HeatMapOutlined,
  BarChartOutlined,
  BugOutlined,
  UserOutlined,
  ClusterOutlined,
  AuditOutlined,
  PieChartOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { dashboardApi, type DashboardStats } from '../api/dashboard'
import { tasksApi, type TaskStats, type TaskOverdueTrend, type TaskCompletionByProject, type TaskCompletionByAssignee, type TaskOverdueByAssignee, type TaskCompletionByPriority, type TaskCompletionRateByProject, type TaskOverdueClustering, type TaskPriorityTrend, type TaskCompletionForecast, type TaskDependencyChainAnalysis, type TaskCommentSentimentTrend, type TaskReworkAnalysis } from '../api/tasks'
import { agentsApi, type OrchestrationResult, type OrchestratorStatus, type OrchestratorHistoryResult, type OrchestrationRunItem, type OrchestratorDailyTrend, type SecurityDailyTrend, type SecurityByAgent, type CollaborationGraph, type CollaborationGraphTimeline, type TaskAllocationFairness, type AgentRunResourceTrend, type SandboxViolationTrend, type SandboxViolationsByAgent, type SandboxTemplateUsage, type ExperiencesStats, type ExperiencesLowConfidence, type ExperiencesScatter, type ExperiencesReuseTrend, type ExperiencesConfidenceDecayForecast, type ExperiencesDecayByDomain, type ExperiencesDecayByTaskType, type ExperiencesConfidenceDistribution, type ExperiencesSourceDistribution, type ExperiencesPropagationChain, type ExperiencesSkillCoverageRadar, type AgentProductivity, type AgentProductivityTrend, type AgentProductivityAlerts, type AgentProductivityByKind, type AgentProductivityHourlyHeatmap, type AgentProductivityCalendarHeatmap, type AgentProductivityWeeklyComparison, type AgentFailureReasons, type AgentFailureErrorPatterns, type AgentCapabilityGapAnalysis, type ConflictsSandboxCorrelation, type AgentHealth, type AgentHealthTrend, type AgentHealthAlerts, type AgentHealthStateTransitions, type HealthWeights, type AgentRunResourceUsage, type AgentSkillMatching, type AgentTaskHandoffStats, type AgentWorkloadForecast, type KnowledgePropagationNetwork, type ProtocolDecisionLatency } from '../api/agents'
import ActivityHeatmap from '../components/ActivityHeatmap'
import MiniTrendChart from '../components/MiniTrendChart'
import SecurityTrendSection from '../components/SecurityTrendSection'
import SecurityEventListItem from '../components/SecurityEventListItem'
import SecurityEventDetailModal from '../components/SecurityEventDetailModal'
import CollaborationGraphView from '../components/CollaborationGraphView'
import WorkflowRunTrendChart from '../components/WorkflowRunTrendChart'
import ReputationTrendPopover from '../components/ReputationTrendPopover'
import PlatformActivityTrendSection from '../components/PlatformActivityTrendSection'
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
  const [experiencesStats, setExperiencesStats] = useState<ExperiencesStats | null>(null)
  const [experiencesLowConfidence, setExperiencesLowConfidence] = useState<ExperiencesLowConfidence | null>(null)
  const [experiencesScatter, setExperiencesScatter] = useState<ExperiencesScatter | null>(null)
  const [experiencesReuseTrend, setExperiencesReuseTrend] = useState<ExperiencesReuseTrend | null>(null)
  const [experiencesDecayForecast, setExperiencesDecayForecast] = useState<ExperiencesConfidenceDecayForecast | null>(null)
  const [experiencesDecayByDomain, setExperiencesDecayByDomain] = useState<ExperiencesDecayByDomain | null>(null)
  const [experiencesDecayByTaskType, setExperiencesDecayByTaskType] = useState<ExperiencesDecayByTaskType | null>(null)
  const [experiencesConfidenceDistribution, setExperiencesConfidenceDistribution] = useState<ExperiencesConfidenceDistribution | null>(null)
  const [experiencesSourceDistribution, setExperiencesSourceDistribution] = useState<ExperiencesSourceDistribution | null>(null)
  const [experiencesPropagationChain, setExperiencesPropagationChain] = useState<ExperiencesPropagationChain | null>(null)
  const [skillCoverageRadar, setSkillCoverageRadar] = useState<ExperiencesSkillCoverageRadar | null>(null)
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [taskOverdueTrend, setTaskOverdueTrend] = useState<TaskOverdueTrend | null>(null)
  const [taskOverdueByAssignee, setTaskOverdueByAssignee] = useState<TaskOverdueByAssignee | null>(null)
  const [taskOverdueClustering, setTaskOverdueClustering] = useState<TaskOverdueClustering | null>(null)
  const [taskPriorityTrend, setTaskPriorityTrend] = useState<TaskPriorityTrend | null>(null)
  const [taskCompletionForecast, setTaskCompletionForecast] = useState<TaskCompletionForecast | null>(null)
  const [taskCompletionByProject, setTaskCompletionByProject] = useState<TaskCompletionByProject | null>(null)
  const [taskCompletionByAssignee, setTaskCompletionByAssignee] = useState<TaskCompletionByAssignee | null>(null)
  const [taskCompletionByPriority, setTaskCompletionByPriority] = useState<TaskCompletionByPriority | null>(null)
  const [taskCompletionRateByProject, setTaskCompletionRateByProject] = useState<TaskCompletionRateByProject | null>(null)
  const [agentProductivity, setAgentProductivity] = useState<AgentProductivity | null>(null)
  const [productivityTrend, setProductivityTrend] = useState<AgentProductivityTrend | null>(null)
  const [productivityAlerts, setProductivityAlerts] = useState<AgentProductivityAlerts | null>(null)
  const [productivityByKind, setProductivityByKind] = useState<AgentProductivityByKind | null>(null)
  const [agentRunResourceUsage, setAgentRunResourceUsage] = useState<AgentRunResourceUsage | null>(null)
  const [agentProdWeeklyComparison, setAgentProdWeeklyComparison] = useState<AgentProductivityWeeklyComparison | null>(null)
  const [productivityHourly, setProductivityHourly] = useState<AgentProductivityHourlyHeatmap | null>(null)
  const [productivityCalendar, setProductivityCalendar] = useState<AgentProductivityCalendarHeatmap | null>(null)
  const [agentFailureReasons, setAgentFailureReasons] = useState<AgentFailureReasons | null>(null)
  const [agentFailureErrorPatterns, setAgentFailureErrorPatterns] = useState<AgentFailureErrorPatterns | null>(null)
  const [capabilityGapAnalysis, setCapabilityGapAnalysis] = useState<AgentCapabilityGapAnalysis | null>(null)
  const [conflictsSandboxCorrelation, setConflictsSandboxCorrelation] = useState<ConflictsSandboxCorrelation | null>(null)
  const [agentHealth, setAgentHealth] = useState<AgentHealth | null>(null)
  const [agentHealthTrend, setAgentHealthTrend] = useState<AgentHealthTrend | null>(null)
  const [healthTrendAgentId, setHealthTrendAgentId] = useState<number | undefined>(undefined)
  const [healthTrendLoading, setHealthTrendLoading] = useState(false)

  const reloadHealthTrend = (agentId?: number) => {
    setHealthTrendLoading(true)
    agentsApi.getAgentHealthTrend(30, agentId).then(setAgentHealthTrend).catch(() => {}).finally(() => setHealthTrendLoading(false))
  }
  const [agentHealthAlerts, setAgentHealthAlerts] = useState<AgentHealthAlerts | null>(null)
  const [healthStateTransitions, setHealthStateTransitions] = useState<AgentHealthStateTransitions | null>(null)
  const [healthWeights, setHealthWeights] = useState<HealthWeights>({ w_reputation: 0.4, w_completion: 0.3, w_conflict: 0.15, w_violation: 0.15 })
  const [healthAlertsLoading, setHealthAlertsLoading] = useState(false)

  const reloadHealthAlerts = (weights: HealthWeights) => {
    setHealthAlertsLoading(true)
    agentsApi.getAgentHealthAlerts(weights).then(setAgentHealthAlerts).catch(() => {}).finally(() => setHealthAlertsLoading(false))
  }

  // Conflict monitor state
  const [conflictData, setConflictData] = useState<any>(null)
  const [conflictLoading, setConflictLoading] = useState(false)
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
      agentsApi.getExperiencesStats().then(setExperiencesStats).catch(() => {})
      agentsApi.getExperiencesLowConfidence().then(setExperiencesLowConfidence).catch(() => {})
      agentsApi.getExperiencesScatter(200).then(setExperiencesScatter).catch(() => {})
      agentsApi.getExperiencesReuseTrend(30).then(setExperiencesReuseTrend).catch(() => {})
      agentsApi.getExperiencesConfidenceDecayForecast(30).then(setExperiencesDecayForecast).catch(() => {})
      agentsApi.getExperiencesDecayByDomain(15).then(setExperiencesDecayByDomain).catch(() => {})
      agentsApi.getExperiencesDecayByTaskType(15).then(setExperiencesDecayByTaskType).catch(() => {})
      agentsApi.getExperiencesConfidenceDistribution().then(setExperiencesConfidenceDistribution).catch(() => {})
      agentsApi.getExperiencesSourceDistribution().then(setExperiencesSourceDistribution).catch(() => {})
      agentsApi.getExperiencesPropagationChain(10).then(setExperiencesPropagationChain).catch(() => {})
      agentsApi.getExperiencesSkillCoverageRadar(6, 8).then(setSkillCoverageRadar).catch(() => {})
      tasksApi.getStats().then(setTaskStats).catch(() => {})
      tasksApi.getOverdueTrend(30).then(setTaskOverdueTrend).catch(() => {})
      tasksApi.getOverdueByAssignee(10).then(setTaskOverdueByAssignee).catch(() => {})
      tasksApi.getOverdueClustering(15).then(setTaskOverdueClustering).catch(() => {})
      tasksApi.getPriorityTrend(30).then(setTaskPriorityTrend).catch(() => {})
      tasksApi.getCompletionForecast(30).then(setTaskCompletionForecast).catch(() => {})
      tasksApi.getCompletionByProject(30, 8).then(setTaskCompletionByProject).catch(() => {})
      tasksApi.getCompletionByAssignee(30, 8).then(setTaskCompletionByAssignee).catch(() => {})
      tasksApi.getCompletionByPriority(30).then(setTaskCompletionByPriority).catch(() => {})
      tasksApi.getCompletionRateByProject(30, 10).then(setTaskCompletionRateByProject).catch(() => {})
      agentsApi.getAgentProductivity(30, 20).then(setAgentProductivity).catch(() => {})
      agentsApi.getAgentProductivityTrend(30).then(setProductivityTrend).catch(() => {})
      agentsApi.getAgentProductivityAlerts().then(setProductivityAlerts).catch(() => {})
      agentsApi.getAgentProductivityByKind(30).then(setProductivityByKind).catch(() => {})
      agentsApi.getAgentRunResourceUsage(30, 8).then(setAgentRunResourceUsage).catch(() => {})
      agentsApi.getAgentProductivityWeeklyComparison(10).then(setAgentProdWeeklyComparison).catch(() => {})
      agentsApi.getAgentProductivityHourlyHeatmap(30, 15).then(setProductivityHourly).catch(() => {})
      agentsApi.getAgentProductivityCalendarHeatmap(90, 10).then(setProductivityCalendar).catch(() => {})
      agentsApi.getAgentFailureReasons(30, 15).then(setAgentFailureReasons).catch(() => {})
      agentsApi.getAgentFailureErrorPatterns(30, 10, 40).then(setAgentFailureErrorPatterns).catch(() => {})
      agentsApi.getAgentCapabilityGapAnalysis(10, 0.5).then(setCapabilityGapAnalysis).catch(() => {})
      agentsApi.getCollaborationGraphTimeline(14, 'day', 30).then(setCollabTimeline).catch(() => {})
      agentsApi.getTaskAllocationFairness(30).then(setTaskAllocationFairness).catch(() => {})
      agentsApi.getAgentRunResourceTrend(14, 10).then(setAgentRunResourceTrend).catch(() => {})
      tasksApi.getDependencyChain(10).then(setDepChain).catch(() => {})
      agentsApi.getAgentSkillMatching(10).then(setSkillMatching).catch(() => {})
      tasksApi.getCommentSentimentTrend(30).then(setCommentSentiment).catch(() => {})
      tasksApi.getReworkAnalysis(30, 15).then(setReworkAnalysis).catch(() => {})
      agentsApi.getAgentTaskHandoffStats(30, 10).then(setHandoffStats).catch(() => {})
      agentsApi.getAgentWorkloadForecast(30, 3, 10).then(setWorkloadForecast).catch(() => {})
      agentsApi.getKnowledgePropagationNetwork(90, 20).then(setPropagationNet).catch(() => {})
      agentsApi.getProtocolDecisionLatency(30).then(setProtocolLatency).catch(() => {})
    } catch {
      // silent
    } finally {
      setSandboxLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSandboxData()
  }, [loadSandboxData])

  const loadConflictData = useCallback(async () => {
    setConflictLoading(true)
    try {
      const result = await agentsApi.getConflictsDashboard()
      setConflictData(result)
      agentsApi.getConflictsSandboxCorrelation(30, 2).then(setConflictsSandboxCorrelation).catch(() => {})
      agentsApi.getAgentHealth(30).then(setAgentHealth).catch(() => {})
      agentsApi.getAgentHealthTrend(30).then(setAgentHealthTrend).catch(() => {})
      agentsApi.getAgentHealthStateTransitions(30).then(setHealthStateTransitions).catch(() => {})
      agentsApi.getAgentHealthAlerts(healthWeights).then(setAgentHealthAlerts).catch(() => {})
    } catch {
      // silent
    } finally {
      setConflictLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConflictData()
  }, [loadConflictData])

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
      loadConflictData()
      // Also refresh scheduler status (last_run updated)
      agentsApi.getOrchestratorStatus().then(setOrchestratorStatus).catch(() => {})
    } catch {
      message.error('执行编排失败')
    } finally {
      setOrchestrationLoading(false)
    }
  }, [securityFilter, loadSecurityEvents, loadConflictData])

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

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      </div>
    )
  }
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

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('stats.totalProjects')}
              value={stats?.projects.total || 0}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('misc.totalTasks')}
              value={stats?.tasks.total || 0}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('taskStatus.in_progress')}
              value={(stats?.tasks.in_progress || 0) + (stats?.tasks.review || 0)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('taskStatus.ai_executing')}
              value={stats?.tasks.ai_executing || 0}
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

      {/* 活跃度热力图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <ActivityHeatmap />
        </Col>
      </Row>

      {/* 协作指标 */}
      <Card
        title={
          <span>
            <DashboardOutlined style={{ marginRight: 8 }} />
            多 Agent 协作指标
          </span>
        }
        extra={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              size="small"
              value={collabDays}
              onChange={setCollabDays}
              style={{ width: 120 }}
              options={[
                { value: 1, label: '最近 1 天' },
                { value: 7, label: '最近 7 天' },
                { value: 30, label: '最近 30 天' },
                { value: 90, label: '最近 90 天' },
              ]}
            />
            <Tooltip title="刷新">
              <ReloadOutlined spin={collabLoading} onClick={loadCollabMetrics} style={{ cursor: 'pointer' }} />
            </Tooltip>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Spin spinning={collabLoading}>
          {collabMetrics ? (
            <>
              {/* Core stats row */}
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="任务完成率"
                    value={collabMetrics.tasks?.completion_rate ?? 0}
                    suffix="%"
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: (collabMetrics.tasks?.completion_rate ?? 0) >= 70 ? '#52c41a' : '#faad14', fontSize: 20 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Agent 利用率"
                    value={collabMetrics.agents?.utilization_pct ?? 0}
                    suffix="%"
                    prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: (collabMetrics.agents?.utilization_pct ?? 0) >= 60 ? '#1890ff' : '#faad14', fontSize: 20 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="工作流成功率"
                    value={collabMetrics.workflows?.success_rate ?? 0}
                    suffix="%"
                    prefix={<ApartmentOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: (collabMetrics.workflows?.success_rate ?? 0) >= 80 ? '#52c41a' : '#faad14', fontSize: 20 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="任务交接"
                    value={collabMetrics.handoffs ?? 0}
                    prefix={<SwapOutlined style={{ color: '#fa8c16' }} />}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
              </Row>

              {/* Task breakdown + Agent status */}
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12}>
                  <Card size="small" title="任务状态" extra={<Tag>共 {collabMetrics.tasks?.total ?? 0} 个</Tag>}>
                    <Row gutter={8}>
                      <Col span={8}><Statistic title="进行中" value={collabMetrics.tasks?.in_progress ?? 0} valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Col>
                      <Col span={8}><Statistic title="已阻塞" value={collabMetrics.tasks?.blocked ?? 0} valueStyle={{ fontSize: 16, color: '#ff4d4f' }} /></Col>
                      <Col span={8}><Statistic title="待审查" value={collabMetrics.tasks?.review ?? 0} valueStyle={{ fontSize: 16, color: '#faad14' }} /></Col>
                    </Row>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#8c8c8c' }}>
                      平均完成时间: {_formatDuration(collabMetrics.tasks?.avg_completion_seconds ?? 0)}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" title="Agent 状态" extra={<Tag>共 {collabMetrics.agents?.total ?? 0} 个</Tag>}>
                    <Row gutter={8}>
                      <Col span={8}><Statistic title="活跃" value={collabMetrics.agents?.active ?? 0} valueStyle={{ fontSize: 16, color: '#52c41a' }} prefix={<ThunderboltOutlined />} /></Col>
                      <Col span={8}><Statistic title="暂停" value={collabMetrics.agents?.paused ?? 0} valueStyle={{ fontSize: 16, color: '#faad14' }} /></Col>
                      <Col span={8}><Statistic title="离线" value={collabMetrics.agents?.offline ?? 0} valueStyle={{ fontSize: 16, color: '#8c8c8c' }} /></Col>
                    </Row>
                    {collabMetrics.agents?.kind_distribution && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {Object.entries(collabMetrics.agents.kind_distribution).map(([k, v]) => (
                          <Tag key={k} color="blue" style={{ fontSize: 11 }}>{_KIND_LABELS[k] || k}: {v as number}</Tag>
                        ))}
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>

              {/* Trend chart */}
              {collabMetrics.trend?.length > 0 && (
                <Card size="small" title="任务趋势" style={{ marginBottom: 16 }} extra={<span style={{ fontSize: 11, color: '#8c8c8c' }}><span style={{ color: '#1890ff' }}>■</span> 创建 <span style={{ color: '#52c41a' }}>■</span> 完成</span>}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, padding: '0 4px' }}>
                    {collabMetrics.trend.map((t: any, i: number) => {
                      const maxVal = Math.max(...collabMetrics.trend.map((x: any) => Math.max(x.created, x.completed)), 1)
                      return (
                        <Tooltip key={i} title={`${t.date}: 创建 ${t.created}, 完成 ${t.completed}`}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 16 }}>
                            <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 60 }}>
                              <div style={{ width: 8, height: Math.max(2, (t.created / maxVal) * 56), background: '#1890ff', borderRadius: 2 }} />
                              <div style={{ width: 8, height: Math.max(2, (t.completed / maxVal) * 56), background: '#52c41a', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 9, color: '#8c8c8c', marginTop: 2 }}>{t.date.slice(5)}</span>
                          </div>
                        </Tooltip>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Top agents */}
              {collabMetrics.top_agents?.length > 0 && (
                <Card size="small" title="Top Agent（完成任务数）">
                  <Table
                    size="small"
                    dataSource={collabMetrics.top_agents}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: '排名', width: 60, render: (_: any, __: any, i: number) => <Tag color={i < 3 ? 'gold' : 'default'}>{i + 1}</Tag> },
                      { title: 'Agent', dataIndex: 'name', render: (name: string, r: any) => <>{name} <Tag>{_KIND_LABELS[r.kind] || r.kind}</Tag></> },
                      { title: '完成任务', dataIndex: 'completed_count', sorter: (a: any, b: any) => a.completed_count - b.completed_count },
                    ]}
                  />
                </Card>
              )}

              {/* Agent performance analysis */}
              {collabMetrics.agent_performance?.length > 0 && (
                <Card size="small" title="Agent 性能分析" style={{ marginTop: 16 }}>
                  <Table
                    size="small"
                    dataSource={collabMetrics.agent_performance}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: 'Agent', dataIndex: 'name' },
                      { title: '总分配', dataIndex: 'total_assignments', width: 80 },
                      { title: '完成', dataIndex: 'done', width: 60 },
                      { title: '失败', dataIndex: 'failed', width: 60, render: (v: number) => v > 0 ? <span style={{ color: '#ff4d4f' }}>{v}</span> : v },
                      {
                        title: '成功率',
                        dataIndex: 'success_rate',
                        width: 100,
                        sorter: (a: any, b: any) => a.success_rate - b.success_rate,
                        render: (rate: number) => (
                          <span style={{ color: rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f' }}>
                            {rate}%
                          </span>
                        ),
                      },
                    ]}
                  />
                </Card>
              )}
            </>
          ) : (
            <Empty description="暂无协作数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

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
      <Card
        title={<Space><DashboardOutlined /> Agent 实时监控</Space>}
        style={{ marginBottom: 24 }}
        extra={<Space><Select size="small" value={monitorHours} onChange={setMonitorHours} style={{ width: 100 }} options={[{ value: 6, label: '6小时' }, { value: 24, label: '24小时' }, { value: 72, label: '3天' }, { value: 168, label: '7天' }]} /><Button size="small" icon={<ReloadOutlined />} onClick={loadMonitorData} loading={monitorLoading} /></Space>}
      >
        <Spin spinning={monitorLoading}>
          {monitorData ? (
            <>
              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col span={6}><Statistic title="总 Agent" value={monitorData.summary?.total_agents || 0} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={6}><Statistic title="活跃" value={monitorData.summary?.active || 0} valueStyle={{ fontSize: 16, color: '#52c41a' }} prefix={<ThunderboltOutlined />} /></Col>
                <Col span={6}><Statistic title="离线" value={monitorData.summary?.offline || 0} valueStyle={{ fontSize: 16, color: '#8c8c8c' }} /></Col>
                <Col span={6}><Statistic title="活跃任务" value={monitorData.summary?.total_active_tasks || 0} valueStyle={{ fontSize: 16 }} /></Col>
              </Row>
              <Table
                size="small"
                dataSource={monitorData.agents || []}
                rowKey="agent_id"
                pagination={monitorData.agents?.length > 10 ? { pageSize: 10 } : false}
                scroll={{ x: 800 }}
                columns={[
                  {
                    title: 'Agent',
                    width: 160,
                    render: (_: any, r: any) => (
                      <Space>
                        <Tag color={r.real_status === 'active' ? 'green' : r.real_status === 'offline' ? 'default' : 'orange'}>{r.real_status}</Tag>
                        <span>{r.agent_name}</span>
                      </Space>
                    ),
                  },
                  { title: '类型', dataIndex: 'agent_kind', width: 70, render: (v: string) => _KIND_LABELS[v] || v },
                  { title: '角色', dataIndex: 'collaboration_role', width: 80, render: (v: string) => <Tag color="blue" style={{ fontSize: 10 }}>{v}</Tag> },
                  {
                    title: '任务',
                    dataIndex: 'active_task_count',
                    width: 60,
                    render: (v: number) => v > 0 ? <span style={{ color: '#1890ff', fontWeight: 600 }}>{v}</span> : <span style={{ color: '#8c8c8c' }}>0</span>,
                  },
                  {
                    title: '声誉',
                    width: 80,
                    render: (_: any, r: any) => r.reputation ? (
                      <ReputationTrendPopover agentId={r.agent_id} score={r.reputation.score}>
                        <span style={{ color: r.reputation.score >= 70 ? '#52c41a' : r.reputation.score >= 40 ? '#faad14' : '#ff4d4f', cursor: 'help', textDecoration: 'underline dotted' }}>
                          {r.reputation.score?.toFixed(0)}
                        </span>
                      </ReputationTrendPopover>
                    ) : '-',
                  },
                  {
                    title: '经验',
                    width: 70,
                    render: (_: any, r: any) => <span>{r.experience_count || 0}<Text type="secondary" style={{ fontSize: 10 }}>({r.shared_experience_count || 0}共享)</Text></span>,
                  },
                  {
                    title: '跨项目',
                    dataIndex: 'cross_project_count',
                    width: 70,
                    render: (v: number) => v > 0 ? <Tag color="cyan" style={{ fontSize: 10 }}>{v}</Tag> : '-',
                  },
                  {
                    title: '活动趋势',
                    dataIndex: 'activity_trend',
                    width: 120,
                    render: (trend: any[]) => {
                      if (!trend || trend.length === 0) return <Text type="secondary" style={{ fontSize: 10 }}>无数据</Text>
                      const maxCount = Math.max(...trend.map((t: any) => t.count), 1)
                      return (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 24 }}>
                          {trend.slice(-24).map((t: any, i: number) => (
                            <div key={i} style={{ width: 4, height: Math.max(1, (t.count / maxCount) * 20), background: '#1890ff', borderRadius: 1, opacity: 0.4 + (t.count / maxCount) * 0.6 }} />
                          ))}
                        </div>
                      )
                    },
                  },
                  {
                    title: '最后在线',
                    dataIndex: 'last_seen_at',
                    width: 100,
                    render: (v: string) => {
                      if (!v) return '-'
                      const diff = Math.floor((Date.now() - new Date(v).getTime()) / 60000)
                      if (diff < 1) return <span style={{ color: '#52c41a' }}>刚刚</span>
                      if (diff < 60) return <span style={{ color: '#52c41a' }}>{diff}分钟前</span>
                      if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
                      return `${Math.floor(diff / 1440)}天前`
                    },
                  },
                ]}
              />
            </>
          ) : (
            <Empty description="暂无监控数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

      {/* Sandbox Security Monitor */}
      <Card
        title={<Space><SafetyOutlined /> 沙盒安全监控</Space>}
        style={{ marginBottom: 24 }}
        extra={<Space><Button size="small" icon={<ReloadOutlined />} onClick={loadSandboxData} loading={sandboxLoading} /></Space>}
      >
        <Spin spinning={sandboxLoading}>
          {sandboxData ? (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={4}><Statistic title="沙盒策略" value={sandboxData.total_sandboxes || 0} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={4}><Statistic title="执行总数" value={sandboxData.total_executions || 0} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={4}><Statistic title="运行中" value={sandboxData.running_executions || 0} valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Col>
                <Col span={4}><Statistic title="违规总数" value={sandboxData.total_violations || 0} valueStyle={{ fontSize: 16, color: (sandboxData.total_violations || 0) > 0 ? '#ff4d4f' : undefined }} prefix={(sandboxData.total_violations || 0) > 0 ? <WarningOutlined /> : undefined} /></Col>
                <Col span={12}>
                  <Space size={[8, 8]} wrap>
                    <Text type="secondary" style={{ fontSize: 12 }}>按级别:</Text>
                    {Object.entries(sandboxData.by_level || {}).map(([k, v]: any) => (
                      <Tag key={k} color={k === 'strict' ? 'red' : k === 'permissive' ? 'green' : 'orange'} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 12 }}>执行状态分布:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(sandboxData.by_status || {}).map(([k, v]: any) => (
                      <Tag key={k} color={k === 'completed' ? 'green' : k === 'running' ? 'blue' : k === 'violated' ? 'red' : k === 'revoked' ? 'orange' : k === 'failed' ? 'volcano' : 'default'} style={{ fontSize: 11 }}>
                        {k}: {v}
                      </Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
              {sandboxViolationTrend && sandboxViolationTrend.trend.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    近 {sandboxViolationTrend.days} 天违规趋势（累计 {sandboxViolationTrend.trend.reduce((s, t) => s + t.count, 0)}）
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <MiniTrendChart
                      height={100}
                      labels={sandboxViolationTrend.trend.map((t) => t.date)}
                      series={[{ key: 'violations', label: '违规', color: '#ff4d4f', values: sandboxViolationTrend.trend.map((t) => t.count) }]}
                    />
                  </div>
                  <Space size={[4, 4]} wrap style={{ marginTop: 4 }}>
                    {Object.entries(sandboxViolationTrend.by_type || {}).filter(([, v]) => (v as number) > 0).map(([k, v]: any) => (
                      <Tag key={k} style={{ fontSize: 10 }}>{k}: {v}</Tag>
                    ))}
                  </Space>
                </div>
              )}
              {sandboxViolationsByAgent && sandboxViolationsByAgent.items.length > 0 ? (() => {
                const items = sandboxViolationsByAgent.items
                const maxTotal = Math.max(1, ...items.map((it) => it.total))
                return (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>违规最多的 Agent（近 {sandboxViolationsByAgent.days} 天）</Text>
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {items.slice(0, 6).map((it) => (
                        <div key={it.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                          <span style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${it.name} #${it.agent_id}`}>
                            {it.name || `#${it.agent_id}`}
                          </span>
                          <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: `${(it.total / maxTotal) * 100}%`, height: '100%', background: '#ff4d4f', borderRadius: 3 }} />
                          </div>
                          <span style={{ color: '#8c8c8c', minWidth: 40, textAlign: 'right' }}>{it.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })() : null}
              {sandboxTemplateUsage && sandboxTemplateUsage.items.length > 0 ? (() => {
                const items = sandboxTemplateUsage.items
                const maxUses = Math.max(1, ...items.map((it) => it.uses))
                return (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>沙盒模板使用（实例化/绑定 Agent）</Text>
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {items.slice(0, 6).map((it) => (
                        <div key={it.template_key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                          <span style={{ width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={it.template_key}>{it.template_key}</span>
                          <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: `${(it.uses / maxUses) * 100}%`, height: '100%', background: '#722ed1', borderRadius: 3 }} />
                          </div>
                          <span style={{ color: '#8c8c8c', minWidth: 70, textAlign: 'right' }}>{it.uses}次 · 绑{it.bound_to_agent}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })() : null}
            </>
          ) : (
            <Empty description="暂无沙盒数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

      {/* Experience Library Stats */}
      <Card
        title={<Space><BookOutlined /> 经验库统计</Space>}
        style={{ marginBottom: 24 }}
      >
        {experiencesStats ? (
          experiencesStats.total > 0 ? (() => {
            const domains = Object.entries(experiencesStats.by_domain)
            const tasks = Object.entries(experiencesStats.by_task_type)
            const types = Object.entries(experiencesStats.by_experience_type)
            const maxDomain = Math.max(1, ...domains.map(([, v]) => v))
            const avgConf = experiencesStats.avg_confidence
            const confColor = avgConf == null ? undefined : avgConf >= 0.8 ? '#52c41a' : avgConf >= 0.5 ? '#faad14' : '#ff4d4f'
            const confBuckets = Object.entries(experiencesStats.by_confidence_bucket || {})
            const maxBucket = Math.max(1, ...confBuckets.map(([, v]) => v))
            const bucketColor = (k: string) => k === '0.85-1.0' ? '#52c41a' : k === '0.7-0.85' ? '#73d13d' : k === '0.5-0.7' ? '#faad14' : k === '0.3-0.5' ? '#fa8c16' : '#ff4d4f'
            const topReused = experiencesStats.top_reused || []
            const maxReuse = Math.max(1, ...topReused.map((t) => t.times_reused))
            const matrix = experiencesStats.by_domain_tasktype || {}
            const matrixDomains = Object.entries(matrix).sort((a, b) => Object.values(b[1]).reduce((s: number, n: any) => s + n, 0) - Object.values(a[1]).reduce((s: number, n: any) => s + n, 0)).slice(0, 6).map(([d]) => d)
            const allTaskTypes = Array.from(new Set(matrixDomains.flatMap((d) => Object.keys(matrix[d] || {})))).slice(0, 8)
            const matrixMax = Math.max(1, ...matrixDomains.flatMap((d) => Object.values(matrix[d] || {})))
            const heatColor = (v: number) => {
              const r = v / matrixMax
              if (r >= 0.75) return '#722ed1'
              if (r >= 0.5) return '#9254de'
              if (r >= 0.25) return '#b37feb'
              if (r > 0) return '#d3adf7'
              return '#f5f5f5'
            }
            return (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}><Statistic title="有效经验" value={experiencesStats.total} valueStyle={{ fontSize: 16 }} /></Col>
                  <Col span={6}><Statistic title="已共享" value={experiencesStats.shared} valueStyle={{ fontSize: 16, color: '#722ed1' }} prefix={<ShareAltOutlined />} /></Col>
                  <Col span={6}><Statistic title="累计复用" value={experiencesStats.total_reuses} valueStyle={{ fontSize: 16 }} suffix="次" /></Col>
                  <Col span={6}><Statistic title="平均置信度" value={avgConf ?? '—'} valueStyle={{ fontSize: 16, color: confColor }} /></Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按域分布:</Text>
                    {domains.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {domains.slice(0, 8).map(([k, v]: any) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={k}>{k}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxDomain) * 100}%`, height: '100%', background: '#722ed1', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : <Empty description="无" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按经验类型:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                      {types.map(([k, v]: any) => (
                        <Tag key={k} color="purple" style={{ fontSize: 11 }}>{k}: {v}</Tag>
                      ))}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>按任务类型:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                      {tasks.length > 0 ? tasks.slice(0, 10).map(([k, v]: any) => (
                        <Tag key={k} color="blue" style={{ fontSize: 11 }}>{k}: {v}</Tag>
                      )) : <Text type="secondary" style={{ fontSize: 12 }}>无</Text>}
                    </Space>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按置信度区间:</Text>
                    {confBuckets.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {confBuckets.map(([k, v]: any) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 70, color: '#595959' }}>{k}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxBucket) * 100}%`, height: '100%', background: bucketColor(k), borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : <Empty description="无" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>复用最多(top5):</Text>
                    {topReused.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {topReused.slice(0, 5).map((t) => (
                          <Tooltip key={t.id} title={t.key_learnings || '无摘要'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                              <span style={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${t.domain} / ${t.experience_type}`}>{t.domain} / {t.experience_type}</span>
                              <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ width: `${(t.times_reused / maxReuse) * 100}%`, height: '100%', background: '#13c2c2', borderRadius: 3 }} />
                              </div>
                              <span style={{ color: '#8c8c8c', minWidth: 50, textAlign: 'right' }}>{t.times_reused}次</span>
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    ) : <Empty description="暂无复用" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                </Row>
                {matrixDomains.length > 0 && allTaskTypes.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>域×任务类型覆盖热力（top6 域 × top8 任务类型）:</Text>
                    <div style={{ marginTop: 6, overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '2px 6px', textAlign: 'left', color: '#8c8c8c' }}>域 \ 任务</th>
                            {allTaskTypes.map((t) => (
                              <th key={t} style={{ padding: '2px 6px', color: '#8c8c8c', fontWeight: 400, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t}>{t}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {matrixDomains.map((d) => (
                            <tr key={d}>
                              <td style={{ padding: '2px 6px', color: '#595959', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d}>{d}</td>
                              {allTaskTypes.map((t) => {
                                const v = (matrix[d] || {})[t] || 0
                                return (
                                  <td key={t} style={{ padding: 0 }}>
                                    <Tooltip title={`${d} × ${t}: ${v}`}>
                                      <div style={{ width: 34, height: 18, background: heatColor(v), borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v > 0 ? (v / matrixMax >= 0.5 ? '#fff' : '#595959') : '#bfbfbf' }}>
                                        {v > 0 ? v : ''}
                                      </div>
                                    </Tooltip>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {(() => {
                  const domainReuses = Object.entries(experiencesStats.by_domain_reuses || {}).filter(([, v]) => v > 0)
                  if (domainReuses.length === 0) return null
                  const maxReuse = Math.max(1, ...domainReuses.map(([, v]) => v))
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>域复用排行（累计复用次数）:</Text>
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {domainReuses.slice(0, 8).map(([d, v]) => (
                          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={d}>{d}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxReuse) * 100}%`, height: '100%', background: '#13c2c2', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 50, textAlign: 'right' }}>{v}次</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                {(() => {
                  const taskTypeReuses = Object.entries(experiencesStats.by_task_type_reuses || {}).filter(([, v]) => v > 0)
                  if (taskTypeReuses.length === 0) return null
                  const maxReuse = Math.max(1, ...taskTypeReuses.map(([, v]) => v))
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>任务类型复用排行（累计复用次数）:</Text>
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {taskTypeReuses.slice(0, 8).map(([t, v]) => (
                          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={t}>{t}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxReuse) * 100}%`, height: '100%', background: '#fa8c16', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 50, textAlign: 'right' }}>{v}次</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                {(() => {
                  const expTypeReuses = Object.entries(experiencesStats.by_experience_type_reuses || {}).filter(([, v]) => v > 0)
                  if (expTypeReuses.length === 0) return null
                  const maxReuse = Math.max(1, ...expTypeReuses.map(([, v]) => v))
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>经验类型复用排行（累计复用次数）:</Text>
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {expTypeReuses.slice(0, 8).map(([t, v]) => (
                          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={t}>{t}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxReuse) * 100}%`, height: '100%', background: '#722ed1', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 50, textAlign: 'right' }}>{v}次</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </>
            )
          })() : <Empty description="暂无有效经验" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty description="加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Low Confidence Experiences */}
      <Card
        title={<Space><WarningOutlined /> 低置信度经验清单 <Tag color="volcano">置信度 &lt; {experiencesLowConfidence?.max_confidence ?? 0.5}</Tag></Space>}
        style={{ marginBottom: 24 }}
      >
        {experiencesLowConfidence ? (
          experiencesLowConfidence.items.length > 0 ? (
            <List
              size="small"
              dataSource={experiencesLowConfidence.items}
              renderItem={(item, idx) => {
                const conf = item.confidence ?? 0
                const confColor = conf < 0.3 ? '#ff4d4f' : conf < 0.4 ? '#faad14' : '#fa8c16'
                return (
                  <List.Item>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space size={4} wrap>
                        <Tag color="volcano">#{item.id}</Tag>
                        <Tag color="purple">{item.domain}</Tag>
                        {item.task_type && <Tag>{item.task_type}</Tag>}
                        <Tag color="cyan">{item.experience_type}</Tag>
                        <Tag color={confColor} style={{ fontWeight: 600 }}>置信度 {conf.toFixed(2)}</Tag>
                        <Tag>复用 {item.times_reused} 次</Tag>
                      </Space>
                      {item.key_learnings && (
                        <Tooltip title={item.key_learnings}>
                          <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: '100%' }}>
                            {item.key_learnings}
                          </Typography.Text>
                        </Tooltip>
                      )}
                    </Space>
                  </List.Item>
                )
              }}
            />
          ) : <Empty description="暂无低置信度经验" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty description="加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Experiences Confidence × Reuse Scatter */}
      <Card
        title={<Space><DotChartOutlined /> 经验置信度 × 复用次数 散点</Space>}
        style={{ marginBottom: 24 }}
      >
        {experiencesScatter && experiencesScatter.points.length > 0 ? (() => {
          const pts = experiencesScatter.points
          const maxReuses = Math.max(1, experiencesScatter.max_reuses)
          const W = 560, H = 220, padL = 36, padR = 12, padT = 12, padB = 28
          const xOf = (c: number) => padL + (c / 1) * (W - padL - padR)
          const yOf = (r: number) => H - padB - (r / maxReuses) * (H - padT - padB)
          // 点颜色按 domain 哈希
          const palette = ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#fa8c16', '#eb2f96', '#fa541c', '#08979c']
          const domainIdx: Record<string, number> = {}
          let di = 0
          const colorFor = (d: string) => {
            if (!(d in domainIdx)) { domainIdx[d] = di++; }
            return palette[domainIdx[d] % palette.length]
          }
          // 聚类：同位置点叠加计数
          const cell: Record<string, { x: number; y: number; n: number; c: string; conf: number; reuse: number }> = {}
          pts.forEach((p) => {
            const c = p.confidence ?? 0
            const key = `${c.toFixed(2)}|${p.times_reused}`
            if (!cell[key]) cell[key] = { x: xOf(c), y: yOf(p.times_reused), n: 0, c: colorFor(p.domain), conf: c, reuse: p.times_reused }
            cell[key].n += 1
          })
          const cells = Object.values(cell)
          const domains = Object.keys(domainIdx).slice(0, 8)
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {pts.length} 条经验（X=置信度 0-1，Y=复用次数，点大小=同位置叠加数，颜色=域）
              </Text>
              <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
                {/* 网格线 */}
                {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                  <g key={g}>
                    <line x1={xOf(g)} y1={padT} x2={xOf(g)} y2={H - padB} stroke="#f0f0f0" strokeWidth={1} />
                    <text x={xOf(g)} y={H - padB + 14} fontSize={9} fill="#8c8c8c" textAnchor="middle">{g.toFixed(2)}</text>
                  </g>
                ))}
                <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#d9d9d9" strokeWidth={1} />
                <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#d9d9d9" strokeWidth={1} />
                <text x={6} y={H / 2} fontSize={9} fill="#8c8c8c" transform={`rotate(-90 6 ${H / 2})`} textAnchor="middle">复用次数</text>
                {/* 散点 */}
                {cells.map((cell, i) => (
                  <circle
                    key={i}
                    cx={cell.x}
                    cy={cell.y}
                    r={3 + Math.min(6, cell.n)}
                    fill={cell.c}
                    fillOpacity={0.6}
                  >
                    <title>{`置信度=${cell.conf.toFixed(2)} 复用=${cell.reuse} 叠加=${cell.n}`}</title>
                  </circle>
                ))}
              </svg>
              <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                {domains.map((d) => (
                  <Text key={d} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ color: colorFor(d) }}>●</span> {d}
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无经验散点数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Experiences Confidence Box Plot by Domain */}
      <Card
        title={<Space><BarChartOutlined /> 经验置信度 按域箱线图</Space>}
        style={{ marginBottom: 24 }}
      >
        {experiencesScatter && experiencesScatter.points.length > 0 ? (() => {
          // 按 domain 分组计算置信度五数
          const byDomain: Record<string, number[]> = {}
          experiencesScatter.points.forEach((p) => {
            if (p.confidence == null) return
            const d = p.domain
            byDomain[d] = byDomain[d] || []
            byDomain[d].push(p.confidence)
          })
          const domains = Object.entries(byDomain)
            .map(([d, cs]) => ({ d, n: cs.length, sorted: cs.slice().sort((a, b) => a - b) }))
            .filter((x) => x.n >= 2) // 至少 2 个才有箱线意义
            .sort((a, b) => b.n - a.n)
            .slice(0, 8)
          if (domains.length === 0) return <Empty description="样本不足" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          const quint = (sorted: number[]) => {
            const n = sorted.length
            const q = (p: number) => {
              const idx = (p / 100) * (n - 1)
              const lo = Math.floor(idx), hi = Math.ceil(idx)
              return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
            }
            return { min: sorted[0], q1: q(25), median: q(50), q3: q(75), max: sorted[n - 1] }
          }
          const W = 560, H = 30 * domains.length + 30, padL = 110, padR = 16, padT = 14
          const xOf = (v: number) => padL + v * (W - padL - padR)
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                按域的置信度分布（min / Q1 / 中位 / Q3 / max，仅显示样本≥2 的 top8 域）
              </Text>
              <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
                {/* X 轴刻度 */}
                {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                  <g key={g}>
                    <line x1={xOf(g)} y1={padT - 6} x2={xOf(g)} y2={H - 4} stroke="#f0f0f0" strokeWidth={1} />
                    <text x={xOf(g)} y={H - 2} fontSize={8} fill="#8c8c8c" textAnchor="middle">{g.toFixed(2)}</text>
                  </g>
                ))}
                {domains.map((dom, i) => {
                  const q = quint(dom.sorted)
                  const y = padT + i * 30 + 12
                  const xMin = xOf(q.min), xMax = xOf(q.max), xQ1 = xOf(q.q1), xQ3 = xOf(q.q3), xMed = xOf(q.median)
                  return (
                    <g key={dom.d}>
                      <text x={padL - 6} y={y + 3} fontSize={10} fill="#595959" textAnchor="end">{dom.d.length > 12 ? dom.d.slice(0, 11) + '…' : dom.d}</text>
                      {/* 须线 */}
                      <line x1={xMin} y1={y} x2={xMax} y2={y} stroke="#8c8c8c" strokeWidth={1} />
                      <line x1={xMin} y1={y - 5} x2={xMin} y2={y + 5} stroke="#8c8c8c" strokeWidth={1} />
                      <line x1={xMax} y1={y - 5} x2={xMax} y2={y + 5} stroke="#8c8c8c" strokeWidth={1} />
                      {/* 箱体 */}
                      <rect x={xQ1} y={y - 7} width={Math.max(1, xQ3 - xQ1)} height={14} fill="#69b1ff" fillOpacity={0.4} stroke="#1890ff" strokeWidth={1} />
                      {/* 中位线 */}
                      <line x1={xMed} y1={y - 7} x2={xMed} y2={y + 7} stroke="#722ed1" strokeWidth={1.5} />
                      <title>{`${dom.d}: n=${dom.n} min=${q.min.toFixed(2)} Q1=${q.q1.toFixed(2)} 中位=${q.median.toFixed(2)} Q3=${q.q3.toFixed(2)} max=${q.max.toFixed(2)}`}</title>
                      <text x={W - padR + 2} y={y + 3} fontSize={9} fill="#8c8c8c">n={dom.n}</text>
                    </g>
                  )
                })}
              </svg>
              <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#1890ff' }}>▭</span> Q1-Q3 箱体</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#722ed1' }}>│</span> 中位数</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#8c8c8c' }}>├─┤</span> min-max 须线</Text>
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无经验数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Experiences Reuse-Decay Trend */}
      <Card
        title={<Space><LineChartOutlined /> 经验复用 × 衰减趋势</Space>}
        extra={experiencesReuseTrend ? (
          <Space size={16}>
            <Text type="secondary" style={{ fontSize: 12 }}>被复用 <b style={{ color: '#13c2c2' }}>{experiencesReuseTrend.total_reused}</b></Text>
            <Text type="secondary" style={{ fontSize: 12 }}>累计复用 <b style={{ color: '#722ed1' }}>{experiencesReuseTrend.total_reuse_count}</b></Text>
            <Text type="secondary" style={{ fontSize: 12 }}>已衰减 <b style={{ color: '#ff4d4f' }}>{experiencesReuseTrend.decayed_count}</b>/{experiencesReuseTrend.total_experiences}</Text>
          </Space>
        ) : null}
        style={{ marginBottom: 16 }}
      >
        {experiencesReuseTrend && experiencesReuseTrend.trend.length > 0 ? (() => {
          const trend = experiencesReuseTrend.trend
          const W = 760, H = 200, padL = 40, padR = 40, padT = 14, padB = 28
          const iw = W - padL - padR, ih = H - padT - padB
          const maxRC = Math.max(1, ...trend.map((b) => b.reuse_count))
          const xFor = (i: number) => padL + (trend.length === 1 ? iw / 2 : (i / (trend.length - 1)) * iw)
          const yRC = (v: number) => padT + ih - (v / maxRC) * ih
          const yConf = (v: number) => padT + ih - v * ih
          // polyline paths
          const rcPath = trend.map((b, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yRC(b.reuse_count).toFixed(1)}`).join(' ')
          const confPath = trend.map((b, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yConf(b.avg_confidence).toFixed(1)}`).join(' ')
          // gridlines
          const gridYs = [0, 0.25, 0.5, 0.75, 1]
          const fmtDate = (d: string) => {
            const parts = d.split('-')
            return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d
          }
          return (
            <div style={{ overflowX: 'auto' }}>
              <svg width={W} height={H} style={{ display: 'block' }}>
                {/* y gridlines (confidence axis 0-1) */}
                {gridYs.map((g) => {
                  const y = padT + ih - g * ih
                  return (
                    <g key={g}>
                      <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth={1} />
                      <text x={padL - 4} y={y + 3} fontSize={9} fill="#8c8c8c" textAnchor="end">{g.toFixed(2)}</text>
                    </g>
                  )
                })}
                {/* right axis labels reuse_count */}
                {[0, 0.5, 1].map((g) => {
                  const y = padT + ih - g * ih
                  const v = Math.round(g * maxRC)
                  return <text key={`r${g}`} x={W - padR + 4} y={y + 3} fontSize={9} fill="#13c2c2" textAnchor="start">{v}</text>
                })}
                {/* decayed bars (background) */}
                {trend.map((b, i) => {
                  if (b.decayed === 0) return null
                  const bh = (b.decayed / Math.max(1, ...trend.map((x) => x.decayed))) * ih * 0.5
                  return <rect key={`d${i}`} x={xFor(i) - 4} y={padT + ih - bh} width={8} height={bh} fill="#ff4d4f" fillOpacity={0.18} />
                })}
                {/* reuse_count line (cyan) */}
                <path d={rcPath} fill="none" stroke="#13c2c2" strokeWidth={2} />
                {trend.map((b, i) => (
                  <circle key={`rc${i}`} cx={xFor(i)} cy={yRC(b.reuse_count)} r={2.5} fill="#13c2c2">
                    <title>{`${fmtDate(b.date)} 累计复用=${b.reuse_count} 复用经验=${b.reused} 平均置信度=${b.avg_confidence} 已衰减=${b.decayed}`}</title>
                  </circle>
                ))}
                {/* avg_confidence line (purple) */}
                <path d={confPath} fill="none" stroke="#722ed1" strokeWidth={2} strokeDasharray="4 3" />
                {trend.map((b, i) => (
                  <circle key={`cf${i}`} cx={xFor(i)} cy={yConf(b.avg_confidence)} r={2.5} fill="#722ed1">
                    <title>{`${fmtDate(b.date)} 平均置信度=${b.avg_confidence} 累计复用=${b.reuse_count} 已衰减=${b.decayed}`}</title>
                  </circle>
                ))}
                {/* x axis labels (first/mid/last) */}
                {trend.length > 0 && [0, Math.floor((trend.length - 1) / 2), trend.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
                  <text key={`x${i}`} x={xFor(i)} y={H - 8} fontSize={9} fill="#8c8c8c" textAnchor="middle">{fmtDate(trend[i].date)}</text>
                ))}
              </svg>
              <div style={{ display: 'flex', gap: 16, marginTop: 2, flexWrap: 'wrap' }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#13c2c2' }}>━</span> 累计复用次数(左)</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#722ed1' }}>┄</span> 平均置信度(右 0-1)</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>▏</span> 当日已衰减经验数</Text>
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无复用趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* 置信度衰减预测 */}
      {experiencesDecayForecast && experiencesDecayForecast.trend.length >= 3 && (() => {
        const trend = experiencesDecayForecast.trend
        const forecast = experiencesDecayForecast.forecast
        const slope = experiencesDecayForecast.slope
        const rSq = experiencesDecayForecast.r_squared
        const daysToDecay = experiencesDecayForecast.days_to_decay
        const all = [...trend.map(t => t.avg_confidence), ...forecast.map(f => f.predicted_confidence)]
        const minC = Math.min(...all, 0)
        const maxC = Math.max(...all, 1)
        const range = maxC - minC || 1
        const W = 400, H = 120, padL = 32, padR = 8, padT = 8, padB = 20
        const iw = W - padL - padR, ih = H - padT - padB
        const total = trend.length + forecast.length
        const xFor = (i: number) => padL + (total <= 1 ? iw / 2 : (i / (total - 1)) * iw)
        const yFor = (v: number) => padT + ih - ((v - minC) / range) * ih
        const trendPts = trend.map((t, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(t.avg_confidence).toFixed(1)}`).join(' ')
        const fcStart = trend.length - 1
        const forecastPts = forecast.map((f, i) => {
          const x = xFor(fcStart + i + 1)
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yFor(f.predicted_confidence).toFixed(1)}`
        }).join(' ')
        // Connect trend last point to forecast first point
        const bridge = trend.length > 0 && forecast.length > 0
          ? `M${xFor(fcStart).toFixed(1)},${yFor(trend[trend.length - 1].avg_confidence).toFixed(1)} L${xFor(fcStart + 1).toFixed(1)},${yFor(forecast[0].predicted_confidence).toFixed(1)}`
          : ''
        return (
          <Card
            title={<Space><FundOutlined /> 置信度衰减预测</Space>}
            extra={
              <Space size={12}>
                <Text type="secondary" style={{ fontSize: 10 }}>斜率={slope}</Text>
                <Text type="secondary" style={{ fontSize: 10 }}>R²={rSq}</Text>
                {daysToDecay != null && <Text style={{ fontSize: 10, color: '#ff4d4f' }}>≈{daysToDecay}天后<0.5</Text>}
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <svg width={W} height={H} style={{ display: 'block' }}>
              {/* 0.5 threshold line */}
              {(() => {
                const y05 = yFor(0.5)
                return <line x1={padL} y1={y05} x2={W - padR} y2={y05} stroke="#ff4d4f" strokeDasharray="4 3" strokeWidth={0.5} />
              })()}
              {/* Y grid */}
              {[0.2, 0.4, 0.6, 0.8, 1.0].filter(v => v >= minC && v <= maxC).map(v => {
                const y = yFor(v)
                return <line key={v} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f5f5f5" strokeWidth={0.5} />
              })}
              {/* Historical line */}
              <path d={trendPts} fill="none" stroke="#722ed1" strokeWidth={1.5} />
              {/* Bridge */}
              {bridge && <path d={bridge} fill="none" stroke="#fa8c16" strokeWidth={1.5} strokeDasharray="3 3" />}
              {/* Forecast line */}
              {forecastPts && <path d={forecastPts} fill="none" stroke="#fa8c16" strokeWidth={1.5} strokeDasharray="3 3" />}
              {/* Forecast dots */}
              {forecast.map((f, i) => (
                <circle key={`fc${i}`} cx={xFor(fcStart + i + 1)} cy={yFor(f.predicted_confidence)} r={3} fill="#fa8c16" fillOpacity={0.7}>
                  <title>{f.date}: 预测={f.predicted_confidence}</title>
                </circle>
              ))}
              {/* X labels */}
              {[0, Math.floor((trend.length - 1) / 2), trend.length - 1].filter((v, i, a) => a.indexOf(v) === i && v >= 0).map(i => (
                <text key={`xl${i}`} x={xFor(i)} y={H - 4} fontSize={8} fill="#8c8c8c" textAnchor="middle">{trend[i].date.slice(5)}</text>
              ))}
              {forecast.length > 0 && <text x={xFor(total - 1)} y={H - 4} fontSize={8} fill="#fa8c16" textAnchor="middle">{forecast[forecast.length - 1].date.slice(5)}</text>}
            </svg>
            <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#722ed1' }}>━</span> 历史</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#fa8c16' }}>┄</span> 预测</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>---</span> 0.5 衰减线</Text>
            </div>
          </Card>
        )
      })()}

      {/* Experiences Decay by Domain */}
      <Card
        title={<Space><HeatMapOutlined /> 经验按域衰减对比</Space>}
        extra={experiencesDecayByDomain ? (
          <Space size={16}>
            <Text type="secondary" style={{ fontSize: 12 }}>活跃 <b style={{ color: '#52c41a' }}>{experiencesDecayByDomain.total_active}</b></Text>
            <Text type="secondary" style={{ fontSize: 12 }}>衰减 <b style={{ color: '#ff4d4f' }}>{experiencesDecayByDomain.total_decayed}</b></Text>
          </Space>
        ) : null}
        style={{ marginBottom: 16 }}
      >
        {experiencesDecayByDomain && experiencesDecayByDomain.domains.length > 0 ? (() => {
          const domains = experiencesDecayByDomain.domains
          const maxTotal = Math.max(1, ...domains.map((d) => d.total))
          return (
            <div>
              {domains.map((d) => {
                const activePct = d.total > 0 ? d.active / d.total : 0
                const decayedPct = d.total > 0 ? d.decayed / d.total : 0
                return (
                  <div key={d.domain} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Tooltip title={`${d.domain}: 总${d.total} 活跃=${d.active} 衰减=${d.decayed} 平均置信度=${d.avg_confidence} 复用=${d.reuses}`}>
                      <Text style={{ fontSize: 11, width: 100, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.domain}</Text>
                    </Tooltip>
                    <div style={{ flex: 1, height: 16, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${activePct * 100}%`, height: '100%', background: '#52c41a', opacity: 0.7 }} />
                      <div style={{ width: `${decayedPct * 100}%`, height: '100%', background: '#ff4d4f', opacity: 0.6 }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 10, width: 50 }}>{d.total}</Text>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#52c41a' }}>■</span> 活跃(置信度≥0.5)</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>■</span> 衰减(置信度<0.5)</Text>
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无经验衰减数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card
        title={<Space><HeatMapOutlined /> 经验按任务类型衰减对比</Space>}
        extra={experiencesDecayByTaskType ? (
          <Space size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>活跃 <b style={{ color: '#52c41a' }}>{experiencesDecayByTaskType.total_active}</b></Text>
            <Text type="secondary" style={{ fontSize: 12 }}>衰减 <b style={{ color: '#ff4d4f' }}>{experiencesDecayByTaskType.total_decayed}</b></Text>
          </Space>
        ) : null}
        style={{ marginBottom: 24 }}
      >
        {experiencesDecayByTaskType && experiencesDecayByTaskType.task_types.length > 0 ? (() => {
          const taskTypes = experiencesDecayByTaskType.task_types
          return (
            <div>
              {taskTypes.map((t) => {
                const activePct = t.total > 0 ? t.active / t.total : 0
                const decayedPct = t.total > 0 ? t.decayed / t.total : 0
                return (
                  <div key={t.task_type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Tooltip title={`${t.task_type}: 总${t.total} 活跃=${t.active} 衰减=${t.decayed} 平均置信度=${t.avg_confidence} 复用=${t.reuses}`}>
                      <Text style={{ fontSize: 11, width: 100, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.task_type}</Text>
                    </Tooltip>
                    <div style={{ flex: 1, height: 16, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${activePct * 100}%`, height: '100%', background: '#52c41a', opacity: 0.7 }} />
                      <div style={{ width: `${decayedPct * 100}%`, height: '100%', background: '#ff4d4f', opacity: 0.6 }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 10, width: 50 }}>{t.total}</Text>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#52c41a' }}>■</span> 活跃(置信度≥0.5)</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>■</span> 衰减(置信度<0.5)</Text>
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无经验衰减数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card
        title={<Space><HeatMapOutlined /> 经验置信度区间分布</Space>}
        extra={experiencesConfidenceDistribution ? (
          <Text type="secondary" style={{ fontSize: 12 }}>共 {experiencesConfidenceDistribution.total} 条</Text>
        ) : null}
        style={{ marginBottom: 24 }}
      >
        {experiencesConfidenceDistribution && experiencesConfidenceDistribution.bins.length > 0 ? (() => {
          const bins = experiencesConfidenceDistribution.bins
          const maxCount = Math.max(1, ...bins.map((b) => b.count))
          // 5档色阶：红→深橙→橙→黄绿→绿
          const barColors = ['#ff4d4f', '#fa541c', '#fa8c16', '#73d13d', '#52c41a']
          return (
            <div>
              {bins.map((b, i) => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Tooltip title={`${b.label}: ${b.count}条(${b.percentage}%) 均复用=${b.avg_reuses}`}>
                    <Text style={{ fontSize: 11, width: 45, textAlign: 'right' }}>{b.label}</Text>
                  </Tooltip>
                  <div style={{ flex: 1, height: 18, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(b.count / maxCount) * 100}%`, height: '100%', background: barColors[i], opacity: 0.75, borderRadius: 3 }} />
                  </div>
                  <Text type="secondary" style={{ fontSize: 10, width: 55 }}>{b.count}({b.percentage}%)</Text>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {bins.map((b, i) => (
                  <Text key={b.label} type="secondary" style={{ fontSize: 9 }}>
                    <span style={{ color: barColors[i] }}>■</span> {b.label}
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无置信度分布数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card
        title={<Space><HeatMapOutlined /> 经验来源分布</Space>}
        extra={experiencesSourceDistribution ? (
          <Text type="secondary" style={{ fontSize: 12 }}>共 {experiencesSourceDistribution.total} 条</Text>
        ) : null}
        style={{ marginBottom: 24 }}
      >
        {experiencesSourceDistribution && experiencesSourceDistribution.sources.length > 0 ? (() => {
          const sources = experiencesSourceDistribution.sources
          const maxCount = Math.max(1, ...sources.map((s) => s.count))
          const sourceColors: Record<string, string> = { manual: '#722ed1', workflow: '#1890ff', auto_step: '#13c2c2' }
          const sourceLabels: Record<string, string> = { manual: '手动创建', workflow: '工作流生成', auto_step: '步骤自动提取' }
          return (
            <div>
              {sources.map((s) => (
                <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Tooltip title={`${sourceLabels[s.source] || s.source}: ${s.count}条(${s.percentage}%) 均置信度=${s.avg_confidence} 均复用=${s.avg_reuses}`}>
                    <Text style={{ fontSize: 11, width: 80, textAlign: 'right', color: sourceColors[s.source] || '#8c8c8c' }}>{sourceLabels[s.source] || s.source}</Text>
                  </Tooltip>
                  <div style={{ flex: 1, height: 20, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.count / maxCount) * 100}%`, height: '100%', background: sourceColors[s.source] || '#8c8c8c', opacity: 0.7, borderRadius: 3 }} />
                  </div>
                  <Text type="secondary" style={{ fontSize: 10, width: 55 }}>{s.count}({s.percentage}%)</Text>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {sources.map((s) => (
                  <Text key={s.source} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ color: sourceColors[s.source] || '#8c8c8c' }}>■</span> {sourceLabels[s.source] || s.source}
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无来源分布数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* 经验共享传播链 */}
      {experiencesPropagationChain && experiencesPropagationChain.chains.length > 0 && (() => {
        const chains = experiencesPropagationChain.chains
        const maxReuses = Math.max(...chains.map(c => c.total_reuses), 1)
        const barMaxW = 180
        return (
          <Card
            title={<Space><ApartmentOutlined /> 经验共享传播链</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{experiencesPropagationChain.total_shared} 条共享 · {experiencesPropagationChain.total_propagated} 次传播</Text>}
            style={{ marginBottom: 24 }}
          >
            {chains.map((c) => {
              const barW = Math.max(2, (c.total_reuses / maxReuses) * barMaxW)
              const domains = c.top_domains.slice(0, 3).join('/')
              return (
                <div key={c.source_agent_id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <Text style={{ fontSize: 12, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.source_agent_name}>{c.source_agent_name}</Text>
                    <svg width={barMaxW + 4} height={12} style={{ flexShrink: 0 }}>
                      <rect x={0} y={1} width={barMaxW} height={10} rx={2} fill="#f5f5f5" />
                      <rect x={0} y={1} width={barW} height={10} rx={2} fill="#722ed1" opacity={0.7} />
                    </svg>
                    <Text style={{ fontSize: 11, color: '#722ed1', minWidth: 30 }}>{c.total_reuses}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>{c.shared_count}条共享</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 10, marginLeft: 108 }}>
                    {domains ? `[${domains}]` : ''} {c.top_experiences.slice(0, 2).map(e => `${e.domain || '?'}(${e.times_reused})`).join(', ')}
                  </Text>
                </div>
              )
            })}
          </Card>
        )
      })()}

      {/* Agent 技能覆盖雷达 */}
      {skillCoverageRadar && skillCoverageRadar.agents.length > 0 && skillCoverageRadar.domain_labels.length >= 3 && (() => {
        const agents = skillCoverageRadar.agents
        const labels = skillCoverageRadar.domain_labels
        const n = labels.length
        const cx = 140
        const cy = 140
        const r = 110
        const angleStep = (2 * Math.PI) / n
        const colors = ['#1890ff', '#722ed1', '#fa8c16', '#52c41a', '#eb2f96', '#13c2c2']
        return (
          <Card
            title={<Space><RadarChartOutlined /> Agent 技能覆盖雷达</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{n} 个技能维度 · {agents.length} 个 Agent</Text>}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <svg width={280} height={280} style={{ flexShrink: 0 }}>
                {/* Grid rings */}
                {[20, 40, 60, 80, 100].map(pct => {
                  const rr = r * pct / 100
                  const pts = Array.from({ length: n }, (_, i) => {
                    const a = -Math.PI / 2 + i * angleStep
                    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`
                  }).join(' ')
                  return <polygon key={`ring-${pct}`} points={pts} fill="none" stroke="#f0f0f0" strokeWidth={0.5} />
                })}
                {/* Axis lines + labels */}
                {labels.map((l, i) => {
                  const a = -Math.PI / 2 + i * angleStep
                  const ex = cx + r * Math.cos(a)
                  const ey = cy + r * Math.sin(a)
                  const lx = cx + (r + 16) * Math.cos(a)
                  const ly = cy + (r + 16) * Math.sin(a)
                  return (
                    <g key={`ax-${i}`}>
                      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e8e8e8" strokeWidth={0.5} />
                      <text x={lx} y={ly + 3} fontSize={9} fill="#8c8c8c" textAnchor="middle">{l.length > 6 ? l.slice(0, 5) + '…' : l}</text>
                    </g>
                  )
                })}
                {/* Agent polygons */}
                {agents.map((ag, ai) => {
                  const color = colors[ai % colors.length]
                  const pts = ag.scores.map((s, i) => {
                    const a = -Math.PI / 2 + i * angleStep
                    const rr = r * s / 100
                    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`
                  }).join(' ')
                  return <polygon key={`ag-${ag.agent_id}`} points={pts} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={1.5} />
                })}
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                {agents.map((ag, ai) => (
                  <Text key={ag.agent_id} style={{ fontSize: 11 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, background: colors[ai % colors.length], borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} />
                    {ag.name} ({ag.total_experiences}条)
                  </Text>
                ))}
              </div>
            </div>
          </Card>
        )
      })()}

      {/* Task Lifecycle Stats */}
      <Card
        title={<Space><FieldTimeOutlined /> 任务生命周期</Space>}
        style={{ marginBottom: 24 }}
      >
        {taskStats ? (
          taskStats.total > 0 ? (() => {
            const statusEntries = Object.entries(taskStats.by_status)
            const priorityEntries = Object.entries(taskStats.by_priority)
            const buckets = taskStats.lifecycle_buckets || {}
            const bucketEntries = Object.entries(buckets)
            const maxBucket = Math.max(1, ...bucketEntries.map(([, v]) => v))
            const statusColor = (k: string) => k === 'done' ? 'green' : k === 'cancelled' ? 'red' : k === 'in_progress' ? 'blue' : k === 'review' ? 'orange' : k === 'blocked' ? 'volcano' : 'default'
            const priorityColor = (k: string) => k === 'urgent' ? 'red' : k === 'high' ? 'orange' : k === 'medium' ? 'blue' : 'default'
            const avgLife = taskStats.avg_lifecycle_hours
            const byProject = taskStats.by_project || []
            const maxProject = Math.max(1, ...byProject.map((p) => p.count))
            return (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}><Statistic title="任务总数" value={taskStats.total} valueStyle={{ fontSize: 16 }} /></Col>
                  <Col span={6}><Statistic title="完成率" value={taskStats.completion_rate} suffix="%" valueStyle={{ fontSize: 16, color: '#52c41a' }} /></Col>
                  <Col span={6}><Statistic title="取消率" value={taskStats.cancellation_rate} suffix="%" valueStyle={{ fontSize: 16, color: taskStats.cancellation_rate > 0 ? '#ff4d4f' : undefined }} /></Col>
                  <Col span={6}><Statistic title="平均完成度" value={taskStats.avg_completion_rate} suffix="%" valueStyle={{ fontSize: 16 }} /></Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按状态:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                      {statusEntries.map(([k, v]: any) => (
                        <Tag key={k} color={statusColor(k)} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                      ))}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>按优先级:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                      {priorityEntries.map(([k, v]: any) => (
                        <Tag key={k} color={priorityColor(k)} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                      ))}
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>已完成任务生命周期分布{avgLife != null ? `（平均 ${avgLife}h）` : ''}:</Text>
                    {bucketEntries.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {bucketEntries.map(([k, v]: any) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 60, color: '#595959' }}>{k}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxBucket) * 100}%`, height: '100%', background: '#1890ff', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : <Empty description="暂无已完成任务" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={8}>
                    <Statistic
                      title="逾期任务"
                      value={taskStats.overdue_count}
                      suffix={taskStats.with_due_date > 0 ? `/ ${taskStats.with_due_date} 有截止日` : ''}
                      valueStyle={{ fontSize: 16, color: taskStats.overdue_count > 0 ? '#ff4d4f' : '#52c41a' }}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>逾期率 {taskStats.overdue_rate}%</Text>
                  </Col>
                  <Col span={16}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按项目分布:</Text>
                    {byProject.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {byProject.slice(0, 6).map((p) => (
                          <div key={p.project_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={p.name}>{p.name}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(p.count / maxProject) * 100}%`, height: '100%', background: '#1890ff', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{p.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : <Empty description="无" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                </Row>
                {(() => {
                  const matrix = taskStats.by_priority_status || {}
                  const priKeys = Object.keys(matrix)
                  if (priKeys.length === 0) return null
                  // 收集所有出现过的状态作为列
                  const statusSet = new Set<string>()
                  priKeys.forEach((p) => Object.keys(matrix[p]).forEach((s) => statusSet.add(s)))
                  const statusCols = Array.from(statusSet)
                  // 计算最大单元格计数用于色阶
                  let cellMax = 1
                  priKeys.forEach((p) => statusCols.forEach((s) => { cellMax = Math.max(cellMax, matrix[p][s] || 0) }))
                  const cellColor = (v: number) => {
                    if (!v) return '#fafafa'
                    const r = v / cellMax
                    if (r >= 0.75) return '#722ed1'
                    if (r >= 0.5) return '#9254de'
                    if (r >= 0.25) return '#b37feb'
                    return '#d3adf7'
                  }
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>优先级 × 状态分布热力:</Text>
                      <table style={{ borderCollapse: 'collapse', fontSize: 10, marginTop: 4 }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>优先级</th>
                            {statusCols.map((s) => (
                              <th key={s} style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', color: '#595959' }}>{s}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {priKeys.map((p) => (
                            <tr key={p}>
                              <td style={{ padding: '2px 6px', color: '#595959', whiteSpace: 'nowrap' }}>{p}</td>
                              {statusCols.map((s) => {
                                const v = matrix[p][s] || 0
                                return (
                                  <td key={s} style={{ padding: 0 }}>
                                    <Tooltip title={`${p} / ${s}: ${v}`}>
                                      <div style={{ width: 44, height: 22, background: cellColor(v), color: v >= cellMax * 0.5 ? '#fff' : '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 1 }}>
                                        {v || ''}
                                      </div>
                                    </Tooltip>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
                {(() => {
                  // 逾期趋势：按 due_date 分日的逾期数，火山色柱
                  if (!taskOverdueTrend || taskOverdueTrend.trend.length === 0) return null
                  const trend = taskOverdueTrend.trend
                  const maxOverdue = Math.max(1, ...trend.map((b) => b.overdue))
                  const priorityTotals = taskOverdueTrend.by_priority_totals || {}
                  const priorityEntries = Object.entries(priorityTotals)
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        逾期趋势（近 {taskOverdueTrend.days} 天，按截止日分桶，共 {taskOverdueTrend.total_overdue} 个逾期）:
                      </Text>
                      {priorityEntries.length > 0 && (
                        <div style={{ marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            按优先级累计: {priorityEntries.map(([k, v]) => `${k}=${v}`).join(' · ')}
                          </Text>
                        </div>
                      )}
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'flex-end', gap: 2, height: 56, overflowX: 'auto', paddingBottom: 2 }}>
                        {trend.map((b) => (
                          <Tooltip key={b.date} title={`${b.date}: 逾期 ${b.overdue}${Object.keys(b.by_priority).length ? ` [${Object.entries(b.by_priority).map(([k, v]) => `${k}=${v}`).join(', ')}]` : ''}`}>
                            <div style={{ flex: '0 0 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                              <div style={{ width: 10, height: `${(b.overdue / maxOverdue) * 100}%`, minHeight: 2, background: '#fa541c', borderRadius: 2 }} />
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </>
            )
          })() : <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty description="加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Task Overdue by Assignee */}
      {taskOverdueByAssignee && taskOverdueByAssignee.items.length > 0 && (
        <Card
          title={<Space><UserOutlined /> 任务逾期按负责人</Space>}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {taskOverdueByAssignee.total_overdue} 个逾期</Text>}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {taskOverdueByAssignee.items.map((a) => {
              const maxOverdue = Math.max(1, taskOverdueByAssignee!.items[0].overdue)
              const priorityTags = Object.entries(a.by_priority).map(([k, v]) => {
                const color = k === 'urgent' ? 'red' : k === 'high' ? 'orange' : k === 'medium' ? 'blue' : 'default'
                return <Tag key={k} color={color} style={{ fontSize: 10 }}>{k}: {v}</Tag>
              })
              return (
                <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={a.name}>{a.name}</span>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 14, position: 'relative', overflow: 'hidden' }}>
                    <Tooltip title={`${a.name}: ${a.overdue}个逾期${a.earliest_due ? ` · 最早到期 ${a.earliest_due.slice(0, 10)}` : ''}`}>
                      <div style={{ width: `${(a.overdue / maxOverdue) * 100}%`, height: '100%', background: '#ff4d4f', borderRadius: 3 }} />
                    </Tooltip>
                  </div>
                  <span style={{ color: '#ff4d4f', minWidth: 30, textAlign: 'right' }}>{a.overdue}</span>
                  <Space size={4}>{priorityTags}</Space>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 任务逾期聚类分析 */}
      {taskOverdueClustering && taskOverdueClustering.clusters.length > 0 && (() => {
        const clusters = taskOverdueClustering.clusters
        const maxCount = Math.max(...clusters.map(c => c.count), 1)
        const barMaxW = 140
        const priorityColors: Record<string, string> = { urgent: '#ff4d4f', high: '#fa8c16', medium: '#1890ff', low: '#52c41a' }
        return (
          <Card
            title={<Space><ClusterOutlined /> 任务逾期聚类分析</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {taskOverdueClustering.total_overdue} 个逾期</Text>}
            style={{ marginBottom: 24 }}
          >
            {clusters.map((c, idx) => {
              const barW = Math.max(2, (c.count / maxCount) * barMaxW)
              const pColor = priorityColors[c.priority] || '#8c8c8c'
              return (
                <div key={idx} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.project_name}>{c.project_name}</Text>
                    <Tag color={pColor} style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>{c.priority}</Tag>
                    <svg width={barMaxW + 4} height={12} style={{ flexShrink: 0 }}>
                      <rect x={0} y={1} width={barMaxW} height={10} rx={2} fill="#f5f5f5" />
                      <rect x={0} y={1} width={barW} height={10} rx={2} fill="#ff4d4f" opacity={0.7} />
                    </svg>
                    <Text style={{ fontSize: 11, color: '#ff4d4f', minWidth: 20 }}>{c.count}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>均{c.avg_days_overdue}天超期</Text>
                  </div>
                  {c.titles.length > 0 && (
                    <Text type="secondary" style={{ fontSize: 9, marginLeft: 118, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.titles.join('; ')}>
                      {c.titles.join('; ')}
                    </Text>
                  )}
                </div>
              )
            })}
          </Card>
        )
      })()}

      {/* 任务优先级分布趋势 */}
      {taskPriorityTrend && taskPriorityTrend.trend.length > 1 && (() => {
        const trend = taskPriorityTrend.trend
        const totals = taskPriorityTrend.totals
        const w = 480
        const h = 160
        const padL = 36
        const padR = 12
        const padT = 12
        const padB = 24
        const plotW = w - padL - padR
        const plotH = h - padT - padB
        const maxVal = Math.max(1, ...trend.flatMap(t => [t.critical, t.high, t.medium, t.low]))
        const xStep = trend.length > 1 ? plotW / (trend.length - 1) : plotW
        const yScale = (v: number) => padT + plotH - (v / maxVal) * plotH
        const xOf = (i: number) => padL + i * xStep
        const lines = [
          { key: 'critical', color: '#ff4d4f', label: '紧急' },
          { key: 'high', color: '#fa8c16', label: '高' },
          { key: 'medium', color: '#1890ff', label: '中' },
          { key: 'low', color: '#52c41a', label: '低' },
        ] as const
        return (
          <Card
            title={<Space><FieldTimeOutlined /> 任务优先级分布趋势</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {taskPriorityTrend.days} 天</Text>}
            style={{ marginBottom: 24 }}
          >
            <svg width={w} height={h} style={{ overflow: 'visible' }}>
              {/* Y grid */}
              {[0, 0.25, 0.5, 0.75, 1].map(r => (
                <line key={`yg-${r}`} x1={padL} y1={yScale(r * maxVal)} x2={w - padR} y2={yScale(r * maxVal)} stroke="#f0f0f0" strokeWidth={0.5} />
              ))}
              {/* Lines */}
              {lines.map(({ key, color }) => {
                const pts = trend.map((t, i) => `${xOf(i)},${yScale(t[key])}`).join(' ')
                return (
                  <polyline key={key} points={pts} fill="none" stroke={color} strokeWidth={1.5} />
                )
              })}
              {/* Dots on last point */}
              {lines.map(({ key, color }) => {
                const last = trend[trend.length - 1]
                const i = trend.length - 1
                return <circle key={`dot-${key}`} cx={xOf(i)} cy={yScale(last[key])} r={3} fill={color} />
              })}
              {/* X labels (first + last + mid) */}
              {trend.length > 2 && (
                <>
                  <text x={padL} y={h - 4} fontSize={8} fill="#8c8c8c" textAnchor="start">{trend[0].date.slice(5)}</text>
                  <text x={xOf(Math.floor(trend.length / 2))} y={h - 4} fontSize={8} fill="#8c8c8c" textAnchor="middle">{trend[Math.floor(trend.length / 2)].date.slice(5)}</text>
                  <text x={xOf(trend.length - 1)} y={h - 4} fontSize={8} fill="#8c8c8c" textAnchor="end">{trend[trend.length - 1].date.slice(5)}</text>
                </>
              )}
            </svg>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              {lines.map(({ key, color, label }) => (
                <Text key={key} style={{ fontSize: 10 }}><span style={{ display: 'inline-block', width: 12, height: 2, background: color, verticalAlign: 'middle', marginRight: 4 }} />{label} {totals[key] ?? 0}</Text>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* 任务完成预测 */}
      {taskCompletionForecast && taskCompletionForecast.total_remaining > 0 && taskCompletionForecast.velocity > 0 && (() => {
        const fc = taskCompletionForecast
        const priorityColors: Record<string, string> = { critical: '#ff4d4f', high: '#fa8c16', medium: '#1890ff', low: '#52c41a' }
        return (
          <Card
            title={<Space><AimOutlined /> 任务完成预测</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>速度 {fc.velocity} 任务/天</Text>}
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={8}><Statistic title="剩余任务" value={fc.total_remaining} valueStyle={{ fontSize: 16 }} /></Col>
              <Col span={8}><Statistic title="预计天数" value={fc.days_to_complete ?? '—'} suffix="天" valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Col>
              <Col span={8}><Statistic title="预计完成" value={fc.estimated_completion_date ?? '—'} valueStyle={{ fontSize: 14, color: '#52c41a' }} /></Col>
            </Row>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fc.priority_forecast.filter(p => p.remaining > 0).map((p) => {
                const color = priorityColors[p.priority] || '#8c8c8c'
                return (
                  <div key={p.priority} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, width: 40, color, fontWeight: 600 }}>{p.priority}</Text>
                    <Text style={{ fontSize: 11 }}>剩余 {p.remaining}</Text>
                    <div style={{ flex: 1, height: 6, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(p.estimated_days / Math.max(fc.days_to_complete || 1, 1) * 100, 100)}%`, height: '100%', background: color, borderRadius: 3 }} />
                    </div>
                    <Text style={{ fontSize: 10, color: '#8c8c8c', minWidth: 80 }}>{p.estimated_date || '—'}</Text>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })()}

      {/* Task Completion by Priority */}
      {taskCompletionByPriority && taskCompletionByPriority.priorities.length > 0 && (() => {
        const priorities = taskCompletionByPriority.priorities
        const maxTotal = Math.max(1, ...priorities.map((p) => p.total))
        const priorityColors: Record<string, string> = { urgent: '#ff4d4f', high: '#fa8c16', medium: '#1890ff', low: '#52c41a' }
        return (
          <Card
            title={<Space><FieldTimeOutlined /> 任务按优先级完成率</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {taskCompletionByPriority.total} 任务</Text>}
            style={{ marginBottom: 24 }}
          >
            <div>
              {priorities.map((p) => {
                const donePct = p.total > 0 ? p.done / p.total : 0
                const cancelPct = p.total > 0 ? p.cancelled / p.total : 0
                const ipPct = p.total > 0 ? p.in_progress / p.total : 0
                const color = priorityColors[p.priority] || '#8c8c8c'
                return (
                  <div key={p.priority} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Tooltip title={`${p.priority}: 总${p.total} 完成=${p.done} 进行中=${p.in_progress} 取消=${p.cancelled} 完成率=${p.completion_rate}%`}>
                      <Text style={{ fontSize: 11, width: 60, textAlign: 'right', color }}>{p.priority}</Text>
                    </Tooltip>
                    <div style={{ flex: 1, height: 16, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${donePct * 100}%`, height: '100%', background: '#52c41a', opacity: 0.7 }} />
                      <div style={{ width: `${ipPct * 100}%`, height: '100%', background: '#1890ff', opacity: 0.5 }} />
                      <div style={{ width: `${cancelPct * 100}%`, height: '100%', background: '#d9d9d9', opacity: 0.6 }} />
                    </div>
                    <Text style={{ fontSize: 10, width: 45, color }}>{p.completion_rate}%</Text>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#52c41a' }}>■</span> 完成</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#1890ff' }}>■</span> 进行中</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#d9d9d9' }}>■</span> 取消</Text>
              </div>
            </div>
          </Card>
        )
      })()}

      {/* 任务按项目完成率对比 */}
      {taskCompletionRateByProject && taskCompletionRateByProject.projects.length > 0 && (() => {
        const projects = taskCompletionRateByProject.projects
        const maxTotal = Math.max(...projects.map(p => p.total), 1)
        const barMaxW = 180
        return (
          <Card
            title={<Space><ProjectOutlined /> 任务按项目完成率对比</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {taskCompletionRateByProject.total_tasks} 任务 · {taskCompletionRateByProject.total_done} 完成</Text>}
            style={{ marginBottom: 24 }}
          >
            {projects.map((p) => {
              const doneW = (p.done / maxTotal) * barMaxW
              const ipW = (p.in_progress / maxTotal) * barMaxW
              const cancelW = (p.cancelled / maxTotal) * barMaxW
              const rateColor = p.completion_rate >= 70 ? '#52c41a' : p.completion_rate >= 40 ? '#faad14' : '#ff4d4f'
              return (
                <div key={p.project_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Tooltip title={`${p.name}: 总${p.total} 完成=${p.done} 进行中=${p.in_progress} 取消=${p.cancelled}`}>
                    <Text style={{ fontSize: 12, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</Text>
                  </Tooltip>
                  <svg width={barMaxW + 4} height={14} style={{ flexShrink: 0 }}>
                    <rect x={0} y={2} width={barMaxW} height={10} rx={2} fill="#f5f5f5" />
                    <rect x={0} y={2} width={doneW} height={10} rx={2} fill="#52c41a" opacity={0.7} />
                    <rect x={doneW} y={2} width={ipW} height={10} fill="#1890ff" opacity={0.5} />
                    <rect x={doneW + ipW} y={2} width={cancelW} height={10} fill="#d9d9d9" opacity={0.6} />
                  </svg>
                  <Text style={{ fontSize: 11, color: rateColor, minWidth: 44 }}>{p.completion_rate}%</Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>{p.done}/{p.total}</Text>
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#52c41a' }}>■</span> 完成</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#1890ff' }}>■</span> 进行中</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#d9d9d9' }}>■</span> 取消</Text>
            </div>
          </Card>
        )
      })()}

      {/* Task Completion by Project Trend */}
      <Card
        title={<Space><LineChartOutlined /> 任务按项目完成趋势</Space>}
        style={{ marginBottom: 24 }}
      >
        {taskCompletionByProject && taskCompletionByProject.series.length > 0 ? (() => {
          const series = taskCompletionByProject.series
          const allDays = taskCompletionByProject.all_days
          const n = allDays.length
          if (n < 2) return <Empty description="样本不足" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          const maxDone = Math.max(1, ...series.flatMap((s) => s.daily.map((d) => d.done)))
          const W = 560, H = 160, padL = 12, padR = 12, padT = 10, padB = 24
          const xStep = (W - padL - padR) / Math.max(1, n - 1)
          const palette = ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#fa8c16', '#eb2f96', '#fa541c', '#08979c']
          const yOf = (v: number) => H - padB - (v / maxDone) * (H - padT - padB)
          const lineFor = (s: { daily: { done: number }[] }) =>
            s.daily.map((d, i) => `${(padL + i * xStep).toFixed(1)},${yOf(d.done).toFixed(1)}`).join(' ')
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {taskCompletionByProject.days} 天完成趋势（共 {taskCompletionByProject.total_done} 个完成，top{series.length} 项目）
              </Text>
              <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
                {[0, 0.5, 1].map((g) => {
                  const y = H - padB - g * (H - padT - padB)
                  return <line key={g} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth={1} />
                })}
                {series.map((s, idx) => (
                  <g key={s.project_id}>
                    <polyline points={lineFor(s)} fill="none" stroke={palette[idx % palette.length]} strokeWidth={1.6} opacity={0.85} />
                    <title>{`${s.name}: 共${s.total}个完成`}</title>
                  </g>
                ))}
                {/* X 轴首尾日期 */}
                <text x={padL} y={H - 6} fontSize={9} fill="#8c8c8c">{allDays[0]}</text>
                <text x={W - padR} y={H - 6} fontSize={9} fill="#8c8c8c" textAnchor="end">{allDays[n - 1]}</text>
              </svg>
              <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                {series.map((s, idx) => (
                  <Text key={s.project_id} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ color: palette[idx % palette.length] }}>●</span> {s.name} ({s.total})
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无完成数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Task Completion by Assignee Trend */}
      <Card
        title={<Space><UserOutlined /> 任务按负责人完成趋势</Space>}
        style={{ marginBottom: 24 }}
      >
        {taskCompletionByAssignee && taskCompletionByAssignee.series.length > 0 ? (() => {
          const series = taskCompletionByAssignee.series
          const allDays = taskCompletionByAssignee.all_days
          const n = allDays.length
          if (n < 2) return <Empty description="样本不足" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          const maxDone = Math.max(1, ...series.flatMap((s) => s.daily.map((d) => d.done)))
          const W = 560, H = 160, padL = 12, padR = 12, padT = 10, padB = 24
          const xStep = (W - padL - padR) / Math.max(1, n - 1)
          const palette = ['#722ed1', '#13c2c2', '#fa8c16', '#eb2f96', '#1677ff', '#52c41a', '#fa541c', '#08979c']
          const yOf = (v: number) => H - padB - (v / maxDone) * (H - padT - padB)
          const lineFor = (s: { daily: { done: number }[] }) =>
            s.daily.map((d, i) => `${(padL + i * xStep).toFixed(1)},${yOf(d.done).toFixed(1)}`).join(' ')
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {taskCompletionByAssignee.days} 天完成趋势（共 {taskCompletionByAssignee.total_done} 个完成，top{series.length} Agent）
              </Text>
              <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
                {[0, 0.5, 1].map((g) => {
                  const y = H - padB - g * (H - padT - padB)
                  return <line key={g} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth={1} />
                })}
                {series.map((s, idx) => (
                  <g key={s.agent_id}>
                    <polyline points={lineFor(s)} fill="none" stroke={palette[idx % palette.length]} strokeWidth={1.6} opacity={0.85} />
                    <title>{`${s.name}: 共${s.total}个完成`}</title>
                  </g>
                ))}
                <text x={padL} y={H - 6} fontSize={9} fill="#8c8c8c">{allDays[0]}</text>
                <text x={W - padR} y={H - 6} fontSize={9} fill="#8c8c8c" textAnchor="end">{allDays[n - 1]}</text>
              </svg>
              <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                {series.map((s, idx) => (
                  <Text key={s.agent_id} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ color: palette[idx % palette.length] }}>●</span> {s.name} ({s.total})
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无完成数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Agent Composite Health */}
      <Card
        title={<Space><FundOutlined /> Agent 综合健康度</Space>}
        style={{ marginBottom: 24 }}
      >
        {agentHealth && agentHealth.items.length > 0 ? (() => {
          const items = agentHealth.items
          const healthColor = (s: number) => s >= 80 ? '#52c41a' : s >= 60 ? '#faad14' : s >= 40 ? '#fa8c16' : '#ff4d4f'
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>近 {agentHealth.days} 天（声誉 0.4 + 完成 0.3 + 冲突 0.15 + 违规 0.15，按健康分降序）</Text>
              {items.map((a) => (
                <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
                  <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name}</span>
                  <div style={{ flex: '0 1 120px', background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: `${a.health_score}%`, height: '100%', background: healthColor(a.health_score), borderRadius: 3 }} />
                  </div>
                  <span style={{ color: healthColor(a.health_score), minWidth: 44, textAlign: 'right', fontWeight: 500 }}>{a.health_score}</span>
                  <Tooltip title={`声誉 ${a.sub_scores.reputation} · 完成 ${a.sub_scores.completion} · 冲突 ${a.sub_scores.conflict} · 违规 ${a.sub_scores.violation}`}>
                    <Tag style={{ fontSize: 10, cursor: 'default' }}>声誉 {a.sub_scores.reputation}</Tag>
                  </Tooltip>
                  <Tag color={a.sub_scores.completion >= 80 ? 'green' : a.sub_scores.completion >= 50 ? 'orange' : 'red'} style={{ fontSize: 10 }}>完成 {a.completion_rate != null ? `${a.completion_rate}%` : '—'}</Tag>
                  <Tag color={a.conflicts > 0 ? 'orange' : 'default'} style={{ fontSize: 10 }}>冲突 {a.conflicts}</Tag>
                  <Tag color={a.sandbox_violations > 0 ? 'red' : 'default'} style={{ fontSize: 10 }}>违规 {a.sandbox_violations}</Tag>
                </div>
              ))}
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>健康分色阶 ≥80 绿 / ≥60 橙 / ≥40 浅橙 / &lt;40 红</Text>
              {(() => {
                // Top3 Agent 四子分数雷达对比
                const top = items.slice(0, 3)
                if (top.length === 0) return null
                const axes = [
                  { key: 'reputation', label: '声誉' },
                  { key: 'completion', label: '完成' },
                  { key: 'conflict', label: '冲突' },
                  { key: 'violation', label: '违规' },
                ] as const
                const cx = 130, cy = 110, R = 80
                const ringColors = ['#52c41a', '#1677ff', '#722ed1']
                const angleFor = (i: number) => -Math.PI / 2 + (i / axes.length) * Math.PI * 2
                // 4 轴雷达：每个轴均匀分布在圆周上
                const pointFor = (vals: Record<string, number>, i: number) => {
                  const v = vals[axes[i].key] ?? 0
                  const ratio = Math.max(0, Math.min(1, v / 100))
                  return { x: cx + R * ratio * Math.cos(angleFor(i)), y: cy + R * ratio * Math.sin(angleFor(i)) }
                }
                const polyFor = (vals: Record<string, number>) =>
                  axes.map((_, i) => { const p = pointFor(vals, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
                return (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Top{top.length} Agent 子分数雷达对比:</Text>
                    <svg width={260} height={220} style={{ display: 'block', marginTop: 4 }}>
                      {/* 同心圆网格 */}
                      {[0.25, 0.5, 0.75, 1].map((g) => (
                        <polygon
                          key={g}
                          points={axes.map((_, i) => {
                            const x = cx + R * g * Math.cos(angleFor(i))
                            const y = cy + R * g * Math.sin(angleFor(i))
                            return `${x.toFixed(1)},${y.toFixed(1)}`
                          }).join(' ')}
                          fill="none"
                          stroke="#f0f0f0"
                          strokeWidth={1}
                        />
                      ))}
                      {/* 轴线 + 标签 */}
                      {axes.map((ax, i) => {
                        const x = cx + R * Math.cos(angleFor(i))
                        const y = cy + R * Math.sin(angleFor(i))
                        const lx = cx + (R + 14) * Math.cos(angleFor(i))
                        const ly = cy + (R + 14) * Math.sin(angleFor(i))
                        return (
                          <g key={ax.key}>
                            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#e8e8e8" strokeWidth={1} />
                            <text x={lx} y={ly} fontSize={10} fill="#8c8c8c" textAnchor="middle" dominantBaseline="middle">{ax.label}</text>
                          </g>
                        )
                      })}
                      {/* 每个 Agent 的雷达多边形 */}
                      {top.map((a, idx) => (
                        <g key={a.agent_id}>
                          <polygon
                            points={polyFor(a.sub_scores as unknown as Record<string, number>)}
                            fill={ringColors[idx % ringColors.length]}
                            fillOpacity={0.12}
                            stroke={ringColors[idx % ringColors.length]}
                            strokeWidth={1.5}
                          />
                          <title>{`${a.name}: 声誉${a.sub_scores.reputation} 完成${a.sub_scores.completion} 冲突${a.sub_scores.conflict} 违规${a.sub_scores.violation}`}</title>
                        </g>
                      ))}
                    </svg>
                    <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                      {top.map((a, idx) => (
                        <Text key={a.agent_id} type="secondary" style={{ fontSize: 10 }}>
                          <span style={{ color: ringColors[idx % ringColors.length] }}>●</span> {a.name} ({a.health_score})
                        </Text>
                      ))}
                    </div>
                  </div>
                )
              })()}
              {(() => {
                // Agent × 维度子分数热力（声誉/完成/冲突/违规）
                const top = items.slice(0, 12)
                if (top.length === 0) return null
                const dims = [
                  { key: 'reputation', label: '声誉' },
                  { key: 'completion', label: '完成' },
                  { key: 'conflict', label: '冲突' },
                  { key: 'violation', label: '违规' },
                ] as const
                const cellColor = (v: number) => {
                  if (v >= 80) return '#52c41a'
                  if (v >= 60) return '#a0d911'
                  if (v >= 40) return '#faad14'
                  if (v >= 20) return '#fa8c16'
                  return '#ff4d4f'
                }
                return (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Agent × 维度子分数热力（top{top.length}）:</Text>
                    <div style={{ marginTop: 4, overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', textAlign: 'left', position: 'sticky', left: 0, background: '#fff' }}>Agent</th>
                            {dims.map((d) => (
                              <th key={d.key} style={{ padding: '2px 8px', borderBottom: '1px solid #f0f0f0', color: '#8c8c8c' }}>{d.label}</th>
                            ))}
                            <th style={{ padding: '2px 8px', borderBottom: '1px solid #f0f0f0', color: '#8c8c8c' }}>综合</th>
                          </tr>
                        </thead>
                        <tbody>
                          {top.map((a) => (
                            <tr key={a.agent_id}>
                              <td style={{ padding: '2px 6px', color: '#595959', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#fff' }} title={a.name}>{a.name.length > 10 ? a.name.slice(0, 9) + '…' : a.name}</td>
                              {dims.map((d) => {
                                const v = a.sub_scores[d.key] ?? 0
                                return (
                                  <td key={d.key} style={{ padding: 0 }}>
                                    <Tooltip title={`${a.name} ${d.label}: ${v}`}>
                                      <div style={{ width: 46, height: 22, background: cellColor(v), color: v >= 50 ? '#fff' : '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 1, fontSize: 10 }}>
                                        {v}
                                      </div>
                                    </Tooltip>
                                  </td>
                                )
                              })}
                              <td style={{ padding: 0 }}>
                                <div style={{ width: 46, height: 22, background: cellColor(a.health_score), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 1, fontSize: 10, fontWeight: 'bold' }}>
                                  {a.health_score}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>色阶:</Text>
                      {[
                        { c: '#ff4d4f', l: '<20' },
                        { c: '#fa8c16', l: '≥20' },
                        { c: '#faad14', l: '≥40' },
                        { c: '#a0d911', l: '≥60' },
                        { c: '#52c41a', l: '≥80' },
                      ].map(({ c, l }) => (
                        <Text key={l} type="secondary" style={{ fontSize: 10 }}>
                          <span style={{ display: 'inline-block', width: 12, height: 10, background: c, borderRadius: 2, verticalAlign: 'middle' }} /> {l}
                        </Text>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })() : (
          <Empty description="暂无 Agent" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        {/* 健康度趋势 Agent 维度筛选 */}
        {agentHealth && agentHealth.items.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>趋势下钻:</Text>
            <Select
              size="small"
              style={{ width: 200 }}
              allowClear
              placeholder="全舰队"
              value={healthTrendAgentId}
              onChange={(v) => { setHealthTrendAgentId(v); reloadHealthTrend(v) }}
              options={agentHealth.items.map((a) => ({ value: a.agent_id, label: `${a.name} #${a.agent_id}` }))}
              loading={healthTrendLoading}
            />
            {agentHealthTrend?.agent_name && <Tag color="purple" style={{ fontSize: 10 }}>{agentHealthTrend.agent_name}</Tag>}
          </div>
        )}
        {agentHealthTrend && agentHealthTrend.trend.length > 0 && (() => {
          const valid = agentHealthTrend.trend.filter((b) => b.avg_reputation != null)
          // 事件标记：仅含有冲突或违规的天
          const eventDays = agentHealthTrend.trend.filter((b) => (b.conflicts || 0) > 0 || (b.sandbox_violations || 0) > 0)
          const maxEvents = Math.max(1, ...agentHealthTrend.trend.map((b) => (b.conflicts || 0) + (b.sandbox_violations || 0)))
          const trendW = 520
          const daySpan = agentHealthTrend.trend.length
          return (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {agentHealthTrend.days} 天声誉趋势（累计正向 {agentHealthTrend.total_positive} / 负向 {agentHealthTrend.total_negative} / 冲突 {agentHealthTrend.total_conflicts || 0} / 违规 {agentHealthTrend.total_violations || 0}）
              </Text>
              {valid.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <MiniTrendChart
                    series={[{ key: 'avg_reputation', label: '平均声誉', color: '#722ed1', values: valid.map((b) => b.avg_reputation as number) }]}
                    labels={valid.map((b) => b.date)}
                    height={84}
                  />
                </div>
              )}
              {/* 按 kind 分组趋势线 */}
              {(() => {
                const kindAvgs: Record<string, number[]> = {}
                const kindColors: Record<string, string> = { coordinator: '#722ed1', autonomous: '#13c2c2', assistant: '#1890ff', external: '#fa8c16' }
                const allDates = agentHealthTrend!.trend.map((b) => b.date)
                agentHealthTrend!.trend.forEach((b) => {
                  if (!b.by_kind_avg) return
                  Object.entries(b.by_kind_avg).forEach(([k, v]) => {
                    if (!kindAvgs[k]) kindAvgs[k] = new Array(allDates.length).fill(null as unknown as number)
                    const idx = allDates.indexOf(b.date)
                    if (idx >= 0) kindAvgs[k][idx] = v
                  })
                })
                const kinds = Object.keys(kindAvgs).filter((k) => kindAvgs[k].some((v) => v != null))
                if (kinds.length < 2) return null
                const kW = 260, kH = 70, kPadL = 24, kPadR = 4, kPadT = 4, kPadB = 14
                const kPlotW = kW - kPadL - kPadR
                const kPlotH = kH - kPadT - kPadB
                const kXStep = allDates.length > 1 ? kPlotW / (allDates.length - 1) : 0
                return (
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>按 Kind 分组趋势</Text>
                    <svg width={kW} height={kH} style={{ display: 'block' }}>
                      {[0, 50, 100].map((v) => {
                        const y = kPadT + kPlotH - (v / 100) * kPlotH
                        return <line key={v} x1={kPadL} y1={y} x2={kW - kPadR} y2={y} stroke="#f0f0f0" strokeWidth={0.5} />
                      })}
                      {kinds.map((k) => {
                        const pts = kindAvgs[k].map((v, i) => {
                          if (v == null) return ''
                          const x = kPadL + i * kXStep
                          const y = kPadT + kPlotH - (v / 100) * kPlotH
                          return `${x.toFixed(1)},${y.toFixed(1)}`
                        }).filter(Boolean).join(' ')
                        if (!pts) return null
                        return <polyline key={k} points={pts} fill="none" stroke={kindColors[k] || '#8c8c8c'} strokeWidth={1.5} />
                      })}
                    </svg>
                    <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                      {kinds.map((k) => (
                        <Text key={k} type="secondary" style={{ fontSize: 10 }}>
                          <span style={{ color: kindColors[k] || '#8c8c8c' }}>━</span> {k}
                        </Text>
                      ))}
                    </div>
                  </div>
                )
              })()}
              {eventDays.length > 0 && daySpan > 1 && (
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>事件标记（与上方趋势同 x 轴）</Text>
                  <svg width={trendW} height={28} style={{ display: 'block' }}>
                    {agentHealthTrend.trend.map((b, i) => {
                      const x = (i / (daySpan - 1)) * (trendW - 8) + 4
                      const c = b.conflicts || 0
                      const v = b.sandbox_violations || 0
                      const r = 3 + 4 * ((c + v) / maxEvents)
                      return (
                        <g key={b.date}>
                          {c > 0 && <circle cx={x} cy={10} r={r} fill="#ff4d4f" opacity={0.85} />}
                          {v > 0 && <circle cx={x} cy={22} r={r} fill="#fa8c16" opacity={0.85} />}
                          <title>{b.date}: 冲突 {c} / 违规 {v}</title>
                        </g>
                      )
                    })}
                  </svg>
                  <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#ff4d4f' }}>●</span> 冲突</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#fa8c16' }}>●</span> 沙盒违规</Text>
                  </div>
                </div>
              )}
              {/* 异常检测标记 */}
              {(() => {
                if (valid.length < 5) return null
                const vals = valid.map((b) => b.avg_reputation as number)
                const mean = vals.reduce((s, v) => s + v, 0) / vals.length
                const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length)
                // 异常点：值 < 均值-2σ 或连续3天下降的起始
                const anomalies: { idx: number; type: string; val: number }[] = []
                vals.forEach((v, i) => {
                  if (std > 0 && v < mean - 2 * std) anomalies.push({ idx: i, type: 'spike', val: v })
                  if (i >= 2 && vals[i] < vals[i - 1] && vals[i - 1] < vals[i - 2]) {
                    if (!anomalies.find(a => a.idx === i - 2)) anomalies.push({ idx: i - 2, type: 'decline', val: vals[i - 2] })
                  }
                })
                if (anomalies.length === 0) return null
                const aW = 520, aH = 36, aPadL = 4, aPadR = 4
                const aXStep = (aW - aPadL - aPadR) / Math.max(1, valid.length - 1)
                const minV = Math.min(...vals)
                const maxV = Math.max(...vals)
                const range = maxV - minV || 1
                return (
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>异常检测（均值={mean.toFixed(1)} σ={std.toFixed(1)}）</Text>
                    <svg width={aW} height={aH} style={{ display: 'block' }}>
                      {/* 均值线 */}
                      {(() => {
                        const y = 4 + (1 - (mean - minV) / range) * 24
                        return <line x1={aPadL} y1={y} x2={aW - aPadR} y2={y} stroke="#d9d9d9" strokeDasharray="3 2" strokeWidth={0.5} />
                      })()}
                      {/* -2σ 阈值线 */}
                      {(() => {
                        const thresh = mean - 2 * std
                        if (thresh < minV) return null
                        const y = 4 + (1 - (thresh - minV) / range) * 24
                        return <line x1={aPadL} y1={y} x2={aW - aPadR} y2={y} stroke="#ff4d4f" strokeDasharray="4 3" strokeWidth={0.5} />
                      })()}
                      {/* 异常点 */}
                      {anomalies.map((a, ai) => {
                        const x = aPadL + a.idx * aXStep
                        const y = 4 + (1 - (a.val - minV) / range) * 24
                        const isDecline = a.type === 'decline'
                        return (
                          <g key={ai}>
                            <circle cx={x} cy={y} r={5} fill={isDecline ? '#fa8c16' : '#ff4d4f'} fillOpacity={0.25} stroke={isDecline ? '#fa8c16' : '#ff4d4f'} strokeWidth={1} />
                            <circle cx={x} cy={y} r={2} fill={isDecline ? '#fa8c16' : '#ff4d4f'} />
                            <title>{valid[a.idx].date}: {a.type === 'spike' ? '突降异常' : '连续下降'} 声誉={a.val.toFixed(1)}</title>
                          </g>
                        )
                      })}
                    </svg>
                    <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                      <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>◉</span> 突降(&lt;μ-2σ)</Text>
                      <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#fa8c16' }}>◉</span> 连续下降(3天)</Text>
                      <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#d9d9d9' }}>---</span> 均值</Text>
                    </div>
                  </div>
                )
              })()}
              {(() => {
                // 双轴对比：声誉（紫，左轴）× 产出完成数（绿，右轴），按 date 对齐
                if (!productivityTrend || productivityTrend.trend.length < 2 || daySpan < 2) return null
                const prodByDate: Record<string, number> = {}
                productivityTrend.trend.forEach((b) => { prodByDate[b.date] = (prodByDate[b.date] || 0) + b.done })
                const maxRep = 100
                const maxDone = Math.max(1, ...Object.values(prodByDate))
                const W = trendW, H = 70, padL = 4, padR = 4, padT = 6, padB = 14
                const xStep = (W - padL - padR) / Math.max(1, daySpan - 1)
                const repPts: string[] = []
                const donePts: string[] = []
                agentHealthTrend.trend.forEach((b, i) => {
                  const x = padL + i * xStep
                  if (b.avg_reputation != null) {
                    const y = H - padB - (b.avg_reputation / maxRep) * (H - padT - padB)
                    repPts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
                  }
                  const d = prodByDate[b.date] || 0
                  const dy = H - padB - (d / maxDone) * (H - padT - padB)
                  donePts.push(`${x.toFixed(1)},${dy.toFixed(1)}`)
                })
                if (repPts.length < 2 && donePts.length < 2) return null
                return (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>声誉 × 产出完成数 双轴对比:</Text>
                    <svg width={W} height={H} style={{ display: 'block' }}>
                      {repPts.length >= 2 && <polyline points={repPts.join(' ')} fill="none" stroke="#722ed1" strokeWidth={1.6} opacity={0.85} />}
                      {donePts.length >= 2 && <polyline points={donePts.join(' ')} fill="none" stroke="#52c41a" strokeWidth={1.6} strokeDasharray="4 3" opacity={0.85} />}
                    </svg>
                    <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#722ed1' }}>━</span> 平均声誉(0-100)</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#52c41a' }}>┄</span> 完成数(max {maxDone})</Text>
                      {(() => {
                        // Pearson 相关系数：声誉 vs 产出完成数
                        const pairs: [number, number][] = []
                        agentHealthTrend.trend.forEach((b) => {
                          if (b.avg_reputation == null) return
                          const d = prodByDate[b.date] || 0
                          pairs.push([b.avg_reputation, d])
                        })
                        if (pairs.length < 3) return null
                        const n = pairs.length
                        const sumX = pairs.reduce((s, p) => s + p[0], 0)
                        const sumY = pairs.reduce((s, p) => s + p[1], 0)
                        const sumXY = pairs.reduce((s, p) => s + p[0] * p[1], 0)
                        const sumX2 = pairs.reduce((s, p) => s + p[0] * p[0], 0)
                        const sumY2 = pairs.reduce((s, p) => s + p[1] * p[1], 0)
                        const denom = Math.sqrt(Math.max(0, (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)))
                        const r = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
                        const rLabel = Math.abs(r) >= 0.7 ? '强' : Math.abs(r) >= 0.4 ? '中' : '弱'
                        const rColor = Math.abs(r) >= 0.7 ? '#722ed1' : Math.abs(r) >= 0.4 ? '#1890ff' : '#8c8c8c'
                        return (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            相关性 r=<b style={{ color: rColor }}>{r.toFixed(2)}</b>({rLabel}, n={n})
                          </Text>
                        )
                      })()}
                    </div>
                  </div>
                )
              })()}
              {(() => {
                // 按 kind 分层声誉曲线（各 kind 每日平均声誉）
                const kindOverall = agentHealthTrend.by_kind_overall || {}
                const kinds = Object.keys(kindOverall).slice(0, 6)
                if (kinds.length === 0) return null
                const trend = agentHealthTrend.trend
                const n = trend.length
                if (n < 2) return null
                const W = 520, H = 70, padL = 4, padR = 4, padT = 6, padB = 14
                const xStep = (W - padL - padR) / Math.max(1, n - 1)
                const palette = ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#fa8c16', '#8c8c8c']
                const kindColor: Record<string, string> = { assistant: '#1677ff', worker: '#52c41a', orchestrator: '#722ed1', reviewer: '#13c2c2', planner: '#fa8c16', observer: '#8c8c8c' }
                const lineFor = (kind: string) => {
                  const pts: string[] = []
                  trend.forEach((b, i) => {
                    const v = b.by_kind_avg?.[kind]
                    if (v == null) return
                    const x = padL + i * xStep
                    const y = H - padB - (v / 100) * (H - padT - padB)
                    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
                  })
                  return pts.join(' ')
                }
                return (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按 kind 分层声誉趋势:</Text>
                    <svg width={W} height={H} style={{ display: 'block' }}>
                      {kinds.map((k, idx) => {
                        const pts = lineFor(k)
                        if (pts.split(' ').length < 2) return null
                        const c = kindColor[k] || palette[idx % palette.length]
                        return <polyline key={k} points={pts} fill="none" stroke={c} strokeWidth={1.6} opacity={0.85} />
                      })}
                    </svg>
                    <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                      {kinds.map((k, idx) => {
                        const c = kindColor[k] || palette[idx % palette.length]
                        return (
                          <Text key={k} type="secondary" style={{ fontSize: 10 }}>
                            <span style={{ color: c }}>●</span> {k} ({kindOverall[k]})
                          </Text>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })()}
      </Card>

      {/* Agent Productivity */}
      <Card
        title={<Space><ThunderboltOutlined /> Agent 产出效率</Space>}
        style={{ marginBottom: 24 }}
      >
        {agentProductivity && agentProductivity.items.length > 0 ? (() => {
          const items = agentProductivity.items
          const maxDone = Math.max(1, ...items.map((a) => a.done))
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>近 {agentProductivity.days} 天（按完成数降序）</Text>
              {items.map((a) => {
                const rate = a.completion_rate
                const rateColor = rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f'
                return (
                  <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name}</span>
                    <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: `${(a.done / maxDone) * 100}%`, height: '100%', background: rateColor, borderRadius: 3 }} />
                    </div>
                    <Tag style={{ fontSize: 10 }}>分配 {a.total}</Tag>
                    <Tag color="green" style={{ fontSize: 10 }}>完成 {a.done}</Tag>
                    {a.failed > 0 && <Tag color="red" style={{ fontSize: 10 }}>失败 {a.failed}</Tag>}
                    {a.in_progress > 0 && <Tag color="blue" style={{ fontSize: 10 }}>进行 {a.in_progress}</Tag>}
                    <span style={{ color: rateColor, minWidth: 56, textAlign: 'right' }}>率 {rate}%</span>
                    <span style={{ color: '#8c8c8c', minWidth: 60, textAlign: 'right' }}>{a.avg_completion_hours != null ? `${a.avg_completion_hours}h` : '—'}</span>
                  </div>
                )
              })}
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>完成率色阶 ≥80% 绿 / ≥50% 橙 / &lt;50% 红；右侧为平均完成时长</Text>
            </div>
          )
        })() : (
          <Empty description="暂无分配数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        {productivityTrend && productivityTrend.trend.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              近 {productivityTrend.days} 天产出趋势（累计完成 {productivityTrend.total_done} / 失败 {productivityTrend.total_failed}）
            </Text>
            <div style={{ marginTop: 4 }}>
              <WorkflowRunTrendChart
                buckets={productivityTrend.trend.map((b) => ({ date: b.date, succeeded: b.done, failed: b.failed, failed_steps: b.failed }))}
                width={520}
                height={84}
              />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
              <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#52c41a' }}>●</span> 完成</Text>
              <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#ff4d4f' }}>●</span> 失败</Text>
            </div>
            {(() => {
              const kindTotals = productivityTrend.by_kind_totals || {}
              const kinds = Object.keys(kindTotals).slice(0, 6)
              if (kinds.length === 0) return null
              const kindColor: Record<string, string> = { assistant: '#1677ff', worker: '#52c41a', orchestrator: '#722ed1', reviewer: '#13c2c2', planner: '#fa8c16', observer: '#8c8c8c' }
              const W = 520, H = 70, padL = 4, padR = 4, padT = 6, padB = 14
              const trend = productivityTrend.trend
              const n = trend.length
              if (n < 2) return null
              const allDone = trend.flatMap((b) => Object.entries(b.by_kind || {}).map(([, v]) => (v as { done: number }).done))
              const maxDone = Math.max(1, ...allDone)
              const xStep = (W - padL - padR) / Math.max(1, n - 1)
              const palette = ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#fa8c16', '#8c8c8c']
              const lineFor = (kind: string) => {
                const pts = trend.map((b, i) => {
                  const v = (b.by_kind?.[kind]?.done) ?? 0
                  const x = padL + i * xStep
                  const y = H - padB - (v / maxDone) * (H - padT - padB)
                  return `${x.toFixed(1)},${y.toFixed(1)}`
                })
                return pts.join(' ')
              }
              return (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按 kind 分层完成趋势:</Text>
                  <svg width={W} height={H} style={{ display: 'block' }}>
                    {kinds.map((k, idx) => {
                      const c = kindColor[k] || palette[idx % palette.length]
                      return (
                        <g key={k}>
                          <polyline
                            points={lineFor(k)}
                            fill="none"
                            stroke={c}
                            strokeWidth={1.6}
                            opacity={0.85}
                          />
                        </g>
                      )
                    })}
                  </svg>
                  <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                    {kinds.map((k, idx) => {
                      const c = kindColor[k] || palette[idx % palette.length]
                      const t = kindTotals[k] as { done: number; failed: number }
                      return (
                        <Text key={k} type="secondary" style={{ fontSize: 10 }}>
                          <span style={{ color: c }}>●</span> {k} ({t.done})
                        </Text>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </Card>

      {/* Productivity by Kind Comparison */}
      <Card
        title={<Space><ThunderboltOutlined /> 按 Agent 类别 产出对比</Space>}
        style={{ marginBottom: 24 }}
      >
        {productivityByKind ? (
          productivityByKind.items.length > 0 ? (() => {
            const kindColor: Record<string, string> = { assistant: '#1677ff', worker: '#52c41a', orchestrator: '#722ed1', reviewer: '#13c2c2' }
            const maxTotal = Math.max(1, ...productivityByKind.items.map((k) => k.total))
            const maxHours = Math.max(1, ...productivityByKind.items.map((k) => k.avg_completion_hours ?? 0))
            const columns = [
              { title: '类别', dataIndex: 'kind', key: 'kind', render: (k: string) => <Tag color={kindColor[k] || 'default'}>{k}</Tag> },
              { title: 'Agent数', dataIndex: 'agent_count', key: 'agent_count', width: 80 },
              { title: '分配', dataIndex: 'total', key: 'total', width: 80, render: (v: number) => <Space size={4}>{v}<div style={{ width: 60, height: 6, background: '#f0f0f0', borderRadius: 3 }}><div style={{ width: `${(v / maxTotal) * 100}%`, height: '100%', background: '#1677ff', borderRadius: 3 }} /></div></Space> },
              { title: '完成', dataIndex: 'done', key: 'done', width: 70 },
              { title: '完成率', dataIndex: 'completion_rate', key: 'completion_rate', width: 90, render: (v: number) => <Tag color={v >= 80 ? 'green' : v >= 50 ? 'orange' : 'red'}>{v}%</Tag> },
              { title: '失败率', dataIndex: 'failure_rate', key: 'failure_rate', width: 90, render: (v: number) => <Tag color={v <= 10 ? 'green' : v <= 30 ? 'orange' : 'red'}>{v}%</Tag> },
              { title: '平均完成(h)', dataIndex: 'avg_completion_hours', key: 'avg_completion_hours', width: 140, render: (v: number | null) => v == null ? '-' : <Space size={4}><span style={{ minWidth: 36, textAlign: 'right' }}>{v}</span><div style={{ width: 70, height: 8, background: '#f0f0f0', borderRadius: 4 }}><div style={{ width: `${(v / maxHours) * 100}%`, height: '100%', background: '#fa8c16', borderRadius: 4 }} /></div></Space> },
            ]
            return <Table size="small" pagination={false} columns={columns} dataSource={productivityByKind.items} rowKey="kind" />
          })() : <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty description="加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Productivity Hourly Heatmap */}
      <Card
        title={<Space><HeatMapOutlined /> Agent 产出 小时维度热力</Space>}
        style={{ marginBottom: 24 }}
      >
        {productivityHourly && productivityHourly.agents.length > 0 ? (() => {
          const agents = productivityHourly.agents
          const matrix = productivityHourly.matrix
          const maxCell = Math.max(1, productivityHourly.max_cell)
          const hours = Array.from({ length: 24 }, (_, i) => i)
          const cellColor = (v: number) => {
            if (!v) return '#fafafa'
            const r = v / maxCell
            if (r >= 0.75) return '#722ed1'
            if (r >= 0.5) return '#1890ff'
            if (r >= 0.25) return '#69b1ff'
            return '#bae0ff'
          }
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {productivityHourly.days} 天完成时段分布（行=Agent，列=小时 0-23，峰值 {productivityHourly.peak_hour != null ? `${productivityHourly.peak_hour}时` : '—'}）
              </Text>
              <div style={{ marginTop: 4, overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', textAlign: 'left', position: 'sticky', left: 0, background: '#fff' }}>Agent</th>
                      {hours.map((h) => (
                        <th key={h} style={{ padding: '2px 1px', borderBottom: '1px solid #f0f0f0', color: h === productivityHourly.peak_hour ? '#722ed1' : '#8c8c8c', fontWeight: h === productivityHourly.peak_hour ? 'bold' : 'normal' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a) => {
                      const row = matrix[String(a.agent_id)] || {}
                      return (
                        <tr key={a.agent_id}>
                          <td style={{ padding: '2px 6px', color: '#595959', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#fff' }} title={`${a.name} (完成${a.done})`}>{a.name.length > 10 ? a.name.slice(0, 9) + '…' : a.name}</td>
                          {hours.map((h) => {
                            const v = row[String(h)] || 0
                            return (
                              <td key={h} style={{ padding: 0 }}>
                                <Tooltip title={`${a.name} ${h}时: ${v}`}>
                                  <div style={{ width: 20, height: 18, background: cellColor(v), color: v >= maxCell * 0.5 ? '#fff' : '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 0.5 }}>
                                    {v || ''}
                                  </div>
                                </Tooltip>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>色阶:</Text>
                {[
                  { c: '#bae0ff', l: '低' },
                  { c: '#69b1ff', l: '中低' },
                  { c: '#1890ff', l: '中' },
                  { c: '#722ed1', l: '高' },
                ].map(({ c, l }) => (
                  <Text key={l} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ display: 'inline-block', width: 12, height: 10, background: c, borderRadius: 2, verticalAlign: 'middle' }} /> {l}
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无完成时段数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Agent 产出日历热力图 */}
      {productivityCalendar && productivityCalendar.agents.length > 0 && (() => {
        const agents = productivityCalendar.agents
        const matrix = productivityCalendar.matrix
        const maxCell = Math.max(1, productivityCalendar.max_cell)
        const dateRange = productivityCalendar.date_range
        // Render a grid: each row = agent, columns = weeks (7 days per col)
        // Group dates by week
        const weeks: string[][] = []
        let cur: string[] = []
        for (const d of dateRange) {
          cur.push(d)
          if (cur.length === 7) { weeks.push(cur); cur = [] }
        }
        if (cur.length > 0) weeks.push(cur)
        const cellColor = (v: number) => {
          if (!v) return '#f0f0f0'
          const r = v / maxCell
          if (r >= 0.75) return '#135200'
          if (r >= 0.5) return '#389e0d'
          if (r >= 0.25) return '#95de64'
          return '#d9f7be'
        }
        const cellSize = 13
        const gap = 2
        const labelW = 80
        const svgW = labelW + weeks.length * (cellSize + gap) + 20
        const svgH = labelW + agents.length * (cellSize + gap) + 30
        return (
          <Card
            title={<Space><CalendarOutlined /> 产出日历热力</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {productivityCalendar.days} 天</Text>}
            style={{ marginBottom: 24 }}
          >
            <div style={{ overflowX: 'auto' }}>
              <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
                {/* Week labels (month) */}
                {weeks.map((w, wi) => {
                  const month = w[0]?.slice(5, 7)
                  const showLabel = wi === 0 || (w[0] && weeks[wi - 1]?.[0]?.slice(5, 7) !== month)
                  return showLabel ? (
                    <text key={`wm-${wi}`} x={labelW + wi * (cellSize + gap)} y={14} fontSize={9} fill="#8c8c8c">{month}月</text>
                  ) : null
                })}
                {/* Agent rows */}
                {agents.map((a, ai) => {
                  const row = matrix[String(a.agent_id)] || {}
                  return (
                    <g key={`ar-${a.agent_id}`}>
                      <text x={labelW - 4} y={28 + ai * (cellSize + gap) + cellSize / 2 + 2} fontSize={9} fill="#595959" textAnchor="end">{a.name.length > 8 ? a.name.slice(0, 7) + '…' : a.name}</text>
                      {weeks.map((w, wi) => (
                        <g key={`wk-${wi}`}>
                          {w.map((d, di) => {
                            const v = row[d] || 0
                            const isFuture = d > new Date().toISOString().slice(0, 10)
                            return (
                              <Tooltip key={d} title={`${a.name} ${d}: ${v} 完成`}>
                                <rect
                                  x={labelW + wi * (cellSize + gap)}
                                  y={28 + ai * (cellSize + gap) + di * (cellSize + gap)}
                                  width={cellSize}
                                  height={cellSize}
                                  rx={2}
                                  fill={isFuture ? '#fafafa' : cellColor(v)}
                                  stroke="#fff"
                                  strokeWidth={0.5}
                                />
                              </Tooltip>
                            )
                          })}
                        </g>
                      ))}
                    </g>
                  )
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 10 }}>少</Text>
              {['#f0f0f0', '#d9f7be', '#95de64', '#389e0d', '#135200'].map((c, i) => (
                <div key={i} style={{ width: 12, height: 10, background: c, borderRadius: 2 }} />
              ))}
              <Text type="secondary" style={{ fontSize: 10 }}>多</Text>
            </div>
          </Card>
        )
      })()}

      {/* Agent Run Resource Usage */}
      {agentRunResourceUsage && agentRunResourceUsage.items.length > 0 && (() => {
        const items = agentRunResourceUsage.items
        const maxHours = Math.max(1, ...items.map((it) => it.total_hours))
        return (
          <Card
            title={<Space><ThunderboltOutlined /> Agent 运行资源排行</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {agentRunResourceUsage.total_runs} 次</Text>}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map((it) => (
                <div key={it.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={it.name}>{it.name}</span>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 14, position: 'relative', overflow: 'hidden' }}>
                    <Tooltip title={`${it.name}: ${it.total_runs}次 总${it.total_hours}h 均${it.avg_run_minutes}min`}>
                      <div style={{ width: `${(it.total_hours / maxHours) * 100}%`, height: '100%', background: '#722ed1', borderRadius: 3, opacity: 0.7 }} />
                    </Tooltip>
                  </div>
                  <span style={{ color: '#722ed1', minWidth: 40, textAlign: 'right', fontSize: 11 }}>{it.total_hours}h</span>
                  <Text type="secondary" style={{ fontSize: 10 }}>{it.total_runs}次 均{it.avg_run_minutes}min</Text>
                </div>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* Agent 产出效率周间对比 */}
      {agentProdWeeklyComparison && agentProdWeeklyComparison.agents.length > 0 && (() => {
        const agents = agentProdWeeklyComparison.agents
        const maxWeek = Math.max(...agents.map(a => Math.max(a.this_week, a.last_week)), 1)
        const barMaxW = 140
        return (
          <Card
            title={<Space><SwapOutlined /> Agent 产出周间对比</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>本周 {agentProdWeeklyComparison.total_this_week} · 上周 {agentProdWeeklyComparison.total_last_week}</Text>}
            style={{ marginBottom: 24 }}
          >
            {agents.map((a) => {
              const thisW = Math.max(2, (a.this_week / maxWeek) * barMaxW)
              const lastW = Math.max(2, (a.last_week / maxWeek) * barMaxW)
              const changeColor = a.change_pct > 0 ? '#52c41a' : a.change_pct < 0 ? '#ff4d4f' : '#8c8c8c'
              const arrow = a.change_pct > 0 ? '↑' : a.change_pct < 0 ? '↓' : '→'
              return (
                <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12 }}>
                  <Text style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.name}>{a.name}</Text>
                  <Tooltip title={`上周: ${a.last_week}`}>
                    <svg width={barMaxW + 4} height={10} style={{ flexShrink: 0 }}>
                      <rect x={0} y={1} width={barMaxW} height={8} rx={2} fill="#f5f5f5" />
                      <rect x={0} y={1} width={lastW} height={8} rx={2} fill="#bfbfbf" opacity={0.5} />
                    </svg>
                  </Tooltip>
                  <Tooltip title={`本周: ${a.this_week}`}>
                    <svg width={barMaxW + 4} height={10} style={{ flexShrink: 0 }}>
                      <rect x={0} y={1} width={barMaxW} height={8} rx={2} fill="#f5f5f5" />
                      <rect x={0} y={1} width={thisW} height={8} rx={2} fill="#1890ff" opacity={0.7} />
                    </svg>
                  </Tooltip>
                  <Text style={{ color: changeColor, minWidth: 50, fontSize: 11 }}>{arrow}{Math.abs(a.change_pct)}%</Text>
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#bfbfbf' }}>■</span> 上周</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#1890ff' }}>■</span> 本周</Text>
            </div>
          </Card>
        )
      })()}

      {/* Agent Failure Reasons */}
      <Card
        title={<Space><BugOutlined /> Agent 失败原因分布</Space>}
        style={{ marginBottom: 24 }}
      >
        {agentFailureReasons && agentFailureReasons.items.length > 0 ? (() => {
          const items = agentFailureReasons.items
          const maxCount = Math.max(1, ...items.map((i) => i.count))
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {agentFailureReasons.days} 天失败原因分布（共 {agentFailureReasons.total_failed_runs} 次失败，top{items.length}）
              </Text>
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <span style={{ width: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={it.reason}>{it.reason}</span>
                    <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 14, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: `${(it.count / maxCount) * 100}%`, height: '100%', background: '#ff4d4f', borderRadius: 3 }} />
                    </div>
                    <Tooltip title={`涉及: ${(it.affected_agent_names || []).join(', ') || '无'}`}>
                      <span style={{ color: '#8c8c8c', minWidth: 70, textAlign: 'right' }}>{it.count}次 · {it.affected_agent_names.length} Agent</span>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无失败记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Agent Failure Error Pattern Clustering */}
      <Card
        title={<Space><ClusterOutlined /> Agent 错误模式聚类</Space>}
        style={{ marginBottom: 24 }}
      >
        {agentFailureErrorPatterns && agentFailureErrorPatterns.patterns.length > 0 ? (() => {
          const patterns = agentFailureErrorPatterns.patterns
          const maxCount = Math.max(1, ...patterns.map((p) => p.count))
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {agentFailureErrorPatterns.days} 天错误模式聚类（前缀长度 {agentFailureErrorPatterns.prefix_length}，共 {patterns.length} 个模式）
              </Text>
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {patterns.map((p, idx) => (
                  <div key={idx} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <Text code style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.pattern}>{p.pattern}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ width: `${(p.count / maxCount) * 100}%`, height: '100%', background: '#fa8c16', borderRadius: 3 }} />
                      </div>
                      <span style={{ color: '#8c8c8c', fontSize: 11, minWidth: 50, textAlign: 'right' }}>{p.count}次</span>
                      <Tooltip title={p.affected_agents.map((a) => a.agent_name).join(', ') || '无'}>
                        <span style={{ color: '#595959', fontSize: 11, minWidth: 70, textAlign: 'right' }}>{p.affected_agents.length} Agent</span>
                      </Tooltip>
                      {p.peak_hour !== null && p.peak_hour !== undefined && (
                        <Tooltip title={`时段分布: ${(p.hour_distribution || []).map((h, hi) => hi + ':00 → ' + h).join(', ')}`}>
                          <span style={{ color: '#1890ff', fontSize: 11 }}>峰值 {p.peak_hour}:00</span>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无错误模式数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Agent Capability Gap Analysis */}
      <Card
        title={<Space><AuditOutlined /> Agent 能力缺口分析</Space>}
        style={{ marginBottom: 24 }}
      >
        {capabilityGapAnalysis && capabilityGapAnalysis.agents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {capabilityGapAnalysis.agents.map((a, ai) => (
              <div key={ai} style={{ background: '#fafafa', borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text strong>{a.agent_name}</Text>
                  <Space size={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{a.total_capabilities} 项能力</Text>
                    <Tag color={a.coverage_score >= 80 ? 'green' : a.coverage_score >= 50 ? 'orange' : 'red'}>
                      覆盖率 {a.coverage_score}%
                    </Tag>
                  </Space>
                </div>
                {/* Coverage bar */}
                <div style={{ background: '#f0f0f0', borderRadius: 3, height: 8, marginBottom: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${a.coverage_score}%`, height: '100%', background: a.coverage_score >= 80 ? '#52c41a' : a.coverage_score >= 50 ? '#fa8c16' : '#ff4d4f', borderRadius: 3 }} />
                </div>
                {/* Gaps */}
                {a.gaps.length > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>缺口（有经验但未声明）:</Text>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                      {a.gaps.map((g, gi) => (
                        <Tooltip key={gi} title={`${g.success_count}次成功 · 置信度${(g.avg_confidence * 100).toFixed(0)}% · ${g.failure_count}次失败`}>
                          <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{g.domain}</Tag>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
                {/* Overclaims */}
                {a.overclaims.length > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 10 }}>过度声明（无成功经验支撑）:</Text>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                      {a.overclaims.map((o, oi) => (
                        <Tooltip key={oi} title={`${o.failure_count}次失败 · 风险${o.risk}`}>
                          <Tag color={o.risk === 'high' ? 'red' : o.risk === 'medium' ? 'orange' : 'default'} style={{ fontSize: 10, margin: 0 }}>{o.capability}</Tag>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无能力缺口数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Task Allocation Fairness */}
      {taskAllocationFairness && taskAllocationFairness.agents.length > 0 && (
        <Card
          title={<Space><PieChartOutlined /> 任务分配公平性</Space>}
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Tag color={taskAllocationFairness.gini < 0.2 ? 'green' : taskAllocationFairness.gini < 0.4 ? 'orange' : 'red'}>
                Gini {taskAllocationFairness.gini}
              </Tag>
              <Tag>{taskAllocationFairness.fairness_level === 'equal' ? '均衡' : taskAllocationFairness.fairness_level === 'moderate' ? '适中' : '不均衡'}</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>近 {taskAllocationFairness.days} 天 · {taskAllocationFairness.total_tasks} 任务</Text>
            </Space>
          }
        >
          {/* Lorenz curve SVG */}
          {taskAllocationFairness.lorenz_curve.length > 1 && (() => {
            const w = 280
            const h = 180
            const pad = 30
            const pw = w - pad * 2
            const ph = h - pad * 2
            const pts = taskAllocationFairness.lorenz_curve
            const linePoints = pts.map((p, i) => `${pad + (p.agent_percent / 100) * pw},${pad + ph - (p.task_percent / 100) * ph}`).join(' ')
            const equalityLine = `${pad},${pad + ph} ${pad + pw},${pad}`
            return (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <svg width={w} height={h} style={{ overflow: 'visible' }}>
                  <line x1={pad} y1={pad + ph} x2={pad + pw} y2={pad} stroke="#d9d9d9" strokeWidth={1} strokeDasharray="4,2" />
                  <polyline points={equalityLine} fill="none" stroke="#e8e8e8" strokeWidth={1} strokeDasharray="4,2" />
                  <polyline points={linePoints} fill="none" stroke="#1890ff" strokeWidth={2} />
                  <line x1={pad} y1={pad} x2={pad} y2={pad + ph} stroke="#bfbfbf" strokeWidth={1} />
                  <line x1={pad} y1={pad + ph} x2={pad + pw} y2={pad + ph} stroke="#bfbfbf" strokeWidth={1} />
                  <text x={pad + pw / 2} y={h - 2} fontSize={9} fill="#8c8c8c" textAnchor="middle">Agent 累计占比 %</text>
                  <text x={4} y={pad + ph / 2} fontSize={9} fill="#8c8c8c" textAnchor="middle" transform={`rotate(-90, 4, ${pad + ph / 2})`}>任务累计占比 %</text>
                </svg>
                <Text type="secondary" style={{ fontSize: 10 }}>Lorenz 曲线 — 越偏离对角线越不均衡</Text>
              </div>
            )
          })()}
          {/* Agent bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {taskAllocationFairness.agents.map((a, ai) => {
              const maxT = Math.max(1, ...taskAllocationFairness.agents.map(x => x.total))
              return (
                <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                  <span style={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={a.name}>{a.name}</span>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 2, height: 12, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(a.completed / maxT) * 100}%`, height: '100%', background: '#52c41a' }} />
                    <div style={{ width: `${(a.in_progress / maxT) * 100}%`, height: '100%', background: '#1890ff' }} />
                    <div style={{ width: `${(a.assigned / maxT) * 100}%`, height: '100%', background: '#d9d9d9' }} />
                  </div>
                  <Tooltip title={`完成 ${a.completed} · 进行中 ${a.in_progress} · 待认领 ${a.assigned}`}>
                    <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{a.total}</span>
                  </Tooltip>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#52c41a' }}>■ 完成</span>
            <span style={{ fontSize: 10, color: '#1890ff' }}>■ 进行中</span>
            <span style={{ fontSize: 10, color: '#d9d9d9' }}>■ 待认领</span>
          </div>
        </Card>
      )}

      {/* Agent Run Resource Trend */}
      {agentRunResourceTrend && agentRunResourceTrend.agents.length > 0 && (
        <Card
          title={<Space><LineChartOutlined /> Agent 运行资源趋势</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {agentRunResourceTrend.days} 天</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agentRunResourceTrend.agents.map((a, ai) => {
              const maxCount = Math.max(1, ...a.count_series)
              const maxDur = Math.max(1, ...a.duration_series.filter(d => d > 0))
              const sparkW = 200
              const sparkH = 24
              return (
                <div key={ai} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{a.agent_name}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>{a.total_runs} 次运行</Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 9 }}>运行次数</Text>
                      <svg width={sparkW} height={sparkH} style={{ display: 'block' }}>
                        {a.count_series.filter(v => v > 0).length > 1 && (() => {
                          const pts = a.count_series.map((v, i) => `${(i / (a.count_series.length - 1)) * sparkW},${sparkH - (v / maxCount) * (sparkH - 2)}`).join(' ')
                          return <polyline points={pts} fill="none" stroke="#1890ff" strokeWidth={1.5} />
                        })()}
                      </svg>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 9 }}>平均时长(s)</Text>
                      <svg width={sparkW} height={sparkH} style={{ display: 'block' }}>
                        {a.duration_series.filter(v => v > 0).length > 1 && (() => {
                          const pts = a.duration_series.map((v, i) => `${(i / (a.duration_series.length - 1)) * sparkW},${sparkH - (v / maxDur) * (sparkH - 2)}`).join(' ')
                          return <polyline points={pts} fill="none" stroke="#fa8c16" strokeWidth={1.5} />
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#1890ff' }}>— 运行次数</span>
            <span style={{ fontSize: 10, color: '#fa8c16' }}>— 平均时长</span>
          </div>
        </Card>
      )}

      {/* Task Dependency Chain */}
      {depChain && depChain.chains.length > 0 && (
        <Card
          title={<Space><ApartmentOutlined /> 任务依赖链分析</Space>}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {depChain.chains.map((c, ci) => {
              const barW = 200
              const barH = 8
              const pct = c.progress_pct
              return (
                <div key={ci} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{c.root_title}</Text>
                    <Space size={4}>
                      <Tag style={{ fontSize: 10 }}>深度 {c.depth}</Tag>
                      <Tag color="blue" style={{ fontSize: 10 }}>{c.total_tasks} 任务</Tag>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width={barW} height={barH + 4} style={{ display: 'block' }}>
                      <rect x={0} y={2} width={barW} height={barH} fill="#f0f0f0" rx={2} />
                      <rect x={0} y={2} width={barW * pct / 100} height={barH} fill="#52c41a" rx={2} />
                    </svg>
                    <Text type="secondary" style={{ fontSize: 10 }}>{c.completed}/{c.total_tasks} 完成 ({pct}%)</Text>
                    {c.in_progress > 0 && <Tag color="processing" style={{ fontSize: 9 }}>{c.in_progress} 进行中</Tag>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Agent Skill Matching */}
      {skillMatching && skillMatching.tasks.length > 0 && (
        <Card
          title={<Space><RadarChartOutlined /> Agent 技能匹配推荐</Space>}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {skillMatching.tasks.map((t, ti) => (
              <div key={ti} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                <Text strong style={{ fontSize: 12 }}>{t.task_title}</Text>
                <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {t.recommendations.map((r, ri) => (
                    <Tag key={ri} color={r.match_score >= 50 ? 'green' : 'blue'} style={{ fontSize: 10 }}>
                      {r.agent_name} ({r.match_score}%)
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Task Comment Sentiment Trend */}
      {commentSentiment && commentSentiment.trend.length > 0 && (
        <Card
          title={<Space><SmileOutlined /> 评论情感趋势</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {commentSentiment.days} 天</Text>}
        >
          {(() => {
            const trend = commentSentiment.trend
            const maxVal = Math.max(1, ...trend.map(d => d.positive + d.negative + d.neutral))
            const svgW = 400
            const svgH = 100
            const xStep = svgW / Math.max(1, trend.length - 1)
            const toY = (v: number) => svgH - (v / maxVal) * (svgH - 4)
            const posPts = trend.map((d, i) => `${i * xStep},${toY(d.positive)}`).join(' ')
            const negPts = trend.map((d, i) => `${i * xStep},${toY(d.negative)}`).join(' ')
            const neuPts = trend.map((d, i) => `${i * xStep},${toY(d.neutral)}`).join(' ')
            return (
              <svg width={svgW} height={svgH} style={{ display: 'block' }}>
                {trend.length > 1 && (
                  <>
                    <polyline points={posPts} fill="none" stroke="#52c41a" strokeWidth={1.5} />
                    <polyline points={negPts} fill="none" stroke="#ff4d4f" strokeWidth={1.5} />
                    <polyline points={neuPts} fill="none" stroke="#d9d9d9" strokeWidth={1.5} />
                  </>
                )}
              </svg>
            )
          })()}
          <div style={{ display: 'flex', gap: 16, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#52c41a' }}>— 积极</span>
            <span style={{ fontSize: 10, color: '#ff4d4f' }}>— 消极</span>
            <span style={{ fontSize: 10, color: '#d9d9d9' }}>— 中性</span>
          </div>
        </Card>
      )}

      {/* Task Rework Analysis */}
      {reworkAnalysis && reworkAnalysis.total_reworked > 0 && (
        <Card
          title={<Space><ReloadOutlined /> 任务返工分析</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {reworkAnalysis.days} 天 · {reworkAnalysis.total_reworked} 任务 {reworkAnalysis.total_rework_events} 次返工</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reworkAnalysis.tasks.map((t, ti) => {
              const maxC = Math.max(1, ...reworkAnalysis.tasks.map(x => x.rework_count))
              const barW = 120
              return (
                <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ minWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.title}>{t.title}</span>
                  <svg width={barW} height={10} style={{ display: 'block' }}>
                    <rect x={0} y={1} width={barW * t.rework_count / maxC} height={8} fill="#fa8c16" rx={2} />
                  </svg>
                  <Tag color="orange" style={{ fontSize: 10 }}>{t.rework_count}次</Tag>
                  <Text type="secondary" style={{ fontSize: 9 }}>{t.project_name}</Text>
                </div>
              )
            })}
          </div>
          {reworkAnalysis.by_project.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>按项目：</Text>
              {reworkAnalysis.by_project.map((p, pi) => (
                <Tag key={pi} color="volcano" style={{ fontSize: 9, margin: '2px' }}>{p.project_name}: {p.rework_count}</Tag>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Agent Workload Forecast */}
      {workloadForecast && workloadForecast.agents.length > 0 && (
        <Card
          title={<Space><ThunderboltOutlined /> Agent 工作负载预测</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {workloadForecast.days} 天 · 预测 {workloadForecast.horizon} 天</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workloadForecast.agents.map((a, ai) => {
              const all = [...a.series, ...a.forecast]
              const maxV = Math.max(1, ...all)
              const w = 180
              const h = 28
              const totalLen = a.series.length + a.forecast.length
              const histPts = a.series.map((v, i) => `${(i / (totalLen - 1)) * w},${h - (v / maxV) * (h - 2)}`).join(' ')
              const fcStartIdx = a.series.length - 1
              const fcPts = a.forecast.map((v, k) => `${((fcStartIdx + k) / (totalLen - 1)) * w},${h - (v / maxV) * (h - 2)}`).join(' ')
              const trendColor = a.trend === 'up' ? '#ff4d4f' : a.trend === 'down' ? '#52c41a' : '#8c8c8c'
              return (
                <div key={ai} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{a.agent_name}</Text>
                    <Space size={4}>
                      <Tag color={a.trend === 'up' ? 'red' : a.trend === 'down' ? 'green' : 'default'} style={{ fontSize: 10 }}>{a.trend === 'up' ? '↑上升' : a.trend === 'down' ? '↓下降' : '→平稳'}</Tag>
                      <Tag style={{ fontSize: 10 }}>预测 +{a.forecast_total}</Tag>
                    </Space>
                  </div>
                  <svg width={w} height={h} style={{ display: 'block' }}>
                    {a.series.length > 1 && <polyline points={histPts} fill="none" stroke="#1890ff" strokeWidth={1.5} />}
                    {a.forecast.length > 0 && <polyline points={fcPts} fill="none" stroke={trendColor} strokeWidth={1.5} strokeDasharray="4 3" />}
                  </svg>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#1890ff' }}>— 历史</span>
            <span style={{ fontSize: 10, color: '#ff4d4f' }}>┄ 预测</span>
          </div>
        </Card>
      )}

      {/* Knowledge Propagation Network */}
      {propagationNet && propagationNet.nodes.length > 0 && (
        <Card
          title={<Space><ShareAltOutlined /> 知识传播网络</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {propagationNet.days} 天 · 分享 {propagationNet.total_shared_experiences} · 复用 {propagationNet.total_reuses}</Text>}
        >
          {(() => {
            const nodes = propagationNet.nodes
            const edges = propagationNet.edges
            const size = 280
            const cx = size / 2
            const cy = size / 2
            const radius = size / 2 - 30
            const pos: Record<number, { x: number; y: number }> = {}
            nodes.forEach((n, i) => {
              const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2
              pos[n.agent_id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
            })
            const maxReuse = Math.max(1, ...nodes.map(n => n.total_reuses))
            const maxW = Math.max(1, ...edges.map(e => e.weight))
            return (
              <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
                {edges.map((e, ei) => {
                  const s = pos[e.source]
                  const t = pos[e.target]
                  if (!s || !t) return null
                  return <line key={`e${ei}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#722ed1" strokeWidth={0.5 + (e.weight / maxW) * 2.5} strokeOpacity={0.4} />
                })}
                {nodes.map((n) => {
                  const p = pos[n.agent_id]
                  if (!p) return null
                  const r = 6 + (n.total_reuses / maxReuse) * 10
                  return (
                    <g key={`n${n.agent_id}`}>
                      <circle cx={p.x} cy={p.y} r={r} fill="#722ed1" fillOpacity={0.7} />
                      <text x={p.x} y={p.y - r - 3} fontSize={8} fill="#595959" textAnchor="middle">{n.agent_name}</text>
                      <title>{`${n.agent_name}: 分享${n.shared_experiences} 复用${n.total_reuses}`}</title>
                    </g>
                  )
                })}
              </svg>
            )
          })()}
        </Card>
      )}

      {/* Protocol Decision Latency */}
      {protocolLatency && protocolLatency.types.length > 0 && (
        <Card
          title={<Space><FieldTimeOutlined /> 协议决策延迟</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {protocolLatency.days} 天 · {protocolLatency.total} 个已决议</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {protocolLatency.types.map((t, ti) => {
              const maxAvg = Math.max(1, ...protocolLatency.types.map(x => x.avg_seconds))
              const barW = 160
              const fmt = (s: number) => s >= 3600 ? `${(s / 3600).toFixed(1)}h` : s >= 60 ? `${(s / 60).toFixed(1)}m` : `${s}s`
              return (
                <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ minWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.protocol_type}>{t.protocol_type}</span>
                  <svg width={barW} height={10} style={{ display: 'block' }}>
                    <rect x={0} y={1} width={barW * t.avg_seconds / maxAvg} height={8} fill="#722ed1" rx={2} />
                  </svg>
                  <Text type="secondary" style={{ fontSize: 10 }}>均{fmt(t.avg_seconds)} · 中位{fmt(t.median_seconds)} · {fmt(t.min_seconds)}~{fmt(t.max_seconds)} · {t.count}次</Text>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Agent Task Handoff Stats */}
      {handoffStats && handoffStats.handoffs.length > 0 && (
        <Card
          title={<Space><SwapOutlined /> Agent 任务交接统计</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {handoffStats.days} 天</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {handoffStats.handoffs.map((h, hi) => {
              const maxCount = Math.max(1, handoffStats.handoffs[0].count)
              const barW = 160
              return (
                <div key={hi} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.from_agent}>{h.from_agent}</span>
                  <span style={{ color: '#1890ff' }}>→</span>
                  <span style={{ minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.to_agent}>{h.to_agent}</span>
                  <svg width={barW} height={10} style={{ display: 'block' }}>
                    <rect x={0} y={1} width={barW * h.count / maxCount} height={8} fill="#1890ff" rx={2} />
                  </svg>
                  <Text type="secondary" style={{ fontSize: 10 }}>{h.count}次{h.avg_duration_seconds != null ? ` 均${h.avg_duration_seconds}s` : ''}</Text>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Low-efficiency Agent Alerts */}
      {productivityAlerts && productivityAlerts.items.length > 0 && (
        <Card
          title={<Space><WarningOutlined /> 低效率 Agent 预警</Space>}
          style={{ marginBottom: 24 }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            近 {productivityAlerts.days} 天，完成率 &lt;{productivityAlerts.min_completion_rate}% 或失败率 &gt;{productivityAlerts.max_failure_rate}%（最少 {productivityAlerts.min_assignments} 次分配），共 {productivityAlerts.items.length} 个
          </Text>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {productivityAlerts.items.map((a) => (
              <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
                <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name}</span>
                <Tag style={{ fontSize: 10 }}>分配 {a.total}</Tag>
                <Tag color="green" style={{ fontSize: 10 }}>完成 {a.done}</Tag>
                <Tag color="red" style={{ fontSize: 10 }}>失败 {a.failed}</Tag>
                <span style={{ color: '#ff4d4f', minWidth: 70 }}>完成率 {a.completion_rate}%</span>
                <span style={{ color: '#fa8c16', minWidth: 60 }}>失败率 {a.failure_rate}%</span>
                {a.reasons.map((r) => (
                  <Tag key={r} color="volcano" style={{ fontSize: 10 }}>{r}</Tag>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Low-health Agent Alerts */}
      {agentHealthAlerts && (
        <Card
          title={<Space><WarningOutlined /> 低健康 Agent 预警</Space>}
          style={{ marginBottom: 24 }}
          extra={
            <Space size={4} wrap>
              <Tooltip title="声誉权重"><InputNumber size="small" min={0} max={1} step={0.05} style={{ width: 56 }} value={healthWeights.w_reputation} onChange={(v) => setHealthWeights((w) => ({ ...w, w_reputation: v ?? 0 }))} /></Tooltip>
              <Tooltip title="完成率权重"><InputNumber size="small" min={0} max={1} step={0.05} style={{ width: 56 }} value={healthWeights.w_completion} onChange={(v) => setHealthWeights((w) => ({ ...w, w_completion: v ?? 0 }))} /></Tooltip>
              <Tooltip title="冲突权重"><InputNumber size="small" min={0} max={1} step={0.05} style={{ width: 56 }} value={healthWeights.w_conflict} onChange={(v) => setHealthWeights((w) => ({ ...w, w_conflict: v ?? 0 }))} /></Tooltip>
              <Tooltip title="违规权重"><InputNumber size="small" min={0} max={1} step={0.05} style={{ width: 56 }} value={healthWeights.w_violation} onChange={(v) => setHealthWeights((w) => ({ ...w, w_violation: v ?? 0 }))} /></Tooltip>
              <Button size="small" type="primary" loading={healthAlertsLoading} onClick={() => reloadHealthAlerts(healthWeights)}>应用权重</Button>
            </Space>
          }
        >
          <Spin spinning={healthAlertsLoading}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            健康分 &lt;{agentHealthAlerts.min_health_score} 的 Agent（近 {agentHealthAlerts.days} 天），共 {agentHealthAlerts.items.length} 个
          </Text>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agentHealthAlerts.items.length === 0 ? (
              <Empty description="暂无低健康 Agent" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : agentHealthAlerts.items.map((a) => (
              <div key={a.agent_id} style={{ padding: '6px 8px', background: '#fff1f0', borderRadius: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
                  <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name}</span>
                  <span style={{ color: '#ff4d4f', minWidth: 44, fontWeight: 500 }}>{a.health_score}</span>
                  {a.reasons.map((r) => (
                    <Tag key={r} color="volcano" style={{ fontSize: 10 }}>{r}</Tag>
                  ))}
                </div>
                {a.recommendations && a.recommendations.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 11, color: '#8c8c8c' }}>
                    <BulbOutlined style={{ color: '#faad14', marginRight: 4 }} />
                    {a.recommendations.join('；')}
                  </div>
                )}
              </div>
            ))}
          </div>
          </Spin>
        </Card>
      )}

      {/* 健康状态流转 */}
      {healthStateTransitions && healthStateTransitions.flows.length > 0 && (() => {
        const states = healthStateTransitions.states
        const flows = healthStateTransitions.flows
        const stateColors: Record<string, string> = { healthy: '#52c41a', degraded: '#faad14', critical: '#ff4d4f' }
        const w = 360
        const h = 200
        const padL = 60
        const padR = 60
        const padT = 20
        const padB = 20
        const barH = 28
        const gapY = 12
        const srcX = padL
        const dstX = w - padR
        const srcNames = states.map(s => s.name)
        const dstNames = states.map(s => s.name)
        const srcY = (name: string) => padT + srcNames.indexOf(name) * (barH + gapY) + barH / 2
        const dstY = (name: string) => padT + dstNames.indexOf(name) * (barH + gapY) + barH / 2
        const maxVal = Math.max(...flows.map(f => f.value), 1)
        return (
          <Card
            title={<Space><SwapOutlined /> 健康状态流转</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {healthStateTransitions.days} 天 · {healthStateTransitions.total_transitions} 次转换</Text>}
            style={{ marginBottom: 24 }}
          >
            <svg width={w} height={h} style={{ overflow: 'visible' }}>
              {/* Source labels */}
              {srcNames.map((name, i) => (
                <g key={`src-${name}`}>
                  <rect x={srcX - 50} y={padT + i * (barH + gapY)} width={48} height={barH} rx={4} fill={stateColors[name] || '#8c8c8c'} opacity={0.15} />
                  <text x={srcX - 26} y={padT + i * (barH + gapY) + barH / 2 + 3} fontSize={10} fill={stateColors[name] || '#595959'} textAnchor="middle" fontWeight={500}>{name}</text>
                </g>
              ))}
              {/* Target labels */}
              {dstNames.map((name, i) => (
                <g key={`dst-${name}`}>
                  <rect x={dstX + 2} y={padT + i * (barH + gapY)} width={48} height={barH} rx={4} fill={stateColors[name] || '#8c8c8c'} opacity={0.15} />
                  <text x={dstX + 26} y={padT + i * (barH + gapY) + barH / 2 + 3} fontSize={10} fill={stateColors[name] || '#595959'} textAnchor="middle" fontWeight={500}>{name}</text>
                </g>
              ))}
              {/* Flow paths */}
              {flows.map((f, i) => {
                const sy = srcY(f.source)
                const dy = dstY(f.target)
                const thickness = Math.max(2, (f.value / maxVal) * 14)
                const midX = (srcX + dstX) / 2
                const color = stateColors[f.source] || '#8c8c8c'
                return (
                  <g key={`flow-${i}`}>
                    <path
                      d={`M ${srcX} ${sy} C ${midX} ${sy}, ${midX} ${dy}, ${dstX} ${dy}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={thickness}
                      opacity={0.4}
                    />
                    <text x={midX} y={(sy + dy) / 2 - 4} fontSize={9} fill="#595959" textAnchor="middle">{f.value}</text>
                  </g>
                )
              })}
            </svg>
          </Card>
        )
      })()}

      {/* Conflict Monitor */}
      <Card
        title={<Space><WarningOutlined /> 协作冲突监控</Space>}
        style={{ marginBottom: 24 }}
        extra={<Space><Button size="small" icon={<ReloadOutlined />} onClick={loadConflictData} loading={conflictLoading} /></Space>}
      >
        <Spin spinning={conflictLoading}>
          {conflictData ? (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}><Statistic title="冲突总数" value={conflictData.total || 0} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={6}><Statistic title="活跃冲突" value={conflictData.active || 0} valueStyle={{ fontSize: 16, color: (conflictData.active || 0) > 0 ? '#ff4d4f' : undefined }} prefix={(conflictData.active || 0) > 0 ? <WarningOutlined /> : undefined} /></Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按严重度:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(conflictData.by_severity || {}).map(([k, v]: any) => (
                      <Tag key={k} color={k === 'critical' ? 'red' : k === 'warning' ? 'orange' : 'blue'} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按类型:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(conflictData.by_type || {}).map(([k, v]: any) => v > 0 ? (
                      <Tag key={k} color="purple" style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ) : null)}
                  </Space>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按状态:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(conflictData.by_status || {}).map(([k, v]: any) => v > 0 ? (
                      <Tag key={k} color={k === 'resolved' ? 'green' : k === 'detected' ? 'red' : k === 'ignored' ? 'default' : 'blue'} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ) : null)}
                  </Space>
                </Col>
              </Row>
              {conflictsSandboxCorrelation && conflictsSandboxCorrelation.total_conflicts > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    冲突↔沙盒违规关联（近 {conflictsSandboxCorrelation.days} 天，±{conflictsSandboxCorrelation.window_hours}h，{conflictsSandboxCorrelation.total_conflicts} 个冲突中 {conflictsSandboxCorrelation.with_violation} 个伴随违规，{conflictsSandboxCorrelation.violation_rate}%）
                  </Text>
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>按冲突类型:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 4 }}>
                      {Object.entries(conflictsSandboxCorrelation.by_conflict_type).map(([k, v]: any) => (
                        <Tag key={k} color={v.with_violation > 0 ? 'volcano' : 'default'} style={{ fontSize: 11 }}>{k}: {v.with_violation}/{v.total} ({v.rate}%)</Tag>
                      ))}
                    </Space>
                  </div>
                  {conflictsSandboxCorrelation.top_agents.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>伴随违规最多的 Agent:</Text>
                      {conflictsSandboxCorrelation.top_agents.map((a) => (
                        <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                          <span style={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name} #{a.agent_id}</span>
                          <Tag style={{ fontSize: 10 }}>冲突 {a.conflicts}</Tag>
                          <Tag color={a.with_violation > 0 ? 'red' : 'default'} style={{ fontSize: 10 }}>伴随违规 {a.with_violation}</Tag>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Empty description="暂无冲突数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

      {/* Security Event Aggregation */}
      <Card
        title={<Space><SafetyOutlined /> 安全审计事件聚合</Space>}
        style={{ marginBottom: 24 }}
        extra={
          <Space wrap size={[8, 4]}>
            <Segmented
              size="small"
              value={securitySeverity || 'all'}
              onChange={(v) => {
                const val = v === 'all' ? '' : String(v)
                setSecuritySeverity(val)
                // loadSecurityEvents 因依赖 buildSecurityParams(severity) 变化而重建，触发 effect 自动加载
              }}
              options={[
                { value: 'all', label: '全部' },
                { value: 'CRITICAL', label: '高危' },
                { value: 'WARNING', label: '警告' },
                { value: 'INFO', label: '普通' },
              ]}
            />
            <Input.Search
              size="small"
              allowClear
              placeholder="搜索标题/详情"
              style={{ width: 180 }}
              onSearch={(v) => setSecuritySearch(v || '')}
              onChange={(e) => { if (!e.target.value) setSecuritySearch('') }}
            />
            <Select
              size="small"
              style={{ width: 130 }}
              allowClear
              placeholder="事件类型"
              value={securityFilter || undefined}
              onChange={(v) => { setSecurityFilter(v || ''); loadSecurityEvents(v || undefined) }}
              options={[
                { value: 'sandbox_violation', label: '沙盒违规' },
                { value: 'conflict', label: '协作冲突' },
                { value: 'audit', label: '审计日志' },
              ]}
            />
            <DatePicker.RangePicker
              size="small"
              showTime
              style={{ width: 340 }}
              onChange={(range) => {
                setSecuritySince(range?.[0]?.toISOString() || '')
                setSecurityUntil(range?.[1]?.toISOString() || '')
              }}
            />
            <Dropdown
              menu={{
                items: [
                  { key: 'csv', label: '导出为 CSV' },
                  { key: 'json', label: '导出为 JSON' },
                ],
                onClick: ({ key }) => exportSecurityEvents(key as 'csv' | 'json'),
              }}
            >
              <Button size="small" icon={<DownloadOutlined />} loading={exporting}>
                导出 <DownOutlined />
              </Button>
            </Dropdown>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => loadSecurityEvents(securityFilter || undefined)} loading={securityLoading} />
          </Space>
        }
      >
        <Spin spinning={securityLoading}>
          {/* 按天趋势 + Agent 排行（公共组件） */}
          <SecurityTrendSection trend={securityTrend} byAgent={securityByAgent} />
          {securityEvents.length > 0 ? (
            <List
              size="small"
              dataSource={securityEvents}
              renderItem={(e: any) => (
                <SecurityEventListItem
                  event={e}
                  onRunClick={(runId) => navigate(`/todo-for-ai/pages/workflows?run_id=${runId}`)}
                  onShowDetail={(ev) => setEventDetail(ev)}
                />
              )}
            />
          ) : (
            <Empty description="暂无安全事件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

      {/* Global Collaboration Orchestrator */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined /> 全局协作编排
            {orchestratorStatus && (
              <Tooltip title={orchestratorStatus.enabled ? '内置调度器运行中（后台自动编排）' : '内置调度器未启用（需手动编排或外部 cron）'}>
                <Badge status={orchestratorStatus.enabled ? 'success' : 'default'} text={orchestratorStatus.enabled ? '自动' : '手动'} />
              </Tooltip>
            )}
          </Space>
        }
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Button size="small" icon={<HistoryOutlined />} onClick={openHistory}>
              历史
            </Button>
            <Popconfirm
              title="立即执行全局编排？"
              description="将依次执行：健康检查、工作流超时、触发器触发、冲突自动解决。"
              onConfirm={runOrchestration}
            >
              <Button type="primary" size="small" icon={<ThunderboltOutlined />} loading={orchestrationLoading}>
                立即编排
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        {orchestration ? (
          <>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={4}><Statistic title="离线 Agent" value={orchestration.stale_agents} valueStyle={{ fontSize: 16 }} /></Col>
              <Col span={4}><Statistic title="过期租约" value={orchestration.expired_leases} valueStyle={{ fontSize: 16 }} /></Col>
              <Col span={4}><Statistic title="升级任务" value={orchestration.escalated_tasks} valueStyle={{ fontSize: 16 }} /></Col>
              <Col span={4}><Statistic title="超时步骤" value={orchestration.timed_out_steps} valueStyle={{ fontSize: 16 }} /></Col>
              <Col span={4}><Statistic title="触发器触发" value={orchestration.triggers_fired} valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Col>
              <Col span={4}><Statistic title="冲突自动解决" value={orchestration.conflicts_auto_resolved} valueStyle={{ fontSize: 16, color: '#52c41a' }} /></Col>
            </Row>
            <Space wrap size={[8, 4]}>
              <Tag>检测冲突 {orchestration.conflicts_detected}</Tag>
              <Tag>跳过冲突 {orchestration.conflicts_skipped}</Tag>
              <Tag color="blue">耗时 {orchestration.duration_seconds}s</Tag>
              {orchestration.trigger_run_ids.length > 0 && (
                <Tag color="purple">新 Run: {orchestration.trigger_run_ids.join(', ')}</Tag>
              )}
              {orchestration.errors.length > 0 && (
                <Tag color="error">错误 {orchestration.errors.length}</Tag>
              )}
            </Space>
            {orchestration.errors.length > 0 && (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message="部分阶段出错"
                description={<ul style={{ margin: 0, paddingLeft: 18 }}>{orchestration.errors.map((e, i) => <li key={i} style={{ fontSize: 12 }}>{e}</li>)}</ul>}
              />
            )}
          </>
        ) : (
          <Empty description="尚未执行编排。点击「立即编排」运行完整协作维护周期。" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}

        {/* Scheduler last-run summary (informational) */}
        {orchestratorStatus?.last_run && (
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="调度器上次自动运行"
            description={
              <span style={{ fontSize: 12 }}>
                {orchestratorStatus.last_run.summary}
                <Text type="secondary"> · 耗时 {orchestratorStatus.last_run.duration_seconds}s</Text>
                {orchestratorStatus.last_run.error_count > 0 && (
                  <Text type="danger"> · {orchestratorStatus.last_run.error_count} 个错误</Text>
                )}
              </span>
            }
          />
        )}
      </Card>

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
          <Card title={tp('sections.recentProjects')} variant="borderless">
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
          <Card title={tp('sections.recentTasks')} variant="borderless">
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
