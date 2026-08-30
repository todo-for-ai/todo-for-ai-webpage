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
  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
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
  const [claimTaskId, setClaimTaskId] = useState<number | null>(null)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackReviewItem, setFeedbackReviewItem] = useState<ReviewQueueItem | null>(null)
  const [liveMode, setLiveMode] = useState(true)
  const [inboxItems, setInboxItems] = useState<TaskEvent[]>([])
  const [inboxLoading, setInboxLoading] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastAgent, setBroadcastAgent] = useState<Agent | null>(null)
  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [dispatchPreviewOpen, setDispatchPreviewOpen] = useState(false)
  const [dispatchPreviewAgent, setDispatchPreviewAgent] = useState<Agent | null>(null)
  const [dispatchPreview, setDispatchPreview] = useState<DispatchPreviewResult | null>(null)
  const [dispatchPreviewLoading, setDispatchPreviewLoading] = useState(false)
  const [dispatchPreviewApplying, setDispatchPreviewApplying] = useState(false)
  const [dispatchPolicySaving, setDispatchPolicySaving] = useState(false)
  const [dispatchPolicyDirty, setDispatchPolicyDirty] = useState(false)
  const [dispatchPreviewOptions, setDispatchPreviewOptions] = useState<DispatchTasksData>(DEFAULT_DISPATCH_PREVIEW_OPTIONS)
  const dispatchCandidateOptions = useMemo(() => {
    return agents
      .filter(agent => {
        if (agent.status !== 'active') {
          return false
        }
        if (agent.kind !== 'coordinator') {
          return true
        }
        return dispatchPreviewOptions.include_self && agent.id === dispatchPreviewAgent?.id
      })
      .map(agent => ({
        label: `${agent.name} · ${agent.kind}`,
        value: agent.id,
      }))
  }, [agents, dispatchPreviewAgent?.id, dispatchPreviewOptions.include_self])

  // Direct message state
  const [dmOpen, setDmOpen] = useState(false)
  const [dmFrom, setDmFrom] = useState<Agent | null>(null)
  const [dmTo, setDmTo] = useState<Agent | null>(null)
  const [dmContent, setDmContent] = useState('')
  const [dmSending, setDmSending] = useState(false)

  // Recommended tasks
  const [recTasksOpen, setRecTasksOpen] = useState(false)
  const [recTasksAgent, setRecTasksAgent] = useState<Agent | null>(null)
  const [recTasks, setRecTasks] = useState<any[]>([])
  const [recTasksLoading, setRecTasksLoading] = useState(false)

  // Channels
  const [channels, setChannels] = useState<any[]>([])
  const [channelActivityTrend, setChannelActivityTrend] = useState<ChannelActivityTrend | null>(null)
  const [channelsOpen, setChannelsOpen] = useState(false)
  const [channelCreateOpen, setChannelCreateOpen] = useState(false)
  const [channelForm, setChannelForm] = useState<any>({ name: '', description: '', agent_ids: [] })
  const [chatOpen, setChatOpen] = useState(false)
  const [chatChannel, setChatChannel] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  // Collaboration templates
  const [collabTemplates, setCollabTemplates] = useState<any[]>([])
  const [collabTemplatesOpen, setCollabTemplatesOpen] = useState(false)
  const [collabTemplatesLoading, setCollabTemplatesLoading] = useState(false)
  const [collabInstantiateOpen, setCollabInstantiateOpen] = useState(false)
  const [collabInstantiateKey, setCollabInstantiateKey] = useState<string>('')
  const [collabInstantiateName, setCollabInstantiateName] = useState<string>('')
  const [collabInstantiateProjectId, setCollabInstantiateProjectId] = useState<number | undefined>(undefined)
  const [collabInstantiating, setCollabInstantiating] = useState(false)
  // Knowledge base
  const [knowledgeEntries, setKnowledgeEntries] = useState<any[]>([])
  const [knowledgeLoading, setKnowledgeLoading] = useState(false)
  const [knowledgeSearch, setKnowledgeSearch] = useState('')
  const [knowledgeCreateOpen, setKnowledgeCreateOpen] = useState(false)
  const [knowledgeForm, setKnowledgeForm] = useState<any>({ title: '', content: '', domain: '', tags: [], entry_type: 'insight', confidence: 1.0 })
  const [knowledgeDetailOpen, setKnowledgeDetailOpen] = useState(false)
  const [knowledgeDetail, setKnowledgeDetail] = useState<any>(null)
  // Protocols
  const [protocols, setProtocols] = useState<any[]>([])
  const [protocolsOpen, setProtocolsOpen] = useState(false)
  const [protocolsLoading, setProtocolsLoading] = useState(false)
  const [protocolCreateOpen, setProtocolCreateOpen] = useState(false)
  const [protocolForm, setProtocolForm] = useState<any>({ protocol_type: 'proposal', title: '', description: '', initiator_agent_id: undefined, config: {} })
  const [protocolDetailOpen, setProtocolDetailOpen] = useState(false)
  const [protocolDetail, setProtocolDetail] = useState<any>(null)
  const [protocolRespondOpen, setProtocolRespondOpen] = useState(false)
  const [protocolRespondMsg, setProtocolRespondMsg] = useState<any>({ protocol_id: 0, agent_id: undefined, message_type: 'accept', content: '' })
  // Deliberation
  const [deliberationOpen, setDeliberationOpen] = useState(false)
  const [deliberationForm, setDeliberationForm] = useState<any>({ protocol_id: 0, agent_id: undefined, message_type: 'comment', content: '' })
  // Sandbox
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const [sandboxes, setSandboxes] = useState<any[]>([])
  const [sandboxForm, setSandboxForm] = useState<any>({ name: '', description: '', agent_id: undefined, security_level: 'moderate', allowed_tools: [], blocked_tools: [], allowed_network_hosts: [], fs_write_paths: [], fs_read_paths: [], max_memory_mb: 0, max_cpu_seconds: 0, max_output_tokens: 0, timeout_seconds: 0 })
  const [sandboxEditingId, setSandboxEditingId] = useState<number | null>(null)
  const [sandboxFormOpen, setSandboxFormOpen] = useState(false)
  const [sandboxExecOpen, setSandboxExecOpen] = useState(false)
  const [sandboxExecSandboxId, setSandboxExecSandboxId] = useState<number | null>(null)
  const [sandboxExecutions, setSandboxExecutions] = useState<any[]>([])
  const [sandboxExecDetail, setSandboxExecDetail] = useState<any>(null)
  const [sandboxExecDetailOpen, setSandboxExecDetailOpen] = useState(false)
  const [sandboxCheckOpen, setSandboxCheckOpen] = useState(false)
  const [sandboxCheckForm, setSandboxCheckForm] = useState<any>({ sandbox_id: 0, action: 'tool', target: '' })
  const [sandboxCheckResult, setSandboxCheckResult] = useState<any>(null)
  const [sandboxStartOpen, setSandboxStartOpen] = useState(false)
  const [sandboxStartForm, setSandboxStartForm] = useState<any>({ sandbox_id: 0, agent_id: undefined, run_id: undefined, step_run_id: undefined })
  const [sandboxViolationOpen, setSandboxViolationOpen] = useState(false)
  const [sandboxViolationForm, setSandboxViolationForm] = useState<any>({ execution_id: 0, violation_type: 'disallowed_tool', attempted_action: '', detail: '', terminate: false })
  // Workflow step dynamic reconfiguration
  const [stepOverrideOpen, setStepOverrideOpen] = useState(false)
  const [stepOverrideForm, setStepOverrideForm] = useState<any>({ run_id: undefined, step_key: '', agent_id: undefined, required_capabilities: '', timeout_seconds: undefined, retry_count: undefined, on_failure: undefined, condition: '', task_template_id: undefined, sub_workflow_id: undefined })
  const [stepEffective, setStepEffective] = useState<any>(null)
  // Conflict detection & resolution
  const [conflictOpen, setConflictOpen] = useState(false)
  const [conflicts, setConflicts] = useState<any[]>([])
  const [conflictDetail, setConflictDetail] = useState<any>(null)
  const [conflictDetailOpen, setConflictDetailOpen] = useState(false)
  const [conflictResolveOpen, setConflictResolveOpen] = useState(false)
  const [conflictResolveForm, setConflictResolveForm] = useState<any>({ conflict_id: 0, strategy: '', description: '' })
  // Sandbox templates
  const [sandboxTemplates, setSandboxTemplates] = useState<any[]>([])
  const [sandboxTemplateOpen, setSandboxTemplateOpen] = useState(false)
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

  const sendDirectMessage = async () => {
    if (!dmFrom || !dmTo || !dmContent.trim()) {
      message.warning('请选择发送方和接收方，并输入消息内容')
      return
    }
    setDmSending(true)
    try {
      await agentsApi.sendAgentMessage(dmFrom.id, dmTo.id, { content: dmContent.trim() })
      message.success(`消息已发送给 ${dmTo.name}`)
      setDmOpen(false)
      setDmFrom(null)
      setDmTo(null)
      setDmContent('')
    } catch {
      message.error('消息发送失败')
    } finally {
      setDmSending(false)
    }
  }

  const loadRecommendedTasks = async (agent: Agent) => {
    setRecTasksAgent(agent)
    setRecTasksOpen(true)
    setRecTasksLoading(true)
    try {
      const result = await agentsApi.getRecommendedTasks(agent.id, { limit: 20 })
      setRecTasks(Array.isArray(result) ? result : [])
    } catch {
      message.error('加载推荐任务失败')
      setRecTasks([])
    } finally {
      setRecTasksLoading(false)
    }
  }

  // --- Channels ---
  const loadChannels = async () => {
    try {
      const result = await agentsApi.listChannels()
      setChannels(Array.isArray(result) ? result : [])
      agentsApi.getChannelActivityTrend(14, 10).then(setChannelActivityTrend).catch(() => {})
    } catch { message.error('加载频道失败') }
  }

  const openChannels = () => {
    setChannelsOpen(true)
    loadChannels()
  }

  const createChannel = async () => {
    if (!channelForm.name.trim()) { message.warning('请输入频道名称'); return }
    try {
      await agentsApi.createChannel(channelForm)
      message.success('频道已创建')
      setChannelCreateOpen(false)
      setChannelForm({ name: '', description: '', agent_ids: [] })
      loadChannels()
    } catch { message.error('创建频道失败') }
  }

  const openChat = async (channel: any) => {
    setChatChannel(channel)
    setChatOpen(true)
    setChatInput('')
    try {
      const msgs = await agentsApi.listChannelMessages(channel.id)
      setChatMessages(Array.isArray(msgs) ? msgs : [])
    } catch { setChatMessages([]) }
  }

  const sendChatMessage = async () => {
    if (!chatChannel || !chatInput.trim()) return
    setChatSending(true)
    try {
      await agentsApi.sendChannelMessage(chatChannel.id, { content: chatInput.trim() })
      setChatInput('')
      const msgs = await agentsApi.listChannelMessages(chatChannel.id)
      setChatMessages(Array.isArray(msgs) ? msgs : [])
    } catch { message.error('发送失败') }
    finally { setChatSending(false) }
  }

  const loadCollabTemplates = async () => {
    setCollabTemplatesLoading(true)
    try {
      const data = await agentsApi.listCollaborationTemplates()
      setCollabTemplates(Array.isArray(data) ? data : [])
    } catch { message.error('加载协作模板失败') }
    finally { setCollabTemplatesLoading(false) }
  }

  const openCollabTemplates = () => {
    setCollabTemplatesOpen(true)
    loadCollabTemplates()
  }

  const openCollabInstantiate = (key: string, name: string) => {
    setCollabInstantiateKey(key)
    setCollabInstantiateName(name)
    setCollabInstantiateProjectId(undefined)
    setCollabInstantiateOpen(true)
  }

  const instantiateCollabTemplate = async () => {
    setCollabInstantiating(true)
    try {
      const data: Record<string, any> = {}
      if (collabInstantiateProjectId) data.project_id = collabInstantiateProjectId
      const result = await agentsApi.instantiateCollaborationTemplate(collabInstantiateKey, data)
      const agentCount = result?.agents?.length || 0
      message.success(`模板已实例化，创建了 ${agentCount} 个 Agent`)
      setCollabInstantiateOpen(false)
      setCollabTemplatesOpen(false)
      loadAgents()
    } catch { message.error('模板实例化失败') }
    finally { setCollabInstantiating(false) }
  }

  const loadKnowledge = async (agent: Agent) => {
    setKnowledgeLoading(true)
    try {
      const params: Record<string, any> = { include_content: false }
      if (knowledgeSearch) params.search = knowledgeSearch
      const data = await agentsApi.listKnowledgeEntries(agent.id, params)
      const items = data?.items || (Array.isArray(data) ? data : [])
      setKnowledgeEntries(items)
    } catch { message.error('加载知识库失败') }
    finally { setKnowledgeLoading(false) }
  }

  const createKnowledgeEntry = async () => {
    if (!selectedAgent) return
    if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
      message.warning('标题和内容不能为空')
      return
    }
    try {
      await agentsApi.createKnowledgeEntry(selectedAgent.id, knowledgeForm)
      message.success('知识条目已创建')
      setKnowledgeCreateOpen(false)
      setKnowledgeForm({ title: '', content: '', domain: '', tags: [], entry_type: 'insight', confidence: 1.0 })
      loadKnowledge(selectedAgent)
    } catch { message.error('创建失败') }
  }

  const openKnowledgeDetail = async (entry: any) => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.getKnowledgeEntry(selectedAgent.id, entry.id)
      setKnowledgeDetail(data)
      setKnowledgeDetailOpen(true)
    } catch { message.error('加载详情失败') }
  }

  const deleteKnowledgeEntry = async (entryId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.deleteKnowledgeEntry(selectedAgent.id, entryId)
      message.success('知识条目已删除')
      loadKnowledge(selectedAgent)
    } catch { message.error('删除失败') }
  }

  const autoExtractKnowledge = async () => {
    if (!selectedAgent) return
    try {
      const result = await agentsApi.autoExtractKnowledge(selectedAgent.id, 10)
      const count = result?.entries_created || 0
      message.success(`自动提取完成，创建了 ${count} 条知识条目`)
      loadKnowledge(selectedAgent)
    } catch { message.error('自动提取失败') }
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

  // Agent Experience (Collective Intelligence)
  const [experiences, setExperiences] = useState<any[]>([])
  const [experiencesLoading, setExperiencesLoading] = useState(false)
  const [experienceCreateOpen, setExperienceCreateOpen] = useState(false)
  const [experienceForm, setExperienceForm] = useState<any>({
    experience_type: 'success_pattern', domain: '', task_type: '',
    capabilities_used: [], strategy: '', outcome_pattern: '',
    key_learnings: '', confidence: 0.7, is_shared: false,
  })
  const [experienceDetailOpen, setExperienceDetailOpen] = useState(false)
  const [experienceDetail, setExperienceDetail] = useState<any>(null)
  const [sharedExperiencesOpen, setSharedExperiencesOpen] = useState(false)
  const [sharedExperiences, setSharedExperiences] = useState<any[]>([])
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false)
  const [sharedExperiencesLoading, setSharedExperiencesLoading] = useState(false)

  const loadExperiences = async (agent: Agent) => {
    setExperiencesLoading(true)
    try {
      const data: any = await agentsApi.listAgentExperiences(agent.id)
      setExperiences(data?.data?.items || data?.items || (Array.isArray(data?.data) ? data.data : []))
    } catch { message.error('加载经验失败') }
    finally { setExperiencesLoading(false) }
  }

  const loadCollaborators = async (agent: Agent) => {
    setCollaboratorsLoading(true)
    try {
      const result = await agentsApi.getAgentCollaborators(agent.id, { limit: 10 })
      setCollaborators(result?.collaborators || [])
    } catch {
      // silent: collaborators are supplementary info
    } finally {
      setCollaboratorsLoading(false)
    }
  }

  // 以当前 Agent 为中心的协作关系子图（中心节点 + top 协作者邻居）
  const collabSubgraph: CollaborationGraph | null = useMemo(() => {
    if (!selectedAgent || collaborators.length === 0) return null
    const center = selectedAgent
    const nodes = [
      { id: center.id, name: center.name, kind: center.kind, messages: 0 },
      ...collaborators.map((c) => ({ id: c.agent_id, name: c.name, kind: undefined, messages: c.total })),
    ]
    // 中心节点 messages = 所有邻居 total 之和
    const centerTotal = collaborators.reduce((s, c) => s + (c.total || 0), 0)
    nodes[0].messages = centerTotal
    const edges = collaborators.map((c) => ({
      source: Math.min(center.id, c.agent_id),
      target: Math.max(center.id, c.agent_id),
      count: c.total,
      // 中心发送给邻居: c.sent；邻居发送给中心: c.received
      // source 为较小 id 端，需按 id 大小映射方向
      ...(center.id < c.agent_id
        ? { source_to_target: c.sent, target_to_source: c.received }
        : { source_to_target: c.received, target_to_source: c.sent }),
    }))
    return { nodes, edges, total_edges: edges.length }
  }, [selectedAgent, collaborators])

  const createExperience = async () => {
    if (!selectedAgent) return
    if (!experienceForm.strategy.trim()) {
      message.warning('请填写策略描述')
      return
    }
    try {
      await agentsApi.createAgentExperience(selectedAgent.id, experienceForm)
      message.success('经验已创建')
      setExperienceCreateOpen(false)
      setExperienceForm({
        experience_type: 'success_pattern', domain: '', task_type: '',
        capabilities_used: [], strategy: '', outcome_pattern: '',
        key_learnings: '', confidence: 0.7, is_shared: false,
      })
      loadExperiences(selectedAgent)
    } catch { message.error('创建经验失败') }
  }

  const openExperienceDetail = async (exp: any) => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.getAgentExperience(selectedAgent.id, exp.id)
      setExperienceDetail(data)
      setExperienceDetailOpen(true)
    } catch { message.error('加载经验详情失败') }
  }

  const deleteExperience = async (expId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.deleteAgentExperience(selectedAgent.id, expId)
      message.success('经验已删除')
      loadExperiences(selectedAgent)
    } catch { message.error('删除经验失败') }
  }

  const shareExperience = async (expId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.shareAgentExperience(selectedAgent.id, expId)
      message.success('经验已分享')
      loadExperiences(selectedAgent)
    } catch { message.error('分享经验失败') }
  }

  const autoExtractExperiences = async () => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.autoExtractExperiences(selectedAgent.id)
      const count = Array.isArray(data) ? data.length : 0
      message.success(`自动提取了 ${count} 条经验`)
      loadExperiences(selectedAgent)
    } catch { message.error('自动提取失败') }
  }

  const loadSharedExperiences = async () => {
    if (!selectedAgent) return
    setSharedExperiencesLoading(true)
    try {
      const data: any = await agentsApi.listSharedExperiences(selectedAgent.id)
      setSharedExperiences(data?.data?.items || data?.items || (Array.isArray(data?.data) ? data.data : []))
      setSharedExperiencesOpen(true)
    } catch { message.error('加载共享经验失败') }
    finally { setSharedExperiencesLoading(false) }
  }

  const learnFromExperience = async (expId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.learnFromExperience(selectedAgent.id, expId)
      message.success('已学习该经验')
      loadExperiences(selectedAgent)
      loadSharedExperiences()
    } catch { message.error('学习经验失败') }
  }

  // Cross-Project Agent Collaboration
  const [crossProjects, setCrossProjects] = useState<any[]>([])
  const [crossProjectOpen, setCrossProjectOpen] = useState(false)
  const [crossProjectLoading, setCrossProjectLoading] = useState(false)
  const [authorizeOpen, setAuthorizeOpen] = useState(false)
  const [authorizeForm, setAuthorizeForm] = useState<any>({ project_id: '', role_in_project: 'contributor', max_concurrent_tasks: 3 })

  const loadCrossProjects = async (agent: Agent) => {
    setCrossProjectLoading(true)
    try {
      const data: any = await agentsApi.listAgentCrossProjects(agent.id)
      setCrossProjects(Array.isArray(data) ? data : data?.items || [])
    } catch { message.error('加载跨项目授权失败') }
    finally { setCrossProjectLoading(false) }
  }

  const openCrossProject = () => {
    if (!selectedAgent) return
    setCrossProjectOpen(true)
    loadCrossProjects(selectedAgent)
  }

  const authorizeAgent = async () => {
    if (!selectedAgent) return
    if (!authorizeForm.project_id) {
      message.warning('请选择目标项目')
      return
    }
    try {
      await agentsApi.authorizeCrossProjectAgent({
        agent_id: selectedAgent.id,
        project_id: Number(authorizeForm.project_id),
        role_in_project: authorizeForm.role_in_project,
        max_concurrent_tasks: authorizeForm.max_concurrent_tasks,
      })
      message.success('跨项目授权成功')
      setAuthorizeOpen(false)
      setAuthorizeForm({ project_id: '', role_in_project: 'contributor', max_concurrent_tasks: 3 })
      loadCrossProjects(selectedAgent)
    } catch { message.error('跨项目授权失败') }
  }

  const revokeCrossProject = async (projectId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.revokeCrossProjectAgent(selectedAgent.id, projectId)
      message.success('已撤销跨项目授权')
      loadCrossProjects(selectedAgent)
    } catch { message.error('撤销授权失败') }
  }

  // Experience decay & validation
  const applyDecay = async () => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.applyExperienceDecay(selectedAgent.id)
      message.success(`经验衰减完成，影响了 ${data?.decayed_count || 0} 条经验`)
      loadExperiences(selectedAgent)
    } catch { message.error('衰减失败') }
  }

  const validateExperience = async (expId: number, isAccurate: boolean) => {
    if (!selectedAgent) return
    try {
      await agentsApi.validateExperience(selectedAgent.id, expId, { is_accurate: isAccurate })
      message.success(isAccurate ? '经验已验证通过' : '经验已被反驳')
      loadExperiences(selectedAgent)
    } catch { message.error('验证失败') }
  }

  // Adaptive capabilities
  const [adaptSuggestions, setAdaptSuggestions] = useState<any>(null)
  const [adaptLoading, setAdaptLoading] = useState(false)
  const [adaptOpen, setAdaptOpen] = useState(false)

  const loadAdaptSuggestions = async (agent: Agent) => {
    setAdaptLoading(true)
    try {
      const data = await agentsApi.suggestCapabilityAdaptation(agent.id)
      setAdaptSuggestions(data)
      setAdaptOpen(true)
    } catch { message.error('获取能力建议失败') }
    finally { setAdaptLoading(false) }
  }

  const applyAdaptation = async (additions: string[], removals: string[]) => {
    if (!selectedAgent) return
    try {
      await agentsApi.applyCapabilityAdaptation(selectedAgent.id, { additions, removals })
      message.success('能力已自适应调整')
      setAdaptOpen(false)
      setAdaptSuggestions(null)
      loadAgents() // refresh list
    } catch { message.error('应用能力调整失败') }
  }

  // Cross-project task discovery
  const [crossTasks, setCrossTasks] = useState<any[]>([])
  const [crossTasksOpen, setCrossTasksOpen] = useState(false)
  const [crossTasksLoading, setCrossTasksLoading] = useState(false)

  const loadCrossProjectTasks = async () => {
    if (!selectedAgent) return
    setCrossTasksLoading(true)
    try {
      const data: any = await agentsApi.findCrossProjectTasks(selectedAgent.id)
      setCrossTasks(Array.isArray(data) ? data : data?.items || [])
      setCrossTasksOpen(true)
    } catch { message.error('加载跨项目任务失败') }
    finally { setCrossTasksLoading(false) }
  }

  const claimCrossTask = async (taskId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.claimCrossProjectTask(selectedAgent.id, taskId)
      message.success(`已领取跨项目任务 #${taskId}`)
      loadCrossProjectTasks()
    } catch { message.error('领取任务失败') }
  }

  const loadProtocols = async () => {
    setProtocolsLoading(true)
    try {
      const data = await agentsApi.listProtocols()
      setProtocols(data?.items || (Array.isArray(data) ? data : []))
    } catch { message.error('加载协议失败') }
    finally { setProtocolsLoading(false) }
  }

  const openProtocols = () => {
    setProtocolsOpen(true)
    loadProtocols()
  }

  const createProtocol = async () => {
    if (!protocolForm.title.trim() || !protocolForm.initiator_agent_id) {
      message.warning('标题和发起 Agent 不能为空')
      return
    }
    try {
      await agentsApi.createProtocol(protocolForm)
      message.success('协议已创建')
      setProtocolCreateOpen(false)
      setProtocolForm({ protocol_type: 'proposal', title: '', description: '', initiator_agent_id: undefined, config: {} })
      loadProtocols()
    } catch { message.error('创建失败') }
  }

  const openProtocolDetail = async (id: number) => {
    try {
      const data = await agentsApi.getProtocol(id)
      setProtocolDetail(data)
      setProtocolDetailOpen(true)
    } catch { message.error('加载协议详情失败') }
  }

  const respondToProtocol = async () => {
    try {
      await agentsApi.respondToProtocol(protocolRespondMsg.protocol_id, {
        agent_id: protocolRespondMsg.agent_id,
        message_type: protocolRespondMsg.message_type,
        content: protocolRespondMsg.content,
      })
      message.success('已响应')
      setProtocolRespondOpen(false)
      if (protocolDetail) openProtocolDetail(protocolDetail.id)
      loadProtocols()
    } catch { message.error('响应失败') }
  }

  const submitDeliberation = async () => {
    try {
      await agentsApi.addDeliberationMessage(deliberationForm.protocol_id, {
        agent_id: deliberationForm.agent_id,
        message_type: deliberationForm.message_type,
        content: deliberationForm.content,
      })
      message.success('已提交审议发言')
      setDeliberationOpen(false)
      if (protocolDetail) openProtocolDetail(protocolDetail.id)
      loadProtocols()
    } catch { message.error('提交审议发言失败') }
  }

  // ---- Sandbox functions ----
  const loadSandboxes = async () => {
    try {
      const result = await agentsApi.listSandboxes({ include_stats: 'true' })
      setSandboxes(result.items || [])
    } catch { message.error('加载沙盒列表失败') }
  }

  const openSandboxes = async () => {
    setSandboxOpen(true)
    loadSandboxes()
  }

  const openCreateSandbox = () => {
    setSandboxEditingId(null)
    setSandboxForm({ name: '', description: '', agent_id: undefined, security_level: 'moderate', allowed_tools: [], blocked_tools: [], allowed_network_hosts: [], fs_write_paths: [], fs_read_paths: [], max_memory_mb: 0, max_cpu_seconds: 0, max_output_tokens: 0, timeout_seconds: 0 })
    setSandboxFormOpen(true)
  }

  const openEditSandbox = async (id: number) => {
    try {
      const s = await agentsApi.getSandbox(id)
      setSandboxEditingId(id)
      setSandboxForm({
        name: s.name || '', description: s.description || '', agent_id: s.agent_id, security_level: s.security_level || 'moderate',
        allowed_tools: s.allowed_tools || [], blocked_tools: s.blocked_tools || [], allowed_network_hosts: s.allowed_network_hosts || [],
        fs_write_paths: s.fs_write_paths || [], fs_read_paths: s.fs_read_paths || [],
        max_memory_mb: s.max_memory_mb || 0, max_cpu_seconds: s.max_cpu_seconds || 0, max_output_tokens: s.max_output_tokens || 0, timeout_seconds: s.timeout_seconds || 0,
      })
      setSandboxFormOpen(true)
    } catch { message.error('加载沙盒详情失败') }
  }

  const submitSandboxForm = async () => {
    if (!sandboxForm.name) { message.warning('请填写沙盒名称'); return }
    try {
      if (sandboxEditingId) {
        await agentsApi.updateSandbox(sandboxEditingId, sandboxForm)
        message.success('沙盒已更新')
      } else {
        await agentsApi.createSandbox(sandboxForm)
        message.success('沙盒已创建')
      }
      setSandboxFormOpen(false)
      loadSandboxes()
    } catch { message.error('保存沙盒失败') }
  }

  const deleteSandbox = async (id: number) => {
    try {
      await agentsApi.deleteSandbox(id)
      message.success('沙盒已删除')
      loadSandboxes()
    } catch { message.error('删除沙盒失败') }
  }

  const bindSandboxToAgent = async (sandboxId: number, agentId: number) => {
    try {
      await agentsApi.bindAgentSandbox(agentId, sandboxId)
      message.success(`已绑定到 Agent #${agentId}`)
      loadSandboxes()
    } catch { message.error('绑定失败') }
  }

  const openSandboxExec = async (sandboxId: number) => {
    setSandboxExecSandboxId(sandboxId)
    setSandboxExecOpen(true)
    try {
      const result = await agentsApi.listSandboxExecutions(sandboxId)
      setSandboxExecutions(result.items || [])
    } catch { message.error('加载执行记录失败') }
  }

  const openSandboxExecDetail = async (execId: number) => {
    try {
      const result = await agentsApi.getSandboxExecution(execId)
      setSandboxExecDetail(result.execution)
      setSandboxExecDetailOpen(true)
    } catch { message.error('加载执行详情失败') }
  }

  const openSandboxStart = (sandboxId: number) => {
    setSandboxStartForm({ sandbox_id: sandboxId, agent_id: undefined, run_id: undefined, step_run_id: undefined })
    setSandboxStartOpen(true)
  }

  const submitSandboxStart = async () => {
    if (!sandboxStartForm.agent_id) { message.warning('请选择 Agent'); return }
    try {
      const result = await agentsApi.startSandboxExecution(sandboxStartForm.sandbox_id, {
        agent_id: sandboxStartForm.agent_id,
        run_id: sandboxStartForm.run_id || undefined,
        step_run_id: sandboxStartForm.step_run_id || undefined,
      })
      message.success(`已启动沙盒执行 #${result.execution?.id}`)
      setSandboxStartOpen(false)
      if (sandboxExecSandboxId) openSandboxExec(sandboxExecSandboxId)
    } catch { message.error('启动执行失败') }
  }

  const completeSandboxExec = async (execId: number) => {
    try {
      await agentsApi.completeSandboxExecution(execId, { output_summary: '手动标记完成' })
      message.success('执行已完成')
      if (sandboxExecSandboxId) openSandboxExec(sandboxExecSandboxId)
    } catch { message.error('完成失败') }
  }

  const revokeSandboxExec = async (execId: number) => {
    try {
      await agentsApi.revokeSandboxExecution(execId)
      message.success('执行已吊销')
      if (sandboxExecSandboxId) openSandboxExec(sandboxExecSandboxId)
    } catch { message.error('吊销失败') }
  }

  const openSandboxCheck = (sandboxId: number) => {
    setSandboxCheckForm({ sandbox_id: sandboxId, action: 'tool', target: '' })
    setSandboxCheckResult(null)
    setSandboxCheckOpen(true)
  }

  const submitSandboxCheck = async () => {
    if (!sandboxCheckForm.target) { message.warning('请输入目标'); return }
    try {
      const result = await agentsApi.checkSandboxAction(sandboxCheckForm.sandbox_id, sandboxCheckForm.action, sandboxCheckForm.target)
      setSandboxCheckResult(result)
    } catch { message.error('检查失败') }
  }

  const openSandboxViolation = (execId: number) => {
    setSandboxViolationForm({ execution_id: execId, violation_type: 'disallowed_tool', attempted_action: '', detail: '', terminate: false })
    setSandboxViolationOpen(true)
  }

  const submitSandboxViolation = async () => {
    try {
      await agentsApi.reportSandboxViolation(sandboxViolationForm.execution_id, {
        violation_type: sandboxViolationForm.violation_type,
        attempted_action: sandboxViolationForm.attempted_action,
        detail: sandboxViolationForm.detail,
        terminate: sandboxViolationForm.terminate,
      })
      message.success('违规已记录')
      setSandboxViolationOpen(false)
      if (sandboxExecDetail?.id === sandboxViolationForm.execution_id) openSandboxExecDetail(sandboxViolationForm.execution_id)
      if (sandboxExecSandboxId) openSandboxExec(sandboxExecSandboxId)
    } catch { message.error('记录违规失败') }
  }

  // ---- Workflow step dynamic reconfiguration ----
  const openStepOverride = async (runId?: number, stepKey?: string) => {
    setStepOverrideForm({ run_id: runId, step_key: stepKey || '', agent_id: undefined, required_capabilities: '', timeout_seconds: undefined, retry_count: undefined, on_failure: undefined, condition: '', task_template_id: undefined, sub_workflow_id: undefined })
    setStepEffective(null)
    setStepOverrideOpen(true)
    if (runId && stepKey) loadStepEffective(runId, stepKey)
  }

  const loadStepEffective = async (runId: number, stepKey: string) => {
    try {
      const result = await agentsApi.getStepEffectiveParams(runId, stepKey)
      setStepEffective(result)
      const eff = result.effective_params || {}
      const ov = result.overrides || {}
      setStepOverrideForm((prev: any) => ({
        ...prev,
        agent_id: ov.agent_id !== undefined ? ov.agent_id : eff.agent_id ?? undefined,
        required_capabilities: (eff.required_capabilities || []).join(', '),
        timeout_seconds: eff.timeout_seconds ?? undefined,
        retry_count: eff.retry_count ?? undefined,
        on_failure: eff.on_failure || undefined,
        condition: eff.condition ? JSON.stringify(eff.condition) : '',
        task_template_id: eff.task_template_id ?? undefined,
        sub_workflow_id: eff.sub_workflow_id ?? undefined,
      }))
    } catch { message.error('加载有效参数失败') }
  }

  const submitStepOverride = async () => {
    if (!stepOverrideForm.run_id || !stepOverrideForm.step_key) { message.warning('请填写运行 ID 和步骤 key'); return }
    const overrides: any = {}
    if (stepOverrideForm.agent_id !== undefined && stepOverrideForm.agent_id !== null && stepOverrideForm.agent_id !== '') overrides.agent_id = Number(stepOverrideForm.agent_id)
    if (stepOverrideForm.required_capabilities) overrides.required_capabilities = String(stepOverrideForm.required_capabilities).split(',').map((s: string) => s.trim()).filter(Boolean)
    if (stepOverrideForm.timeout_seconds !== undefined && stepOverrideForm.timeout_seconds !== null && stepOverrideForm.timeout_seconds !== '') overrides.timeout_seconds = Number(stepOverrideForm.timeout_seconds)
    if (stepOverrideForm.retry_count !== undefined && stepOverrideForm.retry_count !== null && stepOverrideForm.retry_count !== '') overrides.retry_count = Number(stepOverrideForm.retry_count)
    if (stepOverrideForm.on_failure) overrides.on_failure = stepOverrideForm.on_failure
    if (stepOverrideForm.condition) { try { overrides.condition = JSON.parse(stepOverrideForm.condition) } catch { message.error('condition 必须是合法 JSON'); return } }
    if (stepOverrideForm.task_template_id) overrides.task_template_id = Number(stepOverrideForm.task_template_id)
    if (stepOverrideForm.sub_workflow_id) overrides.sub_workflow_id = Number(stepOverrideForm.sub_workflow_id)
    if (Object.keys(overrides).length === 0) { message.warning('请至少填写一项覆盖参数'); return }
    try {
      const result = await agentsApi.setStepRuntimeOverride(Number(stepOverrideForm.run_id), String(stepOverrideForm.step_key), { overrides, merge: true })
      message.success('步骤运行时覆盖已应用')
      setStepEffective(result)
    } catch { message.error('应用覆盖失败') }
  }

  const clearStepOverride = async () => {
    if (!stepOverrideForm.run_id || !stepOverrideForm.step_key) return
    try {
      const result = await agentsApi.clearStepRuntimeOverride(Number(stepOverrideForm.run_id), String(stepOverrideForm.step_key))
      message.success('运行时覆盖已清除')
      setStepEffective(result)
    } catch { message.error('清除覆盖失败') }
  }

  // ---- Conflict detection & resolution ----
  const loadConflicts = async (activeOnly = true) => {
    try {
      const result = await agentsApi.listConflicts(activeOnly ? { active_only: 'true' } : {})
      setConflicts(result.items || [])
    } catch { message.error('加载冲突列表失败') }
  }

  const openConflicts = async () => {
    setConflictOpen(true)
    loadConflicts()
  }

  const scanConflicts = async () => {
    try {
      const result = await agentsApi.scanConflicts()
      message.success(result.detected > 0 ? `检测到 ${result.detected} 个新冲突` : '无新冲突')
      loadConflicts()
    } catch { message.error('扫描失败') }
  }

  const openConflictDetail = async (id: number) => {
    try {
      const result = await agentsApi.getConflict(id)
      setConflictDetail(result.conflict)
      setConflictDetailOpen(true)
    } catch { message.error('加载冲突详情失败') }
  }

  const acknowledgeConflict = async (id: number) => {
    try {
      await agentsApi.acknowledgeConflict(id)
      message.success('已确认')
      loadConflicts()
    } catch { message.error('确认失败') }
  }

  const ignoreConflict = async (id: number) => {
    try {
      await agentsApi.ignoreConflict(id)
      message.success('已忽略')
      loadConflicts()
    } catch { message.error('忽略失败') }
  }

  const openResolveConflict = (c: any) => {
    setConflictResolveForm({ conflict_id: c.id, strategy: c.suggested_strategy || 'manual', description: '' })
    setConflictResolveOpen(true)
  }

  const submitResolveConflict = async () => {
    try {
      const result = await agentsApi.resolveConflict(conflictResolveForm.conflict_id, conflictResolveForm.strategy, conflictResolveForm.description)
      message.success('冲突已解决')
      setConflictResolveOpen(false)
      loadConflicts()
      if (result.actions?.length) message.info(`执行 ${result.actions.length} 项动作`, 4)
    } catch { message.error('解决失败') }
  }

  const autoResolveConflicts = async () => {
    try {
      const result = await agentsApi.autoResolveConflicts()
      message.success(`自动解决 ${result.auto_resolved || 0} 个, 跳过 ${result.skipped || 0} 个`)
      loadConflicts()
    } catch { message.error('自动解决失败') }
  }

  // ---- Sandbox templates ----
  const openSandboxTemplates = async () => {
    try {
      const result = await agentsApi.listSandboxTemplates()
      setSandboxTemplates(result.templates || [])
      setSandboxTemplateOpen(true)
    } catch { message.error('加载模板失败') }
  }

  const instantiateTemplate = async (key: string, name: string) => {
    try {
      await agentsApi.instantiateSandboxTemplate(key, { name })
      message.success(`已从模板 "${name}" 创建沙盒`)
      setSandboxTemplateOpen(false)
      loadSandboxes()
    } catch { message.error('创建失败') }
  }

  const resolveProtocol = async (protocolId: number, resolution: string) => {
    try {
      await agentsApi.resolveProtocol(protocolId, { resolution })
      message.success(`协议已${resolution === 'accepted' ? '接受' : resolution === 'rejected' ? '拒绝' : '取消'}`)
      if (protocolDetail) openProtocolDetail(protocolDetail.id)
      loadProtocols()
    } catch { message.error('操作失败') }
  }

  const loadAssignments = async (agent: Agent, options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (!silent) {
      setSelectedAgent(agent)
      setDrawerOpen(true)
      setAssignmentLoading(true)
      loadInbox(agent)
      loadKnowledge(agent)
      loadAgentReputation(agent)
      loadExperiences(agent)
      loadAgentSandbox(agent)
      loadCollaborators(agent)
    }
    try {
      const result = await agentsApi.getAgentAssignments(agent.id, { per_page: 50 })
      setAssignments(result.items)
    } catch {
      if (!silent) message.error('加载派发记录失败')
    } finally {
      if (!silent) setAssignmentLoading(false)
    }
  }

  const loadInbox = async (agent: Agent) => {
    setInboxLoading(true)
    try {
      const result = await agentsApi.getAgentInbox(agent.id, { per_page: 20 })
      setInboxItems(result.items || [])
    } catch {
      message.error('加载收件箱失败')
    } finally {
      setInboxLoading(false)
    }
  }

  const loadNotifications = async () => {
    setNotificationsLoading(true)
    try {
      const result = await agentsApi.getNotifications({ per_page: 30 })
      setNotifications(result.items || [])
      setUnreadCount(result.unread_count || 0)
    } catch {
      // silent
    } finally {
      setNotificationsLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      await agentsApi.markNotificationsRead({ all: true })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      message.error('标记已读失败')
    }
  }

  const loadDashboardStats = async () => {
    try {
      const stats = await dashboardApi.getStats()
      setDashboardStats(stats)
    } catch {
      // silent
    }
  }

  const showClaimSuccess = (result: NonNullable<Awaited<ReturnType<typeof agentsApi.claimTask>>>) => {
    const capabilityMatch = getClaimMatch(result.run.run_metadata)
    const matchedCapabilities = toStringList(capabilityMatch?.matched_capabilities)
    const score = typeof capabilityMatch?.score === 'number' ? capabilityMatch.score : 0

    if (!capabilityMatch) {
      message.success(`已领取任务 #${result.assignment.task_id}`)
      return
    }

    const matchedText = matchedCapabilities.length > 0
      ? `，命中 ${matchedCapabilities.slice(0, 3).join(', ')}`
      : ''

    message.success(
      `已领取任务 #${result.assignment.task_id}（${matchStrategyLabel(capabilityMatch.strategy)}，分数 ${score}${matchedText}）`,
    )
  }

  const claimTask = async (agent: Agent, taskId?: number | null, matchCapabilities = true) => {
    try {
      const payload = taskId ? { task_id: taskId } : { match_capabilities: matchCapabilities }
      const result = await agentsApi.claimTask(agent.id, payload)
      if (!result) {
        message.info('当前没有可领取任务')
        return
      }
      showClaimSuccess(result)
      setClaimTaskId(null)
      loadAgents()
      loadReviewQueue()
      if (drawerOpen) {
        loadAssignments(agent)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '领取任务失败')
    }
  }

  const updateDispatchPreviewOptions = (patch: Partial<DispatchTasksData>) => {
    setDispatchPreviewOptions(prev => ({
      ...prev,
      ...patch,
    }))
    setDispatchPolicyDirty(true)
    setDispatchPreview(null)
  }

  const dispatchTasks = async (agent: Agent, options: DispatchTasksData = {}) => {
    try {
      const result = await agentsApi.dispatchTasks(agent.id, normalizeDispatchOptions(options))
      const { dispatched, claimable_tasks, available_agents } = result.summary
      if (dispatched === 0) {
        message.info(
          available_agents === 0
            ? '没有空闲的可派活 Agent'
            : claimable_tasks === 0
              ? '当前没有待派发的任务'
              : '没有可派发的任务（可能均无匹配 Agent）',
        )
      } else {
        const detail = result.assignments
          .slice(0, 3)
          .map((item) => `#${item.assignment.task_id}→${item.agent?.name || `Agent ${item.assignment.agent_id}`}`)
          .join('，')
        message.success(
          `协调器 ${result.coordinator.name} 派发 ${dispatched}/${claimable_tasks} 个任务给 ${available_agents} 个空闲 Agent${detail ? `：${detail}` : ''}`,
        )
      }
      loadAgents()
      loadReviewQueue()
      if (drawerOpen) {
        loadAssignments(agent)
      }
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : '自动派活失败')
      return false
    }
  }

  const previewDispatchTasks = async (agent: Agent, options?: DispatchTasksData) => {
    const hasExplicitOptions = !!options
    let nextOptions = options || getAgentDispatchPolicy(agent)
    setDispatchPreviewOptions(nextOptions)
    setDispatchPreviewAgent(agent)
    setDispatchPreviewOpen(true)
    setDispatchPreviewLoading(true)
    setDispatchPreview(null)
    try {
      if (!hasExplicitOptions) {
        const { policy } = await agentsApi.getDispatchPolicy(agent.id)
        nextOptions = policy
        const agentWithLatestPolicy = withAgentDispatchPolicy(agent, policy)
        setDispatchPreviewAgent(agentWithLatestPolicy)
        setDispatchPreviewOptions(nextOptions)
        setDispatchPolicyDirty(false)
        setAgents(prev => prev.map(item => item.id === agent.id ? agentWithLatestPolicy : item))
      }
      const result = await agentsApi.previewDispatchTasks(agent.id, normalizeDispatchOptions(nextOptions))
      setDispatchPreview(result)
      setDispatchPreviewOptions(result.options || nextOptions)
      if (!hasExplicitOptions) {
        setDispatchPolicyDirty(false)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '派活预览失败')
    } finally {
      setDispatchPreviewLoading(false)
    }
  }

  const saveDispatchPolicy = async () => {
    if (!dispatchPreviewAgent) {
      return
    }

    setDispatchPolicySaving(true)
    try {
      const result = await agentsApi.updateDispatchPolicy(
        dispatchPreviewAgent.id,
        normalizeDispatchPolicyPayload(dispatchPreviewOptions),
      )
      setDispatchPreviewAgent(result.coordinator)
      setDispatchPreviewOptions(result.policy)
      setDispatchPolicyDirty(false)
      setAgents(prev => prev.map(agent => agent.id === result.coordinator.id ? result.coordinator : agent))
      message.success('派活策略已保存')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存派活策略失败')
    } finally {
      setDispatchPolicySaving(false)
    }
  }

  const applyDispatchPreview = async () => {
    if (!dispatchPreviewAgent) {
      return
    }

    setDispatchPreviewApplying(true)
    try {
      const dispatched = await dispatchTasks(dispatchPreviewAgent, dispatchPreviewOptions)
      if (dispatched) {
        setDispatchPreviewOpen(false)
        setDispatchPreview(null)
      }
    } finally {
      setDispatchPreviewApplying(false)
    }
  }

  const updateAssignmentState = async (assignment: TaskAssignment, state: TaskAssignmentState) => {
    if (!selectedAgent) {
      return
    }

    try {
      await agentsApi.updateAssignment(selectedAgent.id, assignment.id, { state })
      message.success('派发状态已更新')
      loadAssignments(selectedAgent)
      loadAgents()
      loadReviewQueue()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新派发状态失败')
    }
  }

  const updateReviewQueueItem = async (
    item: ReviewQueueItem,
    action: 'approve' | 'resume' | 'cancel',
  ) => {
    if (action === 'resume' && item.action === 'human_feedback') {
      setFeedbackReviewItem(item)
      feedbackForm.setFieldsValue({
        feedback_content: '',
      })
      setFeedbackModalOpen(true)
      return
    }

    const taskId = item.assignment.task_id
    const assignmentId = item.assignment.id

    try {
      if (action === 'approve') {
        await agentsApi.updateTaskAssignment(taskId, assignmentId, {
          state: 'done',
          progress_rate: 100,
          task_status: 'done',
        })
        message.success('任务已审核完成')
      } else if (action === 'resume') {
        await agentsApi.updateTaskAssignment(taskId, assignmentId, {
          state: 'running',
          task_status: 'in_progress',
        })
        message.success('已退回 Agent 继续执行')
      } else {
        await agentsApi.updateTaskAssignment(taskId, assignmentId, {
          state: 'cancelled',
          task_status: 'cancelled',
        })
        message.success('派发已取消')
      }

      loadReviewQueue()
      loadAgents()
      if (selectedAgent && selectedAgent.id === item.assignment.agent_id) {
        loadAssignments(selectedAgent)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新审核队列失败')
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

  const columns = [
    {
      title: 'Agent',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Agent) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Text strong>{record.name}</Text>
            <Tag color={statusColor[record.status]}>{record.status}</Tag>
          </Space>
          <Text type="secondary">
            {record.description || `${record.provider || 'runtime'} ${record.model || ''}`.trim() || '未配置描述'}
          </Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'kind',
      key: 'kind',
      width: 110,
      render: (kind: AgentKind) => <Tag>{kind}</Tag>,
    },
    {
      title: '协作角色',
      dataIndex: 'collaboration_role',
      key: 'collaboration_role',
      width: 100,
      render: (role: string) => {
        const roleMap: Record<string, { color: string; label: string }> = {
          leader: { color: 'gold', label: '领导者' },
          follower: { color: 'blue', label: '跟随者' },
          standalone: { color: 'default', label: '独立' },
        }
        const info = roleMap[role || 'standalone'] || roleMap.standalone
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: '能力',
      dataIndex: 'capabilities',
      key: 'capabilities',
      render: (capabilities: string[], record: Agent) => (
        <Tooltip
          title={capabilities.length >= 3 ? <CapabilityRadar capabilities={capabilities} size={140} /> : undefined}
          overlayStyle={{ maxWidth: 'none' }}
        >
          <div>{renderCapabilities(capabilities)}</div>
        </Tooltip>
      ),
    },
    {
      title: '派发',
      dataIndex: ['stats', 'active_assignments'],
      key: 'active_assignments',
      width: 120,
      render: (_: number, record: Agent) => (
        <Space direction="vertical" size={0}>
          <Text>{record.stats?.active_assignments || 0} 活跃</Text>
          <Text type="secondary">{record.stats?.total_runs || 0} 次运行</Text>
        </Space>
      ),
    },
    {
      title: '在线状态',
      dataIndex: 'last_seen_at',
      key: 'online_status',
      width: 180,
      render: (val: string | undefined, record: Agent) => {
        const ONLINE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes
        const WARN_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes
        const lastSeen = val ? new Date(val).getTime() : 0
        const now = Date.now()
        const elapsed = now - lastSeen

        if (record.status === 'offline' || !val) {
          return <Space><Badge status="default" /><span style={{ color: '#999' }}>离线</span></Space>
        }
        if (elapsed < WARN_THRESHOLD_MS) {
          return <Space><Badge status="success" /><span style={{ color: '#52c41a' }}>在线</span></Space>
        }
        if (elapsed < ONLINE_THRESHOLD_MS) {
          const mins = Math.floor(elapsed / 60000)
          return <Space><Badge status="warning" /><span style={{ color: '#faad14' }}>{mins}分钟前</span></Space>
        }
        return <Space><Badge status="error" /><span style={{ color: '#ff4d4f' }}>超时</span></Space>
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 430,
      render: (_: unknown, record: Agent) => (
        <Space size="small" wrap>
          <Tooltip title="记录一次在线心跳">
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => heartbeat(record)}>
              心跳
            </Button>
          </Tooltip>
          {record.kind === 'coordinator' ? (
            <>
              <Tooltip title="先查看待办任务与空闲 Agent 的匹配计划">
                <Button size="small" icon={<SearchOutlined />} onClick={() => previewDispatchTasks(record)}>
                  预览派活
                </Button>
              </Tooltip>
              <Tooltip title="作为协调器，把待办任务按能力匹配自动分派给空闲 Agent">
                <Button size="small" type="primary" icon={<DeploymentUnitOutlined />} onClick={() => dispatchTasks(record)}>
                  自动派活
                </Button>
              </Tooltip>
            </>
          ) : (
            <>
              <Button size="small" icon={<PlayCircleOutlined />} onClick={() => claimTask(record, null, true)}>
                智能领取
              </Button>
              <Tooltip title="查看与此 Agent 能力匹配的待办任务">
                <Button size="small" icon={<BulbOutlined />} onClick={() => loadRecommendedTasks(record)}>
                  推荐
                </Button>
              </Tooltip>
              <Button size="small" onClick={() => claimTask(record, null, false)}>
                优先级领取
              </Button>
            </>
          )}
          <Button size="small" icon={<ApiOutlined />} onClick={() => loadAssignments(record)}>
            派发
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Tooltip title="向所有活跃 Agent 发送广播消息">
            <Button size="small" icon={<SoundOutlined />} onClick={() => { setBroadcastAgent(record); setBroadcastOpen(true); setBroadcastContent('') }}>
              广播
            </Button>
          </Tooltip>
          <Tooltip title="向指定 Agent 发送直接消息">
            <Button size="small" icon={<SendOutlined />} onClick={() => { setDmFrom(record); setDmTo(null); setDmOpen(true); setDmContent('') }}>
              消息
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const assignmentColumns = [
    {
      title: '任务',
      dataIndex: 'task',
      key: 'task',
      render: (_: unknown, record: TaskAssignment) => (
        <Space direction="vertical" size={2}>
          <Text strong>#{record.task_id} {record.task?.title || '未加载任务标题'}</Text>
          <Text type="secondary">{record.task?.project?.name || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      width: 120,
      render: (state: TaskAssignmentState) => <Tag color={stateColor[state]}>{state}</Tag>,
    },
    {
      title: '进度',
      dataIndex: 'progress_rate',
      key: 'progress_rate',
      width: 130,
      render: (progress: number) => <Progress percent={progress || 0} size="small" />,
    },
    {
      title: '租约到期',
      dataIndex: 'lease_expires_at',
      key: 'lease_expires_at',
      width: 190,
      render: formatDateTime,
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      render: (_: unknown, record: TaskAssignment) => (
        <Space size="small" wrap>
          <Button size="small" onClick={() => updateAssignmentState(record, 'running')}>运行</Button>
          <Button size="small" onClick={() => updateAssignmentState(record, 'waiting_human')}>等人</Button>
          <Button size="small" icon={<CheckCircleOutlined />} onClick={() => updateAssignmentState(record, 'done')}>
            完成
          </Button>
          <Button size="small" danger onClick={() => updateAssignmentState(record, 'failed')}>失败</Button>
        </Space>
      ),
    },
  ]

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
