import React, { useCallback, useEffect, useState } from 'react'
import { useCollaborationSSE } from '../hooks/useCollaborationSSE'
import {
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
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
  Empty,
  List,
  Spin,
  Popconfirm,
  Descriptions,
  Alert,
  Checkbox,
  notification,
} from 'antd'
import {
  ApiOutlined,
  BellOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  EditOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  SendOutlined,
  BulbOutlined,
  TeamOutlined,
  AppstoreOutlined,
  RocketOutlined,
  BookOutlined,
  SwapOutlined,
  ShareAltOutlined,
  ApartmentOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  MessageOutlined,
  SafetyOutlined,
  SettingOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  agentsApi,
  projectsApi,
  type Agent,
  type AgentKind,
  type AgentStatus,
  type ReviewQueueAction,
  type ReviewQueueItem,
  type TaskAssignment,
  type TaskAssignmentState,
  type TaskEvent,
  type NotificationItem,
} from '../api/agents'
import CapabilityRadar from '../components/Agent/CapabilityRadar'
import { dashboardApi, type DashboardStats } from '../api/dashboard'

const { Title, Text } = Typography
const { TextArea } = Input

const statusColor: Record<AgentStatus, string> = {
  active: 'green',
  paused: 'gold',
  offline: 'default',
  disabled: 'red',
}

const stateColor: Record<TaskAssignmentState, string> = {
  assigned: 'blue',
  claimed: 'cyan',
  running: 'processing',
  waiting_human: 'gold',
  review: 'purple',
  done: 'green',
  failed: 'red',
  cancelled: 'default',
  expired: 'default',
}

const kindOptions: { label: string; value: AgentKind }[] = [
  { label: '助手', value: 'assistant' },
  { label: '自主执行', value: 'autonomous' },
  { label: '协调器', value: 'coordinator' },
  { label: '外部系统', value: 'external' },
]

const statusOptions: { label: string; value: AgentStatus }[] = [
  { label: '活跃', value: 'active' },
  { label: '暂停', value: 'paused' },
  { label: '离线', value: 'offline' },
  { label: '禁用', value: 'disabled' },
]

const reviewActionOptions: { label: string; value: ReviewQueueAction }[] = [
  { label: '全部待处理', value: 'all' },
  { label: '等待反馈', value: 'human_feedback' },
  { label: '最终审核', value: 'final_review' },
]

const reviewActionLabel: Record<ReviewQueueItem['action'], string> = {
  human_feedback: '等待人工反馈',
  final_review: '最终审核',
  review: '需要审核',
}

const reviewActionColor: Record<ReviewQueueItem['action'], string> = {
  human_feedback: 'gold',
  final_review: 'purple',
  review: 'blue',
}

// Agent 预设模板
const AGENT_TEMPLATES: Record<string, {
  label: string
  name: string
  description: string
  kind: AgentKind
  capabilities: string[]
  provider: string
  model: string
}> = {
  code_reviewer: {
    label: '🔍 代码审查 Agent',
    name: 'Code Reviewer',
    description: '自动审查代码变更，检查风格、安全漏洞和最佳实践',
    kind: 'assistant',
    capabilities: ['code_review', 'security', 'best_practices', 'style_guide'],
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
  },
  test_runner: {
    label: '🧪 测试 Agent',
    name: 'Test Runner',
    description: '编写和执行单元测试、集成测试，报告覆盖率',
    kind: 'autonomous',
    capabilities: ['testing', 'unit_test', 'integration_test', 'coverage'],
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
  },
  doc_writer: {
    label: '📝 文档 Agent',
    name: 'Doc Writer',
    description: '生成 API 文档、README 和使用指南',
    kind: 'assistant',
    capabilities: ['documentation', 'api_docs', 'readme', 'markdown'],
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
  },
  coordinator: {
    label: '🎯 协调器 Agent',
    name: 'Coordinator',
    description: '管理任务分配、监控 Agent 状态、自动派活',
    kind: 'coordinator',
    capabilities: ['coordination', 'dispatch', 'monitoring', 'planning'],
    provider: '',
    model: '',
  },
  devops: {
    label: '🚀 DevOps Agent',
    name: 'DevOps Runner',
    description: '执行 CI/CD 流水线、部署、监控和告警',
    kind: 'autonomous',
    capabilities: ['devops', 'ci_cd', 'deployment', 'monitoring', 'infra'],
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
  },
}

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString()
}

