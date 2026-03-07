import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { agentInsightsApi, type AgentProjectInsightItem } from '../../../../api/agents'
import { usePageTranslation } from '../../../../i18n/hooks/useTranslation'
import { emptyPagination, formatDateTime } from './shared'
import './AgentProjectsTab.css'

const { Search } = Input
const { Text } = Typography

interface AgentProjectsTabProps {
  workspaceId: number | null
  agentId: number
  active: boolean
}

export function AgentProjectsTab({ workspaceId, agentId, active }: AgentProjectsTabProps) {
  const { tp } = usePageTranslation('agents')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AgentProjectInsightItem[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [query, setQuery] = useState('')
  const [queryInput, setQueryInput] = useState('')

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    setQuery('')
    setQueryInput('')
  }, [workspaceId, agentId])

  const loadProjects = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      setPagination(emptyPagination)
      return
    }
    try {
      setLoading(true)
      const data = await agentInsightsApi.getProjects(workspaceId, agentId, {
        page: pagination.page,
        per_page: pagination.per_page,
        search: query || undefined,
      })
      setItems(data.items || [])
      setPagination(data.pagination || emptyPagination)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId, pagination.page, pagination.per_page, query])

  useEffect(() => {
    if (!active) {
      return
    }
    void loadProjects()
  }, [active, loadProjects])

  const columns: ColumnsType<AgentProjectInsightItem> = useMemo(
    () => [
      {
        title: tp('detail.projects.project', { defaultValue: 'Project' }),
        key: 'project_name',
        render: (_, row) => (
          <Space direction='vertical' size={2}>
            <span>{row.project_name}</span>
            <Text type='secondary'>{'#' + row.project_id}</Text>
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
    ],
    [tp]
  )

  return (
    <Space direction='vertical' className='agent-projects-tab' size={12}>
      <Search
        placeholder={tp('detail.projects.search', { defaultValue: 'Search project name' })}
        allowClear
        value={queryInput}
        className='agent-projects-tab__search'
        onChange={(event) => setQueryInput(event.target.value)}
        onSearch={(value) => {
          setQuery(value)
          setPagination((prev) => ({ ...prev, page: 1 }))
        }}
      />
      <Table
        rowKey='project_id'
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

export default AgentProjectsTab
