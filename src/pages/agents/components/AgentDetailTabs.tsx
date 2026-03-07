import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Card,
  Descriptions,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { agentAutomationApi, agentInsightsApi, type Agent, type AgentRun } from '../../../api/agents'
import type {
  AgentActivityItem,
  AgentInteractionInsightItem,
  AgentProjectInsightItem,
  AgentTaskInsightItem,
} from '../../../api/agents'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import { AgentKeysCard } from './AgentKeysCard'
import { AgentSecretsCard } from './AgentSecretsCard'
import { AgentSoulVersionsCard } from './AgentSoulVersionsCard'

const { Text } = Typography
const { Search } = Input

const activitySourceValues = ['agent_run', 'agent_task_attempt', 'agent_task_event', 'task_log', 'agent_audit']
const activityLevelValues = ['info', 'warn', 'error']
const taskStatusValues = ['todo', 'in_progress', 'review', 'done', 'cancelled']
const runStateValues = ['queued', 'leased', 'running', 'succeeded', 'failed', 'cancelled', 'expired']

const runStateColorMap: Record<string, 'success' | 'warning' | 'error' | 'default' | 'processing'> = {
  queued: 'default',
  leased: 'processing',
  running: 'processing',
  succeeded: 'success',
  failed: 'error',
  cancelled: 'warning',
  expired: 'error',
}

const taskStatusColorMap: Record<string, string> = {
  todo: 'default',
  in_progress: 'processing',
  review: 'warning',
  done: 'success',
  cancelled: 'default',
}

const activityLevelStatus: Record<string, 'success' | 'warning' | 'error' | 'default' | 'processing'> = {
  info: 'default',
  warn: 'warning',
  error: 'error',
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function normalizeDateTimeFilterValue(value: string) {
  const text = value.trim()
  if (!text) {
    return undefined
  }
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }
  return parsed.toISOString()
}

interface AgentDetailTabsProps {
  workspaceId: number | null
  agent: Agent
  onAfterRollback: () => void | Promise<void>
  activeTab?: AgentDetailTabKey
  onTabChange?: (tab: AgentDetailTabKey) => void
}

const emptyPagination = { page: 1, per_page: 20, total: 0, has_prev: false, has_next: false }

export const AGENT_DETAIL_TAB_KEYS = [
  'overview',
  'activity',
  'projects',
  'interactions',
  'tasks',
  'runs',
  'keys',
  'soul',
  'secrets',
] as const

export type AgentDetailTabKey = (typeof AGENT_DETAIL_TAB_KEYS)[number]

const agentDetailTabKeySet = new Set<string>(AGENT_DETAIL_TAB_KEYS)

export function isAgentDetailTabKey(value: string | null | undefined): value is AgentDetailTabKey {
  return Boolean(value && agentDetailTabKeySet.has(value))
}

