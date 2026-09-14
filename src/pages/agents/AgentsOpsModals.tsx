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

import type { AgentsOpsModalsProps } from './agentsViewProps'
const { Title, Text } = Typography


const AgentsOpsModals = ({

  acknowledgeConflict,
  adaptLoading,
  adaptOpen,
  adaptSuggestions,
  agentReputation,
  agentSandbox,
  agents,
  applyAdaptation,
  applyDecay,
  applyDispatchPreview,
  assignmentColumns,
  assignmentLoading,
  assignments,
  authorizeAgent,
  authorizeForm,
  authorizeOpen,
  autoExtractExperiences,
  autoExtractKnowledge,
  autoResolveConflicts,
  broadcastAgent,
  broadcastContent,
  broadcastOpen,
  broadcasting,
  claimTask,
  claimTaskId,
  clearStepOverride,
  collabSubgraph,
  collaborators,
  collaboratorsLoading,
  conflictDetail,
  conflictDetailOpen,
  conflictOpen,
  conflictResolveForm,
  conflictResolveOpen,
  conflicts,
  createExperience,
  createKnowledgeEntry,
  crossProjectLoading,
  crossProjects,
  crossTasksLoading,
  deleteExperience,
  deleteKnowledgeEntry,
  dispatchCandidateOptions,
  dispatchPolicyDirty,
  dispatchPolicySaving,
  dispatchPreview,
  dispatchPreviewAgent,
  dispatchPreviewApplying,
  dispatchPreviewLoading,
  dispatchPreviewOpen,
  dispatchPreviewOptions,
  dmContent,
  dmFrom,
  dmOpen,
  dmSending,
  dmTo,
  drawerOpen,
  experienceCreateOpen,
  experienceDetail,
  experienceDetailOpen,
  experienceForm,
  experiences,
  experiencesLoading,
  form,
  ignoreConflict,
  inboxItems,
  knowledgeCreateOpen,
  knowledgeDetail,
  knowledgeDetailOpen,
  knowledgeEntries,
  knowledgeForm,
  knowledgeLoading,
  knowledgeSearch,
  learnFromExperience,
  loadAdaptSuggestions,
  loadAssignments,
  loadConflicts,
  loadCrossProjectTasks,
  loadKnowledge,
  loadSharedExperiences,
  loadStepEffective,
  loading,
  navigate,
  openConflictDetail,
  openCrossProject,
  openExperienceDetail,
  openKnowledgeDetail,
  openResolveConflict,
  openSandboxes,
  previewDispatchTasks,
  recTasks,
  recTasksAgent,
  recTasksLoading,
  recTasksOpen,
  recalculateReputation,
  reputationHistory,
  revokeCrossProject,
  saveDispatchPolicy,
  scanConflicts,
  selectedAgent,
  sendBroadcast,
  sendDirectMessage,
  setAdaptOpen,
  setAdaptSuggestions,
  setAuthorizeForm,
  setAuthorizeOpen,
  setBroadcastAgent,
  setBroadcastContent,
  setBroadcastOpen,
  setClaimTaskId,
  setConflictDetailOpen,
  setConflictOpen,
  setConflictResolveForm,
  setConflictResolveOpen,
  setDispatchPolicyDirty,
  setDispatchPreview,
  setDispatchPreviewAgent,
  setDispatchPreviewOpen,
  setDmContent,
  setDmFrom,
  setDmOpen,
  setDmTo,
  setDrawerOpen,
  setExperienceCreateOpen,
  setExperienceDetailOpen,
  setExperienceForm,
  setKnowledgeCreateOpen,
  setKnowledgeDetail,
  setKnowledgeDetailOpen,
  setKnowledgeForm,
  setKnowledgeSearch,
  setRecTasks,
  setRecTasksAgent,
  setRecTasksOpen,
  setSharedExperiencesOpen,
  setStepOverrideForm,
  setStepOverrideOpen,
  shareExperience,
  sharedExperiences,
  sharedExperiencesLoading,
  sharedExperiencesOpen,
  stepEffective,
  stepOverrideForm,
  stepOverrideOpen,
  submitResolveConflict,
  submitStepOverride,
  updateDispatchPreviewOptions,
  validateExperience,
}: AgentsOpsModalsProps) => (
  <>
      <AgentDetailDrawer
        open={drawerOpen}
        selectedAgent={selectedAgent}
        agents={agents}
        assignments={assignments}
        assignmentLoading={assignmentLoading}
        assignmentColumns={assignmentColumns}
        inboxItems={inboxItems}
        claimTaskId={claimTaskId}
        agentReputation={agentReputation}
        agentSandbox={agentSandbox}
        reputationHistory={reputationHistory}
        collaborators={collaborators}
        collaboratorsLoading={collaboratorsLoading}
        collabSubgraph={collabSubgraph}
        experiences={experiences}
        experiencesLoading={experiencesLoading}
        experienceCreateOpen={experienceCreateOpen}
        experienceForm={experienceForm}
        experienceDetailOpen={experienceDetailOpen}
        experienceDetail={experienceDetail}
        sharedExperiencesOpen={sharedExperiencesOpen}
        sharedExperiences={sharedExperiences}
        crossProjects={crossProjects}
        crossProjectLoading={crossProjectLoading}
        knowledgeProps={{
          selectedAgent,
          entries: knowledgeEntries,
          loading: knowledgeLoading,
          search: knowledgeSearch,
          onSearchChange: setKnowledgeSearch,
          onSearch: () => selectedAgent && loadKnowledge(selectedAgent),
          createOpen: knowledgeCreateOpen,
          form: knowledgeForm,
          onFormChange: setKnowledgeForm,
          onCreateOpenChange: setKnowledgeCreateOpen,
          onCreate: createKnowledgeEntry,
          detailOpen: knowledgeDetailOpen,
          detail: knowledgeDetail,
          onDetailOpenChange: setKnowledgeDetailOpen,
          onDetailChange: setKnowledgeDetail,
          onDelete: deleteKnowledgeEntry,
          onOpenDetail: openKnowledgeDetail,
          onAutoExtract: autoExtractKnowledge,
        }}
        experienceProps={{
          createOpen: experienceCreateOpen,
          createForm: experienceForm,
          detailOpen: experienceDetailOpen,
          detail: experienceDetail,
          sharedOpen: sharedExperiencesOpen,
          sharedExperiences,
          selectedAgent,
          onCreateOpenChange: setExperienceCreateOpen,
          onCreateFormChange: setExperienceForm,
          onCreate: createExperience,
          onDetailOpenChange: setExperienceDetailOpen,
          onOpenDetail: openExperienceDetail,
          onSharedOpenChange: setSharedExperiencesOpen,
          onLearnFromExperience: learnFromExperience,
        }}
        onClose={() => setDrawerOpen(false)}
        onClaimTaskIdChange={setClaimTaskId}
        onClaimTask={claimTask}
        onRefreshAssignments={loadAssignments}
        onNavigate={navigate}
        onOpenAgent={(agent) => { setTimeout(() => loadAssignments(agent), 100) }}
        onRecalculateReputation={recalculateReputation}
        onOpenSandboxes={openSandboxes}
        onLoadAdaptSuggestions={loadAdaptSuggestions}
        adaptLoading={adaptLoading}
        onSetDrawerOpen={setDrawerOpen}
        onSetExperienceCreateOpen={setExperienceCreateOpen}
        onAutoExtractExperiences={autoExtractExperiences}
        onLoadSharedExperiences={loadSharedExperiences}
        sharedExperiencesLoading={sharedExperiencesLoading}
        onApplyDecay={applyDecay}
        onValidateExperience={validateExperience}
        onShareExperience={shareExperience}
        onDeleteExperience={deleteExperience}
        onOpenExperienceDetail={openExperienceDetail}
        onSetAuthorizeOpen={setAuthorizeOpen}
        onOpenCrossProject={openCrossProject}
        onLoadCrossProjectTasks={loadCrossProjectTasks}
        crossTasksLoading={crossTasksLoading}
        onRevokeCrossProject={revokeCrossProject}
      />

      {/* 广播消息 Modal */}
      <BroadcastModal
        open={broadcastOpen}
        agent={broadcastAgent}
        content={broadcastContent}
        sending={broadcasting}
        onClose={() => { setBroadcastOpen(false); setBroadcastAgent(null); setBroadcastContent('') }}
        onContentChange={setBroadcastContent}
        onSend={sendBroadcast}
      />

      {/* 派活预览 Modal */}
      <DispatchPreviewModal
        open={dispatchPreviewOpen}
        agent={dispatchPreviewAgent}
        preview={dispatchPreview}
        loading={dispatchPreviewLoading}
        applying={dispatchPreviewApplying}
        policySaving={dispatchPolicySaving}
        policyDirty={dispatchPolicyDirty}
        options={dispatchPreviewOptions}
        candidateOptions={dispatchCandidateOptions}
        onClose={() => {
          setDispatchPreviewOpen(false)
          setDispatchPreviewAgent(null)
          setDispatchPreview(null)
          setDispatchPolicyDirty(false)
        }}
        onApply={applyDispatchPreview}
        onPreview={() => dispatchPreviewAgent && previewDispatchTasks(dispatchPreviewAgent, dispatchPreviewOptions)}
        onSavePolicy={saveDispatchPolicy}
        onUpdateOptions={updateDispatchPreviewOptions}
      />

      {/* Agent 直接消息 Modal */}
      <DirectMessageModal
        open={dmOpen}
        from={dmFrom}
        to={dmTo}
        content={dmContent}
        sending={dmSending}
        agents={agents}
        onCancel={() => { setDmOpen(false); setDmFrom(null); setDmTo(null); setDmContent('') }}
        onOk={sendDirectMessage}
        onToChange={setDmTo}
        onContentChange={setDmContent}
      />

      {/* Recommended tasks Modal */}
      <RecommendedTasksModal
        open={recTasksOpen}
        agent={recTasksAgent}
        tasks={recTasks}
        loading={recTasksLoading}
        onCancel={() => { setRecTasksOpen(false); setRecTasksAgent(null); setRecTasks([]) }}
        onClaim={(agent, taskId) => { claimTask(agent, taskId, true); setRecTasksOpen(false) }}
      />

      {/* Channels Drawer */}
      <StepOverrideModal
        open={stepOverrideOpen}
        form={stepOverrideForm}
        effective={stepEffective}
        agents={agents}
        onCancel={() => setStepOverrideOpen(false)}
        onSubmit={submitStepOverride}
        onClear={clearStepOverride}
        onFormChange={setStepOverrideForm}
        onLoadEffective={loadStepEffective}
      />

      {/* Conflict Management Drawer */}
      <ConflictDrawer
        open={conflictOpen}
        conflicts={conflicts}
        detail={conflictDetail}
        detailOpen={conflictDetailOpen}
        resolveOpen={conflictResolveOpen}
        resolveForm={conflictResolveForm}
        onClose={() => setConflictOpen(false)}
        onRefresh={() => loadConflicts()}
        onScan={scanConflicts}
        onAutoResolve={autoResolveConflicts}
        onOpenDetail={openConflictDetail}
        onAcknowledge={acknowledgeConflict}
        onIgnore={ignoreConflict}
        onOpenResolve={openResolveConflict}
        onSubmitResolve={submitResolveConflict}
        setDetailOpen={setConflictDetailOpen}
        setResolveOpen={setConflictResolveOpen}
        setResolveForm={setConflictResolveForm}
      />

      {/* Experience Modals */}
      <CrossProjectAuthorizeModal
        open={authorizeOpen}
        agentName={selectedAgent?.name || ''}
        form={authorizeForm}
        onCancel={() => setAuthorizeOpen(false)}
        onOk={authorizeAgent}
        onFormChange={setAuthorizeForm}
      />

      {/* Adaptive Capabilities Modal */}
      <AdaptiveCapabilitiesModal
        open={adaptOpen}
        agentName={selectedAgent?.name || ''}
        suggestions={adaptSuggestions}
        onCancel={() => { setAdaptOpen(false); setAdaptSuggestions(null) }}
        onApplyAdaptation={applyAdaptation}
      />

      {/* Cross-Project Tasks Modal */}
  </>
)

export default AgentsOpsModals
