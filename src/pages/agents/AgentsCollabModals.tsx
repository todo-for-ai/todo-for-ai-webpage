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

import type { AgentsCollabModalsProps } from './agentsViewProps'
const { Title, Text } = Typography


const AgentsCollabModals = ({

  agents,
  channelActivityTrend,
  channelCreateOpen,
  channelForm,
  channels,
  channelsOpen,
  chatChannel,
  chatInput,
  chatMessages,
  chatOpen,
  chatSending,
  claimCrossTask,
  collabInstantiateName,
  collabInstantiateOpen,
  collabInstantiateProjectId,
  collabInstantiating,
  collabTemplates,
  collabTemplatesLoading,
  collabTemplatesOpen,
  completeSandboxExec,
  createChannel,
  createExperience,
  createProtocol,
  crossTasks,
  crossTasksOpen,
  deleteSandbox,
  deliberationForm,
  deliberationOpen,
  experienceCreateOpen,
  experienceDetail,
  experienceDetailOpen,
  experienceForm,
  instantiateCollabTemplate,
  instantiateTemplate,
  learnFromExperience,
  loadChannels,
  loadCollabTemplates,
  loading,
  openChat,
  openCollabInstantiate,
  openCreateSandbox,
  openEditSandbox,
  openExperienceDetail,
  openProtocolDetail,
  openSandboxCheck,
  openSandboxExec,
  openSandboxExecDetail,
  openSandboxStart,
  openSandboxTemplates,
  openSandboxViolation,
  protocolCreateOpen,
  protocolDetail,
  protocolDetailOpen,
  protocolForm,
  protocolRespondMsg,
  protocolRespondOpen,
  protocols,
  protocolsLoading,
  protocolsOpen,
  resolveProtocol,
  respondToProtocol,
  revokeSandboxExec,
  sandboxCheckForm,
  sandboxCheckOpen,
  sandboxCheckResult,
  sandboxEditingId,
  sandboxExecDetail,
  sandboxExecDetailOpen,
  sandboxExecOpen,
  sandboxExecSandboxId,
  sandboxExecutions,
  sandboxForm,
  sandboxFormOpen,
  sandboxOpen,
  sandboxStartForm,
  sandboxStartOpen,
  sandboxTemplateOpen,
  sandboxTemplates,
  sandboxViolationForm,
  sandboxViolationOpen,
  sandboxes,
  selectedAgent,
  sendChatMessage,
  setChannelCreateOpen,
  setChannelForm,
  setChannelsOpen,
  setChatChannel,
  setChatInput,
  setChatMessages,
  setChatOpen,
  setCollabInstantiateOpen,
  setCollabInstantiateProjectId,
  setCollabTemplatesOpen,
  setCrossTasksOpen,
  setDeliberationForm,
  setDeliberationOpen,
  setExperienceCreateOpen,
  setExperienceDetailOpen,
  setExperienceForm,
  setProtocolCreateOpen,
  setProtocolDetail,
  setProtocolDetailOpen,
  setProtocolForm,
  setProtocolRespondMsg,
  setProtocolRespondOpen,
  setProtocolsOpen,
  setSandboxCheckForm,
  setSandboxCheckOpen,
  setSandboxCheckResult,
  setSandboxExecDetailOpen,
  setSandboxExecOpen,
  setSandboxForm,
  setSandboxFormOpen,
  setSandboxOpen,
  setSandboxStartForm,
  setSandboxStartOpen,
  setSandboxTemplateOpen,
  setSandboxViolationForm,
  setSandboxViolationOpen,
  setSharedExperiencesOpen,
  sharedExperiences,
  sharedExperiencesOpen,
  submitDeliberation,
  submitSandboxCheck,
  submitSandboxForm,
  submitSandboxStart,
  submitSandboxViolation,
}: AgentsCollabModalsProps) => (
  <>
      <ChannelsDrawer
        open={channelsOpen}
        channels={channels}
        agents={agents}
        activityTrend={channelActivityTrend}
        createOpen={channelCreateOpen}
        createForm={channelForm}
        chatOpen={chatOpen}
        chatChannel={chatChannel}
        chatMessages={chatMessages}
        chatInput={chatInput}
        chatSending={chatSending}
        onClose={() => setChannelsOpen(false)}
        onCreateOpenChange={setChannelCreateOpen}
        onCreateFormChange={setChannelForm}
        onCreate={createChannel}
        onOpenChat={openChat}
        onDeleteChannel={async (channelId: number) => {
          try { await agentsApi.deleteChannel(channelId); message.success('已删除'); loadChannels() }
          catch { message.error('删除失败') }
        }}
        onChatInputChange={setChatInput}
        onSendChatMessage={sendChatMessage}
        onCloseChat={() => { setChatOpen(false); setChatChannel(null); setChatMessages([]) }}
      />

      {/* Collaboration Templates Modal */}
      <CollaborationTemplatesModal
        open={collabTemplatesOpen}
        templates={collabTemplates}
        loading={collabTemplatesLoading}
        onClose={() => setCollabTemplatesOpen(false)}
        onOpenInstantiate={openCollabInstantiate}
        onReload={loadCollabTemplates}
      />

      {/* Instantiate Collaboration Template Modal */}
      <InstantiateCollabTemplateModal
        open={collabInstantiateOpen}
        templateName={collabInstantiateName}
        projectId={collabInstantiateProjectId}
        instantiating={collabInstantiating}
        onCancel={() => setCollabInstantiateOpen(false)}
        onOk={instantiateCollabTemplate}
        onProjectIdChange={setCollabInstantiateProjectId}
      />

      {/* Protocols Modal */}
      <ProtocolsModal
        open={protocolsOpen}
        loading={protocolsLoading}
        protocols={protocols}
        agents={agents}
        createOpen={protocolCreateOpen}
        createForm={protocolForm}
        detailOpen={protocolDetailOpen}
        detail={protocolDetail}
        respondOpen={protocolRespondOpen}
        respondForm={protocolRespondMsg}
        deliberationOpen={deliberationOpen}
        deliberationForm={deliberationForm}
        onClose={() => setProtocolsOpen(false)}
        onCreateOpenChange={setProtocolCreateOpen}
        onCreateFormChange={setProtocolForm}
        onCreate={createProtocol}
        onOpenDetail={openProtocolDetail}
        onDetailOpenChange={setProtocolDetailOpen}
        onDetailChange={setProtocolDetail}
        onRespondOpenChange={setProtocolRespondOpen}
        onRespondFormChange={setProtocolRespondMsg}
        onRespond={respondToProtocol}
        onResolve={resolveProtocol}
        onDeliberationOpenChange={setDeliberationOpen}
        onDeliberationFormChange={setDeliberationForm}
        onDeliberationSubmit={submitDeliberation}
      />

      {/* Sandbox Management Drawer */}
      <SandboxDrawer
        open={sandboxOpen}
        sandboxes={sandboxes}
        templates={sandboxTemplates}
        agents={agents}
        templateOpen={sandboxTemplateOpen}
        formOpen={sandboxFormOpen}
        editingId={sandboxEditingId}
        formData={sandboxForm}
        execOpen={sandboxExecOpen}
        execSandboxId={sandboxExecSandboxId}
        executions={sandboxExecutions}
        execDetail={sandboxExecDetail}
        execDetailOpen={sandboxExecDetailOpen}
        checkOpen={sandboxCheckOpen}
        checkForm={sandboxCheckForm}
        checkResult={sandboxCheckResult}
        startOpen={sandboxStartOpen}
        startForm={sandboxStartForm}
        violationOpen={sandboxViolationOpen}
        violationForm={sandboxViolationForm}
        onClose={() => setSandboxOpen(false)}
        onOpenTemplates={openSandboxTemplates}
        onCreate={openCreateSandbox}
        onEdit={openEditSandbox}
        onDelete={deleteSandbox}
        onSubmitForm={submitSandboxForm}
        onInstantiateTemplate={instantiateTemplate}
        onCloseTemplates={() => setSandboxTemplateOpen(false)}
        onOpenExec={openSandboxExec}
        onOpenExecDetail={openSandboxExecDetail}
        onCompleteExec={completeSandboxExec}
        onRevokeExec={revokeSandboxExec}
        onOpenCheck={openSandboxCheck}
        onSubmitCheck={submitSandboxCheck}
        onOpenStart={openSandboxStart}
        onSubmitStart={submitSandboxStart}
        onOpenViolation={openSandboxViolation}
        onSubmitViolation={submitSandboxViolation}
        setFormData={setSandboxForm}
        setCheckForm={setSandboxCheckForm}
        setStartForm={setSandboxStartForm}
        setViolationForm={setSandboxViolationForm}
        setExecDetailOpen={setSandboxExecDetailOpen}
        setExecOpen={setSandboxExecOpen}
        setFormOpen={setSandboxFormOpen}
        setTemplateOpen={setSandboxTemplateOpen}
        setCheckOpen={setSandboxCheckOpen}
        setStartOpen={setSandboxStartOpen}
        setViolationOpen={setSandboxViolationOpen}
        setCheckResult={setSandboxCheckResult}
      />

      {/* Workflow Step Dynamic Reconfiguration Modal */}
      <ExperienceDrawer
        createOpen={experienceCreateOpen}
        createForm={experienceForm}
        detailOpen={experienceDetailOpen}
        detail={experienceDetail}
        sharedOpen={sharedExperiencesOpen}
        sharedExperiences={sharedExperiences}
        selectedAgent={selectedAgent}
        onCreateOpenChange={setExperienceCreateOpen}
        onCreateFormChange={setExperienceForm}
        onCreate={createExperience}
        onDetailOpenChange={setExperienceDetailOpen}
        onOpenDetail={openExperienceDetail}
        onSharedOpenChange={setSharedExperiencesOpen}
        onLearnFromExperience={learnFromExperience}
      />

      {/* Cross-Project Authorize Modal */}
      <CrossProjectModal
        open={crossTasksOpen}
        selectedAgent={selectedAgent}
        tasks={crossTasks}
        onClose={() => setCrossTasksOpen(false)}
        onClaim={claimCrossTask}
      />
  </>
)

export default AgentsCollabModals
