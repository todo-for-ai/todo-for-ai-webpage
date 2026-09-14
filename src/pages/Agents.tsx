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
import { buildAgentsTableColumns } from './agents/agentsTableColumns'
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
  const [agents, setAgents] = useState<Agent[]>([])
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const pendingAgentId = searchParams.get('agent_id')
  const [autoOpened, setAutoOpened] = useState(false)
  const [autoOpenedConflicts, setAutoOpenedConflicts] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all')
  const [reviewActionFilter, setReviewActionFilter] = useState<ReviewQueueAction>('all')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [liveMode, setLiveMode] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastAgent, setBroadcastAgent] = useState<Agent | null>(null)
  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)



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
  const [agentReputation, setAgentReputation] = useState<any>(null)
  const [reputationHistory, setReputationHistory] = useState<ReputationHistory | null>(null)
  // Agent-bound sandbox (shown in drawer)
  const [agentSandbox, setAgentSandbox] = useState<any>(null)

  // Live event feed
  const [liveEvents, setLiveEvents] = useState<{ type: string; payload: any; time: number }[]>([])
  const MAX_LIVE_EVENTS = 30

  const [form] = Form.useForm()
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

  // 看板实时刷新：每 10s 静默拉取 Agent 列表与人工审核队列（页面隐藏时跳过）
  useEffect(() => {
    if (!liveMode) return
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      loadAgents({ silent: true })
      loadReviewQueue({ silent: true })
      if (drawerOpen && selectedAgent) {
        loadAssignments(selectedAgent, { silent: true })
      }
    }, 10000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode, statusFilter, reviewActionFilter, searchText, drawerOpen, selectedAgent])

  // 自动 dispatch：每 60s 对开启策略的活跃 coordinator 自动触发派活
  useEffect(() => {
    if (!liveMode) return
    const timer = window.setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      const coordinators = agents.filter(a => {
        if (a.kind !== 'coordinator' || a.status !== 'active') {
          return false
        }
        return getAgentDispatchPolicy(a).auto_dispatch_enabled === true
      })
      for (const coord of coordinators) {
        try {
          await agentsApi.dispatchTasks(coord.id, normalizeDispatchOptions(getAgentDispatchPolicy(coord)))
        } catch {
          // silent — may fail if no claimable tasks, that's fine
        }
      }
      loadAgents({ silent: true })
      loadReviewQueue({ silent: true })
    }, 60000)
    return () => window.clearInterval(timer)
  }, [liveMode, agents])

  // SSE: server pushes collaboration events → silent refresh + live feed
  useCollaborationSSE({
    enabled: liveMode,
    onEvent: useCallback((event: any) => {
      loadAgents({ silent: true })
      loadReviewQueue({ silent: true })
      if (drawerOpen && selectedAgent) {
        loadAssignments(selectedAgent, { silent: true })
      }
      // Sandbox violation alerts — surface immediately
      const et = event.event_type || ''
      if (et === 'sandbox_violation' || et === 'sandbox_step_violation') {
        const p = event.payload || {}
        notification.warning({
          key: `sandbox-${et}-${p.execution_id || p.run_id}-${Date.now()}`,
          message: '沙盒策略违规',
          description: `${et === 'sandbox_step_violation' ? `步骤 ${p.step_key} (运行 #${p.run_id})` : `执行 #${p.execution_id}`} — 违规类型: ${p.violation_type}${p.terminated ? ' (已终止)' : ''}`,
          placement: 'topRight',
          duration: 8,
        })
      } else if (et === 'sandbox_execution_revoked') {
        notification.info({
          message: '沙盒执行已吊销',
          description: `执行 #${(event.payload || {}).execution_id} 已被手动终止`,
          placement: 'topRight',
          duration: 5,
        })
      } else if (et === 'conflicts_detected') {
        notification.warning({
          message: '检测到协作冲突',
          description: `扫描发现 ${(event.payload || {}).count || 0} 个新冲突，请前往「冲突」面板处理`,
          placement: 'topRight',
          duration: 8,
        })
      } else if (et === 'conflict_resolved') {
        notification.success({
          message: '冲突已解决',
          description: `冲突 #${(event.payload || {}).conflict_id} 已通过 ${(event.payload || {}).strategy || ''} 策略解决`,
          placement: 'topRight',
          duration: 5,
        })
      } else if (et === 'conflicts_auto_resolved') {
        notification.success({
          message: '冲突自动解决完成',
          description: `维护扫描自动解决了 ${(event.payload || {}).count || 0} 个低严重度冲突`,
          placement: 'topRight',
          duration: 6,
        })
      }
      // Push to live event feed
      setLiveEvents(prev => [
        { type: event.event_type || 'unknown', payload: event.payload, time: Date.now() },
        ...prev,
      ].slice(0, MAX_LIVE_EVENTS))
    }, [drawerOpen, selectedAgent]),
  })

  const loadAgents = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (!silent) setLoading(true)
    try {
      const result = await agentsApi.getAgents({
        status: statusFilter,
        search: searchText,
        sort_by: 'last_seen_at',
        sort_order: 'desc',
        per_page: 50,
      })
      setAgents(result.items)
    } catch (error) {
      if (!silent) message.error('加载 Agent 失败')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const loadReviewQueue = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (!silent) setReviewLoading(true)
    try {
      const result = await agentsApi.getReviewQueue({
        action: reviewActionFilter,
        per_page: 20,
      })
      setReviewQueue(result.items)
    } catch (error) {
      if (!silent) message.error(error instanceof Error ? error.message : '加载人工审核队列失败')
    } finally {
      if (!silent) setReviewLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingAgent(null)
    form.setFieldsValue({
      name: '',
      description: '',
      kind: 'assistant',
      status: 'active',
      provider: '',
      model: '',
      capabilitiesText: '',
      configText: '{}',
    })
    setModalOpen(true)
  }

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent)
    form.setFieldsValue({
      name: agent.name,
      description: agent.description,
      kind: agent.kind,
      status: agent.status,
      provider: agent.provider,
      model: agent.model,
      capabilitiesText: (agent.capabilities || []).join('\n'),
      configText: stringifyConfig(agent),
    })
    setModalOpen(true)
  }

  const saveAgent = async () => {
    try {
      const values = await form.validateFields()
      let config = {}
      try {
        config = JSON.parse(values.configText || '{}')
      } catch {
        message.error('运行配置必须是合法 JSON')
        return
      }

      const payload = {
        name: values.name,
        description: values.description,
        kind: values.kind,
        status: values.status,
        provider: values.provider,
        model: values.model,
        capabilities: parseLines(values.capabilitiesText),
        config,
      }

      if (editingAgent) {
        await agentsApi.updateAgent(editingAgent.id, payload)
        message.success('Agent 已更新')
      } else {
        await agentsApi.createAgent(payload)
        message.success('Agent 已创建')
      }

      setModalOpen(false)
      loadAgents()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    }
  }

  const heartbeat = async (agent: Agent) => {
    try {
      await agentsApi.heartbeatAgent(agent.id, 'active')
      message.success('心跳已记录')
      loadAgents()
    } catch {
      message.error('心跳失败')
    }
  }

  const sendBroadcast = async () => {
    if (!broadcastAgent || !broadcastContent.trim()) {
      message.warning('请输入广播内容')
      return
    }
    setBroadcasting(true)
    try {
      const result = await agentsApi.broadcastMessage(broadcastAgent.id, broadcastContent.trim())
      message.success(`广播已发送给 ${result.recipient_count} 个活跃 Agent`)
      setBroadcastOpen(false)
      setBroadcastAgent(null)
      setBroadcastContent('')
    } catch {
      message.error('广播发送失败')
    } finally {
      setBroadcasting(false)
    }
  }





  const loadAgentReputation = async (agent: Agent) => {
    try {
      const data = await agentsApi.getAgentReputation(agent.id)
      setAgentReputation(data)
    } catch {
      setAgentReputation(null)
    }
    try {
      const hist = await agentsApi.getAgentReputationHistory(agent.id, { limit: 200 })
      setReputationHistory(hist)
    } catch {
      setReputationHistory(null)
    }
  }

  const loadAgentSandbox = async (agent: Agent) => {
    try {
      const data = await agentsApi.getAgentSandbox(agent.id)
      setAgentSandbox(data.sandbox || null)
    } catch {
      setAgentSandbox(null)
    }
  }

  const recalculateReputation = async () => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.recalculateReputation(selectedAgent.id)
      setAgentReputation(data)
      const hist = await agentsApi.getAgentReputationHistory(selectedAgent.id, { limit: 200 })
      setReputationHistory(hist)
      message.success('声誉已重新计算')
    } catch { message.error('重新计算失败') }
  }



  // ---- Workflow step dynamic reconfiguration / Conflict detection & resolution ----
  // 两域块已抽至 agents/hooks/useAgentStepOverrides.ts 与 useAgentConflicts.ts（原样搬移）

  const resolveProtocol = async (protocolId: number, resolution: string) => {
    try {
      await agentsApi.resolveProtocol(protocolId, { resolution })
      message.success(`协议已${resolution === 'accepted' ? '接受' : resolution === 'rejected' ? '拒绝' : '取消'}`)
      if (protocolDetail) openProtocolDetail(protocolDetail.id)
      loadProtocols()
    } catch { message.error('操作失败') }
  }





  const loadDashboardStats = async () => {
    try {
      const stats = await dashboardApi.getStats()
      setDashboardStats(stats)
    } catch {
      // silent
    }
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
      <CrossProjectModal
        open={crossTasksOpen}
        selectedAgent={selectedAgent}
        tasks={crossTasks}
        onClose={() => setCrossTasksOpen(false)}
        onClaim={claimCrossTask}
      />
    </div>
  )
}


export default Agents