const parseLines = (value?: string) => {
  return (value || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}

const stringifyConfig = (agent?: Agent | null) => {
  if (!agent?.config || Object.keys(agent.config).length === 0) {
    return '{}'
  }
  return JSON.stringify(agent.config, null, 2)
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(item => String(item)).filter(Boolean)
}

const matchStrategyLabel = (strategy: unknown) => {
  if (strategy === 'capability_match') {
    return '能力匹配'
  }
  if (strategy === 'priority_fifo') {
    return '优先级队列'
  }
  return strategy ? String(strategy) : '指定任务'
}

const getClaimMatch = (runMetadata?: Record<string, unknown>) => {
  const capabilityMatch = runMetadata?.capability_match
  return isRecord(capabilityMatch) ? capabilityMatch : null
}

const renderCapabilities = (capabilities: string[] = [], limit = 4) => {
  if (capabilities.length === 0) {
    return <Text type="secondary">未配置</Text>
  }

  const visibleCapabilities = capabilities.slice(0, limit)
  const hiddenCapabilities = capabilities.slice(limit)

  return (
    <Space wrap size={[4, 4]}>
      {visibleCapabilities.map(capability => (
        <Tag key={capability}>{capability}</Tag>
      ))}
      {hiddenCapabilities.length > 0 && (
        <Tooltip title={hiddenCapabilities.join(', ')}>
          <Tag>+{hiddenCapabilities.length}</Tag>
        </Tooltip>
      )}
    </Space>
  )
}

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
  // Reputation
  const [agentReputation, setAgentReputation] = useState<any>(null)
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

  // 自动 dispatch：每 60s 对所有活跃 coordinator 自动触发派活
  useEffect(() => {
    if (!liveMode) return
    const timer = window.setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      const coordinators = agents.filter(a => a.kind === 'coordinator' && a.status === 'active')
      for (const coord of coordinators) {
        try {
          await agentsApi.dispatchTasks(coord.id, { max_assignments: 5 })
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
  const [sharedExperiencesLoading, setSharedExperiencesLoading] = useState(false)

  const loadExperiences = async (agent: Agent) => {
    setExperiencesLoading(true)
    try {
      const data = await agentsApi.listAgentExperiences(agent.id)
      setExperiences(data?.data?.items || data?.items || (Array.isArray(data?.data) ? data.data : []))
    } catch { message.error('加载经验失败') }
    finally { setExperiencesLoading(false) }
  }

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
      const data = await agentsApi.listSharedExperiences(selectedAgent.id)
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
      const data = await agentsApi.listAgentCrossProjects(agent.id)
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
      const data = await agentsApi.findCrossProjectTasks(selectedAgent.id)
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

  const dispatchTasks = async (agent: Agent) => {
    try {
      const result = await agentsApi.dispatchTasks(agent.id, {})
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
    } catch (error) {
      message.error(error instanceof Error ? error.message : '自动派活失败')
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

  const reviewQueueColumns = [
    {
      title: '任务',
      key: 'task',
      render: (_: unknown, record: ReviewQueueItem) => (
        <Space direction="vertical" size={2}>
          <Text strong>#{record.assignment.task_id} {record.task?.title || record.assignment.task?.title || '未加载任务标题'}</Text>
          <Text type="secondary">{record.task?.project?.name || record.assignment.task?.project?.name || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Agent',
      key: 'agent',
      width: 180,
      render: (_: unknown, record: ReviewQueueItem) => (
        <Space direction="vertical" size={2}>
          <Text>{record.agent?.name || record.assignment.agent?.name || `Agent #${record.assignment.agent_id}`}</Text>
          <Text type="secondary">{record.agent?.model || record.agent?.kind || record.assignment.agent?.kind || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '处理类型',
      dataIndex: 'action',
      key: 'action',
      width: 130,
      render: (action: ReviewQueueItem['action']) => (
        <Tag color={reviewActionColor[action]}>{reviewActionLabel[action]}</Tag>
      ),
    },
    {
      title: '派发状态',
      key: 'state',
      width: 120,
      render: (_: unknown, record: ReviewQueueItem) => (
        <Tag color={stateColor[record.assignment.state]}>{record.assignment.state}</Tag>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 130,
      render: (_: unknown, record: ReviewQueueItem) => (
        <Progress percent={record.assignment.progress_rate || 0} size="small" />
      ),
    },
    {
      title: '更新时间',
      key: 'updated_at',
      width: 190,
      render: (_: unknown, record: ReviewQueueItem) => formatDateTime(record.assignment.updated_at),
    },
    {
      title: '操作',
      key: 'actions',
      width: 300,
      render: (_: unknown, record: ReviewQueueItem) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} href={`/todo-for-ai/pages/tasks/${record.assignment.task_id}`}>
            详情
          </Button>
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => updateReviewQueueItem(record, 'approve')}>
            通过
          </Button>
          <Button size="small" onClick={() => updateReviewQueueItem(record, 'resume')}>
            继续
          </Button>
          <Button size="small" danger onClick={() => updateReviewQueueItem(record, 'cancel')}>
            取消
          </Button>
        </Space>
      ),
    },
  ]

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
            <Tooltip title="作为协调器，把待办任务按能力匹配自动分派给空闲 Agent">
              <Button size="small" type="primary" icon={<DeploymentUnitOutlined />} onClick={() => dispatchTasks(record)}>
                自动派活
              </Button>
            </Tooltip>
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
          <Popover
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>协作通知</span>
                {unreadCount > 0 && (
                  <Button size="small" type="link" onClick={markAllRead}>全部已读</Button>
                )}
              </div>
            }
            content={
              <div style={{ maxWidth: 360, maxHeight: 400, overflow: 'auto' }}>
                {notificationsLoading && <Text type="secondary">加载中…</Text>}
                {!notificationsLoading && notifications.length === 0 && (
                  <Text type="secondary">暂无通知</Text>
                )}
                {notifications.map(n => (
                  <div
                    key={n.id}
                    style={{
                      padding: '6px 8px',
                      borderBottom: '1px solid #f0f0f0',
                      background: n.is_read ? 'transparent' : '#f6ffed',
                      borderRadius: 4,
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Tag color="blue" style={{ margin: 0 }}>{n.event_type}</Tag>
                      {!n.is_read && <Tag color="green" style={{ margin: 0, fontSize: 10 }}>新</Tag>}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13 }}>
                      {n.agent_name && <Text strong>{n.agent_name}</Text>}
                      {n.task_title && <Text type="secondary"> — {n.task_title}</Text>}
                      {!n.task_title && n.task_id && <Text type="secondary"> — 任务 #{n.task_id}</Text>}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            }
            trigger="click"
            onOpenChange={(open) => { if (open) loadNotifications() }}
          >
            <Badge count={unreadCount} size="small" offset={[-4, 4]}>
              <Button icon={<BellOutlined />} shape="circle" size="small" />
            </Badge>
          </Popover>
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

      <Card style={{ marginBottom: 16 }} size="small">
        <Row gutter={16}>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <DashboardOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600 }}>{agents.length}</div>
              <Text type="secondary">Agent 总数</Text>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
              <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                {agents.filter(a => a.status === 'active').length}
              </div>
              <Text type="secondary">在线</Text>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <DeploymentUnitOutlined style={{ fontSize: 20, color: '#722ed1' }} />
              <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#722ed1' }}>
                {agents.filter(a => a.kind === 'coordinator' && a.status === 'active').length}
              </div>
              <Text type="secondary">协调器</Text>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <PlayCircleOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
              <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>
                {agents.filter(a => a.stats?.active_assignments && a.stats.active_assignments > 0).length}
              </div>
              <Text type="secondary">执行中</Text>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <BellOutlined style={{ fontSize: 20, color: '#eb2f96' }} />
              <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#eb2f96' }}>
                {reviewQueue.length}
              </div>
              <Text type="secondary">待审核</Text>
            </div>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'center' }}>
              <ThunderboltOutlined style={{ fontSize: 20, color: '#13c2c2' }} />
              <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#13c2c2' }}>
                {agents.filter(a => a.status === 'offline').length}
              </div>
              <Text type="secondary">离线</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {(() => {
        // 能力图谱：聚合所有 Agent 的能力标签，统计每个能力有多少 Agent 具备
        const capMap = new Map<string, { count: number; agents: string[] }>()
        agents.forEach(agent => {
          (agent.capabilities || []).forEach(cap => {
            const key = cap.trim().toLowerCase()
            if (!key) return
            const entry = capMap.get(key) || { count: 0, agents: [] }
            entry.count++
            if (entry.agents.length < 3) entry.agents.push(agent.name)
            capMap.set(key, entry)
          })
        })
        const sorted = [...capMap.entries()].sort((a, b) => b[1].count - a[1].count)
        if (sorted.length === 0) return null
        return (
          <Card title="能力图谱" size="small" style={{ marginBottom: 16 }}>
            <Space size={[8, 8]} wrap>
              {sorted.map(([cap, info]) => (
                <Tag
                  key={cap}
                  color={info.count >= 3 ? 'green' : info.count >= 2 ? 'blue' : 'default'}
                  style={{ fontSize: 13, padding: '2px 8px' }}
                >
                  {cap} <Text type="secondary" style={{ fontSize: 11 }}>(×{info.count})</Text>
                </Tag>
              ))}
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {sorted.length} 项能力，{agents.filter(a => (a.capabilities || []).length > 0).length}/{agents.length} 个 Agent 已标注能力
              </Text>
            </div>
          </Card>
        )
      })()}

      {/* 任务分布统计 */}
      {dashboardStats && (
        <Card title="任务分布" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 600 }}>{dashboardStats.tasks.total}</div>
                <Text type="secondary">任务总数</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a' }}>{dashboardStats.tasks.done}</div>
                <Text type="secondary">已完成</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#1890ff' }}>
                  {dashboardStats.tasks.total > 0
                    ? Math.round((dashboardStats.tasks.done / dashboardStats.tasks.total) * 100)
                    : 0}%
                </div>
                <Text type="secondary">完成率</Text>
              </div>
            </Col>
          </Row>
          <Divider style={{ margin: '12px 0' }} />
          <Space size={[8, 8]} wrap>
            <Tag color="default">待办 {dashboardStats.tasks.todo}</Tag>
            <Tag color="blue">进行中 {dashboardStats.tasks.in_progress}</Tag>
            <Tag color="purple">待审核 {dashboardStats.tasks.review}</Tag>
            <Tag color="green">已完成 {dashboardStats.tasks.done}</Tag>
            {dashboardStats.tasks.ai_executing > 0 && (
              <Tag color="geekblue">AI 执行中 {dashboardStats.tasks.ai_executing}</Tag>
            )}
          </Space>
          {dashboardStats.agent_collaboration && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>协作派发：</Text>
              <Space size={[8, 8]} wrap style={{ marginTop: 4 }}>
                <Tag color="processing">活跃 {dashboardStats.agent_collaboration.assignments.active}</Tag>
                <Tag color="gold">等人工 {dashboardStats.agent_collaboration.assignments.waiting_human}</Tag>
                <Tag color="purple">审核 {dashboardStats.agent_collaboration.assignments.review}</Tag>
                {dashboardStats.agent_collaboration.assignments.expired_leases > 0 && (
                  <Tag color="red">过期 {dashboardStats.agent_collaboration.assignments.expired_leases}</Tag>
                )}
              </Space>
            </>
          )}
        </Card>
      )}

      {/* 维护操作 */}
      <Card title="维护操作" size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={async () => {
              try {
                const result = await agentsApi.escalateOverdueTasks()
                message.success(`已提升 ${result.escalated_count} 个逾期任务优先级`)
              } catch {
                message.error('提升逾期任务优先级失败')
              }
            }}
          >
            提升逾期任务优先级
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={async () => {
              try {
                const result = await agentsApi.healthCheck()
                message.success(
                  `健康检查完成: ${result.stale_agents} 个离线 Agent, ${result.expired_leases} 个过期租约, ${result.escalated_tasks} 个提升任务`
                )
                loadDashboardStats()
              } catch {
                message.error('健康检查失败')
              }
            }}
          >
            执行健康检查
          </Button>
        </Space>
      </Card>

      {/* 实时协作事件流 */}
      {liveMode && liveEvents.length > 0 && (
        <Card
          title={
            <Space>
              <Badge dot color="#52c41a" />
              实时协作事件
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
          extra={<Button size="small" onClick={() => setLiveEvents([])}>清空</Button>}
        >
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {liveEvents.map((ev, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <Space size={4}>
                  <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{ev.type}</Tag>
                  <span>
                    {ev.payload?.from_agent?.name && <Text type="secondary">{ev.payload.from_agent.name}</Text>}
                    {ev.payload?.to_agent?.name && <Text type="secondary"> → {ev.payload.to_agent.name}</Text>}
                    {ev.payload?.content && <Text>{String(ev.payload.content).slice(0, 60)}</Text>}
                    {ev.payload?.task_id && <Tag style={{ fontSize: 10, margin: 0 }}>#{ev.payload.task_id}</Tag>}
                  </span>
                </Space>
                <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
                  {new Date(ev.time).toLocaleTimeString()}
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card
        title="人工审核队列"
        style={{ marginBottom: 16 }}
        extra={(
          <Space>
            <Select
              value={reviewActionFilter}
              style={{ width: 140 }}
              onChange={setReviewActionFilter}
              options={reviewActionOptions}
            />
            <Button icon={<ReloadOutlined />} onClick={() => loadReviewQueue()}>刷新</Button>
          </Space>
        )}
      >
        <Table
          columns={reviewQueueColumns}
          dataSource={reviewQueue}
          rowKey={record => record.assignment.id}
          loading={reviewLoading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

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

      <Modal
        title={editingAgent ? '编辑 Agent' : '注册 Agent'}
        open={modalOpen}
        onOk={saveAgent}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={720}
      >
        {!editingAgent && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>从模板快速创建：</Text>
            <Space wrap>
              {Object.entries(AGENT_TEMPLATES).map(([key, tpl]) => (
                <Button
                  key={key}
                  size="small"
                  onClick={() => {
                    form.setFieldsValue({
                      name: tpl.name,
                      description: tpl.description,
                      kind: tpl.kind,
                      provider: tpl.provider,
                      model: tpl.model,
                      capabilitiesText: tpl.capabilities.join('\n'),
                    })
                  }}
                >
                  {tpl.label}
                </Button>
              ))}
            </Space>
            <Divider style={{ margin: '12px 0' }} />
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如 Claude Code Worker" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="kind" label="类型" style={{ width: 180 }}>
              <Select options={kindOptions} />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ width: 180 }}>
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="collaboration_role" label="协作角色" style={{ width: 180 }}>
              <Select
                placeholder="选择协作角色"
                allowClear
                options={[
                  { value: 'standalone', label: '独立' },
                  { value: 'leader', label: '领导者（协调分配）' },
                  { value: 'follower', label: '跟随者（执行任务）' },
                ]}
              />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="provider" label="提供方" style={{ width: 140 }}>
              <Input placeholder="openai" />
            </Form.Item>
            <Form.Item name="model" label="模型/运行时" style={{ width: 180 }}>
              <Input placeholder="gpt-5-codex" />
            </Form.Item>
          </Space>
          <Form.Item name="capabilitiesText" label="能力标签">
            <TextArea rows={3} placeholder={'每行一个能力，例如：\ncode_review\nfrontend\npython'} />
          </Form.Item>
          <Form.Item name="configText" label="运行配置 JSON">
            <TextArea rows={5} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交人工反馈"
        open={feedbackModalOpen}
        onOk={submitHumanFeedback}
        onCancel={() => {
          setFeedbackModalOpen(false)
          setFeedbackReviewItem(null)
          feedbackForm.resetFields()
        }}
        confirmLoading={feedbackSubmitting}
        okText="提交并继续"
        cancelText="取消"
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {feedbackReviewItem && (
            <Space direction="vertical" size={2}>
              <Text strong>
                #{feedbackReviewItem.assignment.task_id} {feedbackReviewItem.task?.title || feedbackReviewItem.assignment.task?.title || '未加载任务标题'}
              </Text>
              <Text type="secondary">
                {feedbackReviewItem.agent?.name || feedbackReviewItem.assignment.agent?.name || `Agent #${feedbackReviewItem.assignment.agent_id}`}
              </Text>
            </Space>
          )}
          <Form form={feedbackForm} layout="vertical">
            <Form.Item
              name="feedback_content"
              label="反馈内容"
              rules={[{ required: true, message: '请输入要交给 Agent 的反馈或补充信息' }]}
            >
              <TextArea rows={5} placeholder="说明需要调整的方向、补充约束或继续执行所需的信息" />
            </Form.Item>
          </Form>
        </Space>
      </Modal>

      <Drawer
        title={selectedAgent ? `${selectedAgent.name} 的派发记录` : '派发记录'}
        width={980}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedAgent && (
          <Space direction="vertical" size={12} style={{ marginBottom: 16, width: '100%' }}>
            {/* Agent status & capabilities overview */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Space wrap style={{ marginBottom: 8 }}>
                  <Tag color={selectedAgent.status === 'active' ? 'green' : selectedAgent.status === 'paused' ? 'orange' : 'default'}>
                    {selectedAgent.status}
                  </Tag>
                  <Tag>{selectedAgent.kind}</Tag>
                  {selectedAgent.collaboration_role && selectedAgent.collaboration_role !== 'standalone' && (
                    <Tag color={selectedAgent.collaboration_role === 'leader' ? 'gold' : 'cyan'}>
                      {selectedAgent.collaboration_role === 'leader' ? '领导者' : '跟随者'}
                    </Tag>
                  )}
                  {selectedAgent.last_seen_at && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      最近心跳: {new Date(selectedAgent.last_seen_at).toLocaleString()}
                    </Text>
                  )}
                  {agentReputation && (
                    <Tag color={agentReputation.score >= 70 ? 'green' : agentReputation.score >= 40 ? 'orange' : 'red'} style={{ cursor: 'pointer' }} onClick={recalculateReputation}>
                      声誉: {agentReputation.score.toFixed(1)} ({agentReputation.completed_tasks || 0}✓ {agentReputation.failed_tasks || 0}✗)
                    </Tag>
                  )}
                  {agentSandbox ? (
                    <Tag color={agentSandbox.security_level === 'strict' ? 'red' : agentSandbox.security_level === 'permissive' ? 'green' : 'orange'} icon={<SafetyOutlined />} style={{ cursor: 'pointer' }} onClick={openSandboxes}>
                      沙盒: {agentSandbox.name} [{agentSandbox.security_level}] 执行={agentSandbox.stats?.total_executions || 0} 违规={agentSandbox.stats?.violations || 0}
                    </Tag>
                  ) : (
                    <Tag onClick={openSandboxes} style={{ cursor: 'pointer' }}>未绑定沙盒</Tag>
                  )}
                </Space>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {renderCapabilities(selectedAgent.capabilities, 12)}
                </div>
              </div>
              {(selectedAgent.capabilities || []).length >= 3 && (
                <CapabilityRadar capabilities={selectedAgent.capabilities || []} size={140} />
              )}
            </div>
            <Space wrap>
              <Text type="secondary">能力</Text>
              {renderCapabilities(selectedAgent.capabilities, 8)}
              <Button size="small" icon={<BulbOutlined />} onClick={() => loadAdaptSuggestions(selectedAgent)} loading={adaptLoading}>自适应</Button>
            </Space>
            <Space wrap>
              <InputNumber
                placeholder="指定任务 ID"
                value={claimTaskId}
                onChange={value => setClaimTaskId(value)}
                min={1}
                style={{ width: 160 }}
              />
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                disabled={!claimTaskId}
                onClick={() => claimTask(selectedAgent, claimTaskId)}
              >
                指定领取
              </Button>
              <Button icon={<PlayCircleOutlined />} onClick={() => claimTask(selectedAgent, null, true)}>
                智能领取
              </Button>
              <Button onClick={() => claimTask(selectedAgent, null, false)}>
                优先级领取
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => loadAssignments(selectedAgent)}>
                刷新
              </Button>
            </Space>
          </Space>
        )}
        {selectedAgent && inboxItems.length > 0 && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
              <Space>
                <BellOutlined />
                <Text>收件箱（@提及）</Text>
                <Tag color="blue">{inboxItems.length}</Tag>
              </Space>
            </Divider>
            <div style={{ maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
              {inboxItems.map(event => (
                <div key={event.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Space size={8} wrap>
                    <Tag color="geekblue">{event.event_type}</Tag>
                    <Text type="secondary">
                      {event.actor_agent?.name || event.actor_user?.name || event.actor_type}
                    </Text>
                    {event.payload?.content && <Text>{String(event.payload.content).slice(0, 120)}</Text>}
                    {(event.payload as Record<string, any>)?.task?.title && <Tag>任务 #{event.task_id} {String((event.payload as Record<string, any>).task.title).slice(0, 30)}</Tag>}
                  </Space>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(event.created_at).toLocaleString()}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <Table
          columns={assignmentColumns}
          dataSource={assignments}
          rowKey="id"
          loading={assignmentLoading}
          pagination={{ pageSize: 10 }}
        />

        {/* Knowledge Base */}
        {selectedAgent && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
              <Space>
                <BookOutlined />
                <Text>知识库</Text>
                <Tag color="blue">{knowledgeEntries.length}</Tag>
              </Space>
            </Divider>
            <Space style={{ marginBottom: 8, width: '100%' }} wrap>
              <Input.Search
                placeholder="搜索知识..."
                value={knowledgeSearch}
                onChange={e => setKnowledgeSearch(e.target.value)}
                onSearch={() => selectedAgent && loadKnowledge(selectedAgent)}
                style={{ width: 200 }}
                allowClear
              />
              <Button icon={<PlusOutlined />} onClick={() => setKnowledgeCreateOpen(true)}>添加知识</Button>
              <Button icon={<ThunderboltOutlined />} onClick={autoExtractKnowledge}>自动提取</Button>
            </Space>
            <Spin spinning={knowledgeLoading}>
              {knowledgeEntries.length === 0 && !knowledgeLoading ? (
                <Empty description="暂无知识条目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  size="small"
                  dataSource={knowledgeEntries}
                  style={{ maxHeight: 300, overflowY: 'auto' }}
                  renderItem={(entry: any) => (
                    <List.Item
                      style={{ cursor: 'pointer', padding: '6px 8px' }}
                      actions={[
                        <Popconfirm key="del" title="确定删除？" onConfirm={() => deleteKnowledgeEntry(entry.id)}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>,
                      ]}
                      onClick={() => openKnowledgeDetail(entry)}
                    >
                      <List.Item.Meta
                        title={<Space><Text strong>{entry.title}</Text> {entry.entry_type && <Tag>{entry.entry_type}</Tag>} {entry.domain && <Tag color="blue">{entry.domain}</Tag>}</Space>}
                        description={
                          <Space size={4}>
                            <Text type="secondary" style={{ fontSize: 11 }}>置信度: {entry.confidence ?? 1.0}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>访问: {entry.access_count || 0}</Text>
                            {entry.tags && (entry.tags as string[]).map((t, i) => <Tag key={i} style={{ fontSize: 10 }}>{t}</Tag>)}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </>
        )}

        {/* Agent Experience (Collective Intelligence) */}
        {selectedAgent && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
              <Space>
                <BulbOutlined />
                <Text>经验与学习</Text>
                <Tag color="purple">{experiences.length}</Tag>
              </Space>
            </Divider>
            <Space style={{ marginBottom: 8, width: '100%' }} wrap>
              <Button icon={<PlusOutlined />} onClick={() => setExperienceCreateOpen(true)}>添加经验</Button>
              <Button icon={<ThunderboltOutlined />} onClick={autoExtractExperiences}>自动提取</Button>
              <Button icon={<TeamOutlined />} onClick={loadSharedExperiences} loading={sharedExperiencesLoading}>群体学习</Button>
              <Button icon={<FieldTimeOutlined />} onClick={applyDecay}>衰减</Button>
            </Space>
            <Spin spinning={experiencesLoading}>
              {experiences.length === 0 && !experiencesLoading ? (
                <Empty description="暂无经验记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  size="small"
                  dataSource={experiences}
                  style={{ maxHeight: 300, overflowY: 'auto' }}
                  renderItem={(exp: any) => (
                    <List.Item
                      style={{ cursor: 'pointer', padding: '6px 8px' }}
                      actions={[
                        <Tooltip key="validate" title="验证准确">
                          <Button size="small" icon={<CheckCircleOutlined />} onClick={(e) => { e.stopPropagation(); validateExperience(exp.id, true) }} />
                        </Tooltip>,
                        <Tooltip key="refute" title="反驳">
                          <Button size="small" danger icon={<CloseCircleOutlined />} onClick={(e) => { e.stopPropagation(); validateExperience(exp.id, false) }} />
                        </Tooltip>,
                        exp.is_shared
                          ? <Tag key="shared" color="green" style={{ fontSize: 10 }}>已分享</Tag>
                          : <Button key="share" size="small" icon={<ShareAltOutlined />} onClick={(e) => { e.stopPropagation(); shareExperience(exp.id) }} />,
                        <Popconfirm key="del" title="确定删除？" onConfirm={() => deleteExperience(exp.id)}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>,
                      ]}
                      onClick={() => openExperienceDetail(exp)}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag color={exp.experience_type === 'success_pattern' ? 'green' : exp.experience_type === 'failure_pattern' ? 'red' : 'blue'} style={{ fontSize: 10 }}>
                              {exp.experience_type === 'success_pattern' ? '成功' : exp.experience_type === 'failure_pattern' ? '失败' : exp.experience_type === 'strategy' ? '策略' : exp.experience_type === 'optimization' ? '优化' : '反模式'}
                            </Tag>
                            {exp.domain && <Tag color="purple" style={{ fontSize: 10 }}>{exp.domain}</Tag>}
                            <Text strong style={{ fontSize: 12 }}>{exp.strategy?.substring(0, 40) || '无策略'}</Text>
                          </Space>
                        }
                        description={
                          <Space size={4}>
                            <Text type="secondary" style={{ fontSize: 11 }}>置信度: {exp.confidence ?? 0.7}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>复用: {exp.times_reused || 0}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </>
        )}

        {/* Cross-Project Agent Collaboration */}
        {selectedAgent && (
          <>
            <Divider orientation="left" style={{ margin: '16px 0 8px' }}>
              <Space>
                <ApartmentOutlined />
                <Text>跨项目协作</Text>
                <Tag color="cyan">{crossProjects.length}</Tag>
              </Space>
            </Divider>
            <Space style={{ marginBottom: 8, width: '100%' }} wrap>
              <Button icon={<PlusOutlined />} onClick={() => setAuthorizeOpen(true)}>授权到项目</Button>
              <Button icon={<ReloadOutlined />} onClick={openCrossProject} loading={crossProjectLoading}>刷新</Button>
              <Button icon={<SearchOutlined />} onClick={loadCrossProjectTasks} loading={crossTasksLoading}>发现跨项目任务</Button>
            </Space>
            {crossProjects.length === 0 && !crossProjectLoading ? (
              <Empty description="暂无跨项目授权" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={crossProjects}
                style={{ maxHeight: 200, overflowY: 'auto' }}
                renderItem={(auth: any) => (
                  <List.Item
                    actions={[
                      <Popconfirm key="revoke" title="确定撤销授权？" onConfirm={() => revokeCrossProject(auth.project_id)}>
                        <Button size="small" danger>撤销</Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{auth.project_name || `项目 #${auth.project_id}`}</Text>
                          <Tag color="blue">{auth.role_in_project}</Tag>
                          {auth.is_active ? <Tag color="green">活跃</Tag> : <Tag color="default">停用</Tag>}
                        </Space>
                      }
                      description={
                        <Space size={4}>
                          <Text type="secondary" style={{ fontSize: 11 }}>最大并发: {auth.max_concurrent_tasks || 3}</Text>
                          {auth.expires_at && <Text type="secondary" style={{ fontSize: 11 }}>到期: {new Date(auth.expires_at).toLocaleDateString()}</Text>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </>
        )}
      </Drawer>

      {/* 广播消息 Modal */}
      <Modal
        title={`广播消息 — ${broadcastAgent?.name || ''}`}
        open={broadcastOpen}
        onCancel={() => { setBroadcastOpen(false); setBroadcastAgent(null); setBroadcastContent('') }}
        onOk={sendBroadcast}
        confirmLoading={broadcasting}
        okText="发送广播"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">
            消息将发送给所有在线（ACTIVE）的 Agent，通过 Notification 系统推送给它们。
          </Text>
        </div>
        <Input.TextArea
          rows={4}
          placeholder="请输入要广播的内容..."
          value={broadcastContent}
          onChange={e => setBroadcastContent(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>

      {/* Agent 直接消息 Modal */}
      <Modal
        title={`发送消息 — ${dmFrom?.name || ''}`}
        open={dmOpen}
        onCancel={() => { setDmOpen(false); setDmFrom(null); setDmTo(null); setDmContent('') }}
        onOk={sendDirectMessage}
        confirmLoading={dmSending}
        okText="发送"
        cancelText="取消"
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">
            从 <Text strong>{dmFrom?.name}</Text> 向指定 Agent 发送直接消息。
          </Text>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Text style={{ display: 'block', marginBottom: 4 }}>接收方 Agent</Text>
          <Select
            style={{ width: '100%' }}
            placeholder="选择接收方 Agent"
            value={dmTo?.id}
            onChange={id => setDmTo(agents.find(a => a.id === id) || null)}
            options={agents.filter(a => a.id !== dmFrom?.id).map(a => ({
              value: a.id,
              label: `${a.name} (${a.kind})`,
            }))}
          />
        </div>
        <Input.TextArea
          rows={4}
          placeholder="请输入消息内容..."
          value={dmContent}
          onChange={e => setDmContent(e.target.value)}
          maxLength={1000}
          showCount
        />
      </Modal>

      {/* Recommended tasks Modal */}
      <Modal
        title={`推荐任务 — ${recTasksAgent?.name || ''}`}
        open={recTasksOpen}
        onCancel={() => { setRecTasksOpen(false); setRecTasksAgent(null); setRecTasks([]) }}
        footer={null}
        width={700}
      >
        <Spin spinning={recTasksLoading}>
          {recTasks.length === 0 && !recTasksLoading ? (
            <Empty description="没有匹配的推荐任务" />
          ) : (
            <List
              size="small"
              dataSource={recTasks}
              renderItem={(item: any, index: number) => {
                const t = item.task
                const matched = [...(item.matched_capabilities || []), ...(item.matched_tags || [])]
                const missing = item.missing_required || []
                return (
                  <List.Item
                    style={{ padding: '8px 0' }}
                    actions={[
                      <Button key="claim" size="small" type="primary" onClick={() => {
                        if (recTasksAgent) { claimTask(recTasksAgent, t.id, true); setRecTasksOpen(false) }
                      }}>领取</Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>#{t.id} {t.title}</span>
                          <Tag color="blue">得分: {item.score}</Tag>
                        </Space>
                      }
                      description={
                        <div>
                          {matched.length > 0 && (
                            <div style={{ marginBottom: 4 }}>
                              <Text type="success" style={{ fontSize: 12 }}>匹配: </Text>
                              {matched.map((c: string) => <Tag key={c} color="green" style={{ fontSize: 11 }}>{c}</Tag>)}
                            </div>
                          )}
                          {missing.length > 0 && (
                            <div>
                              <Text type="danger" style={{ fontSize: 12 }}>缺失: </Text>
                              {missing.map((c: string) => <Tag key={c} color="red" style={{ fontSize: 11 }}>{c}</Tag>)}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )
              }}
            />
          )}
        </Spin>
      </Modal>

      {/* Channels Modal */}
      <Modal
        title="协作频道"
        open={channelsOpen}
        onCancel={() => setChannelsOpen(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setChannelCreateOpen(true)}>创建频道</Button>
        </div>
        <List
          size="small"
          dataSource={channels}
          renderItem={(ch: any) => (
            <List.Item
              actions={[
                <Button key="chat" size="small" type="primary" onClick={() => openChat(ch)}>进入</Button>,
                <Popconfirm key="del" title="确定删除此频道？" onConfirm={async () => {
                  try { await agentsApi.deleteChannel(ch.id); message.success('已删除'); loadChannels() }
                  catch { message.error('删除失败') }
                }}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Space><TeamOutlined />{ch.name}<Tag>{(ch.members || []).length} 成员</Tag></Space>}
                description={ch.description || (ch.task_id ? `任务 #${ch.task_id}` : ch.project_id ? `项目 #${ch.project_id}` : '全局频道')}
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Create Channel Modal */}
      <Modal
        title="创建协作频道"
        open={channelCreateOpen}
        onCancel={() => setChannelCreateOpen(false)}
        onOk={createChannel}
      >
        <Form layout="vertical">
          <Form.Item label="频道名称" required>
            <Input value={channelForm.name} onChange={e => setChannelForm({ ...channelForm, name: e.target.value })} placeholder="例如：代码审查讨论" />
          </Form.Item>
          <Form.Item label="描述">
            <Input.TextArea value={channelForm.description} onChange={e => setChannelForm({ ...channelForm, description: e.target.value })} placeholder="频道用途说明" rows={2} />
          </Form.Item>
          <Form.Item label="初始成员（Agent）">
            <Select
              mode="multiple"
              value={channelForm.agent_ids}
              onChange={v => setChannelForm({ ...channelForm, agent_ids: v })}
              style={{ width: '100%' }}
              options={agents.map(a => ({ value: a.id, label: `${a.name} (${a.kind})` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Chat Modal */}
      <Modal
        title={`频道: ${chatChannel?.name || ''}`}
        open={chatOpen}
        onCancel={() => { setChatOpen(false); setChatChannel(null); setChatMessages([]) }}
        footer={null}
        width={700}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 8 }}>
          {chatMessages.length === 0 ? (
            <Empty description="暂无消息" />
          ) : (
            chatMessages.map((msg: any) => (
              <div key={msg.id} style={{ marginBottom: 8, padding: '6px 10px', background: msg.sender_type === 'human' ? '#e6f7ff' : '#fff', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text strong style={{ fontSize: 12 }}>{msg.sender_name || '未知'}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</Text>
                </div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onPressEnter={sendChatMessage}
            placeholder="输入消息..."
            disabled={chatSending}
          />
          <Button type="primary" onClick={sendChatMessage} loading={chatSending} icon={<SendOutlined />}>发送</Button>
        </div>
      </Modal>

      {/* Collaboration Templates Modal */}
      <Modal
        title="协作模板"
        open={collabTemplatesOpen}
        onCancel={() => setCollabTemplatesOpen(false)}
        footer={null}
        width={800}
      >
        <Spin spinning={collabTemplatesLoading}>
          {collabTemplates.length === 0 && !collabTemplatesLoading ? (
            <Empty description="暂无协作模板" />
          ) : (
            <List
              dataSource={collabTemplates}
              renderItem={(tpl: any) => (
                <List.Item
                  actions={[
                    <Button
                      key="instantiate"
                      type="primary"
                      size="small"
                      icon={<RocketOutlined />}
                      onClick={() => openCollabInstantiate(tpl.id, tpl.name)}
                    >
                      实例化
                    </Button>,
                    !tpl.is_builtin ? (
                      <Popconfirm
                        key="delete"
                        title="确定删除此模板？"
                        onConfirm={async () => {
                          try {
                            await agentsApi.deleteCollaborationTemplate(parseInt(String(tpl.id).replace('builtin:', ''), 10))
                            message.success('模板已删除')
                            loadCollabTemplates()
                          } catch { message.error('删除失败') }
                        }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    ) : null,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={<Space>{tpl.name} {tpl.is_builtin && <Tag color="blue">内置</Tag>} {tpl.category && <Tag>{tpl.category}</Tag>}</Space>}
                    description={
                      <div>
                        <div>{tpl.description || '无描述'}</div>
                        {tpl.agent_specs && (
                          <div style={{ marginTop: 4 }}>
                            {(tpl.agent_specs as any[]).map((spec: any, idx: number) => (
                              <Tag key={idx} color="geekblue" style={{ marginBottom: 2 }}>
                                {spec.name} ({spec.kind || 'autonomous'})
                                {spec.collaboration_role && ` · ${spec.collaboration_role}`}
                              </Tag>
                            ))}
                          </div>
                        )}
                        {tpl.workflow_steps && (tpl.workflow_steps as any[]).length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>工作流步骤 ({(tpl.workflow_steps as any[]).length}):</Text>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                              {(tpl.workflow_steps as any[]).map((step: any, idx: number) => (
                                <Tag
                                  key={idx}
                                  color={step.condition ? 'orange' : 'blue'}
                                  style={{ fontSize: 10 }}
                                >
                                  {step.name || step.step_key}
                                  {step.condition && ` [${step.condition.operator === 'succeeded' ? '✓' : step.condition.operator === 'failed' ? '✗' : '?'}→${step.condition.step_key}]`}
                                </Tag>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Modal>

      {/* Instantiate Collaboration Template Modal */}
      <Modal
        title={`实例化模板: ${collabInstantiateName}`}
        open={collabInstantiateOpen}
        onCancel={() => setCollabInstantiateOpen(false)}
        onOk={instantiateCollabTemplate}
        confirmLoading={collabInstantiating}
        okText="实例化"
      >
        <Form layout="vertical">
          <Form.Item label="项目 ID（可选）">
            <InputNumber
              value={collabInstantiateProjectId}
              onChange={v => setCollabInstantiateProjectId(v ?? undefined)}
              placeholder="输入项目 ID"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Knowledge Create Modal */}
      <Modal
        title="添加知识条目"
        open={knowledgeCreateOpen}
        onCancel={() => setKnowledgeCreateOpen(false)}
        onOk={createKnowledgeEntry}
        okText="创建"
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="标题" required>
            <Input value={knowledgeForm.title} onChange={e => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })} placeholder="简短描述这条知识" />
          </Form.Item>
          <Form.Item label="内容" required>
            <Input.TextArea value={knowledgeForm.content} onChange={e => setKnowledgeForm({ ...knowledgeForm, content: e.target.value })} placeholder="知识内容（支持 Markdown）" rows={6} />
          </Form.Item>
          <Form.Item label="领域">
            <Input value={knowledgeForm.domain} onChange={e => setKnowledgeForm({ ...knowledgeForm, domain: e.target.value })} placeholder="如: python, frontend, devops" />
          </Form.Item>
          <Form.Item label="类型">
            <Select value={knowledgeForm.entry_type} onChange={v => setKnowledgeForm({ ...knowledgeForm, entry_type: v })} style={{ width: 160 }}>
              <Select.Option value="insight">洞察</Select.Option>
              <Select.Option value="pattern">模式</Select.Option>
              <Select.Option value="solution">解决方案</Select.Option>
              <Select.Option value="reference">参考</Select.Option>
              <Select.Option value="rule">规则</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="标签">
            <Select mode="tags" value={knowledgeForm.tags} onChange={v => setKnowledgeForm({ ...knowledgeForm, tags: v })} placeholder="添加标签" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="置信度">
            <InputNumber min={0} max={1} step={0.1} value={knowledgeForm.confidence} onChange={v => setKnowledgeForm({ ...knowledgeForm, confidence: v ?? 1.0 })} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Knowledge Detail Modal */}
      <Modal
        title={knowledgeDetail?.title || '知识详情'}
        open={knowledgeDetailOpen}
        onCancel={() => { setKnowledgeDetailOpen(false); setKnowledgeDetail(null) }}
        footer={null}
        width={700}
      >
        {knowledgeDetail && (
          <div>
            <Space style={{ marginBottom: 12 }} wrap>
              {knowledgeDetail.entry_type && <Tag>{knowledgeDetail.entry_type}</Tag>}
              {knowledgeDetail.domain && <Tag color="blue">{knowledgeDetail.domain}</Tag>}
              <Tag>置信度: {knowledgeDetail.confidence ?? 1.0}</Tag>
              <Tag>访问: {knowledgeDetail.access_count || 0}</Tag>
              <Tag>来源: {knowledgeDetail.source_type || 'manual'}</Tag>
              {knowledgeDetail.tags && (knowledgeDetail.tags as string[]).map((t: string, i: number) => <Tag key={i} color="geekblue">{t}</Tag>)}
            </Space>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8, maxHeight: 400, overflowY: 'auto' }}>
              {knowledgeDetail.content}
            </div>
            {knowledgeDetail.source_task_id && (
              <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                来源任务: #{knowledgeDetail.source_task_id}
              </Text>
            )}
          </div>
        )}
      </Modal>

      {/* Protocols Modal */}
      <Modal
        title="协作协议"
        open={protocolsOpen}
        onCancel={() => setProtocolsOpen(false)}
        footer={<Button type="primary" icon={<PlusOutlined />} onClick={() => setProtocolCreateOpen(true)}>创建协议</Button>}
        width={800}
      >
        <Spin spinning={protocolsLoading}>
          {protocols.length === 0 && !protocolsLoading ? (
            <Empty description="暂无协议" />
          ) : (
            <List
              dataSource={protocols}
              renderItem={(p: any) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  actions={[
                    p.status === 'open' || p.status === 'voting' ? (
                      <Button key="respond" size="small" type="primary" onClick={(e) => { e.stopPropagation(); setProtocolRespondMsg({ ...protocolRespondMsg, protocol_id: p.id }); setProtocolRespondOpen(true) }}>响应</Button>
                    ) : null,
                    p.status === 'open' || p.status === 'voting' ? (
                      <Popconfirm key="reject" title="确定拒绝此协议？" onConfirm={(e: any) => { e?.stopPropagation?.(); resolveProtocol(p.id, 'rejected') }}>
                        <Button size="small" danger onClick={(e) => e.stopPropagation()}>拒绝</Button>
                      </Popconfirm>
                    ) : null,
                  ].filter(Boolean)}
                  onClick={() => openProtocolDetail(p.id)}
                >
                  <List.Item.Meta
                    title={<Space>
                      {p.title}
                      <Tag color={p.status === 'accepted' ? 'green' : p.status === 'rejected' ? 'red' : p.status === 'open' ? 'blue' : 'default'}>{p.status}</Tag>
                      <Tag>{p.protocol_type}</Tag>
                    </Space>}
                    description={<Text type="secondary">发起者: Agent #{p.initiator_agent_id} | {p.created_at ? new Date(p.created_at).toLocaleString() : ''}</Text>}
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Modal>

      {/* Create Protocol Modal */}
      <Modal
        title="创建协作协议"
        open={protocolCreateOpen}
        onCancel={() => setProtocolCreateOpen(false)}
        onOk={createProtocol}
        okText="创建"
      >
        <Form layout="vertical">
          <Form.Item label="协议类型" required>
            <Select value={protocolForm.protocol_type} onChange={v => setProtocolForm({ ...protocolForm, protocol_type: v })}>
              <Select.Option value="proposal">提案</Select.Option>
              <Select.Option value="vote">投票</Select.Option>
              <Select.Option value="consensus">共识</Select.Option>
              <Select.Option value="auction">竞标</Select.Option>
              <Select.Option value="handoff">交接</Select.Option>
              <Select.Option value="deliberation">审议</Select.Option>
              <Select.Option value="ranked_vote">排名投票</Select.Option>
              <Select.Option value="weighted_vote">加权投票</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="标题" required>
            <Input value={protocolForm.title} onChange={e => setProtocolForm({ ...protocolForm, title: e.target.value })} placeholder="协议标题" />
          </Form.Item>
          <Form.Item label="描述">
            <Input.TextArea value={protocolForm.description} onChange={e => setProtocolForm({ ...protocolForm, description: e.target.value })} placeholder="详细描述" rows={3} />
          </Form.Item>
          <Form.Item label="发起 Agent" required>
            <Select value={protocolForm.initiator_agent_id} onChange={v => setProtocolForm({ ...protocolForm, initiator_agent_id: v })} placeholder="选择发起 Agent" style={{ width: '100%' }}>
              {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name} ({a.kind})</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Protocol Detail Modal */}
      <Modal
        title={protocolDetail?.title || '协议详情'}
        open={protocolDetailOpen}
        onCancel={() => { setProtocolDetailOpen(false); setProtocolDetail(null) }}
        footer={null}
        width={700}
      >
        {protocolDetail && (
          <div>
            <Space style={{ marginBottom: 12 }} wrap>
              <Tag color={protocolDetail.status === 'accepted' ? 'green' : protocolDetail.status === 'rejected' ? 'red' : 'blue'}>{protocolDetail.status}</Tag>
              <Tag>{protocolDetail.protocol_type}</Tag>
              {protocolDetail.description && <Text type="secondary">{protocolDetail.description}</Text>}
            </Space>
            {/* Show protocol result for resolved protocols */}
            {protocolDetail.result && Object.keys(protocolDetail.result).length > 0 && (
              <Card size="small" title="决议结果" style={{ marginBottom: 12 }}>
                <Descriptions column={1} size="small">
                  {protocolDetail.protocol_type === 'weighted_vote' && (
                    <>
                      <Descriptions.Item label="加权赞成">{protocolDetail.result.weighted_for}</Descriptions.Item>
                      <Descriptions.Item label="加权反对">{protocolDetail.result.weighted_against}</Descriptions.Item>
                      <Descriptions.Item label="总票数">{protocolDetail.result.total_votes}</Descriptions.Item>
                    </>
                  )}
                  {protocolDetail.protocol_type === 'ranked_vote' && (
                    <>
                      <Descriptions.Item label="胜出选项"><Tag color="green">{protocolDetail.result.winner}</Tag></Descriptions.Item>
                      <Descriptions.Item label="投票轮次">{protocolDetail.result.rounds?.length || 0}</Descriptions.Item>
                      <Descriptions.Item label="总票数">{protocolDetail.result.total_votes}</Descriptions.Item>
                    </>
                  )}
                  {protocolDetail.protocol_type === 'deliberation' && (
                    <>
                      <Descriptions.Item label="讨论消息数">{protocolDetail.result.discussion_count}</Descriptions.Item>
                      <Descriptions.Item label="赞成票">{protocolDetail.result.votes_for}</Descriptions.Item>
                      <Descriptions.Item label="反对票">{protocolDetail.result.votes_against}</Descriptions.Item>
                    </>
                  )}
                  {protocolDetail.result.votes_for !== undefined && protocolDetail.protocol_type === 'vote' && (
                    <>
                      <Descriptions.Item label="赞成">{protocolDetail.result.votes_for}</Descriptions.Item>
                      <Descriptions.Item label="反对">{protocolDetail.result.votes_against}</Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              </Card>
            )}
            {(protocolDetail.messages || []).length > 0 ? (
              <List
                size="small"
                dataSource={protocolDetail.messages}
                renderItem={(m: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Space><Tag color={m.message_type === 'argument' ? 'orange' : m.message_type === 'evidence' ? 'blue' : 'default'}>{m.message_type}</Tag> Agent #{m.agent_id}</Space>}
                      description={<div><div>{m.content || '无内容'}</div>{m.payload && Object.keys(m.payload).length > 0 && <Text type="secondary" style={{ fontSize: 11 }}>{JSON.stringify(m.payload)}</Text>}</div>}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无响应" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
            {(protocolDetail.status === 'open' || protocolDetail.status === 'voting') && (
              <Space style={{ marginTop: 12 }}>
                <Button type="primary" onClick={() => { setProtocolRespondMsg({ ...protocolRespondMsg, protocol_id: protocolDetail.id }); setProtocolRespondOpen(true) }}>响应</Button>
                {protocolDetail.protocol_type === 'deliberation' && (
                  <Button icon={<MessageOutlined />} onClick={() => { setDeliberationForm({ protocol_id: protocolDetail.id, agent_id: undefined, message_type: 'comment', content: '' }); setDeliberationOpen(true) }}>审议发言</Button>
                )}
                <Popconfirm title="接受此协议？" onConfirm={() => resolveProtocol(protocolDetail.id, 'accepted')}>
                  <Button>接受</Button>
                </Popconfirm>
                <Popconfirm title="拒绝此协议？" onConfirm={() => resolveProtocol(protocolDetail.id, 'rejected')}>
                  <Button danger>拒绝</Button>
                </Popconfirm>
              </Space>
            )}
          </div>
        )}
      </Modal>

      {/* Deliberation Message Modal */}
      <Modal
        title="审议发言"
        open={deliberationOpen}
        onCancel={() => setDeliberationOpen(false)}
        onOk={submitDeliberation}
        okText="提交"
      >
        <Form layout="vertical">
          <Form.Item label="Agent" required>
            <Select value={deliberationForm.agent_id} onChange={v => setDeliberationForm({ ...deliberationForm, agent_id: v })} placeholder="选择发言 Agent" style={{ width: '100%' }}>
              {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="消息类型" required>
            <Select value={deliberationForm.message_type} onChange={v => setDeliberationForm({ ...deliberationForm, message_type: v })}>
              <Select.Option value="comment">评论</Select.Option>
              <Select.Option value="argument">论点</Select.Option>
              <Select.Option value="evidence">证据</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="内容" required>
            <Input.TextArea value={deliberationForm.content} onChange={e => setDeliberationForm({ ...deliberationForm, content: e.target.value })} placeholder="发言内容..." rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Sandbox Management Drawer */}
      <Drawer
        title={<Space><SafetyOutlined /> Agent 执行沙盒</Space>}
        open={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
        width={900}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateSandbox}>新建沙盒</Button>}
      >
        <Alert
          message="安全执行环境隔离"
          description="沙盒策略控制 Agent 执行时的工具访问、网络出口、文件系统范围和资源限制。每次执行会冻结策略快照用于审计。"
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
        />
        <List
          dataSource={sandboxes}
          locale={{ emptyText: '暂无沙盒策略' }}
          renderItem={(s: any) => (
            <List.Item
              actions={[
                <Button size="small" onClick={() => openEditSandbox(s.id)}>编辑</Button>,
                <Button size="small" icon={<SearchOutlined />} onClick={() => openSandboxCheck(s.id)}>检查</Button>,
                <Button size="small" onClick={() => openSandboxStart(s.id)}>启动执行</Button>,
                <Button size="small" onClick={() => openSandboxExec(s.id)}>执行记录</Button>,
                <Popconfirm title="确认删除此沙盒？" onConfirm={() => deleteSandbox(s.id)}>
                  <Button size="small" danger>删除</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Space><Text strong>{s.name}</Text><Tag color={s.security_level === 'strict' ? 'red' : s.security_level === 'permissive' ? 'green' : 'orange'}>{s.security_level}</Tag>{s.is_active ? <Tag color="blue">活跃</Tag> : <Tag>停用</Tag>}{s.agent_id ? <Tag color="purple">Agent #{s.agent_id}</Tag> : <Tag>未绑定</Tag>}</Space>}
                description={
                  <Space size={[16, 4]} wrap style={{ fontSize: 12 }}>
                    <span>工具: {(s.allowed_tools || []).length}允许 / {(s.blocked_tools || []).length}禁止</span>
                    <span>网络: {(s.allowed_network_hosts || []).length}主机</span>
                    <span>超时: {s.timeout_seconds || 0}s</span>
                    <span>内存: {s.max_memory_mb || 0}MB</span>
                    <span>执行: {s.stats?.total_executions || 0}</span>
                    <span style={{ color: (s.stats?.violations || 0) > 0 ? '#ff4d4f' : undefined }}>违规: {s.stats?.violations || 0}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Sandbox Create/Edit Modal */}
      <Modal
        title={sandboxEditingId ? '编辑沙盒策略' : '新建沙盒策略'}
        open={sandboxFormOpen}
        onCancel={() => setSandboxFormOpen(false)}
        onOk={submitSandboxForm}
        okText="保存"
        width={680}
      >
        <Form layout="vertical">
          <Form.Item label="名称" required>
            <Input value={sandboxForm.name} onChange={e => setSandboxForm({ ...sandboxForm, name: e.target.value })} placeholder="沙盒名称" />
          </Form.Item>
          <Form.Item label="描述">
            <Input value={sandboxForm.description} onChange={e => setSandboxForm({ ...sandboxForm, description: e.target.value })} placeholder="沙盒用途说明" />
          </Form.Item>
          <Form.Item label="绑定 Agent">
            <Select value={sandboxForm.agent_id} onChange={v => setSandboxForm({ ...sandboxForm, agent_id: v })} allowClear placeholder="不绑定 (可复用模板)" style={{ width: '100%' }}>
              {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="安全级别" required>
            <Select value={sandboxForm.security_level} onChange={v => setSandboxForm({ ...sandboxForm, security_level: v })}>
              <Select.Option value="strict">严格 (无网络/无写盘/仅白名单工具)</Select.Option>
              <Select.Option value="moderate">中等 (受限网络/范围写盘/工具白名单)</Select.Option>
              <Select.Option value="permissive">宽松 (全网络/全盘/工具黑名单)</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="允许工具 (逗号分隔)">
                <Input value={(sandboxForm.allowed_tools || []).join(', ')} onChange={e => setSandboxForm({ ...sandboxForm, allowed_tools: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [] })} placeholder="tool_a, tool_b" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="禁止工具 (逗号分隔)">
                <Input value={(sandboxForm.blocked_tools || []).join(', ')} onChange={e => setSandboxForm({ ...sandboxForm, blocked_tools: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [] })} placeholder="tool_x, tool_y" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="允许网络主机 (逗号分隔, 后缀匹配)">
            <Input value={(sandboxForm.allowed_network_hosts || []).join(', ')} onChange={e => setSandboxForm({ ...sandboxForm, allowed_network_hosts: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [] })} placeholder="api.example.com, cdn.example.com" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="写入路径 (逗号分隔)">
                <Input value={(sandboxForm.fs_write_paths || []).join(', ')} onChange={e => setSandboxForm({ ...sandboxForm, fs_write_paths: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [] })} placeholder="/tmp/work, /data/out" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="读取路径 (逗号分隔)">
                <Input value={(sandboxForm.fs_read_paths || []).join(', ')} onChange={e => setSandboxForm({ ...sandboxForm, fs_read_paths: e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [] })} placeholder="/data/in" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}><Form.Item label="超时(秒)"><InputNumber value={sandboxForm.timeout_seconds} onChange={v => setSandboxForm({ ...sandboxForm, timeout_seconds: v || 0 })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item label="内存(MB)"><InputNumber value={sandboxForm.max_memory_mb} onChange={v => setSandboxForm({ ...sandboxForm, max_memory_mb: v || 0 })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item label="CPU(秒)"><InputNumber value={sandboxForm.max_cpu_seconds} onChange={v => setSandboxForm({ ...sandboxForm, max_cpu_seconds: v || 0 })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item label="输出Token"><InputNumber value={sandboxForm.max_output_tokens} onChange={v => setSandboxForm({ ...sandboxForm, max_output_tokens: v || 0 })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Sandbox Executions Modal */}
      <Modal
        title={`沙盒执行记录 #${sandboxExecSandboxId || ''}`}
        open={sandboxExecOpen}
        onCancel={() => setSandboxExecOpen(false)}
        footer={null}
        width={820}
      >
        <Table
          size="small"
          dataSource={sandboxExecutions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 60 },
            { title: 'Agent', dataIndex: 'agent_id', width: 70, render: (v: number) => `#${v}` },
            { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => <Tag color={s === 'completed' ? 'green' : s === 'running' ? 'blue' : s === 'violated' ? 'red' : s === 'revoked' ? 'orange' : 'default'}>{s}</Tag> },
            { title: '工具调用', dataIndex: 'tool_calls', width: 80 },
            { title: '网络调用', dataIndex: 'network_calls', width: 80 },
            { title: '开始', dataIndex: 'started_at', width: 150, render: (v: string) => v || '-' },
            { title: '操作', width: 200, render: (_: any, r: any) => (
              <Space size={4} wrap>
                <Button size="small" onClick={() => openSandboxExecDetail(r.id)}>详情</Button>
                {r.status === 'running' && <>
                  <Button size="small" onClick={() => completeSandboxExec(r.id)}>完成</Button>
                  <Popconfirm title="吊销此执行？" onConfirm={() => revokeSandboxExec(r.id)}>
                    <Button size="small" danger>吊销</Button>
                  </Popconfirm>
                  <Button size="small" onClick={() => openSandboxViolation(r.id)}>报违规</Button>
                </>}
              </Space>
            ) },
          ]}
        />
      </Modal>

      {/* Sandbox Execution Detail Modal */}
      <Modal
        title={`执行详情 #${sandboxExecDetail?.id || ''}`}
        open={sandboxExecDetailOpen}
        onCancel={() => setSandboxExecDetailOpen(false)}
        footer={null}
        width={700}
      >
        {sandboxExecDetail && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="状态"><Tag color={sandboxExecDetail.status === 'completed' ? 'green' : sandboxExecDetail.status === 'violated' ? 'red' : 'blue'}>{sandboxExecDetail.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Agent">#{sandboxExecDetail.agent_id}</Descriptions.Item>
              <Descriptions.Item label="开始">{sandboxExecDetail.started_at || '-'}</Descriptions.Item>
              <Descriptions.Item label="结束">{sandboxExecDetail.ended_at || '-'}</Descriptions.Item>
              <Descriptions.Item label="工具调用">{sandboxExecDetail.tool_calls || 0}</Descriptions.Item>
              <Descriptions.Item label="网络调用">{sandboxExecDetail.network_calls || 0}</Descriptions.Item>
              <Descriptions.Item label="内存峰值">{sandboxExecDetail.peak_memory_mb || 0} MB</Descriptions.Item>
              <Descriptions.Item label="CPU">{sandboxExecDetail.cpu_seconds || 0}s</Descriptions.Item>
              {sandboxExecDetail.termination_reason && <Descriptions.Item label="终止原因" span={2}>{sandboxExecDetail.termination_reason}</Descriptions.Item>}
              {sandboxExecDetail.output_summary && <Descriptions.Item label="输出摘要" span={2}>{sandboxExecDetail.output_summary}</Descriptions.Item>}
            </Descriptions>
            <Title level={5}>违规记录 ({(sandboxExecDetail.violations || []).length})</Title>
            {(sandboxExecDetail.violations || []).length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={sandboxExecDetail.violations}
                renderItem={(v: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Space><Tag color="red">{v.violation_type}</Tag><Text type="secondary">{v.blocked_at}</Text></Space>}
                      description={<div><div>{v.attempted_action}</div>{v.detail && <Text type="secondary" style={{ fontSize: 11 }}>{v.detail}</Text>}</div>}
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="无违规记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </>
        )}
      </Modal>

      {/* Sandbox Check Modal */}
      <Modal
        title="沙盒策略检查 (Dry-run)"
        open={sandboxCheckOpen}
        onCancel={() => setSandboxCheckOpen(false)}
        onOk={submitSandboxCheck}
        okText="检查"
      >
        <Form layout="vertical">
          <Form.Item label="动作类型" required>
            <Select value={sandboxCheckForm.action} onChange={v => setSandboxCheckForm({ ...sandboxCheckForm, action: v })}>
              <Select.Option value="tool">工具调用 (tool)</Select.Option>
              <Select.Option value="network">网络访问 (network)</Select.Option>
              <Select.Option value="fs_write">文件写入 (fs_write)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="目标" required>
            <Input value={sandboxCheckForm.target} onChange={e => setSandboxCheckForm({ ...sandboxCheckForm, target: e.target.value })} placeholder="工具名 / 主机名 / 路径" />
          </Form.Item>
        </Form>
        {sandboxCheckResult && (
          <Alert
            type={sandboxCheckResult.allowed ? 'success' : 'error'}
            message={sandboxCheckResult.allowed ? '允许' : '拒绝'}
            description={sandboxCheckResult.reason || (sandboxCheckResult.allowed ? '符合沙盒策略' : '违反沙盒策略')}
            showIcon
          />
        )}
      </Modal>

      {/* Sandbox Start Execution Modal */}
      <Modal
        title="启动沙盒执行"
        open={sandboxStartOpen}
        onCancel={() => setSandboxStartOpen(false)}
        onOk={submitSandboxStart}
        okText="启动"
      >
        <Form layout="vertical">
          <Form.Item label="Agent" required>
            <Select value={sandboxStartForm.agent_id} onChange={v => setSandboxStartForm({ ...sandboxStartForm, agent_id: v })} placeholder="选择执行 Agent" style={{ width: '100%' }}>
              {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="关联 AgentRun ID (可选)">
            <InputNumber value={sandboxStartForm.run_id} onChange={v => setSandboxStartForm({ ...sandboxStartForm, run_id: v || undefined })} placeholder="AgentRun ID" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="关联 WorkflowStepRun ID (可选)">
            <InputNumber value={sandboxStartForm.step_run_id} onChange={v => setSandboxStartForm({ ...sandboxStartForm, step_run_id: v || undefined })} placeholder="StepRun ID" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Sandbox Violation Report Modal */}
      <Modal
        title="报告沙盒违规"
        open={sandboxViolationOpen}
        onCancel={() => setSandboxViolationOpen(false)}
        onOk={submitSandboxViolation}
        okText="记录"
      >
        <Form layout="vertical">
          <Form.Item label="违规类型" required>
            <Select value={sandboxViolationForm.violation_type} onChange={v => setSandboxViolationForm({ ...sandboxViolationForm, violation_type: v })}>
              <Select.Option value="disallowed_tool">禁止工具</Select.Option>
              <Select.Option value="network_blocked">网络被阻止</Select.Option>
              <Select.Option value="fs_write_blocked">写入被阻止</Select.Option>
              <Select.Option value="fs_read_blocked">读取被阻止</Select.Option>
              <Select.Option value="resource_limit">资源超限</Select.Option>
              <Select.Option value="timeout">超时</Select.Option>
              <Select.Option value="capability_exceed">能力越界</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="尝试动作">
            <Input value={sandboxViolationForm.attempted_action} onChange={e => setSandboxViolationForm({ ...sandboxViolationForm, attempted_action: e.target.value })} placeholder="Agent 试图做什么" />
          </Form.Item>
          <Form.Item label="详情">
            <Input.TextArea value={sandboxViolationForm.detail} onChange={e => setSandboxViolationForm({ ...sandboxViolationForm, detail: e.target.value })} placeholder="为何被阻止" rows={3} />
          </Form.Item>
          <Form.Item>
            <Checkbox checked={sandboxViolationForm.terminate} onChange={e => setSandboxViolationForm({ ...sandboxViolationForm, terminate: e.target.checked })}>同时终止此执行 (标记为 violated)</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* Workflow Step Dynamic Reconfiguration Modal */}
      <Modal
        title={<Space><SettingOutlined /> 工作流步骤动态重配置</Space>}
        open={stepOverrideOpen}
        onCancel={() => setStepOverrideOpen(false)}
        footer={[
          <Button key="clear" danger onClick={clearStepOverride} disabled={!stepOverrideForm.run_id || !stepOverrideForm.step_key}>清除覆盖</Button>,
          <Button key="cancel" onClick={() => setStepOverrideOpen(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={submitStepOverride}>应用覆盖</Button>,
        ]}
        width={680}
      >
        <Alert
          message="运行时动态重配置"
          description="为运行中工作流的某个步骤设置运行时覆盖，无需修改工作流定义。未启动步骤可改全部参数；运行中步骤仅可改超时/重试。"
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
        />
        <Form layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label="运行 ID" required>
                <InputNumber value={stepOverrideForm.run_id} onChange={v => setStepOverrideForm({ ...stepOverrideForm, run_id: v || undefined })} placeholder="WorkflowRun ID" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="步骤 key" required>
                <Input value={stepOverrideForm.step_key} onChange={e => setStepOverrideForm({ ...stepOverrideForm, step_key: e.target.value })} placeholder="如 review, build, deploy" />
              </Form.Item>
            </Col>
          </Row>
          <Button size="small" icon={<SearchOutlined />} onClick={() => stepOverrideForm.run_id && stepOverrideForm.step_key && loadStepEffective(Number(stepOverrideForm.run_id), String(stepOverrideForm.step_key))} disabled={!stepOverrideForm.run_id || !stepOverrideForm.step_key} style={{ marginBottom: 16 }}>加载当前有效参数</Button>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="指定 Agent">
                <Select value={stepOverrideForm.agent_id} onChange={v => setStepOverrideForm({ ...stepOverrideForm, agent_id: v })} allowClear placeholder="覆盖能力匹配" style={{ width: '100%' }}>
                  {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="所需能力 (逗号分隔)">
                <Input value={stepOverrideForm.required_capabilities} onChange={e => setStepOverrideForm({ ...stepOverrideForm, required_capabilities: e.target.value })} placeholder="code_review, python" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}><Form.Item label="超时(秒)"><InputNumber value={stepOverrideForm.timeout_seconds} onChange={v => setStepOverrideForm({ ...stepOverrideForm, timeout_seconds: v || undefined })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="重试次数"><InputNumber value={stepOverrideForm.retry_count} onChange={v => setStepOverrideForm({ ...stepOverrideForm, retry_count: v || undefined })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}>
              <Form.Item label="失败策略">
                <Select value={stepOverrideForm.on_failure} onChange={v => setStepOverrideForm({ ...stepOverrideForm, on_failure: v })} allowClear placeholder="abort">
                  <Select.Option value="abort">中止</Select.Option>
                  <Select.Option value="skip">跳过</Select.Option>
                  <Select.Option value="continue">继续</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item label="任务模板 ID"><InputNumber value={stepOverrideForm.task_template_id} onChange={v => setStepOverrideForm({ ...stepOverrideForm, task_template_id: v || undefined })} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item label="子工作流 ID"><InputNumber value={stepOverrideForm.sub_workflow_id} onChange={v => setStepOverrideForm({ ...stepOverrideForm, sub_workflow_id: v || undefined })} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item label="条件 (JSON)">
            <Input.TextArea value={stepOverrideForm.condition} onChange={e => setStepOverrideForm({ ...stepOverrideForm, condition: e.target.value })} placeholder='{"step_key":"review","operator":"succeeded","value":true}' rows={2} />
          </Form.Item>
        </Form>
        {stepEffective && (
          <Card size="small" title="当前有效参数" style={{ marginTop: 8 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Agent">{String(stepEffective.effective_params?.agent_id ?? '-')}</Descriptions.Item>
              <Descriptions.Item label="超时">{stepEffective.effective_params?.timeout_seconds ?? '-'}s</Descriptions.Item>
              <Descriptions.Item label="重试">{stepEffective.effective_params?.retry_count ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="失败策略">{stepEffective.effective_params?.on_failure ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="能力" span={2}>{(stepEffective.effective_params?.required_capabilities || []).join(', ') || '-'}</Descriptions.Item>
              <Descriptions.Item label="运行状态">{stepEffective.step_run?.status || '-'}</Descriptions.Item>
              <Descriptions.Item label="覆盖数">{Object.keys(stepEffective.overrides || {}).length}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Modal>

      {/* Conflict Management Drawer */}
      <Drawer
        title={<Space><WarningOutlined /> 协作冲突检测与解决</Space>}
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        width={820}
        extra={<Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadConflicts()}>刷新</Button>
          <Button type="primary" icon={<SearchOutlined />} onClick={scanConflicts} loading={false}>扫描冲突</Button>
        </Space>}
      >
        <Alert
          message="协作冲突检测"
          description="扫描检测重复认领、过期分配、协议僵局等冲突，并提供自动/手动解决策略。"
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
        />
        <List
          dataSource={conflicts}
          locale={{ emptyText: '暂无活跃冲突' }}
          renderItem={(c: any) => (
            <List.Item
              actions={[
                <Button size="small" onClick={() => openConflictDetail(c.id)}>详情</Button>,
                <Button size="small" type="primary" onClick={() => openResolveConflict(c)}>解决</Button>,
                <Button size="small" onClick={() => acknowledgeConflict(c.id)}>确认</Button>,
                <Popconfirm title="忽略此冲突？" onConfirm={() => ignoreConflict(c.id)}>
                  <Button size="small" danger>忽略</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Space>
                  <Tag color={c.severity === 'critical' ? 'red' : c.severity === 'warning' ? 'orange' : 'blue'}>{c.severity}</Tag>
                  <Tag color="purple">{c.conflict_type}</Tag>
                  <Tag>{c.status}</Tag>
                  <Text strong>{c.title}</Text>
                </Space>}
                description={<Space size={[16, 4]} wrap style={{ fontSize: 12 }}>
                  <span>涉及 Agent: {(c.agent_ids || []).map((id: number) => `#${id}`).join(', ') || '-'}</span>
                  {c.suggested_strategy && <span>建议: {c.suggested_strategy}</span>}
                </Space>}
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Conflict Detail Modal */}
      <Modal
        title={`冲突详情 #${conflictDetail?.id || ''}`}
        open={conflictDetailOpen}
        onCancel={() => setConflictDetailOpen(false)}
        footer={conflictDetail && conflictDetail.status !== 'resolved' && conflictDetail.status !== 'ignored' ? [
          <Button key="ack" onClick={() => { acknowledgeConflict(conflictDetail.id); setConflictDetailOpen(false) }}>确认</Button>,
          <Button key="ign" danger onClick={() => { ignoreConflict(conflictDetail.id); setConflictDetailOpen(false) }}>忽略</Button>,
          <Button key="res" type="primary" onClick={() => { const c = conflictDetail; setConflictDetailOpen(false); openResolveConflict(c) }}>解决</Button>,
        ] : null}
      >
        {conflictDetail && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="类型"><Tag color="purple">{conflictDetail.conflict_type}</Tag></Descriptions.Item>
            <Descriptions.Item label="严重度"><Tag color={conflictDetail.severity === 'critical' ? 'red' : conflictDetail.severity === 'warning' ? 'orange' : 'blue'}>{conflictDetail.severity}</Tag></Descriptions.Item>
            <Descriptions.Item label="状态"><Tag>{conflictDetail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="标题">{conflictDetail.title}</Descriptions.Item>
            <Descriptions.Item label="描述">{conflictDetail.description}</Descriptions.Item>
            <Descriptions.Item label="涉及 Agent">{(conflictDetail.agent_ids || []).map((id: number) => `#${id}`).join(', ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="建议策略">{conflictDetail.suggested_strategy || '-'}</Descriptions.Item>
            {conflictDetail.task_id && <Descriptions.Item label="任务">#{conflictDetail.task_id}</Descriptions.Item>}
            {conflictDetail.protocol_id && <Descriptions.Item label="协议">#{conflictDetail.protocol_id}</Descriptions.Item>}
            {conflictDetail.evidence && Object.keys(conflictDetail.evidence).length > 0 && <Descriptions.Item label="证据"><pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(conflictDetail.evidence, null, 2)}</pre></Descriptions.Item>}
            {conflictDetail.resolution && <Descriptions.Item label="解决说明">{conflictDetail.resolution}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>

      {/* Conflict Resolve Modal */}
      <Modal
        title={`解决冲突 #${conflictResolveForm.conflict_id}`}
        open={conflictResolveOpen}
        onCancel={() => setConflictResolveOpen(false)}
        onOk={submitResolveConflict}
        okText="解决"
      >
        <Form layout="vertical">
          <Form.Item label="解决策略" required>
            <Select value={conflictResolveForm.strategy} onChange={v => setConflictResolveForm({ ...conflictResolveForm, strategy: v })}>
              <Select.Option value="first_wins">先到先得 (保留最早分配)</Select.Option>
              <Select.Option value="highest_reputation">最高声誉 (声誉最佳者胜出)</Select.Option>
              <Select.Option value="least_loaded">最少负载 (活跃任务最少者胜出)</Select.Option>
              <Select.Option value="auto_retry">自动重试 (取消过期/重新排队)</Select.Option>
              <Select.Option value="split">拆分 (分配给多方)</Select.Option>
              <Select.Option value="escalate">升级 (转交协调者)</Select.Option>
              <Select.Option value="manual">人工 (仅记录)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="解决说明">
            <Input.TextArea value={conflictResolveForm.description} onChange={e => setConflictResolveForm({ ...conflictResolveForm, description: e.target.value })} placeholder="可选: 解决备注" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Protocol Respond Modal */}
      <Modal
        title="响应协议"
        open={protocolRespondOpen}
        onCancel={() => setProtocolRespondOpen(false)}
        onOk={respondToProtocol}
        okText="提交"
      >
        <Form layout="vertical">
          <Form.Item label="Agent" required>
            <Select value={protocolRespondMsg.agent_id} onChange={v => setProtocolRespondMsg({ ...protocolRespondMsg, agent_id: v })} placeholder="选择响应 Agent" style={{ width: '100%' }}>
              {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="响应类型" required>
            <Select value={protocolRespondMsg.message_type} onChange={v => setProtocolRespondMsg({ ...protocolRespondMsg, message_type: v })}>
              <Select.Option value="accept">接受</Select.Option>
              <Select.Option value="reject">拒绝</Select.Option>
              <Select.Option value="vote">投票</Select.Option>
              <Select.Option value="ranked_vote">排名投票</Select.Option>
              <Select.Option value="bid">竞标</Select.Option>
              <Select.Option value="comment">评论</Select.Option>
              <Select.Option value="counter_proposal">反提案</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="内容">
            <Input.TextArea value={protocolRespondMsg.content} onChange={e => setProtocolRespondMsg({ ...protocolRespondMsg, content: e.target.value })} placeholder="响应内容" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Experience Create Modal */}
      <Modal
        title="添加经验"
        open={experienceCreateOpen}
        onCancel={() => setExperienceCreateOpen(false)}
        onOk={createExperience}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="经验类型" required>
            <Select value={experienceForm.experience_type} onChange={v => setExperienceForm({ ...experienceForm, experience_type: v })}>
              <Option value="success_pattern">成功模式</Option>
              <Option value="failure_pattern">失败模式</Option>
              <Option value="strategy">策略</Option>
              <Option value="optimization">优化</Option>
              <Option value="anti_pattern">反模式</Option>
            </Select>
          </Form.Item>
          <Form.Item label="领域">
            <Input value={experienceForm.domain} onChange={e => setExperienceForm({ ...experienceForm, domain: e.target.value })} placeholder="e.g. python, frontend, devops" />
          </Form.Item>
          <Form.Item label="任务类型">
            <Input value={experienceForm.task_type} onChange={e => setExperienceForm({ ...experienceForm, task_type: e.target.value })} placeholder="e.g. code_review, bug_fix" />
          </Form.Item>
          <Form.Item label="策略描述" required>
            <Input.TextArea value={experienceForm.strategy} onChange={e => setExperienceForm({ ...experienceForm, strategy: e.target.value })} placeholder="使用了什么策略/方法" rows={3} />
          </Form.Item>
          <Form.Item label="结果模式">
            <Input.TextArea value={experienceForm.outcome_pattern} onChange={e => setExperienceForm({ ...experienceForm, outcome_pattern: e.target.value })} placeholder="发生了什么 — 成功因素或失败原因" rows={2} />
          </Form.Item>
          <Form.Item label="关键学习">
            <Input.TextArea value={experienceForm.key_learnings} onChange={e => setExperienceForm({ ...experienceForm, key_learnings: e.target.value })} placeholder="对未来类似任务的精简建议" rows={2} />
          </Form.Item>
          <Form.Item label="置信度">
            <InputNumber value={experienceForm.confidence} onChange={v => setExperienceForm({ ...experienceForm, confidence: v ?? 0.7 })} min={0} max={1} step={0.1} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="分享给其他 Agent">
            <Select value={experienceForm.is_shared ? 'true' : 'false'} onChange={v => setExperienceForm({ ...experienceForm, is_shared: v === 'true' })}>
              <Option value="false">否</Option>
              <Option value="true">是</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Experience Detail Modal */}
      <Modal
        title={`经验详情 #${experienceDetail?.id || ''}`}
        open={experienceDetailOpen}
        onCancel={() => setExperienceDetailOpen(false)}
        footer={null}
        width={600}
      >
        {experienceDetail && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="类型">
              <Tag color={experienceDetail.experience_type === 'success_pattern' ? 'green' : experienceDetail.experience_type === 'failure_pattern' ? 'red' : 'blue'}>
                {experienceDetail.experience_type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="领域">{experienceDetail.domain || '-'}</Descriptions.Item>
            <Descriptions.Item label="任务类型">{experienceDetail.task_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="能力">{(experienceDetail.capabilities_used || []).map((c: string, i: number) => <Tag key={i} style={{ fontSize: 10 }}>{c}</Tag>)}</Descriptions.Item>
            <Descriptions.Item label="策略">{experienceDetail.strategy || '-'}</Descriptions.Item>
            <Descriptions.Item label="结果模式">{experienceDetail.outcome_pattern || '-'}</Descriptions.Item>
            <Descriptions.Item label="关键学习">{experienceDetail.key_learnings || '-'}</Descriptions.Item>
            <Descriptions.Item label="置信度">{experienceDetail.confidence}</Descriptions.Item>
            <Descriptions.Item label="适用性">{experienceDetail.applicability_score}</Descriptions.Item>
            <Descriptions.Item label="复用次数">{experienceDetail.times_reused || 0}</Descriptions.Item>
            <Descriptions.Item label="已分享">{experienceDetail.is_shared ? '是' : '否'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Shared Experiences (Collective Learning) Modal */}
      <Modal
        title="群体学习 — 从其他 Agent 的共享经验中学习"
        open={sharedExperiencesOpen}
        onCancel={() => setSharedExperiencesOpen(false)}
        footer={null}
        width={700}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          以下是其他 Agent 分享的经验，{selectedAgent?.name} 可以选择学习并内化为自己的经验。
        </Text>
        {sharedExperiences.length === 0 ? (
          <Empty description="暂无可学习的共享经验" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={sharedExperiences}
            style={{ maxHeight: 500, overflowY: 'auto' }}
            renderItem={(exp: any) => (
              <List.Item
                actions={[
                  <Button key="learn" size="small" type="primary" icon={<BulbOutlined />} onClick={() => learnFromExperience(exp.id)}>
                    学习
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={exp.experience_type === 'success_pattern' ? 'green' : exp.experience_type === 'failure_pattern' ? 'red' : 'blue'}>
                        {exp.experience_type === 'success_pattern' ? '成功' : exp.experience_type === 'failure_pattern' ? '失败' : '策略'}
                      </Tag>
                      {exp.domain && <Tag color="purple">{exp.domain}</Tag>}
                      <Text type="secondary" style={{ fontSize: 11 }}>来自 Agent #{exp.agent_id}</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <div><Text style={{ fontSize: 12 }}>{exp.key_learnings || exp.strategy?.substring(0, 100)}</Text></div>
                      <Space size={4} style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>置信度: {exp.confidence}</Text>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Cross-Project Authorize Modal */}
      <Modal
        title={`跨项目授权 — ${selectedAgent?.name || ''}`}
        open={authorizeOpen}
        onCancel={() => setAuthorizeOpen(false)}
        onOk={authorizeAgent}
        okText="授权"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="目标项目" required>
            <Select
              value={authorizeForm.project_id || undefined}
              onChange={v => setAuthorizeForm({ ...authorizeForm, project_id: v })}
              placeholder="选择要授权的项目"
              style={{ width: '100%' }}
            >
              {/* Projects will be loaded dynamically */}
              <Option value="">请选择项目</Option>
            </Select>
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
              输入项目 ID 或从列表中选择（需要是项目的 ADMIN 或 OWNER）
            </Text>
            <InputNumber
              value={authorizeForm.project_id || undefined}
              onChange={v => setAuthorizeForm({ ...authorizeForm, project_id: v })}
              placeholder="项目 ID"
              style={{ width: '100%', marginTop: 4 }}
              min={1}
            />
          </Form.Item>
          <Form.Item label="项目角色">
            <Select value={authorizeForm.role_in_project} onChange={v => setAuthorizeForm({ ...authorizeForm, role_in_project: v })}>
              <Option value="contributor">贡献者 (contributor)</Option>
              <Option value="reviewer">审查者 (reviewer)</Option>
              <Option value="observer">观察者 (observer)</Option>
            </Select>
          </Form.Item>
          <Form.Item label="最大并发任务数">
            <InputNumber value={authorizeForm.max_concurrent_tasks} onChange={v => setAuthorizeForm({ ...authorizeForm, max_concurrent_tasks: v ?? 3 })} min={1} max={20} style={{ width: 120 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Adaptive Capabilities Modal */}
      <Modal
        title={`能力自适应建议 — ${selectedAgent?.name || ''}`}
        open={adaptOpen}
        onCancel={() => { setAdaptOpen(false); setAdaptSuggestions(null) }}
        footer={null}
        width={600}
      >
        {adaptSuggestions ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">基于 Agent 的成功/失败经验模式，以下能力调整建议可优化任务匹配效果。</Text>
            </div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="当前能力">
                <Space wrap>{(adaptSuggestions.current_capabilities || []).map((c: string) => <Tag key={c}>{c}</Tag>)}</Space>
              </Descriptions.Item>
            </Descriptions>
            {Object.keys(adaptSuggestions.suggested_additions || {}).length > 0 && (
              <Card size="small" title="建议添加" style={{ marginTop: 12 }} extra={<Button size="small" type="primary" onClick={() => applyAdaptation(Object.keys(adaptSuggestions.suggested_additions), [])}>全部添加</Button>}>
                <List size="small" dataSource={Object.entries(adaptSuggestions.suggested_additions)} renderItem(([cap, info]: [string, any]) => (
                  <List.Item extra={<Button size="small" onClick={() => applyAdaptation([cap], [])}>添加</Button>}>
                    <Tag color="green">{cap}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>{info.reason}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>置信度: {info.confidence}</Text>
                  </List.Item>
                )} />
              </Card>
            )}
            {Object.keys(adaptSuggestions.suggested_removals || {}).length > 0 && (
              <Card size="small" title="建议移除" style={{ marginTop: 12 }} type="inner" extra={<Button size="small" danger onClick={() => applyAdaptation([], Object.keys(adaptSuggestions.suggested_removals))}>全部移除</Button>}>
                <List size="small" dataSource={Object.entries(adaptSuggestions.suggested_removals)} renderItem(([cap, info]: [string, any]) => (
                  <List.Item extra={<Button size="small" danger onClick={() => applyAdaptation([], [cap])}>移除</Button>}>
                    <Tag color="red">{cap}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>{info.reason}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>置信度: {info.confidence}</Text>
                  </List.Item>
                )} />
              </Card>
            )}
            {Object.keys(adaptSuggestions.suggested_additions || {}).length === 0 && Object.keys(adaptSuggestions.suggested_removals || {}).length === 0 && (
              <Empty description="当前没有需要调整的能力" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 20 }} />
            )}
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>净变化: {adaptSuggestions.net_change || 0}</Text>
            </div>
          </div>
        ) : (
          <Spin />
        )}
      </Modal>

      {/* Cross-Project Tasks Modal */}
      <Modal
        title={`跨项目任务 — ${selectedAgent?.name || ''}`}
        open={crossTasksOpen}
        onCancel={() => setCrossTasksOpen(false)}
        footer={null}
        width={700}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          以下是 {selectedAgent?.name} 跨项目授权的项目中可领取的任务，按能力匹配度排序。
        </Text>
        {crossTasks.length === 0 ? (
          <Empty description="暂无可领取的跨项目任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={crossTasks}
            style={{ maxHeight: 500, overflowY: 'auto' }}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  <Button key="claim" size="small" type="primary" onClick={() => claimCrossTask(item.task.id)}>
                    领取
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={item.match?.score >= 50 ? 'green' : item.match?.score >= 20 ? 'orange' : 'default'}>
                        {item.match?.score || 0} 分
                      </Tag>
                      <Text strong>{item.task?.title}</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <Space size={4}>
                        <Tag color="blue">{item.project?.name}</Tag>
                        <Tag>{item.role_in_project}</Tag>
                        {item.task?.priority && <Tag color="red">优先级 {item.task.priority}</Tag>}
                      </Space>
                      {item.match?.matched_capabilities?.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>匹配能力: </Text>
                          {item.match.matched_capabilities.map((c: string, i: number) => (
                            <Tag key={i} color="geekblue" style={{ fontSize: 10 }}>{c}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  )
}

export default Agents
