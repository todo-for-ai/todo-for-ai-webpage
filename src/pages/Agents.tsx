import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCollaborationSSE } from '../hooks/useCollaborationSSE'
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
import { useAgentSandboxPanel } from './agents/hooks/useAgentSandboxPanel'
import { useAgentChannelsPanel } from './agents/hooks/useAgentChannelsPanel'
import { useAgentIntelligencePanel } from './agents/hooks/useAgentIntelligencePanel'
import { useAgentInboxDmTasks } from './agents/hooks/useAgentInboxDmTasks'
import { useAgentDispatchPanel } from './agents/hooks/useAgentDispatchPanel'
import { useAgentCollabKnowledgePanel } from './agents/hooks/useAgentCollabKnowledgePanel'
import { useAgentStepOverrides } from './agents/hooks/useAgentStepOverrides'
import { useAgentConflicts } from './agents/hooks/useAgentConflicts'
import { useAgentCrudActions } from './agents/hooks/useAgentCrudActions'
import { useAgentLiveDashboard } from './agents/hooks/useAgentLiveDashboard'
import { buildAgentsTableColumns } from './agents/agentsTableColumns'
import AgentsBoardSection from './agents/AgentsBoardSection'
import AgentsOpsModals from './agents/AgentsOpsModals'
import AgentsCollabModals from './agents/AgentsCollabModals'
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
} from '../api/agents'
import CapabilityRadar from '../components/Agent/CapabilityRadar'
import { dashboardApi, type DashboardStats } from '../api/dashboard'

import { DEFAULT_DISPATCH_PREVIEW_OPTIONS, statusColor, stateColor, statusOptions, formatDateTime, parseLines, stringifyConfig, toStringList, matchStrategyLabel, normalizeDispatchOptions, normalizeDispatchPolicyPayload, getAgentDispatchPolicy, withAgentDispatchPolicy, getClaimMatch, renderCapabilities } from './agents/utils'
import { DispatchPreviewModal, SandboxDrawer, ConflictDrawer, KnowledgeDrawer, ProtocolsModal, CrossProjectModal, BroadcastModal, ChannelsDrawer, ExperienceDrawer, FeedbackModal, AgentFormModal, RecommendedTasksModal, DirectMessageModal, ReviewQueueSection, AgentDetailDrawer, CollaborationTemplatesModal, InstantiateCollabTemplateModal, StepOverrideModal, CrossProjectAuthorizeModal, AdaptiveCapabilitiesModal } from './agents/modals'
import AgentStatsBar from './agents/AgentStatsBar'
import CapabilityMapCard from './agents/CapabilityMapCard'
import TaskDistributionCard from './agents/TaskDistributionCard'
import MaintenanceActionsCard from './agents/MaintenanceActionsCard'
import LiveEventFeedCard from './agents/LiveEventFeedCard'
import NotificationPopover from './agents/NotificationPopover'

const { Title, Text } = Typography

