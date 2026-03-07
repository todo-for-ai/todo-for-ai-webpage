import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { agentInsightsApi, type AgentInteractionInsightItem } from '../../../../api/agents'
import { usePageTranslation } from '../../../../i18n/hooks/useTranslation'
import { emptyPagination, formatDateTime } from './shared'
import './AgentInteractionsTab.css'

const { Search } = Input
const { Text } = Typography

interface AgentInteractionsTabProps {
  workspaceId: number | null
  agentId: number
  active: boolean
}

export function AgentInteractionsTab({ workspaceId, agentId, active }: AgentInteractionsTabProps) {
  const { tp } = usePageTranslation('agents')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AgentInteractionInsightItem[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [query, setQuery] = useState('')
  const [queryInput, setQueryInput] = useState('')

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    setQuery('')
    setQueryInput('')
  }, [workspaceId, agentId])

  const loadInteractions = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      setPagination(emptyPagination)
      return
    }
    try {
      setLoading(true)
      const data = await agentInsightsApi.getInteractions(workspaceId, agentId, {
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
    void loadInteractions()
  }, [active, loadInteractions])

  const columns: ColumnsType<AgentInteractionInsightItem> = useMemo(
    () => [
      {
        title: tp('detail.interactions.user', { defaultValue: 'User' }),
        key: 'display_name',
        render: (_, row) => (
          <Space direction='vertical' size={2}>
            <span>{row.display_name}</span>
            <Text type='secondary'>{row.email || '#' + row.user_id}</Text>
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
    ],
    [tp]
  )

  return (
    <Space direction='vertical' className='agent-interactions-tab' size={12}>
      <Search
        placeholder={tp('detail.interactions.search', { defaultValue: 'Search user name/email' })}
        allowClear
        value={queryInput}
        className='agent-interactions-tab__search'
        onChange={(event) => setQueryInput(event.target.value)}
        onSearch={(value) => {
          setQuery(value)
          setPagination((prev) => ({ ...prev, page: 1 }))
        }}
      />
      <Table
        rowKey='user_id'
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

export default AgentInteractionsTab
