import { useState, useEffect, useCallback } from 'react'
import AgentAnalyticsOverviewCard from './AgentAnalyticsOverviewCard'
import { Card, Row, Col, Statistic, Empty, Tag, Tooltip, Space, Typography, Select, Button, Table, Spin, InputNumber } from 'antd'
import {
  FundOutlined,
  ThunderboltOutlined,
  HeatMapOutlined,
  BugOutlined,
  ClusterOutlined,
  AuditOutlined,
  RadarChartOutlined,
  RiseOutlined,
  SwapOutlined,
  ShareAltOutlined,
  DeploymentUnitOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  CalendarOutlined,
  ReloadOutlined,
  WarningOutlined,
  ApartmentOutlined,
  PieChartOutlined,
  LineChartOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import { agentsApi, type AgentHealth, type AgentHealthTrend, type AgentHealthAlerts, type AgentHealthStateTransitions, type HealthWeights, type AgentProductivity, type AgentProductivityTrend, type AgentProductivityAlerts, type AgentProductivityByKind, type AgentProductivityHourlyHeatmap, type AgentProductivityCalendarHeatmap, type AgentProductivityWeeklyComparison, type AgentFailureReasons, type AgentFailureErrorPatterns, type AgentCapabilityGapAnalysis, type AgentRunResourceUsage, type AgentSkillMatching, type AgentTaskHandoffStats, type AgentWorkloadForecast, type AgentSpecializationEvolution, type AgentExperiencesDecayAlerts, type AgentCrossProjectEfficiency, type AgentCapabilitySupplyDemand, type AgentIdleRanking, type TaskAllocationFairness, type AgentRunResourceTrend, type KnowledgePropagationNetwork, type ProtocolDecisionLatency } from '../../api/agents'
import { tasksApi, type TaskDependencyChainAnalysis, type TaskCommentSentimentTrend, type TaskReworkAnalysis } from '../../api/tasks'
import MiniTrendChart from '../../components/MiniTrendChart'
import WorkflowRunTrendChart from '../../components/WorkflowRunTrendChart'
import AgentHealthCard from './AgentHealthCard'
import AgentProductivityCard from './AgentProductivityCard'
import AgentFailureReasonsCard from './AgentFailureReasonsCard'
import AgentErrorPatternsCard from './AgentErrorPatternsCard'

/**
 * Agent 分析区数据层：34 组状态 + 挂载时 30 个分析端点并发拉取 + 健康趋势/告警重载。
 * 由 AgentAnalyticsSection 原样拆出。
 */
export function useAgentAnalyticsData() {
  const [agentHealth, setAgentHealth] = useState<AgentHealth | null>(null)
  const [agentHealthTrend, setAgentHealthTrend] = useState<AgentHealthTrend | null>(null)
  const [healthTrendAgentId, setHealthTrendAgentId] = useState<number | undefined>(undefined)
  const [healthTrendLoading, setHealthTrendLoading] = useState(false)
  const [agentHealthAlerts, setAgentHealthAlerts] = useState<AgentHealthAlerts | null>(null)
  const [healthStateTransitions, setHealthStateTransitions] = useState<AgentHealthStateTransitions | null>(null)
  const [healthWeights, setHealthWeights] = useState<HealthWeights>({ w_reputation: 0.4, w_completion: 0.3, w_conflict: 0.15, w_violation: 0.15 })
  const [healthAlertsLoading, setHealthAlertsLoading] = useState(false)
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
  const [skillMatching, setSkillMatching] = useState<AgentSkillMatching | null>(null)
  const [handoffStats, setHandoffStats] = useState<AgentTaskHandoffStats | null>(null)
  const [workloadForecast, setWorkloadForecast] = useState<AgentWorkloadForecast | null>(null)
  const [specializationEvo, setSpecializationEvo] = useState<AgentSpecializationEvolution | null>(null)
  const [decayAlerts, setDecayAlerts] = useState<AgentExperiencesDecayAlerts | null>(null)
  const [crossProjEff, setCrossProjEff] = useState<AgentCrossProjectEfficiency | null>(null)
  const [capSupplyDemand, setCapSupplyDemand] = useState<AgentCapabilitySupplyDemand | null>(null)
  const [idleRanking, setIdleRanking] = useState<AgentIdleRanking | null>(null)
  const [taskAllocationFairness, setTaskAllocationFairness] = useState<TaskAllocationFairness | null>(null)
  const [agentRunResourceTrend, setAgentRunResourceTrend] = useState<AgentRunResourceTrend | null>(null)
  const [propagationNet, setPropagationNet] = useState<KnowledgePropagationNetwork | null>(null)
  const [protocolLatency, setProtocolLatency] = useState<ProtocolDecisionLatency | null>(null)
  const [depChain, setDepChain] = useState<TaskDependencyChainAnalysis | null>(null)
  const [commentSentiment, setCommentSentiment] = useState<TaskCommentSentimentTrend | null>(null)
  const [reworkAnalysis, setReworkAnalysis] = useState<TaskReworkAnalysis | null>(null)

  const reloadHealthTrend = (agentId?: number) => {
    setHealthTrendLoading(true)
    agentsApi.getAgentHealthTrend(30, agentId).then(setAgentHealthTrend).catch(() => {}).finally(() => setHealthTrendLoading(false))
  }

  const reloadHealthAlerts = (weights: HealthWeights) => {
    setHealthAlertsLoading(true)
    agentsApi.getAgentHealthAlerts(weights).then(setAgentHealthAlerts).catch(() => {}).finally(() => setHealthAlertsLoading(false))
  }

  useEffect(() => {
    agentsApi.getAgentHealth(30).then(setAgentHealth).catch(() => {})
    agentsApi.getAgentHealthTrend(30).then(setAgentHealthTrend).catch(() => {})
    agentsApi.getAgentHealthStateTransitions(30).then(setHealthStateTransitions).catch(() => {})
    agentsApi.getAgentHealthAlerts({ w_reputation: 0.4, w_completion: 0.3, w_conflict: 0.15, w_violation: 0.15 }).then(setAgentHealthAlerts).catch(() => {})
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
    agentsApi.getTaskAllocationFairness(30).then(setTaskAllocationFairness).catch(() => {})
    agentsApi.getAgentRunResourceTrend(14, 10).then(setAgentRunResourceTrend).catch(() => {})
    agentsApi.getAgentSkillMatching(10).then(setSkillMatching).catch(() => {})
    agentsApi.getAgentTaskHandoffStats(30, 10).then(setHandoffStats).catch(() => {})
    agentsApi.getAgentWorkloadForecast(30, 3, 10).then(setWorkloadForecast).catch(() => {})
    agentsApi.getAgentSpecializationEvolution(12, 8).then(setSpecializationEvo).catch(() => {})
    agentsApi.getAgentExperiencesDecayAlerts(30, 0.1, 10).then(setDecayAlerts).catch(() => {})
    agentsApi.getAgentCrossProjectEfficiency(30, 20).then(setCrossProjEff).catch(() => {})
    agentsApi.getAgentCapabilitySupplyDemand(20).then(setCapSupplyDemand).catch(() => {})
    agentsApi.getAgentIdleRanking(20).then(setIdleRanking).catch(() => {})
    agentsApi.getKnowledgePropagationNetwork(90, 20).then(setPropagationNet).catch(() => {})
    agentsApi.getProtocolDecisionLatency(30).then(setProtocolLatency).catch(() => {})
    tasksApi.getDependencyChain(10).then(setDepChain).catch(() => {})
    tasksApi.getCommentSentimentTrend(30).then(setCommentSentiment).catch(() => {})
    tasksApi.getReworkAnalysis(30, 15).then(setReworkAnalysis).catch(() => {})
  }, [])

  return {
    agentHealth,
    setAgentHealth,
    agentHealthTrend,
    setAgentHealthTrend,
    healthTrendAgentId,
    setHealthTrendAgentId,
    healthTrendLoading,
    setHealthTrendLoading,
    agentHealthAlerts,
    setAgentHealthAlerts,
    healthStateTransitions,
    setHealthStateTransitions,
    healthWeights,
    setHealthWeights,
    healthAlertsLoading,
    setHealthAlertsLoading,
    agentProductivity,
    setAgentProductivity,
    productivityTrend,
    setProductivityTrend,
    productivityAlerts,
    setProductivityAlerts,
    productivityByKind,
    setProductivityByKind,
    agentRunResourceUsage,
    setAgentRunResourceUsage,
    agentProdWeeklyComparison,
    setAgentProdWeeklyComparison,
    productivityHourly,
    setProductivityHourly,
    productivityCalendar,
    setProductivityCalendar,
    agentFailureReasons,
    setAgentFailureReasons,
    agentFailureErrorPatterns,
    setAgentFailureErrorPatterns,
    capabilityGapAnalysis,
    setCapabilityGapAnalysis,
    skillMatching,
    setSkillMatching,
    handoffStats,
    setHandoffStats,
    workloadForecast,
    setWorkloadForecast,
    specializationEvo,
    setSpecializationEvo,
    decayAlerts,
    setDecayAlerts,
    crossProjEff,
    setCrossProjEff,
    capSupplyDemand,
    setCapSupplyDemand,
    idleRanking,
    setIdleRanking,
    taskAllocationFairness,
    setTaskAllocationFairness,
    agentRunResourceTrend,
    setAgentRunResourceTrend,
    propagationNet,
    setPropagationNet,
    protocolLatency,
    setProtocolLatency,
    depChain,
    setDepChain,
    commentSentiment,
    setCommentSentiment,
    reworkAnalysis,
    setReworkAnalysis,
    reloadHealthTrend,
    reloadHealthAlerts
  }
}