const Agents: React.FC = () => {
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const pendingAgentId = searchParams.get('agent_id')
  const [autoOpened, setAutoOpened] = useState(false)
  const [autoOpenedConflicts, setAutoOpenedConflicts] = useState(false)
  // Agent CRUD/广播/声誉/沙盒域块已抽至 agents/hooks/useAgentCrudActions.ts（原样搬移）
  const {
    agents, setAgents,
    reviewQueue, setReviewQueue,
    loading, setLoading,
    reviewLoading, setReviewLoading,
    modalOpen, setModalOpen,
    editingAgent, setEditingAgent,
    searchText, setSearchText,
    statusFilter, setStatusFilter,
    reviewActionFilter, setReviewActionFilter,
    broadcastOpen, setBroadcastOpen,
    broadcastAgent, setBroadcastAgent,
    broadcastContent, setBroadcastContent,
    broadcasting, setBroadcasting,
    agentReputation, setAgentReputation,
    reputationHistory, setReputationHistory,
    agentSandbox, setAgentSandbox,
    form,
    loadAgents,
    loadReviewQueue,
    openCreateModal,
    openEditModal,
    saveAgent,
    heartbeat,
    sendBroadcast,
    loadAgentReputation,
    loadAgentSandbox,
    recalculateReputation,
  } = useAgentCrudActions({ selectedAgent })
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)



  // Channels
  // 频道/聊天领域块已抽至 agents/hooks/useAgentChannelsPanel.ts（原样搬移）
  const {
    channels, channelActivityTrend, channelsOpen, setChannelsOpen,
    channelCreateOpen, setChannelCreateOpen, channelForm, setChannelForm,
    chatOpen, setChatOpen, chatChannel, setChatChannel, chatMessages,
    setChatMessages, chatInput, setChatInput, chatSending,
    loadChannels, openChannels, createChannel, openChat,
    sendChatMessage,
  } = useAgentChannelsPanel()

  // 派发面板领域块已抽至 agents/hooks/useAgentDispatchPanel.ts（原样搬移）
  const {
    applyDispatchPreview,
    assignments,
    claimTask,
    claimTaskId,
    dispatchPolicyDirty,
    dispatchPolicySaving,
    dispatchPreview,
    dispatchPreviewAgent,
    dispatchPreviewApplying,
    dispatchPreviewLoading,
    dispatchPreviewOpen,
    dispatchPreviewOptions,
    dispatchTasks,
    feedbackModalOpen,
    feedbackReviewItem,
    loadAssignments,
    previewDispatchTasks,
    saveDispatchPolicy,
    setAssignments,
    setClaimTaskId,
    setDispatchPolicyDirty,
    setDispatchPolicySaving,
    setDispatchPreview,
    setDispatchPreviewAgent,
    setDispatchPreviewApplying,
    setDispatchPreviewLoading,
    setDispatchPreviewOpen,
    setDispatchPreviewOptions,
    setFeedbackModalOpen,
    setFeedbackReviewItem,
    showClaimSuccess,
    updateAssignmentState,
    updateDispatchPreviewOptions,
    updateReviewQueueItem,
    dispatchCandidateOptions,
  } = useAgentDispatchPanel({
  get selectedAgent() { return selectedAgent },
  get agents() { return agents },
  get loadInbox() { return loadInbox },
  get loadAgentReputation() { return loadAgentReputation },
  get loadAgentSandbox() { return loadAgentSandbox },
  get loadReviewQueue() { return loadReviewQueue },
  get drawerOpen() { return drawerOpen },
  get feedbackForm() { return feedbackForm },
  get setSelectedAgent() { return setSelectedAgent },
  get setAgents() { return setAgents },
  get setDrawerOpen() { return setDrawerOpen },
  get setAssignmentLoading() { return setAssignmentLoading },
  get assignmentLoading() { return assignmentLoading },
  get loadCollaborators() { return loadCollaborators },
  get loadExperiences() { return loadExperiences },
  get loadKnowledge() { return loadKnowledge },
  get loadAgents() { return loadAgents },
  get form() { return form },
  })

  // 实时看板域块已抽至 agents/hooks/useAgentLiveDashboard.ts（原样搬移）
  const {
    liveMode, setLiveMode,
    dashboardStats,
    liveEvents, setLiveEvents,
    loadDashboardStats,
  } = useAgentLiveDashboard({
    agents,
    statusFilter,
    searchText,
    reviewActionFilter,
    drawerOpen,
    selectedAgent,
    loadAgents,
    loadReviewQueue,
    loadAssignments,
  })

  // 低耦合三小块已抽至 agents/hooks/useAgentInboxDmTasks.ts（原样搬移）
  const {
    inboxItems, inboxLoading, notifications, unreadCount, notificationsLoading,
    dmOpen, setDmOpen, dmFrom, setDmFrom, dmTo, setDmTo, dmContent, setDmContent,
    dmSending, recTasksOpen, setRecTasksOpen, recTasksAgent, setRecTasksAgent,
    recTasks, setRecTasks, recTasksLoading,
    sendDirectMessage, loadRecommendedTasks,
    loadInbox, loadNotifications, markAllRead,
  } = useAgentInboxDmTasks()

  // Agent 智能面板领域块已抽至 agents/hooks/useAgentIntelligencePanel.ts（原样搬移）
  const {
    adaptLoading,
    adaptOpen,
    adaptSuggestions,
    applyAdaptation,
    applyDecay,
    authorizeAgent,
    authorizeForm,
    authorizeOpen,
    autoExtractExperiences,
    claimCrossTask,
    collaborators,
    collaboratorsLoading,
    createExperience,
    createProtocol,
    crossProjectLoading,
    crossProjectOpen,
    crossProjects,
    crossTasks,
    crossTasksLoading,
    crossTasksOpen,
    deleteExperience,
    deliberationOpen,
    experienceCreateOpen,
    experienceDetail,
    experienceDetailOpen,
    experienceForm,
    experiences,
    experiencesLoading,
    learnFromExperience,
    loadAdaptSuggestions,
    loadCollaborators,
    loadCrossProjectTasks,
    loadCrossProjects,
    loadExperiences,
    loadProtocols,
    loadSharedExperiences,
    openCrossProject,
    openExperienceDetail,
    openProtocolDetail,
    openProtocols,
    protocolCreateOpen,
    protocolDetail,
    protocolDetailOpen,
    protocolForm,
    protocolRespondOpen,
    protocols,
    protocolsLoading,
    protocolsOpen,
    respondToProtocol,
    revokeCrossProject,
    setAdaptLoading,
    setAdaptOpen,
    setAdaptSuggestions,
    setAuthorizeForm,
    setAuthorizeOpen,
    setCollaborators,
    setCollaboratorsLoading,
    setCrossProjectLoading,
    setCrossProjectOpen,
    setCrossProjects,
    setCrossTasks,
    setCrossTasksLoading,
    setCrossTasksOpen,
    setDeliberationOpen,
    setExperienceCreateOpen,
    setExperienceDetail,
    setExperienceDetailOpen,
    setExperienceForm,
    setExperiences,
    setExperiencesLoading,
    setProtocolCreateOpen,
    setProtocolDetail,
    setProtocolDetailOpen,
    setProtocolForm,
    setProtocolRespondOpen,
    setProtocols,
    setProtocolsLoading,
    setProtocolsOpen,
    setSharedExperiences,
    setSharedExperiencesLoading,
    setSharedExperiencesOpen,
    shareExperience,
    sharedExperiences,
    sharedExperiencesLoading,
    sharedExperiencesOpen,
    submitDeliberation,
    validateExperience,
    collabSubgraph, protocolRespondMsg, setProtocolRespondMsg,
    deliberationForm, setDeliberationForm,
  } = useAgentIntelligencePanel(selectedAgent, () => loadAgents)
  // 协作模板 + 知识库领域块已抽至 agents/hooks/useAgentCollabKnowledgePanel.ts（原样搬移）
  const {
    collabTemplates, collabTemplatesOpen, setCollabTemplatesOpen,
    collabInstantiateOpen, setCollabInstantiateOpen,
    collabInstantiateKey, collabInstantiateName, collabInstantiateProjectId,
    setCollabInstantiateProjectId, collabInstantiating,
    knowledgeEntries, knowledgeLoading, knowledgeSearch, setKnowledgeSearch,
    knowledgeCreateOpen, setKnowledgeCreateOpen, knowledgeForm, setKnowledgeForm,
    knowledgeDetailOpen, setKnowledgeDetailOpen, knowledgeDetail,
    setKnowledgeDetail, collabTemplatesLoading,
    loadCollabTemplates, openCollabTemplates, openCollabInstantiate,
    instantiateCollabTemplate,
    loadKnowledge, createKnowledgeEntry, openKnowledgeDetail,
    deleteKnowledgeEntry, autoExtractKnowledge,
  } = useAgentCollabKnowledgePanel(selectedAgent, () => loadAgents)

  // Sandbox
  // 沙盒面板领域块已抽至 agents/hooks/useAgentSandboxPanel.ts（原样搬移）
  const {
    setSandboxOpen, setSandboxes, setSandboxForm, setSandboxEditingId,
    setSandboxFormOpen, setSandboxExecOpen, setSandboxExecSandboxId,
    setSandboxExecutions, setSandboxExecDetail, setSandboxExecDetailOpen,
    setSandboxCheckOpen, setSandboxCheckForm, setSandboxCheckResult,
    setSandboxStartOpen, setSandboxStartForm, setSandboxViolationOpen,
    setSandboxViolationForm, setSandboxTemplates, setSandboxTemplateOpen,
    sandboxOpen, sandboxes, sandboxForm, sandboxEditingId, sandboxFormOpen,
    sandboxExecOpen, sandboxExecSandboxId, sandboxExecutions, sandboxExecDetail,
    sandboxExecDetailOpen, sandboxCheckOpen, sandboxCheckForm, sandboxCheckResult,
    sandboxStartOpen, sandboxStartForm, sandboxViolationOpen, sandboxViolationForm,
    sandboxTemplates, sandboxTemplateOpen,
    loadSandboxes, openSandboxes, openCreateSandbox, openEditSandbox,
    submitSandboxForm, deleteSandbox, bindSandboxToAgent,
    openSandboxExec, openSandboxExecDetail, openSandboxStart, submitSandboxStart,
    completeSandboxExec, revokeSandboxExec,
    openSandboxCheck, submitSandboxCheck,
    openSandboxViolation, submitSandboxViolation,
    openSandboxTemplates, instantiateTemplate,
  } = useAgentSandboxPanel()
  // Workflow step dynamic reconfiguration 域块已抽至 agents/hooks/useAgentStepOverrides.ts（原样搬移）
  const {
    stepOverrideOpen, setStepOverrideOpen,
    stepOverrideForm, setStepOverrideForm,
    stepEffective, setStepEffective,
    openStepOverride, loadStepEffective, submitStepOverride, clearStepOverride,
  } = useAgentStepOverrides()
  // Conflict detection & resolution 域块已抽至 agents/hooks/useAgentConflicts.ts（原样搬移）
  const {
    conflictOpen, setConflictOpen,
    conflicts, setConflicts,
    conflictDetail, setConflictDetail,
    conflictDetailOpen, setConflictDetailOpen,
    conflictResolveOpen, setConflictResolveOpen,
    conflictResolveForm, setConflictResolveForm,
    loadConflicts, openConflicts, scanConflicts, openConflictDetail,
    acknowledgeConflict, ignoreConflict, openResolveConflict,
    submitResolveConflict, autoResolveConflicts,
  } = useAgentConflicts()
  // Reputation
  // Agent-bound sandbox (shown in drawer)

  // Live event feed

  const [feedbackForm] = Form.useForm()

  useEffect(() => {
    loadAgents()
    loadNotifications()
    loadDashboardStats()
  }, [statusFilter])

  // 从 URL ?agent_id= 自动打开对应 Agent 的 Drawer（指挥中心等外部跳转入口）
  useEffect(() => {
    if (!pendingAgentId || autoOpened || agents.length === 0) return
    const target = agents.find((a) => String(a.id) === String(pendingAgentId))
    if (target) {
      setAutoOpened(true)
      loadAssignments(target)
      // 清除 URL 参数，避免刷新或返回时重复打开
      const next = new URLSearchParams(searchParams)
      next.delete('agent_id')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAgentId, agents, autoOpened])

  // 从 URL ?conflicts=1 自动打开冲突管理 Drawer（指挥中心冲突跳转入口）
  useEffect(() => {
    if (searchParams.get('conflicts') !== '1' || autoOpenedConflicts) return
    setAutoOpenedConflicts(true)
    openConflicts()
    const next = new URLSearchParams(searchParams)
    next.delete('conflicts')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, autoOpenedConflicts])

  useEffect(() => {
    loadReviewQueue()
  }, [reviewActionFilter])







  const resolveProtocol = async (protocolId: number, resolution: string) => {
    try {
      await agentsApi.resolveProtocol(protocolId, { resolution })
      message.success(`协议已${resolution === 'accepted' ? '接受' : resolution === 'rejected' ? '拒绝' : '取消'}`)
      if (protocolDetail) openProtocolDetail(protocolDetail.id)
      loadProtocols()
    } catch { message.error('操作失败') }
  }










  const submitHumanFeedback = async () => {
    if (!feedbackReviewItem) {
      return
    }

    try {
      const values = await feedbackForm.validateFields()
      setFeedbackSubmitting(true)
      await agentsApi.updateTaskAssignment(feedbackReviewItem.assignment.task_id, feedbackReviewItem.assignment.id, {
        state: 'running',
        task_status: 'in_progress',
        feedback_content: values.feedback_content,
        notes: values.feedback_content,
        lease_seconds: 1800,
      })

      message.success('反馈已提交，Agent 可继续执行')
      setFeedbackModalOpen(false)
      setFeedbackReviewItem(null)
      feedbackForm.resetFields()
      loadReviewQueue()
      loadAgents()
      if (selectedAgent && selectedAgent.id === feedbackReviewItem.assignment.agent_id) {
        loadAssignments(selectedAgent)
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  // 表格列定义已抽至 agents/agentsTableColumns.tsx（原样搬移，处理器经 ctx 注入）
  const { columns, assignmentColumns } = buildAgentsTableColumns({
    heartbeat, previewDispatchTasks, dispatchTasks, claimTask, loadRecommendedTasks,
    loadAssignments, openEditModal,
    setBroadcastAgent, setBroadcastOpen, setBroadcastContent,
    setDmFrom, setDmTo, setDmOpen, setDmContent,
    updateAssignmentState,
  })

  return (
    <div style={{ padding: 24 }}>
      <AgentsBoardSection
        agents={agents}
        columns={columns}
        dashboardStats={dashboardStats}
        editingAgent={editingAgent}
        feedbackForm={feedbackForm}
        feedbackModalOpen={feedbackModalOpen}
        feedbackReviewItem={feedbackReviewItem}
        feedbackSubmitting={feedbackSubmitting}
        form={form}
        liveEvents={liveEvents}
        liveMode={liveMode}
        loadAgents={loadAgents}
        loadDashboardStats={loadDashboardStats}
        loadNotifications={loadNotifications}
        loadReviewQueue={loadReviewQueue}
        loading={loading}
        markAllRead={markAllRead}
        modalOpen={modalOpen}
        notifications={notifications}
        notificationsLoading={notificationsLoading}
        openChannels={openChannels}
        openCollabTemplates={openCollabTemplates}
        openConflicts={openConflicts}
        openCreateModal={openCreateModal}
        openProtocols={openProtocols}
        openSandboxes={openSandboxes}
        openStepOverride={openStepOverride}
        reviewActionFilter={reviewActionFilter}
        reviewLoading={reviewLoading}
        reviewQueue={reviewQueue}
        saveAgent={saveAgent}
        searchText={searchText}
        setFeedbackModalOpen={setFeedbackModalOpen}
        setFeedbackReviewItem={setFeedbackReviewItem}
        setLiveEvents={setLiveEvents}
        setLiveMode={setLiveMode}
        setModalOpen={setModalOpen}
        setReviewActionFilter={setReviewActionFilter}
        setSearchText={setSearchText}
        setStatusFilter={setStatusFilter}
        statusFilter={statusFilter}
        submitHumanFeedback={submitHumanFeedback}
        unreadCount={unreadCount}
        updateReviewQueueItem={updateReviewQueueItem}
      />

      <AgentsOpsModals
        acknowledgeConflict={acknowledgeConflict}
        adaptLoading={adaptLoading}
        adaptOpen={adaptOpen}
        adaptSuggestions={adaptSuggestions}
        agentReputation={agentReputation}
        agentSandbox={agentSandbox}
        agents={agents}
        applyAdaptation={applyAdaptation}
        applyDecay={applyDecay}
        applyDispatchPreview={applyDispatchPreview}
        assignmentColumns={assignmentColumns}
        assignmentLoading={assignmentLoading}
        assignments={assignments}
        authorizeAgent={authorizeAgent}
        authorizeForm={authorizeForm}
        authorizeOpen={authorizeOpen}
        autoExtractExperiences={autoExtractExperiences}
        autoExtractKnowledge={autoExtractKnowledge}
        autoResolveConflicts={autoResolveConflicts}
        broadcastAgent={broadcastAgent}
        broadcastContent={broadcastContent}
        broadcastOpen={broadcastOpen}
        broadcasting={broadcasting}
        claimTask={claimTask}
        claimTaskId={claimTaskId}
        clearStepOverride={clearStepOverride}
        collabSubgraph={collabSubgraph}
        collaborators={collaborators}
        collaboratorsLoading={collaboratorsLoading}
        conflictDetail={conflictDetail}
        conflictDetailOpen={conflictDetailOpen}
        conflictOpen={conflictOpen}
        conflictResolveForm={conflictResolveForm}
        conflictResolveOpen={conflictResolveOpen}
        conflicts={conflicts}
        createExperience={createExperience}
        createKnowledgeEntry={createKnowledgeEntry}
        crossProjectLoading={crossProjectLoading}
        crossProjects={crossProjects}
        crossTasksLoading={crossTasksLoading}
        deleteExperience={deleteExperience}
        deleteKnowledgeEntry={deleteKnowledgeEntry}
        dispatchCandidateOptions={dispatchCandidateOptions}
        dispatchPolicyDirty={dispatchPolicyDirty}
        dispatchPolicySaving={dispatchPolicySaving}
        dispatchPreview={dispatchPreview}
        dispatchPreviewAgent={dispatchPreviewAgent}
        dispatchPreviewApplying={dispatchPreviewApplying}
        dispatchPreviewLoading={dispatchPreviewLoading}
        dispatchPreviewOpen={dispatchPreviewOpen}
        dispatchPreviewOptions={dispatchPreviewOptions}
        dmContent={dmContent}
        dmFrom={dmFrom}
        dmOpen={dmOpen}
        dmSending={dmSending}
        dmTo={dmTo}
        drawerOpen={drawerOpen}
        experienceCreateOpen={experienceCreateOpen}
        experienceDetail={experienceDetail}
        experienceDetailOpen={experienceDetailOpen}
        experienceForm={experienceForm}
        experiences={experiences}
        experiencesLoading={experiencesLoading}
        form={form}
        ignoreConflict={ignoreConflict}
        inboxItems={inboxItems}
        knowledgeCreateOpen={knowledgeCreateOpen}
        knowledgeDetail={knowledgeDetail}
        knowledgeDetailOpen={knowledgeDetailOpen}
        knowledgeEntries={knowledgeEntries}
        knowledgeForm={knowledgeForm}
        knowledgeLoading={knowledgeLoading}
        knowledgeSearch={knowledgeSearch}
        learnFromExperience={learnFromExperience}
        loadAdaptSuggestions={loadAdaptSuggestions}
        loadAssignments={loadAssignments}
        loadConflicts={loadConflicts}
        loadCrossProjectTasks={loadCrossProjectTasks}
        loadKnowledge={loadKnowledge}
        loadSharedExperiences={loadSharedExperiences}
        loadStepEffective={loadStepEffective}
        loading={loading}
        navigate={navigate}
        openConflictDetail={openConflictDetail}
        openCrossProject={openCrossProject}
        openExperienceDetail={openExperienceDetail}
        openKnowledgeDetail={openKnowledgeDetail}
        openResolveConflict={openResolveConflict}
        openSandboxes={openSandboxes}
        previewDispatchTasks={previewDispatchTasks}
        recTasks={recTasks}
        recTasksAgent={recTasksAgent}
        recTasksLoading={recTasksLoading}
        recTasksOpen={recTasksOpen}
        recalculateReputation={recalculateReputation}
        reputationHistory={reputationHistory}
        revokeCrossProject={revokeCrossProject}
        saveDispatchPolicy={saveDispatchPolicy}
        scanConflicts={scanConflicts}
        selectedAgent={selectedAgent}
        sendBroadcast={sendBroadcast}
        sendDirectMessage={sendDirectMessage}
        setAdaptOpen={setAdaptOpen}
        setAdaptSuggestions={setAdaptSuggestions}
        setAuthorizeForm={setAuthorizeForm}
        setAuthorizeOpen={setAuthorizeOpen}
        setBroadcastAgent={setBroadcastAgent}
        setBroadcastContent={setBroadcastContent}
        setBroadcastOpen={setBroadcastOpen}
        setClaimTaskId={setClaimTaskId}
        setConflictDetailOpen={setConflictDetailOpen}
        setConflictOpen={setConflictOpen}
        setConflictResolveForm={setConflictResolveForm}
        setConflictResolveOpen={setConflictResolveOpen}
        setDispatchPolicyDirty={setDispatchPolicyDirty}
        setDispatchPreview={setDispatchPreview}
        setDispatchPreviewAgent={setDispatchPreviewAgent}
        setDispatchPreviewOpen={setDispatchPreviewOpen}
        setDmContent={setDmContent}
        setDmFrom={setDmFrom}
        setDmOpen={setDmOpen}
        setDmTo={setDmTo}
        setDrawerOpen={setDrawerOpen}
        setExperienceCreateOpen={setExperienceCreateOpen}
        setExperienceDetailOpen={setExperienceDetailOpen}
        setExperienceForm={setExperienceForm}
        setKnowledgeCreateOpen={setKnowledgeCreateOpen}
        setKnowledgeDetail={setKnowledgeDetail}
        setKnowledgeDetailOpen={setKnowledgeDetailOpen}
        setKnowledgeForm={setKnowledgeForm}
        setKnowledgeSearch={setKnowledgeSearch}
        setRecTasks={setRecTasks}
        setRecTasksAgent={setRecTasksAgent}
        setRecTasksOpen={setRecTasksOpen}
        setSharedExperiencesOpen={setSharedExperiencesOpen}
        setStepOverrideForm={setStepOverrideForm}
        setStepOverrideOpen={setStepOverrideOpen}
        shareExperience={shareExperience}
        sharedExperiences={sharedExperiences}
        sharedExperiencesLoading={sharedExperiencesLoading}
        sharedExperiencesOpen={sharedExperiencesOpen}
        stepEffective={stepEffective}
        stepOverrideForm={stepOverrideForm}
        stepOverrideOpen={stepOverrideOpen}
        submitResolveConflict={submitResolveConflict}
        submitStepOverride={submitStepOverride}
        updateDispatchPreviewOptions={updateDispatchPreviewOptions}
        validateExperience={validateExperience}
      />

      <AgentsCollabModals
        agents={agents}
        channelActivityTrend={channelActivityTrend}
        channelCreateOpen={channelCreateOpen}
        channelForm={channelForm}
        channels={channels}
        channelsOpen={channelsOpen}
        chatChannel={chatChannel}
        chatInput={chatInput}
        chatMessages={chatMessages}
        chatOpen={chatOpen}
        chatSending={chatSending}
        claimCrossTask={claimCrossTask}
        collabInstantiateName={collabInstantiateName}
        collabInstantiateOpen={collabInstantiateOpen}
        collabInstantiateProjectId={collabInstantiateProjectId}
        collabInstantiating={collabInstantiating}
        collabTemplates={collabTemplates}
        collabTemplatesLoading={collabTemplatesLoading}
        collabTemplatesOpen={collabTemplatesOpen}
        completeSandboxExec={completeSandboxExec}
        createChannel={createChannel}
        createExperience={createExperience}
        createProtocol={createProtocol}
        crossTasks={crossTasks}
        crossTasksOpen={crossTasksOpen}
        deleteSandbox={deleteSandbox}
        deliberationForm={deliberationForm}
        deliberationOpen={deliberationOpen}
        experienceCreateOpen={experienceCreateOpen}
        experienceDetail={experienceDetail}
        experienceDetailOpen={experienceDetailOpen}
        experienceForm={experienceForm}
        instantiateCollabTemplate={instantiateCollabTemplate}
        instantiateTemplate={instantiateTemplate}
        learnFromExperience={learnFromExperience}
        loadChannels={loadChannels}
        loadCollabTemplates={loadCollabTemplates}
        loading={loading}
        openChat={openChat}
        openCollabInstantiate={openCollabInstantiate}
        openCreateSandbox={openCreateSandbox}
        openEditSandbox={openEditSandbox}
        openExperienceDetail={openExperienceDetail}
        openProtocolDetail={openProtocolDetail}
        openSandboxCheck={openSandboxCheck}
        openSandboxExec={openSandboxExec}
        openSandboxExecDetail={openSandboxExecDetail}
        openSandboxStart={openSandboxStart}
        openSandboxTemplates={openSandboxTemplates}
        openSandboxViolation={openSandboxViolation}
        protocolCreateOpen={protocolCreateOpen}
        protocolDetail={protocolDetail}
        protocolDetailOpen={protocolDetailOpen}
        protocolForm={protocolForm}
        protocolRespondMsg={protocolRespondMsg}
        protocolRespondOpen={protocolRespondOpen}
        protocols={protocols}
        protocolsLoading={protocolsLoading}
        protocolsOpen={protocolsOpen}
        resolveProtocol={resolveProtocol}
        respondToProtocol={respondToProtocol}
        revokeSandboxExec={revokeSandboxExec}
        sandboxCheckForm={sandboxCheckForm}
        sandboxCheckOpen={sandboxCheckOpen}
        sandboxCheckResult={sandboxCheckResult}
        sandboxEditingId={sandboxEditingId}
        sandboxExecDetail={sandboxExecDetail}
        sandboxExecDetailOpen={sandboxExecDetailOpen}
        sandboxExecOpen={sandboxExecOpen}
        sandboxExecSandboxId={sandboxExecSandboxId}
        sandboxExecutions={sandboxExecutions}
        sandboxForm={sandboxForm}
        sandboxFormOpen={sandboxFormOpen}
        sandboxOpen={sandboxOpen}
        sandboxStartForm={sandboxStartForm}
        sandboxStartOpen={sandboxStartOpen}
        sandboxTemplateOpen={sandboxTemplateOpen}
        sandboxTemplates={sandboxTemplates}
        sandboxViolationForm={sandboxViolationForm}
        sandboxViolationOpen={sandboxViolationOpen}
        sandboxes={sandboxes}
        selectedAgent={selectedAgent}
        sendChatMessage={sendChatMessage}
        setChannelCreateOpen={setChannelCreateOpen}
        setChannelForm={setChannelForm}
        setChannelsOpen={setChannelsOpen}
        setChatChannel={setChatChannel}
        setChatInput={setChatInput}
        setChatMessages={setChatMessages}
        setChatOpen={setChatOpen}
        setCollabInstantiateOpen={setCollabInstantiateOpen}
        setCollabInstantiateProjectId={setCollabInstantiateProjectId}
        setCollabTemplatesOpen={setCollabTemplatesOpen}
        setCrossTasksOpen={setCrossTasksOpen}
        setDeliberationForm={setDeliberationForm}
        setDeliberationOpen={setDeliberationOpen}
        setExperienceCreateOpen={setExperienceCreateOpen}
        setExperienceDetailOpen={setExperienceDetailOpen}
        setExperienceForm={setExperienceForm}
        setProtocolCreateOpen={setProtocolCreateOpen}
        setProtocolDetail={setProtocolDetail}
        setProtocolDetailOpen={setProtocolDetailOpen}
        setProtocolForm={setProtocolForm}
        setProtocolRespondMsg={setProtocolRespondMsg}
        setProtocolRespondOpen={setProtocolRespondOpen}
        setProtocolsOpen={setProtocolsOpen}
        setSandboxCheckForm={setSandboxCheckForm}
        setSandboxCheckOpen={setSandboxCheckOpen}
        setSandboxCheckResult={setSandboxCheckResult}
        setSandboxExecDetailOpen={setSandboxExecDetailOpen}
        setSandboxExecOpen={setSandboxExecOpen}
        setSandboxForm={setSandboxForm}
        setSandboxFormOpen={setSandboxFormOpen}
        setSandboxOpen={setSandboxOpen}
        setSandboxStartForm={setSandboxStartForm}
        setSandboxStartOpen={setSandboxStartOpen}
        setSandboxTemplateOpen={setSandboxTemplateOpen}
        setSandboxViolationForm={setSandboxViolationForm}
        setSandboxViolationOpen={setSandboxViolationOpen}
        setSharedExperiencesOpen={setSharedExperiencesOpen}
        sharedExperiences={sharedExperiences}
        sharedExperiencesOpen={sharedExperiencesOpen}
        submitDeliberation={submitDeliberation}
        submitSandboxCheck={submitSandboxCheck}
        submitSandboxForm={submitSandboxForm}
        submitSandboxStart={submitSandboxStart}
        submitSandboxViolation={submitSandboxViolation}
      />
    </div>
  )
}


export default Agents
