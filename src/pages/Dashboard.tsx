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
import CollabGraphCard from './dashboard/CollabGraphCard'
import TimelineReplayCard from './dashboard/TimelineReplayCard'
import { useDashboardData } from './dashboard/useDashboardData'
import RecentProjectsTasksCard from './dashboard/RecentProjectsTasksCard'
import UnifiedTrendCard from './dashboard/UnifiedTrendCard'
import DashboardModals from './dashboard/DashboardModals'
import TopOrganizationsRow from './dashboard/TopOrganizationsRow'
import OrgAgentStatsRow from './dashboard/OrgAgentStatsRow'
import CollabOverviewRow from './dashboard/CollabOverviewRow'
import AgentStatsRow from './dashboard/AgentStatsRow'
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
  const {
agentCollaboration,
    agentRunResourceTrend,
    buildSecurityParams,
    capSupplyDemand,
    collabDays,
    collabDetail,
    collabDetailGraph,
    collabGraph,
    collabGraphLoading,
    collabLoading,
    collabMetrics,
    collabSummary,
    collabSvgRef,
    collabTimeline,
    collabTimelineIdx,
    commentSentiment,
    crossProjEff,
    decayAlerts,
    depChain,
    eventDetail,
    exportCollabGraph,
    exportCollabGraphPng,
    exportCollabGraphSvg,
    exportSecurityEvents,
    exporting,
    forceLinkDistance,
    forceRepulsion,
    formatDate,
    formatDateTime,
    getStatusColor,
    getStatusText,
    graphFullscreen,
    graphFullscreenSize,
    graphKinds,
    graphLayout,
    graphMinCount,
    graphResetKey,
    graphSearch,
    graphShowLabels,
    graphWindow,
    handoffStats,
    hasExpiredLeases,
    historyData,
    historyFilter,
    historyLoading,
    historyOpen,
    idleRanking,
    loadCollabDetail,
    loadCollabGraph,
    loadCollabMetrics,
    loadDashboardStats,
    loadForceParams,
    loadMonitorData,
    loadOrchestratorHistory,
    loadOrchestratorStatus,
    loadSandboxData,
    loadSecurityEvents,
    loadUnifiedTrend,
    loading,
    monitorData,
    monitorHours,
    monitorLoading,
    navigate,
    openHistory,
    orchDailyTrend,
    orchestration,
    orchestrationLoading,
    orchestratorStatus,
    orgSummary,
    owned,
    pageTitle,
    participated,
    propagationNet,
    protocolLatency,
    reworkAnalysis,
    runOrchestration,
    sandboxData,
    sandboxLoading,
    sandboxTemplateUsage,
    sandboxViolationTrend,
    sandboxViolationsByAgent,
    securityByAgent,
    securityEvents,
    securityFilter,
    securityLoading,
    securitySearch,
    securitySeverity,
    securitySince,
    securityTrend,
    securityUntil,
    setAgentRunResourceTrend,
    setCapSupplyDemand,
    setCollabDays,
    setCollabDetail,
    setCollabGraph,
    setCollabGraphLoading,
    setCollabLoading,
    setCollabMetrics,
    setCollabTimeline,
    setCollabTimelineIdx,
    setCommentSentiment,
    setCrossProjEff,
    setDecayAlerts,
    setDepChain,
    setEventDetail,
    setExporting,
    setForceLinkDistance,
    setForceRepulsion,
    setGraphFullscreen,
    setGraphFullscreenSize,
    setGraphKinds,
    setGraphLayout,
    setGraphMinCount,
    setGraphResetKey,
    setGraphSearch,
    setGraphShowLabels,
    setGraphWindow,
    setHandoffStats,
    setHistoryData,
    setHistoryFilter,
    setHistoryLoading,
    setHistoryOpen,
    setIdleRanking,
    setLoading,
    setMonitorData,
    setMonitorHours,
    setMonitorLoading,
    setOrchDailyTrend,
    setOrchestration,
    setOrchestrationLoading,
    setOrchestratorStatus,
    setPropagationNet,
    setProtocolLatency,
    setReworkAnalysis,
    setSandboxData,
    setSandboxLoading,
    setSandboxTemplateUsage,
    setSandboxViolationTrend,
    setSandboxViolationsByAgent,
    setSecurityByAgent,
    setSecurityEvents,
    setSecurityFilter,
    setSecurityLoading,
    setSecuritySearch,
    setSecuritySeverity,
    setSecuritySince,
    setSecurityTrend,
    setSecurityUntil,
    setSkillMatching,
    setSpecializationEvo,
    setStats,
    setTaskAllocationFairness,
    setTrendEventType,
    setTrendSeverity,
    setTrendWindow,
    setUnifiedSecTrend,
    setWorkloadForecast,
    skillMatching,
    specializationEvo,
    stats,
    taskAllocationFairness,
    tc,
    topOrganizations,
    tp,
    trendEventType,
    trendSeverity,
    trendWindow,
    unifiedSecTrend,
    workloadForecast,
    reviewOrExpiredAssignments,
  } = useDashboardData()



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
      <AgentStatsRow
        loading={ loading }
        owned={ owned }
        stats={ stats }
      />

      {/* Agent 协作概览 */}
      <CollabOverviewRow
        agentCollaboration={ agentCollaboration }
        hasExpiredLeases={ hasExpiredLeases }
        reviewOrExpiredAssignments={ reviewOrExpiredAssignments }
      />

      <Title level={4}>{tp('sections.organizationAgentStats')}</Title>
      <OrgAgentStatsRow
        loading={ loading }
        orgSummary={ orgSummary }
        stats={ stats }
      />

      <TopOrganizationsRow
        formatDateTime={ formatDateTime }
        loading={ loading }
        stats={ stats }
        topOrganizations={ topOrganizations }
      />

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
      <CollabGraphCard
        collabGraph={ collabGraph }
        collabGraphLoading={ collabGraphLoading }
        collabSvgRef={ collabSvgRef }
        collabSummary={ collabSummary }
        exportCollabGraph={ exportCollabGraph }
        exportCollabGraphPng={ exportCollabGraphPng }
        exportCollabGraphSvg={ exportCollabGraphSvg }
        forceLinkDistance={ forceLinkDistance }
        forceRepulsion={ forceRepulsion }
        graphKinds={ graphKinds }
        graphLayout={ graphLayout }
        graphMinCount={ graphMinCount }
        graphResetKey={ graphResetKey }
        graphSearch={ graphSearch }
        graphShowLabels={ graphShowLabels }
        graphWindow={ graphWindow }
        loadCollabDetail={ loadCollabDetail }
        setForceLinkDistance={ setForceLinkDistance }
        setForceRepulsion={ setForceRepulsion }
        setGraphFullscreen={ setGraphFullscreen }
        setGraphKinds={ setGraphKinds }
        setGraphLayout={ setGraphLayout }
        setGraphMinCount={ setGraphMinCount }
        setGraphResetKey={ setGraphResetKey }
        setGraphSearch={ setGraphSearch }
        setGraphShowLabels={ setGraphShowLabels }
        setGraphWindow={ setGraphWindow }
      />

      {/* Agent 协作关系图 */}


      {/* 平台活动统一趋势：编排活动 + 安全事件同时间轴 */}
      <UnifiedTrendCard
        orchDailyTrend={ orchDailyTrend }
        securityTrend={ securityTrend }
        trendEventType={ trendEventType }
        trendSeverity={ trendSeverity }
        trendWindow={ trendWindow }
        unifiedSecTrend={ unifiedSecTrend }
        setTrendEventType={ setTrendEventType }
        setTrendSeverity={ setTrendSeverity }
        setTrendWindow={ setTrendWindow }
      />

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
      <DashboardModals
        collabDetail={ collabDetail }
        setCollabDetail={ setCollabDetail }
        setEventDetail={ setEventDetail }
        setGraphFullscreen={ setGraphFullscreen }
        setHistoryFilter={ setHistoryFilter }
        setHistoryOpen={ setHistoryOpen }
        collabDetailGraph={ collabDetailGraph }
        collabGraph={ collabGraph }
        eventDetail={ eventDetail }
        forceLinkDistance={ forceLinkDistance }
        forceRepulsion={ forceRepulsion }
        graphFullscreen={ graphFullscreen }
        graphFullscreenSize={ graphFullscreenSize }
        graphKinds={ graphKinds }
        graphLayout={ graphLayout }
        graphMinCount={ graphMinCount }
        graphSearch={ graphSearch }
        graphShowLabels={ graphShowLabels }
        historyData={ historyData }
        historyFilter={ historyFilter }
        historyLoading={ historyLoading }
        historyOpen={ historyOpen }
        loadCollabDetail={ loadCollabDetail }
        loadOrchestratorHistory={ loadOrchestratorHistory }
        loading={ loading }
        navigate={ navigate }
      />
    </div>
  )
}

export default Dashboard
