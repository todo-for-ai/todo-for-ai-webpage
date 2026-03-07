import { useCallback, useMemo } from 'react'
import { Descriptions, Space, Tag } from 'antd'
import type { Agent } from '../../../../api/agents'
import { usePageTranslation } from '../../../../i18n/hooks/useTranslation'
import { formatDateTime } from './shared'
import './AgentOverviewTab.css'

interface AgentOverviewTabProps {
  agent: Agent
}

export function AgentOverviewTab({ agent }: AgentOverviewTabProps) {
  const { tp } = usePageTranslation('agents')

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
      {
        key: 'runnerEnabled',
        label: tp('detail.overview.runnerEnabled', { defaultValue: 'Runner Enabled' }),
        children: agent.runner_enabled ? tp('detail.common.yes', { defaultValue: 'Yes' }) : tp('detail.common.no', { defaultValue: 'No' }),
      },
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
      {
        key: 'runnerConfigVersion',
        label: tp('detail.overview.runnerConfigVersion', { defaultValue: 'Runner Config Version' }),
        children: agent.runner_config_version || 1,
      },
      { key: 'soulVersion', label: tp('detail.overview.soulVersion', { defaultValue: 'SOUL Version' }), children: agent.soul_version || 1 },
      { key: 'createdAt', label: tp('detail.overview.createdAt', { defaultValue: 'Created At' }), children: formatDateTime(agent.created_at) },
      { key: 'updatedAt', label: tp('detail.overview.updatedAt', { defaultValue: 'Updated At' }), children: formatDateTime(agent.updated_at) },
    ],
    [agent, tp, getExecutionModeLabel, getReasoningModeLabel, getStatusLabel]
  )

  return (
    <Space direction='vertical' className='agent-overview-tab' size={16}>
      <Descriptions bordered size='small' column={2} items={overviewItems} />
      <Space wrap>
        {(agent.capability_tags || []).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </Space>
    </Space>
  )
}

export default AgentOverviewTab
