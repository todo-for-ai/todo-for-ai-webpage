import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Empty, Input, InputNumber, Select, Space, Table, Tag, Typography } from 'antd'
import type { AgentActivityItem } from '../../../api/agents'
import { agentInsightsApi, agentsApi } from '../../../api/agents'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import {
  activityLevelValues,
  activitySourceValues,
  emptyPagination,
  normalizeDateTimeFilterValue,
} from './detailTabs/shared'
import { buildWorkspaceActivityColumns } from './workspaceActivity/WorkspaceActivityColumns'
import { WorkspaceActivityDetailModal } from './workspaceActivity/WorkspaceActivityDetailModal'
import './AgentWorkspaceActivityCenter.css'

const { Search } = Input
const { Text } = Typography

interface AgentWorkspaceActivityCenterProps {
  workspaceId: number | null
}

export function AgentWorkspaceActivityCenter({ workspaceId }: AgentWorkspaceActivityCenterProps) {
  const { tp } = usePageTranslation('agents')

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AgentActivityItem[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [agentOptions, setAgentOptions] = useState<Array<{ label: string; value: number }>>([])

  const [agentId, setAgentId] = useState<number | undefined>(undefined)
  const [source, setSource] = useState<string | undefined>(undefined)
  const [level, setLevel] = useState<string | undefined>(undefined)
  const [eventType, setEventType] = useState('')
  const [eventTypeInput, setEventTypeInput] = useState('')
  const [query, setQuery] = useState('')
  const [queryInput, setQueryInput] = useState('')
  const [taskId, setTaskId] = useState<number | undefined>(undefined)
  const [projectId, setProjectId] = useState<number | undefined>(undefined)
  const [runId, setRunId] = useState('')
  const [runIdInput, setRunIdInput] = useState('')
  const [attemptId, setAttemptId] = useState('')
  const [attemptIdInput, setAttemptIdInput] = useState('')
  const [riskMin, setRiskMin] = useState<number | undefined>(undefined)
  const [riskMax, setRiskMax] = useState<number | undefined>(undefined)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sourceSummary, setSourceSummary] = useState<Record<string, number>>({})
  const [levelSummary, setLevelSummary] = useState<Record<string, number>>({})
  const [detailItem, setDetailItem] = useState<AgentActivityItem | null>(null)

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

  const loadAgentOptions = useCallback(async () => {
    if (!workspaceId) {
      setAgentOptions([])
      return
    }

    try {
      const data = await agentsApi.getAgents(workspaceId, { page: 1, per_page: 500 })
      const options = (data.items || []).map((item) => ({
        label: `${item.display_name || item.name} (#${item.id})`,
        value: item.id,
      }))
      setAgentOptions(options)
    } catch {
      setAgentOptions([])
    }
  }, [workspaceId])

  const loadActivities = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      setPagination(emptyPagination)
      setSourceSummary({})
      setLevelSummary({})
      return
    }

    try {
      setLoading(true)
      const data = await agentInsightsApi.getWorkspaceActivity(workspaceId, {
        page: pagination.page,
        per_page: pagination.per_page,
        agent_id: agentId,
        source,
        level,
        event_type: eventType || undefined,
        q: query || undefined,
        task_id: taskId,
        project_id: projectId,
        run_id: runId || undefined,
        attempt_id: attemptId || undefined,
        min_risk_score: riskMin,
        max_risk_score: riskMax,
        from: normalizeDateTimeFilterValue(from),
        to: normalizeDateTimeFilterValue(to),
      })
      setItems(data.items || [])
      setPagination(data.pagination || emptyPagination)
      setSourceSummary(data.summary?.sources || {})
      setLevelSummary(data.summary?.levels || {})
    } finally {
      setLoading(false)
    }
  }, [
    workspaceId,
    pagination.page,
    pagination.per_page,
    agentId,
    source,
    level,
    eventType,
    query,
    taskId,
    projectId,
    runId,
    attemptId,
    riskMin,
    riskMax,
    from,
    to,
  ])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    setAgentId(undefined)
    setSource(undefined)
    setLevel(undefined)
    setEventType('')
    setEventTypeInput('')
    setQuery('')
    setQueryInput('')
    setTaskId(undefined)
    setProjectId(undefined)
    setRunId('')
    setRunIdInput('')
    setAttemptId('')
    setAttemptIdInput('')
    setRiskMin(undefined)
    setRiskMax(undefined)
    setFrom('')
    setTo('')
    setSourceSummary({})
    setLevelSummary({})
    setDetailItem(null)
  }, [workspaceId])

  useEffect(() => {
    void loadAgentOptions()
  }, [loadAgentOptions])

  useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  const columns = useMemo(
    () =>
      buildWorkspaceActivityColumns({
        tp,
        getActivityLevelLabel,
        getActivitySourceLabel,
      }),
    [tp, getActivityLevelLabel, getActivitySourceLabel]
  )

  if (!workspaceId) {
    return (
      <Card title={tp('workspaceActivity.title', { defaultValue: 'Workspace Activity Center' })}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tp('form.workspace')} />
      </Card>
    )
  }

  return (
    <Card title={tp('workspaceActivity.title', { defaultValue: 'Workspace Activity Center' })}>
      <Space direction='vertical' className='agent-workspace-activity-center' size={12}>
        <Space wrap>
          <Select
            allowClear
            showSearch
            options={agentOptions}
            optionFilterProp='label'
            value={agentId}
            className='agent-workspace-activity-center__agent'
            placeholder={tp('workspaceActivity.agentFilter', { defaultValue: 'Agent' })}
            onChange={(value) => {
              setAgentId(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
          <Select
            allowClear
            placeholder={tp('detail.activity.sourceFilter', { defaultValue: 'Source' })}
            options={activitySourceOptions}
            value={source}
            className='agent-workspace-activity-center__source'
            onChange={(value) => {
              setSource(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
          <Select
            allowClear
            placeholder={tp('detail.activity.levelFilter', { defaultValue: 'Level' })}
            options={activityLevelOptions}
            value={level}
            className='agent-workspace-activity-center__level'
            onChange={(value) => {
              setLevel(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
          <Input
            placeholder={tp('detail.activity.eventTypeFilter', { defaultValue: 'Event Type Contains' })}
            value={eventTypeInput}
            className='agent-workspace-activity-center__text'
            onChange={(event) => setEventTypeInput(event.target.value)}
            onPressEnter={() => {
              setEventType(eventTypeInput.trim())
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            onBlur={() => {
              setEventType(eventTypeInput.trim())
            }}
          />
          <InputNumber
            min={1}
            value={taskId}
            placeholder={tp('detail.activity.taskIdFilter', { defaultValue: 'Task ID' })}
            onChange={(value) => {
              setTaskId(typeof value === 'number' ? value : undefined)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className='agent-workspace-activity-center__number'
          />
          <InputNumber
            min={1}
            value={projectId}
            placeholder={tp('detail.activity.projectIdFilter', { defaultValue: 'Project ID' })}
            onChange={(value) => {
              setProjectId(typeof value === 'number' ? value : undefined)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className='agent-workspace-activity-center__number'
          />
          <Input
            placeholder={tp('detail.activity.runIdFilter', { defaultValue: 'Run ID Contains' })}
            value={runIdInput}
            className='agent-workspace-activity-center__text'
            onChange={(event) => setRunIdInput(event.target.value)}
            onPressEnter={() => {
              setRunId(runIdInput.trim())
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            onBlur={() => {
              setRunId(runIdInput.trim())
            }}
          />
          <Input
            placeholder={tp('detail.activity.attemptIdFilter', { defaultValue: 'Attempt ID Contains' })}
            value={attemptIdInput}
            className='agent-workspace-activity-center__text'
            onChange={(event) => setAttemptIdInput(event.target.value)}
            onPressEnter={() => {
              setAttemptId(attemptIdInput.trim())
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            onBlur={() => {
              setAttemptId(attemptIdInput.trim())
            }}
          />
          <InputNumber
            min={0}
            value={riskMin}
            placeholder={tp('detail.activity.minRiskFilter', { defaultValue: 'Min Risk' })}
            onChange={(value) => {
              setRiskMin(typeof value === 'number' ? value : undefined)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className='agent-workspace-activity-center__number'
          />
          <InputNumber
            min={0}
            value={riskMax}
            placeholder={tp('detail.activity.maxRiskFilter', { defaultValue: 'Max Risk' })}
            onChange={(value) => {
              setRiskMax(typeof value === 'number' ? value : undefined)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className='agent-workspace-activity-center__number'
          />
          <Search
            placeholder={tp('detail.activity.search', { defaultValue: 'Search message or payload' })}
            allowClear
            value={queryInput}
            className='agent-workspace-activity-center__search'
            onChange={(event) => setQueryInput(event.target.value)}
            onSearch={(value) => {
              setQuery(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
          <Input
            type='datetime-local'
            value={from}
            placeholder={tp('detail.activity.from', { defaultValue: 'From' })}
            className='agent-workspace-activity-center__datetime'
            onChange={(event) => {
              setFrom(event.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
          <Input
            type='datetime-local'
            value={to}
            placeholder={tp('detail.activity.to', { defaultValue: 'To' })}
            className='agent-workspace-activity-center__datetime'
            onChange={(event) => {
              setTo(event.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
        </Space>
        <Space wrap size={[8, 8]}>
          {Object.entries(sourceSummary).map(([key, count]) => (
            <Tag key={key}>
              {getActivitySourceLabel(key)}: {count}
            </Tag>
          ))}
          {Object.entries(levelSummary).map(([key, count]) => (
            <Tag key={`level-${key}`}>
              {getActivityLevelLabel(key)}: {count}
            </Tag>
          ))}
        </Space>
        <Table
          rowKey='id'
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={{
            current: pagination.page,
            pageSize: pagination.per_page,
            total: pagination.total,
            showSizeChanger: true,
          }}
          onRow={(record) => ({
            onClick: () => setDetailItem(record),
            style: { cursor: 'pointer' },
          })}
          onChange={(pageInfo) => {
            setPagination((prev) => ({
              ...prev,
              page: pageInfo.current || 1,
              per_page: pageInfo.pageSize || prev.per_page,
            }))
          }}
        />
        <Text type='secondary'>{tp('detail.activity.clickHint', { defaultValue: 'Click a row to view details.' })}</Text>
      </Space>
      <WorkspaceActivityDetailModal
        tp={tp}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        getActivityLevelLabel={getActivityLevelLabel}
        getActivitySourceLabel={getActivitySourceLabel}
      />
    </Card>
  )
}

export default AgentWorkspaceActivityCenter
