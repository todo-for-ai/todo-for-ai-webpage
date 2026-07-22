import { Tag, Tooltip, Space, Typography } from 'antd'
import type { Agent, AgentStatus, AgentKind, DispatchTasksData, DispatchPolicy, ReviewQueueItem, TaskAssignmentState, ReviewQueueAction } from '../../api/agents'

const { Text } = Typography

export const DEFAULT_DISPATCH_PREVIEW_OPTIONS: DispatchTasksData = {
  auto_dispatch_enabled: false,
  max_assignments: 5,
  lease_seconds: 1800,
  match_capabilities: true,
  require_capability_match: false,
  include_self: false,
}

export const statusColor: Record<AgentStatus, string> = {
  active: 'green',
  paused: 'gold',
  offline: 'default',
  disabled: 'red',
}

export const stateColor: Record<TaskAssignmentState, string> = {
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

export const kindOptions: { label: string; value: AgentKind }[] = [
  { label: '助手', value: 'assistant' },
  { label: '自主执行', value: 'autonomous' },
  { label: '协调器', value: 'coordinator' },
  { label: '外部系统', value: 'external' },
]

export const statusOptions: { label: string; value: AgentStatus }[] = [
  { label: '活跃', value: 'active' },
  { label: '暂停', value: 'paused' },
  { label: '离线', value: 'offline' },
  { label: '禁用', value: 'disabled' },
]

export const reviewActionOptions: { label: string; value: ReviewQueueAction }[] = [
  { label: '全部待处理', value: 'all' },
  { label: '等待反馈', value: 'human_feedback' },
  { label: '最终审核', value: 'final_review' },
]

export const reviewActionLabel: Record<ReviewQueueItem['action'], string> = {
  human_feedback: '等待人工反馈',
  final_review: '最终审核',
  review: '需要审核',
}

export const reviewActionColor: Record<ReviewQueueItem['action'], string> = {
  human_feedback: 'gold',
  final_review: 'purple',
  review: 'blue',
}

// Agent 预设模板
export const AGENT_TEMPLATES: Record<string, {
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

export const formatDateTime = (value?: string) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString()
}

export const parseLines = (value?: string) => {
  return (value || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean)
}

export const stringifyConfig = (agent?: Agent | null) => {
  if (!agent?.config || Object.keys(agent.config).length === 0) {
    return '{}'
  }
  return JSON.stringify(agent.config, null, 2)
}

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export const toStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map(item => String(item)).filter(Boolean)
}

export const matchStrategyLabel = (strategy: unknown) => {
  if (strategy === 'capability_match') {
    return '能力匹配'
  }
  if (strategy === 'priority_fifo') {
    return '优先级队列'
  }
  return strategy ? String(strategy) : '指定任务'
}

export const normalizeDispatchOptions = (options: DispatchTasksData): DispatchTasksData => {
  const payload: DispatchTasksData = {}

  if (typeof options.auto_dispatch_enabled === 'boolean') {
    payload.auto_dispatch_enabled = options.auto_dispatch_enabled
  }
  if (options.project_id) {
    payload.project_id = Number(options.project_id)
  }
  if (options.max_assignments) {
    payload.max_assignments = Number(options.max_assignments)
  }
  if (options.lease_seconds) {
    payload.lease_seconds = Number(options.lease_seconds)
  }
  if (options.match_capabilities === false) {
    payload.match_capabilities = false
  } else if (options.match_capabilities === true) {
    payload.match_capabilities = true
  }
  if (options.require_capability_match) {
    payload.require_capability_match = true
  }
  if (options.include_self) {
    payload.include_self = true
  }
  if (options.candidate_agent_ids && options.candidate_agent_ids.length > 0) {
    payload.candidate_agent_ids = options.candidate_agent_ids.map(Number).filter(id => Number.isFinite(id))
  }

  return payload
}

export const normalizeDispatchPolicyPayload = (options: DispatchTasksData): DispatchPolicy => ({
  auto_dispatch_enabled: !!options.auto_dispatch_enabled,
  project_id: options.project_id ? Number(options.project_id) : null,
  max_assignments: options.max_assignments ? Number(options.max_assignments) : DEFAULT_DISPATCH_PREVIEW_OPTIONS.max_assignments || 5,
  lease_seconds: options.lease_seconds ? Number(options.lease_seconds) : DEFAULT_DISPATCH_PREVIEW_OPTIONS.lease_seconds || 1800,
  match_capabilities: options.match_capabilities !== false,
  require_capability_match: options.match_capabilities === false ? false : !!options.require_capability_match,
  include_self: !!options.include_self,
  candidate_agent_ids: (options.candidate_agent_ids || []).map(Number).filter(id => Number.isFinite(id) && id > 0),
})

export const getAgentDispatchPolicy = (agent?: Agent | null): DispatchTasksData => {
  const config = isRecord(agent?.config) ? agent?.config : {}
  const policy = isRecord(config?.dispatch_policy) ? config.dispatch_policy : {}
  const candidateIds = Array.isArray(policy.candidate_agent_ids)
    ? policy.candidate_agent_ids.map(Number).filter(id => Number.isFinite(id) && id > 0)
    : undefined

  return {
    ...DEFAULT_DISPATCH_PREVIEW_OPTIONS,
    auto_dispatch_enabled: typeof policy.auto_dispatch_enabled === 'boolean'
      ? policy.auto_dispatch_enabled
      : DEFAULT_DISPATCH_PREVIEW_OPTIONS.auto_dispatch_enabled,
    project_id: policy.project_id ? Number(policy.project_id) : undefined,
    max_assignments: policy.max_assignments ? Number(policy.max_assignments) : DEFAULT_DISPATCH_PREVIEW_OPTIONS.max_assignments,
    lease_seconds: policy.lease_seconds ? Number(policy.lease_seconds) : DEFAULT_DISPATCH_PREVIEW_OPTIONS.lease_seconds,
    match_capabilities: policy.match_capabilities === false ? false : DEFAULT_DISPATCH_PREVIEW_OPTIONS.match_capabilities,
    require_capability_match: !!policy.require_capability_match,
    include_self: !!policy.include_self,
    candidate_agent_ids: candidateIds && candidateIds.length > 0 ? candidateIds : undefined,
  }
}

export const withAgentDispatchPolicy = (agent: Agent, policy: DispatchPolicy): Agent => ({
  ...agent,
  config: {
    ...(isRecord(agent.config) ? agent.config : {}),
    dispatch_policy: policy,
  },
})

export const getClaimMatch = (runMetadata?: Record<string, unknown>) => {
  const capabilityMatch = runMetadata?.capability_match
  return isRecord(capabilityMatch) ? capabilityMatch : null
}

export const renderCapabilities = (capabilities: string[] = [], limit = 4) => {
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

