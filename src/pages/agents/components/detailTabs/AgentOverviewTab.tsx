import { useCallback, useMemo, type ReactNode } from 'react'
import { DeploymentUnitOutlined, ExperimentOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Space, Tag, Typography } from 'antd'
import type { Agent } from '../../../../api/agents'
import { usePageTranslation } from '../../../../i18n/hooks/useTranslation'
import { formatDateTime } from './shared'
import './AgentOverviewTab.css'

interface AgentOverviewTabProps {
  agent: Agent
}

interface LabelValueItem {
  key: string
  label: string
  value: ReactNode
}

interface OverviewPanel {
  key: string
  title: string
  subtitle: string
  icon: ReactNode
  tone: 'runtime' | 'model' | 'limits'
  items: LabelValueItem[]
}

const { Text } = Typography

function renderPrimitive(value: ReactNode) {
  if (typeof value === 'string' || typeof value === 'number') {
    return <Text>{value}</Text>
  }
  return value
}

export function AgentOverviewTab({ agent }: AgentOverviewTabProps) {
  const { tp } = usePageTranslation('agents')
  const emptyText = tp('detail.overview.empty', { defaultValue: '-' })

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

  const getExecutionModeKey = useCallback((value?: string | null) => String(value || '').trim().toLowerCase(), [])
  const getReasoningModeKey = useCallback((value?: string | null) => String(value || '').trim().toLowerCase(), [])
  const getStatusKey = useCallback((value?: string | null) => String(value || '').trim().toLowerCase(), [])

  const getExecutionModeLabel = useCallback(
    (value?: string | null) => {
      const key = getExecutionModeKey(value)
      if (!key) return emptyText
      return executionModeLabels[key as keyof typeof executionModeLabels] || key
    },
    [emptyText, executionModeLabels, getExecutionModeKey]
  )

  const getReasoningModeLabel = useCallback(
    (value?: string | null) => {
      const key = getReasoningModeKey(value)
      if (!key) return emptyText
      return reasoningModeLabels[key as keyof typeof reasoningModeLabels] || key
    },
    [emptyText, reasoningModeLabels, getReasoningModeKey]
  )

  const getStatusLabel = useCallback(
    (value?: string | null) => {
      const key = getStatusKey(value)
      if (!key) return emptyText
      if (key === 'active') return tp('form.status.active')
      if (key === 'inactive') return tp('form.status.inactive')
      if (key === 'revoked') return tp('form.status.revoked')
      return key
    },
    [emptyText, getStatusKey, tp]
  )

  const getStatusColor = useCallback(
    (value?: string | null) => {
      const key = getStatusKey(value)
      if (key === 'active') return 'green'
      if (key === 'inactive') return 'orange'
      if (key === 'revoked') return 'red'
      return 'blue'
    },
    [getStatusKey]
  )

  const getReasoningColor = useCallback(
    (value?: string | null) => {
      const key = getReasoningModeKey(value)
      if (key === 'fast') return 'cyan'
      if (key === 'deep') return 'orange'
      if (key === 'balanced') return 'blue'
      return 'default'
    },
    [getReasoningModeKey]
  )

  const renderBooleanTag = useCallback(
    (value?: boolean | null) => {
      if (typeof value !== 'boolean') return emptyText
      return (
        <Tag color={value ? 'green' : 'orange'} className='agent-overview-tab__value-tag'>
          {value ? tp('detail.common.yes', { defaultValue: 'Yes' }) : tp('detail.common.no', { defaultValue: 'No' })}
        </Tag>
      )
    },
    [emptyText, tp]
  )

  const renderIdBadge = useCallback(
    (value?: number | null) => {
      if (typeof value !== 'number') return emptyText
      return <span className='agent-overview-tab__mono-pill'>#{value}</span>
    },
    [emptyText]
  )

  const renderModelBadge = useCallback(
    (value?: string | null) => {
      const model = String(value || '').trim()
      if (!model) return emptyText
      return <span className='agent-overview-tab__model-pill'>{model}</span>
    },
    [emptyText]
  )

  const renderTags = useCallback(
    (values: Array<string | number> | undefined, color: string) => {
      const items = (values || []).filter((value) => value !== null && value !== undefined && String(value).trim().length > 0)
      if (items.length === 0) return emptyText
      return (
        <Space wrap size={[6, 6]}>
          {items.map((value, index) => (
            <Tag key={String(value) + '-' + index} color={color} className='agent-overview-tab__value-tag'>
              {typeof value === 'number' ? '#' + value : String(value)}
            </Tag>
          ))}
        </Space>
      )
    },
    [emptyText]
  )

  const heroTitle = agent.display_name || agent.name || emptyText
  const heroSubtitle = agent.name || emptyText
  const heroInitial = heroTitle.trim().charAt(0).toUpperCase() || 'A'

  const identityItems = useMemo<LabelValueItem[]>(
    () => [
      { key: 'agentId', label: tp('detail.overview.agentId', { defaultValue: 'Agent ID' }), value: renderIdBadge(agent.id) },
      { key: 'workspaceId', label: tp('detail.overview.workspaceId', { defaultValue: 'Workspace ID' }), value: renderIdBadge(agent.workspace_id) },
      { key: 'creatorUserId', label: tp('detail.overview.creatorUserId', { defaultValue: 'Creator User ID' }), value: renderIdBadge(agent.creator_user_id) },
      { key: 'createdAt', label: tp('detail.overview.createdAt', { defaultValue: 'Created At' }), value: formatDateTime(agent.created_at) },
      { key: 'updatedAt', label: tp('detail.overview.updatedAt', { defaultValue: 'Updated At' }), value: formatDateTime(agent.updated_at) },
    ],
    [agent.created_at, agent.creator_user_id, agent.id, agent.updated_at, agent.workspace_id, renderIdBadge, tp]
  )

  const heroFocusItems = useMemo<LabelValueItem[]>(
    () => [
      {
        key: 'executionMode',
        label: tp('detail.overview.summary.executionMode', { defaultValue: 'Execution Mode' }),
        value: getExecutionModeLabel(agent.execution_mode),
      },
      {
        key: 'reasoningMode',
        label: tp('form.fields.reasoningMode'),
        value: (
          <Tag color={getReasoningColor(agent.reasoning_mode)} className='agent-overview-tab__value-tag'>
            {getReasoningModeLabel(agent.reasoning_mode)}
          </Tag>
        ),
      },
      { key: 'runnerEnabled', label: tp('detail.overview.runnerEnabled', { defaultValue: 'Runner Enabled' }), value: renderBooleanTag(agent.runner_enabled) },
      { key: 'llmModel', label: tp('detail.overview.summary.llmModel', { defaultValue: 'Current Model' }), value: renderModelBadge(agent.llm_model) },
    ],
    [
      agent.execution_mode,
      agent.llm_model,
      agent.reasoning_mode,
      agent.runner_enabled,
      getExecutionModeLabel,
      getReasoningColor,
      getReasoningModeLabel,
      renderBooleanTag,
      renderModelBadge,
      tp,
    ]
  )

  const panels = useMemo<OverviewPanel[]>(
    () => [
      {
        key: 'runtime',
        title: tp('detail.overview.sections.runtime', { defaultValue: 'Runtime & Access Control' }),
        subtitle: tp('detail.overview.sectionSubtitles.runtime', {
          defaultValue: 'Execution mode and access boundary',
        }),
        icon: <DeploymentUnitOutlined />,
        tone: 'runtime',
        items: [
          {
            key: 'status',
            label: tp('detail.overview.summary.status', { defaultValue: 'Status' }),
            value: (
              <Tag color={getStatusColor(agent.status)} className='agent-overview-tab__value-tag'>
                {getStatusLabel(agent.status)}
              </Tag>
            ),
          },
          {
            key: 'executionMode',
            label: tp('detail.overview.executionMode', { defaultValue: 'Execution Mode' }),
            value: getExecutionModeLabel(agent.execution_mode),
          },
          {
            key: 'sandboxProfile',
            label: tp('detail.overview.sandboxProfile', { defaultValue: 'Sandbox Profile' }),
            value: agent.sandbox_profile || emptyText,
          },
          {
            key: 'allowedProjectIds',
            label: tp('detail.overview.allowedProjectIds', { defaultValue: 'Allowed Project IDs' }),
            value: renderTags(agent.allowed_project_ids, 'blue'),
          },
          {
            key: 'capabilityTags',
            label: tp('detail.overview.capabilityTags', { defaultValue: 'Capability Tags' }),
            value: renderTags(agent.capability_tags, 'cyan'),
          },
        ],
      },
      {
        key: 'model',
        title: tp('detail.overview.sections.model', { defaultValue: 'Model & Generation' }),
        subtitle: tp('detail.overview.sectionSubtitles.model', {
          defaultValue: 'Model choice and generation profile',
        }),
        icon: <ExperimentOutlined />,
        tone: 'model',
        items: [
          { key: 'llmProvider', label: tp('form.fields.llmProvider'), value: agent.llm_provider || emptyText },
          { key: 'llmModel', label: tp('form.fields.llmModel'), value: renderModelBadge(agent.llm_model) },
          {
            key: 'reasoningMode',
            label: tp('form.fields.reasoningMode'),
            value: (
              <Tag color={getReasoningColor(agent.reasoning_mode)} className='agent-overview-tab__value-tag'>
                {getReasoningModeLabel(agent.reasoning_mode)}
              </Tag>
            ),
          },
          { key: 'temperature', label: tp('form.fields.temperature'), value: typeof agent.temperature === 'number' ? agent.temperature : emptyText },
          { key: 'topP', label: tp('form.fields.topP'), value: typeof agent.top_p === 'number' ? agent.top_p : emptyText },
          { key: 'maxOutputTokens', label: tp('form.fields.maxOutputTokens'), value: agent.max_output_tokens ?? emptyText },
          { key: 'contextWindowTokens', label: tp('form.fields.contextWindowTokens'), value: agent.context_window_tokens ?? emptyText },
        ],
      },
      {
        key: 'limits',
        title: tp('detail.overview.sections.limits', { defaultValue: 'Concurrency & Reliability Limits' }),
        subtitle: tp('detail.overview.sectionSubtitles.limits', {
          defaultValue: 'Concurrency, retry, timeout and version guardrails',
        }),
        icon: <SafetyCertificateOutlined />,
        tone: 'limits',
        items: [
          { key: 'maxConcurrency', label: tp('form.fields.maxConcurrency'), value: agent.max_concurrency ?? emptyText },
          { key: 'maxRetry', label: tp('form.fields.maxRetry'), value: agent.max_retry ?? emptyText },
          { key: 'timeoutSeconds', label: tp('form.fields.timeoutSeconds'), value: agent.timeout_seconds ?? emptyText },
          { key: 'heartbeatIntervalSeconds', label: tp('form.fields.heartbeatIntervalSeconds'), value: agent.heartbeat_interval_seconds ?? emptyText },
          { key: 'configVersion', label: tp('detail.overview.configVersion', { defaultValue: 'Config Version' }), value: agent.config_version ?? 1 },
          { key: 'runnerConfigVersion', label: tp('detail.overview.runnerConfigVersion', { defaultValue: 'Runner Config Version' }), value: agent.runner_config_version ?? 1 },
          { key: 'soulVersion', label: tp('detail.overview.soulVersion', { defaultValue: 'SOUL Version' }), value: agent.soul_version ?? 1 },
        ],
      },
    ],
    [
      agent.allowed_project_ids,
      agent.capability_tags,
      agent.config_version,
      agent.context_window_tokens,
      agent.execution_mode,
      agent.heartbeat_interval_seconds,
      agent.llm_model,
      agent.llm_provider,
      agent.max_concurrency,
      agent.max_output_tokens,
      agent.max_retry,
      agent.reasoning_mode,
      agent.runner_config_version,
      agent.sandbox_profile,
      agent.soul_version,
      agent.status,
      agent.temperature,
      agent.timeout_seconds,
      agent.top_p,
      emptyText,
      getExecutionModeLabel,
      getReasoningColor,
      getReasoningModeLabel,
      getStatusColor,
      getStatusLabel,
      renderModelBadge,
      renderTags,
      tp,
    ]
  )

  return (
    <Space direction='vertical' className='agent-overview-tab' size={12}>
      <section className='agent-overview-tab__hero'>
        <div className='agent-overview-tab__hero-head'>
          <div className='agent-overview-tab__hero-identity'>
            <div className='agent-overview-tab__avatar'>{heroInitial}</div>
            <div className='agent-overview-tab__hero-texts'>
              <div className='agent-overview-tab__hero-title'>{heroTitle}</div>
              <div className='agent-overview-tab__hero-subtitle'>{heroSubtitle}</div>
              <div className='agent-overview-tab__hero-caption'>
                {tp('detail.overview.headline', { defaultValue: 'Operational profile and behavior signature' })}
              </div>
            </div>
          </div>
          <Tag color={getStatusColor(agent.status)} className='agent-overview-tab__status-pill'>
            {tp('detail.overview.summary.status', { defaultValue: 'Status' })}: {getStatusLabel(agent.status)}
          </Tag>
        </div>

        <div className='agent-overview-tab__focus-strip'>
          {heroFocusItems.map((item) => (
            <div key={item.key} className='agent-overview-tab__focus-chip'>
              <div className='agent-overview-tab__focus-label'>{item.label}</div>
              <div className='agent-overview-tab__focus-value'>{renderPrimitive(item.value)}</div>
            </div>
          ))}
        </div>

        <div className='agent-overview-tab__identity-cloud'>
          {identityItems.map((item) => (
            <div key={item.key} className='agent-overview-tab__identity-chip'>
              <div className='agent-overview-tab__identity-label'>{item.label}</div>
              <div className='agent-overview-tab__identity-value'>{renderPrimitive(item.value)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className='agent-overview-tab__canvas'>
        {panels.map((panel) => (
          <article key={panel.key} className={'agent-overview-tab__panel agent-overview-tab__panel--' + panel.tone}>
            <header className='agent-overview-tab__panel-header'>
              <span className='agent-overview-tab__panel-icon'>{panel.icon}</span>
              <div>
                <div className='agent-overview-tab__panel-title'>{panel.title}</div>
                <div className='agent-overview-tab__panel-subtitle'>{panel.subtitle}</div>
              </div>
            </header>
            <div className='agent-overview-tab__list'>
              {panel.items.map((item) => (
                <div key={item.key} className='agent-overview-tab__list-item'>
                  <div className='agent-overview-tab__list-label'>{item.label}</div>
                  <div className='agent-overview-tab__list-value'>{renderPrimitive(item.value)}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </Space>
  )
}

export default AgentOverviewTab
