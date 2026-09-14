const { Title, Text } = Typography

/** 自动生成：从 Agents.tsx 原样抽出（AgentsBoardSection），props 显式传递，逻辑零改动 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCollaborationSSE } from '../../hooks/useCollaborationSSE'
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Popover,
  Badge,
  Popconfirm,
  notification,
} from 'antd'
import {
  ApiOutlined,
  BellOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  EditOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  SoundOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  SendOutlined,
  AppstoreOutlined,
  SwapOutlined,
  SearchOutlined,
  SafetyOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useAgentSandboxPanel } from './hooks/useAgentSandboxPanel'
import { useAgentChannelsPanel } from './hooks/useAgentChannelsPanel'
import { useAgentIntelligencePanel } from './hooks/useAgentIntelligencePanel'
import { useAgentInboxDmTasks } from './hooks/useAgentInboxDmTasks'
import { useAgentDispatchPanel } from './hooks/useAgentDispatchPanel'
import { useAgentCollabKnowledgePanel } from './hooks/useAgentCollabKnowledgePanel'
import { useAgentStepOverrides } from './hooks/useAgentStepOverrides'
import { useAgentConflicts } from './hooks/useAgentConflicts'
import { useAgentCrudActions } from './hooks/useAgentCrudActions'
import { useAgentLiveDashboard } from './hooks/useAgentLiveDashboard'
import { buildAgentsTableColumns } from './agentsTableColumns'
import {
  agentsApi,
  type Agent,
  type AgentKind,
  type AgentStatus,
  type ReviewQueueAction,
  type ReviewQueueItem,
  type TaskAssignment,
  type TaskAssignmentState,
  type TaskEvent,
  type DispatchTasksData,
  type DispatchPreviewResult,
  type ChannelActivityTrend,
  type ReputationHistory,
  type CollaborationGraph,
} from '../../api/agents'
import CapabilityRadar from '../../components/Agent/CapabilityRadar'
import { dashboardApi, type DashboardStats } from '../../api/dashboard'

import { DEFAULT_DISPATCH_PREVIEW_OPTIONS, statusColor, stateColor, statusOptions, formatDateTime, parseLines, stringifyConfig, toStringList, matchStrategyLabel, normalizeDispatchOptions, normalizeDispatchPolicyPayload, getAgentDispatchPolicy, withAgentDispatchPolicy, getClaimMatch, renderCapabilities } from './utils'
import { DispatchPreviewModal, SandboxDrawer, ConflictDrawer, KnowledgeDrawer, ProtocolsModal, CrossProjectModal, BroadcastModal, ChannelsDrawer, ExperienceDrawer, FeedbackModal, AgentFormModal, RecommendedTasksModal, DirectMessageModal, ReviewQueueSection, AgentDetailDrawer, CollaborationTemplatesModal, InstantiateCollabTemplateModal, StepOverrideModal, CrossProjectAuthorizeModal, AdaptiveCapabilitiesModal } from './modals'
import AgentStatsBar from './AgentStatsBar'
import CapabilityMapCard from './CapabilityMapCard'
import TaskDistributionCard from './TaskDistributionCard'
import MaintenanceActionsCard from './MaintenanceActionsCard'
import LiveEventFeedCard from './LiveEventFeedCard'
import NotificationPopover from './NotificationPopover'



interface AgentsBoardSectionProps {
  agents: any
  columns: any
  dashboardStats: any
  editingAgent: any
  feedbackForm: any
  feedbackModalOpen: any
  feedbackReviewItem: any
  feedbackSubmitting: any
  form: any
  liveEvents: any
  liveMode: any
  loadAgents: any
  loadDashboardStats: any
  loadNotifications: any
  loadReviewQueue: any
  loading: any
  markAllRead: any
  modalOpen: any
  notifications: any
  notificationsLoading: any
  openChannels: any
  openCollabTemplates: any
  openConflicts: any
  openCreateModal: any
  openProtocols: any
  openSandboxes: any
  openStepOverride: any
  reviewActionFilter: any
  reviewLoading: any
  reviewQueue: any
  saveAgent: any
  searchText: any
  setFeedbackModalOpen: any
  setFeedbackReviewItem: any
  setLiveEvents: any
  setLiveMode: any
  setModalOpen: any
  setReviewActionFilter: any
  setSearchText: any
  setStatusFilter: any
  statusFilter: any
  submitHumanFeedback: any
  unreadCount: any
  updateReviewQueueItem: any
}

const AgentsBoardSection = ({
  agents,
  columns,
  dashboardStats,
  editingAgent,
  feedbackForm,
  feedbackModalOpen,
  feedbackReviewItem,
  feedbackSubmitting,
  form,
  liveEvents,
  liveMode,
  loadAgents,
  loadDashboardStats,
  loadNotifications,
  loadReviewQueue,
  loading,
  markAllRead,
  modalOpen,
  notifications,
  notificationsLoading,
  openChannels,
  openCollabTemplates,
  openConflicts,
  openCreateModal,
  openProtocols,
  openSandboxes,
  openStepOverride,
  reviewActionFilter,
  reviewLoading,
  reviewQueue,
  saveAgent,
  searchText,
  setFeedbackModalOpen,
  setFeedbackReviewItem,
  setLiveEvents,
  setLiveMode,
  setModalOpen,
  setReviewActionFilter,
  setSearchText,
  setStatusFilter,
  statusFilter,
  submitHumanFeedback,
  unreadCount,
  updateReviewQueueItem,
}: AgentsBoardSectionProps) => (
  <>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>Agent 协作</Title>
        <Space>
          <NotificationPopover
            unreadCount={unreadCount}
            notifications={notifications}
            loading={notificationsLoading}
            onMarkAllRead={markAllRead}
            onOpen={loadNotifications}
          />
          <Tooltip title={liveMode ? '实时刷新已开启（每 10 秒）' : '实时刷新已关闭'}>
            <Space size={4}>
              <Switch size="small" checked={liveMode} onChange={setLiveMode} />
              <Text type="secondary">{liveMode ? '实时' : '手动'}</Text>
            </Space>
          </Tooltip>
          <Button icon={<ReloadOutlined />} onClick={() => { loadAgents(); loadReviewQueue() }}>刷新</Button>
          <Button icon={<ApiOutlined />} onClick={async () => {
            try {
              const result = await agentsApi.markOfflineAgents()
              message.success(result.marked_offline > 0 ? `已标记 ${result.marked_offline} 个 Agent 为离线` : '所有 Agent 均在线')
              loadAgents()
            } catch { message.error('检测失败') }
          }}>检测离线</Button>
          <Button icon={<TeamOutlined />} onClick={openChannels}>频道</Button>
          <Button icon={<AppstoreOutlined />} onClick={openCollabTemplates}>协作模板</Button>
          <Button icon={<SwapOutlined />} onClick={openProtocols}>协议</Button>
          <Button icon={<SafetyOutlined />} onClick={openSandboxes}>沙盒</Button>
          <Button icon={<SettingOutlined />} onClick={() => openStepOverride()}>步骤重配置</Button>
          <Button icon={<WarningOutlined />} onClick={openConflicts}>冲突</Button>
          <Button type="primary" icon={<ApiOutlined />} onClick={openCreateModal}>注册 Agent</Button>
        </Space>
      </div>

      <AgentStatsBar agents={agents} reviewQueue={reviewQueue} />

      <CapabilityMapCard agents={agents} />

      {/* 任务分布统计 */}
      {dashboardStats && <TaskDistributionCard stats={dashboardStats} />}

      {/* 维护操作 */}
      <MaintenanceActionsCard onRefreshStats={loadDashboardStats} />

      {/* 实时协作事件流 */}
      {liveMode && <LiveEventFeedCard events={liveEvents} onClear={() => setLiveEvents([])} />}

      <ReviewQueueSection
        items={reviewQueue}
        loading={reviewLoading}
        actionFilter={reviewActionFilter}
        onActionFilterChange={setReviewActionFilter}
        onRefresh={() => loadReviewQueue()}
        onUpdateItem={updateReviewQueueItem}
      />

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input.Search
            allowClear
            placeholder="搜索 Agent"
            style={{ width: 280 }}
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            onSearch={() => loadAgents()}
          />
          <Select
            value={statusFilter}
            style={{ width: 140 }}
            onChange={setStatusFilter}
            options={[{ label: '全部状态', value: 'all' }, ...statusOptions]}
          />
        </div>
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1180 }}
        />
      </Card>

      <AgentFormModal
        open={modalOpen}
        editingAgent={editingAgent}
        form={form}
        onOk={saveAgent}
        onCancel={() => setModalOpen(false)}
      />

      <FeedbackModal
        open={feedbackModalOpen}
        submitting={feedbackSubmitting}
        reviewItem={feedbackReviewItem}
        form={feedbackForm}
        onOk={submitHumanFeedback}
        onCancel={() => {
          setFeedbackModalOpen(false)
          setFeedbackReviewItem(null)
          feedbackForm.resetFields()
        }}
      />
  </>
)

export default AgentsBoardSection
