import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Card,
  Descriptions,
  Empty,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { agentInsightsApi, agentsApi, type AgentActivityItem } from '../../../api/agents'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

const { Search } = Input
const { Text } = Typography

const activitySourceValues = ['agent_run', 'agent_task_attempt', 'agent_task_event', 'task_log', 'agent_audit']
const activityLevelValues = ['info', 'warn', 'error']

const activityLevelStatus: Record<string, 'success' | 'warning' | 'error' | 'default' | 'processing'> = {
  info: 'default',
  warn: 'warning',
  error: 'error',
}

const emptyPagination = { page: 1, per_page: 20, total: 0, has_prev: false, has_next: false }

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
    } catch (error: any) {
      message.error(error?.message || tp('messages.loadAgentsFailed'))
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
    tp,
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

  const columns: ColumnsType<AgentActivityItem> = useMemo(
    () => [
      {
        title: tp('workspaceActivity.agent', { defaultValue: 'Agent' }),
        key: 'agent',
        width: 220,
        render: (_, row) => (
          <Space direction="vertical" size={2}>
            <span>{row.agent_display_name || row.agent_name || '-'}</span>
            <Text type="secondary">{row.agent_id ? `#${row.agent_id}` : '-'}</Text>
          </Space>
        ),
      },
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
            {row.task_id ? (
              <Text type="secondary">
                {`${tp('detail.activity.taskId', { defaultValue: 'Task ID' })}: ${row.task_id}${row.task_title ? ` | ${row.task_title}` : ''}`}
              </Text>
            ) : null}
            {row.project_id ? (
              <Text type="secondary">
                {`${tp('detail.activity.projectId', { defaultValue: 'Project ID' })}: ${row.project_id}${row.project_name ? ` | ${row.project_name}` : ''}`}
              </Text>
            ) : null}
            {row.run_id ? <Text type="secondary">{`${tp('detail.activity.runId', { defaultValue: 'Run ID' })}: ${row.run_id}`}</Text> : null}
            {row.attempt_id ? (
              <Text type="secondary">{`${tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}: ${row.attempt_id}`}</Text>
            ) : null}
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
        width: 190,
        render: (value) => formatDateTime(value),
      },
    ],
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
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Space wrap>
          <Select
            allowClear
            showSearch
            options={agentOptions}
            optionFilterProp="label"
            value={agentId}
            style={{ width: 240 }}
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
            style={{ width: 180 }}
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
            style={{ width: 150 }}
            onChange={(value) => {
              setLevel(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
          <Input
            placeholder={tp('detail.activity.eventTypeFilter', { defaultValue: 'Event Type Contains' })}
            value={eventTypeInput}
            style={{ width: 220 }}
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
            style={{ width: 140 }}
          />
          <InputNumber
            min={1}
            value={projectId}
            placeholder={tp('detail.activity.projectIdFilter', { defaultValue: 'Project ID' })}
            onChange={(value) => {
              setProjectId(typeof value === 'number' ? value : undefined)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            style={{ width: 140 }}
          />
          <Input
            placeholder={tp('detail.activity.runIdFilter', { defaultValue: 'Run ID Contains' })}
            value={runIdInput}
            style={{ width: 220 }}
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
            style={{ width: 220 }}
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
            style={{ width: 140 }}
          />
          <InputNumber
            min={0}
            value={riskMax}
            placeholder={tp('detail.activity.maxRiskFilter', { defaultValue: 'Max Risk' })}
            onChange={(value) => {
              setRiskMax(typeof value === 'number' ? value : undefined)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            style={{ width: 140 }}
          />
          <Search
            placeholder={tp('detail.activity.search', { defaultValue: 'Search message or payload' })}
            allowClear
            value={queryInput}
            style={{ width: 280 }}
            onChange={(event) => setQueryInput(event.target.value)}
            onSearch={(value) => {
              setQuery(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
          <Input
            type="datetime-local"
            value={from}
            placeholder={tp('detail.activity.from', { defaultValue: 'From' })}
            onChange={(event) => {
              setFrom(event.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            style={{ width: 200 }}
          />
          <Input
            type="datetime-local"
            value={to}
            placeholder={tp('detail.activity.to', { defaultValue: 'To' })}
            onChange={(event) => {
              setTo(event.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            style={{ width: 200 }}
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
          rowKey="id"
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
        <Text type="secondary">{tp('detail.activity.clickHint', { defaultValue: 'Click a row to view details.' })}</Text>
        <Modal
          title={tp('detail.activity.detailTitle', { defaultValue: 'Activity Detail' })}
          open={!!detailItem}
          onCancel={() => setDetailItem(null)}
          onOk={() => setDetailItem(null)}
          okText={tp('detail.activity.close', { defaultValue: 'Close' })}
          cancelButtonProps={{ style: { display: 'none' } }}
          width={900}
        >
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label={tp('workspaceActivity.agent', { defaultValue: 'Agent' })} span={2}>
              {detailItem?.agent_display_name || detailItem?.agent_name || '-'}
              {detailItem?.agent_id ? ` (#${detailItem.agent_id})` : ''}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.source', { defaultValue: 'Source' })}>
              {getActivitySourceLabel(detailItem?.source)}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.level', { defaultValue: 'Level' })}>
              {getActivityLevelLabel(detailItem?.level)}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.eventType', { defaultValue: 'Event Type' })} span={2}>
              <Text code>{detailItem?.event_type || '-'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.occurredAt', { defaultValue: 'Occurred At' })}>
              {formatDateTime(detailItem?.occurred_at)}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.related', { defaultValue: 'Related' })}>
              {detailItem?.task_id
                ? `${tp('detail.activity.taskId', { defaultValue: 'Task ID' })}: ${detailItem.task_id}`
                : detailItem?.run_id
                  ? `${tp('detail.activity.runId', { defaultValue: 'Run ID' })}: ${detailItem.run_id}`
                  : detailItem?.attempt_id
                    ? `${tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}: ${detailItem.attempt_id}`
                    : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.message', { defaultValue: 'Message' })} span={2}>
              {detailItem?.message || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.riskScore', { defaultValue: 'Risk Score' })}>
              {typeof detailItem?.risk_score === 'number' ? detailItem.risk_score : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.correlationId', { defaultValue: 'Correlation ID' })}>
              {detailItem?.correlation_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.requestId', { defaultValue: 'Request ID' })}>
              {detailItem?.request_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.durationMs', { defaultValue: 'Duration (ms)' })}>
              {typeof detailItem?.duration_ms === 'number' ? detailItem.duration_ms : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.errorCode', { defaultValue: 'Error Code' })}>
              {detailItem?.error_code || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.runId', { defaultValue: 'Run ID' })}>
              {detailItem?.run_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}>
              {detailItem?.attempt_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.taskId', { defaultValue: 'Task ID' })}>
              {detailItem?.task_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.projectId', { defaultValue: 'Project ID' })}>
              {detailItem?.project_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.actor', { defaultValue: 'Actor' })}>
              {detailItem?.actor_type || detailItem?.actor_id
                ? `${detailItem?.actor_type || '-'}:${detailItem?.actor_id || '-'}`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={tp('detail.activity.target', { defaultValue: 'Target' })}>
              {detailItem?.target_type || detailItem?.target_id
                ? `${detailItem?.target_type || '-'}:${detailItem?.target_id || '-'}`
                : '-'}
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
                {JSON.stringify(detailItem?.payload || {}, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        </Modal>
      </Space>
    </Card>
  )
}

export default AgentWorkspaceActivityCenter