export function AgentDetailTabs({
  workspaceId,
  agent,
  onAfterRollback,
  activeTab: controlledActiveTab,
  onTabChange,
}: AgentDetailTabsProps) {
  const { tp } = usePageTranslation('agents')
  const [internalActiveTab, setInternalActiveTab] = useState<AgentDetailTabKey>('overview')
  const activeTab = controlledActiveTab && isAgentDetailTabKey(controlledActiveTab) ? controlledActiveTab : internalActiveTab

  const handleTabChange = (nextKey: string) => {
    if (!isAgentDetailTabKey(nextKey)) {
      return
    }
    if (!controlledActiveTab) {
      setInternalActiveTab(nextKey)
    }
    onTabChange?.(nextKey)
  }

  const [activityLoading, setActivityLoading] = useState(false)
  const [activityItems, setActivityItems] = useState<AgentActivityItem[]>([])
  const [activityPagination, setActivityPagination] = useState(emptyPagination)
  const [activitySource, setActivitySource] = useState<string | undefined>(undefined)
  const [activityLevel, setActivityLevel] = useState<string | undefined>(undefined)
  const [activityEventType, setActivityEventType] = useState('')
  const [activityEventTypeInput, setActivityEventTypeInput] = useState('')
  const [activityQuery, setActivityQuery] = useState('')
  const [activityInputQuery, setActivityInputQuery] = useState('')
  const [activityTaskId, setActivityTaskId] = useState<number | undefined>(undefined)
  const [activityProjectId, setActivityProjectId] = useState<number | undefined>(undefined)
  const [activityRunId, setActivityRunId] = useState('')
  const [activityRunIdInput, setActivityRunIdInput] = useState('')
  const [activityAttemptId, setActivityAttemptId] = useState('')
  const [activityAttemptIdInput, setActivityAttemptIdInput] = useState('')
  const [activityRiskMin, setActivityRiskMin] = useState<number | undefined>(undefined)
  const [activityRiskMax, setActivityRiskMax] = useState<number | undefined>(undefined)
  const [activityFrom, setActivityFrom] = useState('')
  const [activityTo, setActivityTo] = useState('')
  const [activitySourceSummary, setActivitySourceSummary] = useState<Record<string, number>>({})
  const [activityLevelSummary, setActivityLevelSummary] = useState<Record<string, number>>({})
  const [activityDetailItem, setActivityDetailItem] = useState<AgentActivityItem | null>(null)

  const [projectLoading, setProjectLoading] = useState(false)
  const [projectItems, setProjectItems] = useState<AgentProjectInsightItem[]>([])
  const [projectPagination, setProjectPagination] = useState(emptyPagination)
  const [projectQuery, setProjectQuery] = useState('')
  const [projectInputQuery, setProjectInputQuery] = useState('')

  const [interactionLoading, setInteractionLoading] = useState(false)
  const [interactionItems, setInteractionItems] = useState<AgentInteractionInsightItem[]>([])
  const [interactionPagination, setInteractionPagination] = useState(emptyPagination)
  const [interactionQuery, setInteractionQuery] = useState('')
  const [interactionInputQuery, setInteractionInputQuery] = useState('')

  const [taskLoading, setTaskLoading] = useState(false)
  const [taskItems, setTaskItems] = useState<AgentTaskInsightItem[]>([])
  const [taskPagination, setTaskPagination] = useState(emptyPagination)
  const [taskQuery, setTaskQuery] = useState('')
  const [taskInputQuery, setTaskInputQuery] = useState('')
  const [taskStatus, setTaskStatus] = useState<string | undefined>(undefined)
  const [taskProjectId, setTaskProjectId] = useState<number | undefined>(undefined)
  const [taskProjectOptions, setTaskProjectOptions] = useState<Array<{ label: string; value: number }>>([])

  const [runLoading, setRunLoading] = useState(false)
  const [runItems, setRunItems] = useState<AgentRun[]>([])
  const [runPagination, setRunPagination] = useState(emptyPagination)
  const [runState, setRunState] = useState<string | undefined>(undefined)

  const executionModeLabels = useMemo(
    () => ({
      external_pull: tp('detail.enums.executionMode.external_pull', { defaultValue: 'External Pull' }),
      managed_runner: tp('detail.enums.executionMode.managed_runner', { defaultValue: 'Managed Runner' }),
    }),
    [tp]
  )

  const reasoningModeLabels = useMemo(
    () => ({
      balanced: tp('detail.enums.reasoningMode.balanced', { defaultValue: 'Balanced' }),
      fast: tp('detail.enums.reasoningMode.fast', { defaultValue: 'Fast' }),
      deep: tp('detail.enums.reasoningMode.deep', { defaultValue: 'Deep' }),
    }),
    [tp]
  )

  const activitySourceOptions = useMemo(
    () =>
      activitySourceValues.map((value) => ({
        value,
        label: tp(`detail.activity.sources.${value}`, { defaultValue: value }),
      })),
    [tp]
  )

  const activityLevelOptions = useMemo(
    () =>
      activityLevelValues.map((value) => ({
        value,
        label: tp(`detail.activity.levels.${value}`, { defaultValue: value }),
      })),
    [tp]
  )

  const taskStatusOptions = useMemo(
    () =>
      taskStatusValues.map((value) => ({
        value,
        label: tp(`detail.enums.taskStatus.${value}`, { defaultValue: value }),
      })),
    [tp]
  )

  const runStateOptions = useMemo(
    () =>
      runStateValues.map((value) => ({
        value,
        label: tp(`detail.enums.runState.${value}`, { defaultValue: value }),
      })),
    [tp]
  )

  const getExecutionModeLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return executionModeLabels[key as keyof typeof executionModeLabels] || key
    },
    [executionModeLabels]
  )

  const getReasoningModeLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return reasoningModeLabels[key as keyof typeof reasoningModeLabels] || key
    },
    [reasoningModeLabels]
  )

  const getStatusLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      if (key === 'active') return tp('form.status.active')
      if (key === 'inactive') return tp('form.status.inactive')
      if (key === 'revoked') return tp('form.status.revoked')
      return key
    },
    [tp]
  )

  const getActivitySourceLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return tp(`detail.activity.sources.${key}`, { defaultValue: key })
    },
    [tp]
  )

  const getActivityLevelLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return tp(`detail.activity.levels.${key}`, { defaultValue: key })
    },
    [tp]
  )

  const getTaskStatusLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return tp(`detail.enums.taskStatus.${key}`, { defaultValue: key })
    },
    [tp]
  )

  const getAttemptStateLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return tp(`detail.enums.attemptState.${key}`, { defaultValue: key })
    },
    [tp]
  )

  const getRunStateLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return tp(`detail.enums.runState.${key}`, { defaultValue: key })
    },
    [tp]
  )

  useEffect(() => {
    setActivityPagination((prev) => ({ ...prev, page: 1 }))
    setProjectPagination((prev) => ({ ...prev, page: 1 }))
    setInteractionPagination((prev) => ({ ...prev, page: 1 }))
    setTaskPagination((prev) => ({ ...prev, page: 1 }))
    setRunPagination((prev) => ({ ...prev, page: 1 }))

    setActivitySource(undefined)
    setActivityLevel(undefined)
    setActivityEventType('')
    setActivityEventTypeInput('')
    setActivityQuery('')
    setActivityInputQuery('')
    setActivityTaskId(undefined)
    setActivityProjectId(undefined)
    setActivityRunId('')
    setActivityRunIdInput('')
    setActivityAttemptId('')
    setActivityAttemptIdInput('')
    setActivityRiskMin(undefined)
    setActivityRiskMax(undefined)
    setActivityFrom('')
    setActivityTo('')
    setActivitySourceSummary({})
    setActivityLevelSummary({})
    setActivityDetailItem(null)
    setTaskProjectId(undefined)
    setTaskProjectOptions([])
  }, [agent.id, workspaceId])

  const loadActivity = useCallback(async () => {
    if (!workspaceId) {
      setActivityItems([])
      setActivityPagination(emptyPagination)
      setActivitySourceSummary({})
      return
    }
    try {
      setActivityLoading(true)
      const data = await agentInsightsApi.getActivity(workspaceId, agent.id, {
        page: activityPagination.page,
        per_page: activityPagination.per_page,
        source: activitySource,
        level: activityLevel,
        event_type: activityEventType || undefined,
        q: activityQuery || undefined,
        task_id: activityTaskId,
        project_id: activityProjectId,
        run_id: activityRunId || undefined,
        attempt_id: activityAttemptId || undefined,
        min_risk_score: activityRiskMin,
        max_risk_score: activityRiskMax,
        from: normalizeDateTimeFilterValue(activityFrom),
        to: normalizeDateTimeFilterValue(activityTo),
      })
      setActivityItems(data.items || [])
      setActivityPagination(data.pagination || emptyPagination)
      setActivitySourceSummary(data.summary?.sources || {})
      setActivityLevelSummary(data.summary?.levels || {})
    } catch (error: any) {
      message.error(error?.message || tp('messages.loadAgentsFailed'))
    } finally {
      setActivityLoading(false)
    }
  }, [
    workspaceId,
    agent.id,
    activityPagination.page,
    activityPagination.per_page,
    activitySource,
    activityLevel,
    activityEventType,
    activityQuery,
    activityTaskId,
    activityProjectId,
    activityRunId,
    activityAttemptId,
    activityRiskMin,
    activityRiskMax,
    activityFrom,
    activityTo,
    tp,
  ])

  const loadProjects = useCallback(async () => {
    if (!workspaceId) {
      setProjectItems([])
      setProjectPagination(emptyPagination)
      return
    }
    try {
      setProjectLoading(true)
      const data = await agentInsightsApi.getProjects(workspaceId, agent.id, {
        page: projectPagination.page,
        per_page: projectPagination.per_page,
        search: projectQuery || undefined,
      })
      setProjectItems(data.items || [])
      setProjectPagination(data.pagination || emptyPagination)
    } catch (error: any) {
      message.error(error?.message || tp('messages.loadAgentsFailed'))
    } finally {
      setProjectLoading(false)
    }
  }, [workspaceId, agent.id, projectPagination.page, projectPagination.per_page, projectQuery, tp])

  const loadTaskProjectOptions = useCallback(async () => {
    if (!workspaceId) {
      setTaskProjectOptions([])
      return
    }

    try {
      const data = await agentInsightsApi.getProjects(workspaceId, agent.id, {
        page: 1,
        per_page: 200,
      })
      const options = (data.items || []).map((item) => ({
        label: `${item.project_name} (#${item.project_id})`,
        value: item.project_id,
      }))
      setTaskProjectOptions(options)
    } catch {
      setTaskProjectOptions([])
    }
  }, [workspaceId, agent.id])

  const loadInteractions = useCallback(async () => {
    if (!workspaceId) {
      setInteractionItems([])
      setInteractionPagination(emptyPagination)
      return
    }
    try {
      setInteractionLoading(true)
      const data = await agentInsightsApi.getInteractions(workspaceId, agent.id, {
        page: interactionPagination.page,
        per_page: interactionPagination.per_page,
        search: interactionQuery || undefined,
      })
      setInteractionItems(data.items || [])
      setInteractionPagination(data.pagination || emptyPagination)
    } catch (error: any) {
      message.error(error?.message || tp('messages.loadAgentsFailed'))
    } finally {
      setInteractionLoading(false)
    }
  }, [workspaceId, agent.id, interactionPagination.page, interactionPagination.per_page, interactionQuery, tp])

  const loadTasks = useCallback(async () => {
    if (!workspaceId) {
      setTaskItems([])
      setTaskPagination(emptyPagination)
      return
    }
    try {
      setTaskLoading(true)
      const data = await agentInsightsApi.getTasks(workspaceId, agent.id, {
        page: taskPagination.page,
        per_page: taskPagination.per_page,
        search: taskQuery || undefined,
        status: taskStatus || undefined,
        project_id: taskProjectId,
      })
      setTaskItems(data.items || [])
      setTaskPagination(data.pagination || emptyPagination)
    } catch (error: any) {
      message.error(error?.message || tp('messages.loadAgentsFailed'))
    } finally {
      setTaskLoading(false)
    }
  }, [workspaceId, agent.id, taskPagination.page, taskPagination.per_page, taskQuery, taskStatus, taskProjectId, tp])

  const loadRuns = useCallback(async () => {
    if (!workspaceId) {
      setRunItems([])
      setRunPagination(emptyPagination)
      return
    }
    try {
      setRunLoading(true)
      const data = await agentAutomationApi.listRuns(workspaceId, agent.id, {
        page: runPagination.page,
        per_page: runPagination.per_page,
        state: runState || undefined,
      })
      setRunItems(data.items || [])
      setRunPagination(data.pagination || emptyPagination)
    } catch (error: any) {
      message.error(error?.message || tp('messages.loadAgentsFailed'))
    } finally {
      setRunLoading(false)
    }
  }, [workspaceId, agent.id, runPagination.page, runPagination.per_page, runState, tp])

  useEffect(() => {
    if (activeTab === 'activity') {
      void loadActivity()
    }
  }, [activeTab, loadActivity])

  useEffect(() => {
    if (activeTab === 'projects') {
      void loadProjects()
    }
  }, [activeTab, loadProjects])

  useEffect(() => {
    if (activeTab === 'interactions') {
      void loadInteractions()
    }
  }, [activeTab, loadInteractions])

  useEffect(() => {
    if (activeTab === 'tasks') {
      void loadTaskProjectOptions()
      void loadTasks()
    }
  }, [activeTab, loadTaskProjectOptions, loadTasks])

  useEffect(() => {
    if (activeTab === 'runs') {
      void loadRuns()
    }
  }, [activeTab, loadRuns])

  const overviewItems = useMemo(
    () => [
      { key: 'id', label: tp('detail.overview.agentId', { defaultValue: 'Agent ID' }), children: agent.id },
      { key: 'workspace', label: tp('detail.overview.workspaceId', { defaultValue: 'Workspace ID' }), children: agent.workspace_id },
      {
        key: 'status',
        label: tp('table.status'),
        children: <Tag>{getStatusLabel(agent.status)}</Tag>,
      },
      {
        key: 'displayName',
        label: tp('detail.overview.displayName', { defaultValue: 'Display Name' }),
        children: agent.display_name || '-',
      },
      {
        key: 'creatorUserId',
        label: tp('detail.overview.creatorUserId', { defaultValue: 'Creator User ID' }),
        children: agent.creator_user_id || '-',
      },
      {
        key: 'executionMode',
        label: tp('detail.overview.executionMode', { defaultValue: 'Execution Mode' }),
        children: getExecutionModeLabel(agent.execution_mode),
      },
      { key: 'runnerEnabled', label: tp('detail.overview.runnerEnabled', { defaultValue: 'Runner Enabled' }), children: agent.runner_enabled ? tp('detail.common.yes', { defaultValue: 'Yes' }) : tp('detail.common.no', { defaultValue: 'No' }) },
      { key: 'llmProvider', label: tp('form.fields.llmProvider'), children: agent.llm_provider || '-' },
      { key: 'llmModel', label: tp('form.fields.llmModel'), children: agent.llm_model || '-' },
      { key: 'reasoning', label: tp('form.fields.reasoningMode'), children: getReasoningModeLabel(agent.reasoning_mode) },
      { key: 'temperature', label: tp('form.fields.temperature'), children: typeof agent.temperature === 'number' ? agent.temperature : '-' },
      { key: 'topP', label: tp('form.fields.topP'), children: typeof agent.top_p === 'number' ? agent.top_p : '-' },
      { key: 'maxOutputTokens', label: tp('form.fields.maxOutputTokens'), children: agent.max_output_tokens ?? '-' },
      { key: 'contextWindowTokens', label: tp('form.fields.contextWindowTokens'), children: agent.context_window_tokens ?? '-' },
      { key: 'maxConcurrency', label: tp('form.fields.maxConcurrency'), children: agent.max_concurrency ?? '-' },
      { key: 'maxRetry', label: tp('form.fields.maxRetry'), children: agent.max_retry ?? '-' },
      { key: 'timeoutSeconds', label: tp('form.fields.timeoutSeconds'), children: agent.timeout_seconds ?? '-' },
      { key: 'heartbeatIntervalSeconds', label: tp('form.fields.heartbeatIntervalSeconds'), children: agent.heartbeat_interval_seconds ?? '-' },
      { key: 'sandboxProfile', label: tp('detail.overview.sandboxProfile', { defaultValue: 'Sandbox Profile' }), children: agent.sandbox_profile || '-' },
      {
        key: 'allowedProjectIds',
        label: tp('detail.overview.allowedProjectIds', { defaultValue: 'Allowed Project IDs' }),
        children: (agent.allowed_project_ids || []).length > 0 ? (agent.allowed_project_ids || []).join(', ') : '-',
      },
      { key: 'configVersion', label: tp('detail.overview.configVersion', { defaultValue: 'Config Version' }), children: agent.config_version || 1 },
      { key: 'runnerConfigVersion', label: tp('detail.overview.runnerConfigVersion', { defaultValue: 'Runner Config Version' }), children: agent.runner_config_version || 1 },
      { key: 'soulVersion', label: tp('detail.overview.soulVersion', { defaultValue: 'SOUL Version' }), children: agent.soul_version || 1 },
      { key: 'createdAt', label: tp('detail.overview.createdAt', { defaultValue: 'Created At' }), children: formatDateTime(agent.created_at) },
      { key: 'updatedAt', label: tp('detail.overview.updatedAt', { defaultValue: 'Updated At' }), children: formatDateTime(agent.updated_at) },
    ],
    [agent, tp, getExecutionModeLabel, getReasoningModeLabel, getStatusLabel]
  )

  const activityColumns: ColumnsType<AgentActivityItem> = [
    {
      title: tp('detail.activity.source', { defaultValue: 'Source' }),
      dataIndex: 'source',
      key: 'source',
      width: 150,
      render: (value) => <Tag>{getActivitySourceLabel(value)}</Tag>,
    },
    {
      title: tp('detail.activity.eventType', { defaultValue: 'Event Type' }),
      dataIndex: 'event_type',
      key: 'event_type',
      width: 220,
      render: (value) => <Text code>{value}</Text>,
    },
    {
      title: tp('detail.activity.level', { defaultValue: 'Level' }),
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (value) => <Badge status={activityLevelStatus[value] || 'default'} text={getActivityLevelLabel(value)} />,
    },
    {
      title: tp('detail.activity.related', { defaultValue: 'Related' }),
      key: 'related',
      width: 250,
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          {row.task_id ? <Text type="secondary">{`${tp('detail.activity.taskId', { defaultValue: 'Task ID' })}: ${row.task_id}${row.task_title ? ` | ${row.task_title}` : ''}`}</Text> : null}
          {row.project_id ? <Text type="secondary">{`${tp('detail.activity.projectId', { defaultValue: 'Project ID' })}: ${row.project_id}${row.project_name ? ` | ${row.project_name}` : ''}`}</Text> : null}
          {row.run_id ? <Text type="secondary">{`${tp('detail.activity.runId', { defaultValue: 'Run ID' })}: ${row.run_id}`}</Text> : null}
          {row.attempt_id ? <Text type="secondary">{`${tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}: ${row.attempt_id}`}</Text> : null}
        </Space>
      ),
    },
    {
      title: tp('detail.activity.message', { defaultValue: 'Message' }),
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (value, row) => (
        <Space direction="vertical" size={2}>
          <span>{value || '-'}</span>
          {typeof row.risk_score === 'number' ? (
            <Text type="secondary">{`${tp('detail.activity.riskScore', { defaultValue: 'Risk Score' })}: ${row.risk_score}`}</Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: tp('detail.activity.occurredAt', { defaultValue: 'Occurred At' }),
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      width: 180,
      render: (value) => formatDateTime(value),
    },
  ]

  const projectColumns: ColumnsType<AgentProjectInsightItem> = [
    {
      title: tp('detail.projects.project', { defaultValue: 'Project' }),
      key: 'project_name',
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <span>{row.project_name}</span>
          <Text type="secondary">{'#' + row.project_id}</Text>
        </Space>
      ),
    },
    {
      title: tp('detail.projects.allowed', { defaultValue: 'Allowed' }),
      dataIndex: 'is_explicitly_allowed',
      key: 'is_explicitly_allowed',
      width: 110,
      render: (value) => (
        <Tag color={value ? 'green' : 'default'}>
          {value ? tp('detail.common.yes', { defaultValue: 'Yes' }) : tp('detail.common.no', { defaultValue: 'No' })}
        </Tag>
      ),
    },
    {
      title: tp('detail.projects.touchedTasks', { defaultValue: 'Touched Tasks' }),
      dataIndex: 'touched_task_count',
      key: 'touched_task_count',
      width: 130,
    },
    {
      title: tp('detail.projects.committedTasks', { defaultValue: 'Committed Tasks' }),
      dataIndex: 'committed_task_count',
      key: 'committed_task_count',
      width: 140,
    },
    {
      title: tp('detail.projects.interactionLogs', { defaultValue: 'Interaction Logs' }),
      dataIndex: 'interaction_log_count',
      key: 'interaction_log_count',
      width: 140,
    },
    {
      title: tp('detail.projects.lastActivity', { defaultValue: 'Last Activity' }),
      dataIndex: 'last_activity_at',
      key: 'last_activity_at',
      width: 180,
      render: (value) => formatDateTime(value),
    },
  ]

  const interactionColumns: ColumnsType<AgentInteractionInsightItem> = [
    {
      title: tp('detail.interactions.user', { defaultValue: 'User' }),
      key: 'display_name',
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <span>{row.display_name}</span>
          <Text type="secondary">{row.email || '#' + row.user_id}</Text>
        </Space>
      ),
    },
    {
      title: tp('detail.interactions.interactionCount', { defaultValue: 'Interactions' }),
      dataIndex: 'interaction_count',
      key: 'interaction_count',
      width: 130,
    },
    {
      title: tp('detail.interactions.taskCount', { defaultValue: 'Tasks' }),
      dataIndex: 'task_count',
      key: 'task_count',
      width: 110,
    },
    {
      title: tp('detail.interactions.lastInteraction', { defaultValue: 'Last Interaction' }),
      dataIndex: 'last_interaction_at',
      key: 'last_interaction_at',
      width: 180,
      render: (value) => formatDateTime(value),
    },
  ]

  const taskColumns: ColumnsType<AgentTaskInsightItem> = [
    {
      title: tp('detail.tasks.task', { defaultValue: 'Task' }),
      key: 'title',
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <span>{row.title}</span>
          <Text type="secondary">{'Task #' + row.task_id + ' | ' + (row.project_name || '-')}</Text>
        </Space>
      ),
    },
    {
      title: tp('detail.tasks.status', { defaultValue: 'Status' }),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => <Tag color={taskStatusColorMap[value] || 'default'}>{getTaskStatusLabel(value)}</Tag>,
    },
    {
      title: tp('detail.tasks.lastAttempt', { defaultValue: 'Last Attempt' }),
      key: 'last_attempt',
      width: 220,
      render: (_, row) =>
        row.last_attempt ? (
          <Space direction="vertical" size={2}>
            <Tag>{getAttemptStateLabel(row.last_attempt.state)}</Tag>
            <Text type="secondary">{row.last_attempt.attempt_id}</Text>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: tp('detail.tasks.agentLogs', { defaultValue: 'Agent Logs' }),
      dataIndex: 'agent_log_count',
      key: 'agent_log_count',
      width: 110,
    },
    {
      title: tp('detail.tasks.lastActivity', { defaultValue: 'Last Activity' }),
      dataIndex: 'last_activity_at',
      key: 'last_activity_at',
      width: 180,
      render: (value) => formatDateTime(value),
    },
  ]

  const runColumns: ColumnsType<AgentRun> = [
    {
      title: tp('detail.runs.run', { defaultValue: 'Run' }),
      key: 'run',
      render: (_, row) => (
        <Space direction="vertical" size={2}>
          <Text code>{row.run_id}</Text>
          <Text type="secondary">{row.trigger_reason}</Text>
        </Space>
      ),
    },
    {
      title: tp('detail.runs.state', { defaultValue: 'State' }),
      dataIndex: 'state',
      key: 'state',
      width: 120,
      render: (value: string) => <Badge status={runStateColorMap[value] || 'default'} text={getRunStateLabel(value)} />,
    },
    {
      title: tp('detail.runs.scheduledAt', { defaultValue: 'Scheduled At' }),
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: tp('detail.runs.endedAt', { defaultValue: 'Ended At' }),
      dataIndex: 'ended_at',
      key: 'ended_at',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: tp('detail.runs.failure', { defaultValue: 'Failure' }),
      key: 'failure',
      ellipsis: true,
      render: (_, row) => row.failure_reason || row.failure_code || '-',
    },
  ]

  return (
    <Card title={tp('detail.title', { defaultValue: 'Agent Detail' })}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'overview',
            label: tp('detail.tabs.overview', { defaultValue: 'Overview' }),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Descriptions bordered size="small" column={2} items={overviewItems} />
                <Space wrap>
                  {(agent.capability_tags || []).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </Space>
            ),
          },
          {
            key: 'activity',
            label: tp('detail.tabs.activity', { defaultValue: 'Activity' }),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Space wrap>
                  <Select
                    allowClear
                    placeholder={tp('detail.activity.sourceFilter', { defaultValue: 'Source' })}
                    options={activitySourceOptions}
                    value={activitySource}
                    style={{ width: 180 }}
                    onChange={(value) => {
                      setActivitySource(value)
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                  />
                  <Select
                    allowClear
                    placeholder={tp('detail.activity.levelFilter', { defaultValue: 'Level' })}
                    options={activityLevelOptions}
                    value={activityLevel}
                    style={{ width: 150 }}
                    onChange={(value) => {
                      setActivityLevel(value)
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                  />
                  <Input
                    placeholder={tp('detail.activity.eventTypeFilter', { defaultValue: 'Event Type Contains' })}
                    value={activityEventTypeInput}
                    style={{ width: 220 }}
                    onChange={(event) => setActivityEventTypeInput(event.target.value)}
                    onPressEnter={() => {
                      setActivityEventType(activityEventTypeInput.trim())
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    onBlur={() => {
                      setActivityEventType(activityEventTypeInput.trim())
                    }}
                  />
                  <InputNumber
                    min={1}
                    value={activityTaskId}
                    placeholder={tp('detail.activity.taskIdFilter', { defaultValue: 'Task ID' })}
                    onChange={(value) => {
                      setActivityTaskId(typeof value === 'number' ? value : undefined)
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    style={{ width: 140 }}
                  />
                  <InputNumber
                    min={1}
                    value={activityProjectId}
                    placeholder={tp('detail.activity.projectIdFilter', { defaultValue: 'Project ID' })}
                    onChange={(value) => {
                      setActivityProjectId(typeof value === 'number' ? value : undefined)
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    style={{ width: 140 }}
                  />
                  <Input
                    placeholder={tp('detail.activity.runIdFilter', { defaultValue: 'Run ID Contains' })}
                    value={activityRunIdInput}
                    style={{ width: 220 }}
                    onChange={(event) => setActivityRunIdInput(event.target.value)}
                    onPressEnter={() => {
                      setActivityRunId(activityRunIdInput.trim())
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    onBlur={() => {
                      setActivityRunId(activityRunIdInput.trim())
                    }}
                  />
                  <Input
                    placeholder={tp('detail.activity.attemptIdFilter', { defaultValue: 'Attempt ID Contains' })}
                    value={activityAttemptIdInput}
                    style={{ width: 220 }}
                    onChange={(event) => setActivityAttemptIdInput(event.target.value)}
                    onPressEnter={() => {
                      setActivityAttemptId(activityAttemptIdInput.trim())
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    onBlur={() => {
                      setActivityAttemptId(activityAttemptIdInput.trim())
                    }}
                  />
                  <InputNumber
                    min={0}
                    value={activityRiskMin}
                    placeholder={tp('detail.activity.minRiskFilter', { defaultValue: 'Min Risk' })}
                    onChange={(value) => {
                      setActivityRiskMin(typeof value === 'number' ? value : undefined)
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    style={{ width: 140 }}
                  />
                  <InputNumber
                    min={0}
                    value={activityRiskMax}
                    placeholder={tp('detail.activity.maxRiskFilter', { defaultValue: 'Max Risk' })}
                    onChange={(value) => {
                      setActivityRiskMax(typeof value === 'number' ? value : undefined)
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    style={{ width: 140 }}
                  />
                  <Search
                    placeholder={tp('detail.activity.search', { defaultValue: 'Search message / payload' })}
                    allowClear
                    value={activityInputQuery}
                    onChange={(event) => setActivityInputQuery(event.target.value)}
                    onSearch={(value) => {
                      setActivityQuery(value)
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    style={{ width: 280 }}
                  />
                  <Input
                    type="datetime-local"
                    value={activityFrom}
                    placeholder={tp('detail.activity.from', { defaultValue: 'From' })}
                    onChange={(event) => {
                      setActivityFrom(event.target.value)
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    style={{ width: 200 }}
                  />
                  <Input
                    type="datetime-local"
                    value={activityTo}
                    placeholder={tp('detail.activity.to', { defaultValue: 'To' })}
                    onChange={(event) => {
                      setActivityTo(event.target.value)
                      setActivityPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                    style={{ width: 200 }}
                  />
                </Space>
                <Space wrap size={[8, 8]}>
                  {Object.entries(activitySourceSummary).map(([source, count]) => (
                    <Tag key={source}>
                      {getActivitySourceLabel(source)}: {count}
                    </Tag>
                  ))}
                  {Object.entries(activityLevelSummary).map(([level, count]) => (
                    <Tag key={`level-${level}`}>
                      {getActivityLevelLabel(level)}: {count}
                    </Tag>
                  ))}
                </Space>
                <Table
                  rowKey="id"
                  loading={activityLoading}
                  columns={activityColumns}
                  dataSource={activityItems}
                  pagination={{
                    current: activityPagination.page,
                    pageSize: activityPagination.per_page,
                    total: activityPagination.total,
                    showSizeChanger: true,
                  }}
                  onRow={(record) => ({
                    onClick: () => setActivityDetailItem(record),
                    style: { cursor: 'pointer' },
                  })}
                  onChange={(pagination) => {
                    setActivityPagination((prev) => ({
                      ...prev,
                      page: pagination.current || 1,
                      per_page: pagination.pageSize || prev.per_page,
                    }))
                  }}
                />
                <Text type="secondary">{tp('detail.activity.clickHint', { defaultValue: 'Click a row to view details.' })}</Text>
                <Modal
                  title={tp('detail.activity.detailTitle', { defaultValue: 'Activity Detail' })}
                  open={!!activityDetailItem}
                  onCancel={() => setActivityDetailItem(null)}
                  onOk={() => setActivityDetailItem(null)}
                  okText={tp('detail.activity.close', { defaultValue: 'Close' })}
                  cancelButtonProps={{ style: { display: 'none' } }}
                  width={900}
                >
                  <Descriptions bordered size="small" column={2}>
                    <Descriptions.Item label={tp('detail.activity.source', { defaultValue: 'Source' })}>
                      {getActivitySourceLabel(activityDetailItem?.source)}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.level', { defaultValue: 'Level' })}>
                      {getActivityLevelLabel(activityDetailItem?.level)}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.eventType', { defaultValue: 'Event Type' })} span={2}>
                      <Text code>{activityDetailItem?.event_type || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.occurredAt', { defaultValue: 'Occurred At' })}>
                      {formatDateTime(activityDetailItem?.occurred_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.related', { defaultValue: 'Related' })}>
                      {activityDetailItem?.task_id
                        ? `${tp('detail.activity.taskId', { defaultValue: 'Task ID' })}: ${activityDetailItem.task_id}`
                        : activityDetailItem?.run_id
                          ? `${tp('detail.activity.runId', { defaultValue: 'Run ID' })}: ${activityDetailItem.run_id}`
                          : activityDetailItem?.attempt_id
                            ? `${tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}: ${activityDetailItem.attempt_id}`
                            : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.message', { defaultValue: 'Message' })} span={2}>
                      {activityDetailItem?.message || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.riskScore', { defaultValue: 'Risk Score' })}>
                      {typeof activityDetailItem?.risk_score === 'number' ? activityDetailItem.risk_score : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.correlationId', { defaultValue: 'Correlation ID' })}>
                      {activityDetailItem?.correlation_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.requestId', { defaultValue: 'Request ID' })}>
                      {activityDetailItem?.request_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.durationMs', { defaultValue: 'Duration (ms)' })}>
                      {typeof activityDetailItem?.duration_ms === 'number' ? activityDetailItem.duration_ms : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.errorCode', { defaultValue: 'Error Code' })}>
                      {activityDetailItem?.error_code || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.runId', { defaultValue: 'Run ID' })}>
                      {activityDetailItem?.run_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}>
                      {activityDetailItem?.attempt_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.taskId', { defaultValue: 'Task ID' })}>
                      {activityDetailItem?.task_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.projectId', { defaultValue: 'Project ID' })}>
                      {activityDetailItem?.project_id || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.actor', { defaultValue: 'Actor' })}>
                      {activityDetailItem?.actor_type || activityDetailItem?.actor_id ? `${activityDetailItem?.actor_type || '-'}:${activityDetailItem?.actor_id || '-'}` : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.target', { defaultValue: 'Target' })}>
                      {activityDetailItem?.target_type || activityDetailItem?.target_id ? `${activityDetailItem?.target_type || '-'}:${activityDetailItem?.target_id || '-'}` : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={tp('detail.activity.payload', { defaultValue: 'Payload' })} span={2}>
                      <pre
                        style={{
                          margin: 0,
                          maxHeight: 260,
                          overflow: 'auto',
                          background: '#f7f7f7',
                          border: '1px solid #f0f0f0',
                          borderRadius: 6,
                          padding: 12,
                        }}
                      >
                        {JSON.stringify(activityDetailItem?.payload || {}, null, 2)}
                      </pre>
                    </Descriptions.Item>
                  </Descriptions>
                </Modal>
              </Space>
            ),
          },
          {
            key: 'projects',
            label: tp('detail.tabs.projects', { defaultValue: 'Projects' }),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Search
                  placeholder={tp('detail.projects.search', { defaultValue: 'Search project name' })}
                  allowClear
                  value={projectInputQuery}
                  style={{ width: 280 }}
                  onChange={(event) => setProjectInputQuery(event.target.value)}
                  onSearch={(value) => {
                    setProjectQuery(value)
                    setProjectPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                />
                <Table
                  rowKey="project_id"
                  loading={projectLoading}
                  columns={projectColumns}
                  dataSource={projectItems}
                  pagination={{
                    current: projectPagination.page,
                    pageSize: projectPagination.per_page,
                    total: projectPagination.total,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setProjectPagination((prev) => ({
                      ...prev,
                      page: pagination.current || 1,
                      per_page: pagination.pageSize || prev.per_page,
                    }))
                  }}
                />
              </Space>
            ),
          },
          {
            key: 'interactions',
            label: tp('detail.tabs.interactions', { defaultValue: 'Interactions' }),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Search
                  placeholder={tp('detail.interactions.search', { defaultValue: 'Search user name/email' })}
                  allowClear
                  value={interactionInputQuery}
                  style={{ width: 280 }}
                  onChange={(event) => setInteractionInputQuery(event.target.value)}
                  onSearch={(value) => {
                    setInteractionQuery(value)
                    setInteractionPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                />
                <Table
                  rowKey="user_id"
                  loading={interactionLoading}
                  columns={interactionColumns}
                  dataSource={interactionItems}
                  pagination={{
                    current: interactionPagination.page,
                    pageSize: interactionPagination.per_page,
                    total: interactionPagination.total,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setInteractionPagination((prev) => ({
                      ...prev,
                      page: pagination.current || 1,
                      per_page: pagination.pageSize || prev.per_page,
                    }))
                  }}
                />
              </Space>
            ),
          },
          {
            key: 'tasks',
            label: tp('detail.tabs.tasks', { defaultValue: 'Tasks' }),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Space wrap>
                  <Select
                    allowClear
                    placeholder={tp('detail.tasks.statusFilter', { defaultValue: 'Task status' })}
                    value={taskStatus}
                    style={{ width: 180 }}
                    options={taskStatusOptions}
                    onChange={(value) => {
                      setTaskStatus(value)
                      setTaskPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder={tp('detail.tasks.projectFilter', { defaultValue: 'Project' })}
                    value={taskProjectId}
                    style={{ width: 240 }}
                    options={taskProjectOptions}
                    optionFilterProp="label"
                    onChange={(value) => {
                      setTaskProjectId(value)
                      setTaskPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                  />
                  <Search
                    placeholder={tp('detail.tasks.search', { defaultValue: 'Search task title/content' })}
                    allowClear
                    value={taskInputQuery}
                    style={{ width: 280 }}
                    onChange={(event) => setTaskInputQuery(event.target.value)}
                    onSearch={(value) => {
                      setTaskQuery(value)
                      setTaskPagination((prev) => ({ ...prev, page: 1 }))
                    }}
                  />
                </Space>
                <Table
                  rowKey="task_id"
                  loading={taskLoading}
                  columns={taskColumns}
                  dataSource={taskItems}
                  pagination={{
                    current: taskPagination.page,
                    pageSize: taskPagination.per_page,
                    total: taskPagination.total,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setTaskPagination((prev) => ({
                      ...prev,
                      page: pagination.current || 1,
                      per_page: pagination.pageSize || prev.per_page,
                    }))
                  }}
                />
              </Space>
            ),
          },
          {
            key: 'runs',
            label: tp('detail.tabs.runs', { defaultValue: 'Runs' }),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Select
                  allowClear
                  placeholder={tp('detail.runs.stateFilter', { defaultValue: 'Run state' })}
                  value={runState}
                  style={{ width: 200 }}
                  options={runStateOptions}
                  onChange={(value) => {
                    setRunState(value)
                    setRunPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                />
                <Table
                  rowKey="run_id"
                  loading={runLoading}
                  columns={runColumns}
                  dataSource={runItems}
                  pagination={{
                    current: runPagination.page,
                    pageSize: runPagination.per_page,
                    total: runPagination.total,
                    showSizeChanger: true,
                  }}
                  onChange={(pagination) => {
                    setRunPagination((prev) => ({
                      ...prev,
                      page: pagination.current || 1,
                      per_page: pagination.pageSize || prev.per_page,
                    }))
                  }}
                />
              </Space>
            ),
          },
          {
            key: 'keys',
            label: tp('detail.tabs.keys', { defaultValue: 'Keys' }),
            children: <AgentKeysCard workspaceId={workspaceId} agentId={agent.id} agentName={agent.name} />,
          },
          {
            key: 'soul',
            label: tp('detail.tabs.soul', { defaultValue: 'SOUL Versions' }),
            children: (
              <AgentSoulVersionsCard
                workspaceId={workspaceId}
                agentId={agent.id}
                soulVersion={agent.soul_version}
                onAfterRollback={onAfterRollback}
              />
            ),
          },
          {
            key: 'secrets',
            label: tp('detail.tabs.secrets', { defaultValue: 'Secrets' }),
            children: <AgentSecretsCard workspaceId={workspaceId} agentId={agent.id} />,
          },
        ]}
      />
    </Card>
  )
}

export default AgentDetailTabs
