import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { agentInsightsApi, type AgentTaskInsightItem } from '../../../../api/agents'
import { usePageTranslation } from '../../../../i18n/hooks/useTranslation'
import { emptyPagination, formatDateTime, taskStatusColorMap, taskStatusValues } from './shared'
import './AgentTasksTab.css'

const { Search } = Input
const { Text } = Typography

interface AgentTasksTabProps {
  workspaceId: number | null
  agentId: number
  active: boolean
}

export function AgentTasksTab({ workspaceId, agentId, active }: AgentTasksTabProps) {
  const { tp } = usePageTranslation('agents')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AgentTaskInsightItem[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [query, setQuery] = useState('')
  const [queryInput, setQueryInput] = useState('')
  const [taskStatus, setTaskStatus] = useState<string | undefined>(undefined)
  const [taskProjectId, setTaskProjectId] = useState<number | undefined>(undefined)
  const [taskProjectOptions, setTaskProjectOptions] = useState<Array<{ label: string; value: number }>>([])

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    setQuery('')
    setQueryInput('')
    setTaskStatus(undefined)
    setTaskProjectId(undefined)
    setTaskProjectOptions([])
  }, [workspaceId, agentId])

  const taskStatusOptions = useMemo(
    () =>
      taskStatusValues.map((value) => ({
        value,
        label: tp(`detail.enums.taskStatus.${value}`, { defaultValue: value }),
      })),
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

  const loadTaskProjectOptions = useCallback(async () => {
    if (!workspaceId) {
      setTaskProjectOptions([])
      return
    }
    try {
      const data = await agentInsightsApi.getProjects(workspaceId, agentId, {
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
  }, [workspaceId, agentId])

  const loadTasks = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      setPagination(emptyPagination)
      return
    }
    try {
      setLoading(true)
      const data = await agentInsightsApi.getTasks(workspaceId, agentId, {
        page: pagination.page,
        per_page: pagination.per_page,
        search: query || undefined,
        status: taskStatus || undefined,
        project_id: taskProjectId,
      })
      setItems(data.items || [])
      setPagination(data.pagination || emptyPagination)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId, pagination.page, pagination.per_page, query, taskStatus, taskProjectId])

  useEffect(() => {
    if (!active) {
      return
    }
    void loadTaskProjectOptions()
    void loadTasks()
  }, [active, loadTaskProjectOptions, loadTasks])

  const columns: ColumnsType<AgentTaskInsightItem> = useMemo(
    () => [
      {
        title: tp('detail.tasks.task', { defaultValue: 'Task' }),
        key: 'title',
        render: (_, row) => (
          <Space direction='vertical' size={2}>
            <span>{row.title}</span>
            <Text type='secondary'>{'Task #' + row.task_id + ' | ' + (row.project_name || '-')}</Text>
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
            <Space direction='vertical' size={2}>
              <Tag>{getAttemptStateLabel(row.last_attempt.state)}</Tag>
              <Text type='secondary'>{row.last_attempt.attempt_id}</Text>
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
    ],
    [tp, getAttemptStateLabel, getTaskStatusLabel]
  )

  return (
    <Space direction='vertical' className='agent-tasks-tab' size={12}>
      <Space wrap>
        <Select
          allowClear
          placeholder={tp('detail.tasks.statusFilter', { defaultValue: 'Task status' })}
          value={taskStatus}
          className='agent-tasks-tab__status'
          options={taskStatusOptions}
          onChange={(value) => {
            setTaskStatus(value)
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
        />
        <Select
          allowClear
          showSearch
          placeholder={tp('detail.tasks.projectFilter', { defaultValue: 'Project' })}
          value={taskProjectId}
          className='agent-tasks-tab__project'
          options={taskProjectOptions}
          optionFilterProp='label'
          onChange={(value) => {
            setTaskProjectId(value)
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
        />
        <Search
          placeholder={tp('detail.tasks.search', { defaultValue: 'Search task title/content' })}
          allowClear
          value={queryInput}
          className='agent-tasks-tab__search'
          onChange={(event) => setQueryInput(event.target.value)}
          onSearch={(value) => {
            setQuery(value)
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
        />
      </Space>
      <Table
        rowKey='task_id'
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{
          current: pagination.page,
          pageSize: pagination.per_page,
          total: pagination.total,
          showSizeChanger: true,
        }}
        onChange={(pageInfo) => {
          setPagination((prev) => ({
            ...prev,
            page: pageInfo.current || 1,
            per_page: pageInfo.pageSize || prev.per_page,
          }))
        }}
      />
    </Space>
  )
}

export default AgentTasksTab
