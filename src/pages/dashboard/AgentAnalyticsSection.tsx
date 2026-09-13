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
import { useAgentAnalyticsData } from './useAgentAnalyticsData'
import { AgentAnalyticsProductivityCards } from './AgentAnalyticsProductivityCards'
import { AgentAnalyticsCapabilityCards } from './AgentAnalyticsCapabilityCards'
import { AgentAnalyticsTaskAnalysisCards } from './AgentAnalyticsTaskAnalysisCards'
import { AgentAnalyticsOpsAlertCards } from './AgentAnalyticsOpsAlertCards'

const AgentAnalyticsSection = () => {
  const bundle = useAgentAnalyticsData()

  return (
    <>
      <AgentAnalyticsProductivityCards {...bundle} />
      <AgentAnalyticsCapabilityCards {...bundle} />
      <AgentAnalyticsTaskAnalysisCards {...bundle} />
      <AgentAnalyticsOpsAlertCards {...bundle} />
    </>
  )
}

export default AgentAnalyticsSection
