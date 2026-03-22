import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input, InputNumber, Space, Table, Typography, Avatar, DatePicker, Button, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { UserOutlined, FilterOutlined } from '@ant-design/icons'
import { agentInsightsApi, type AgentInteractionInsightItem } from '../../../../api/agents'
import { usePageTranslation } from '../../../../i18n/hooks/useTranslation'
import { emptyPagination, formatDateTime } from './shared'
import './AgentInteractionsTab.css'

const { Search } = Input
const { Text } = Typography
const { RangePicker } = DatePicker

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

  // 新增筛选状态
  const [showFilters, setShowFilters] = useState(false)
  const [minInteractions, setMinInteractions] = useState<number | undefined>()
  const [maxInteractions, setMaxInteractions] = useState<number | undefined>()
  const [minTasks, setMinTasks] = useState<number | undefined>()
  const [maxTasks, setMaxTasks] = useState<number | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)
  const [sortBy, setSortBy] = useState<string>('last_interaction_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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
        min_interactions: minInteractions,
        max_interactions: maxInteractions,
        min_tasks: minTasks,
        max_tasks: maxTasks,
        from: dateRange?.[0],
        to: dateRange?.[1],
        sort_by: sortBy as any,
        sort_order: sortOrder,
      })
      setItems(data.items || [])
      setPagination(data.pagination || emptyPagination)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId, pagination.page, pagination.per_page, query, minInteractions, maxInteractions, minTasks, maxTasks, dateRange, sortBy, sortOrder])

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
        fixed: 'left',
        width: 220,
        sorter: true,
        render: (_, row) => (
          <Space>
            <Avatar
              size={40}
              src={row.avatar_url}
              icon={<UserOutlined />}
            />
            <Space direction='vertical' size={2}>
              <span>{row.display_name}</span>
              <Space size={8}>
                <Text type='secondary' style={{ fontSize: 12 }}>{row.email || '#' + row.user_id}</Text>
                {row.username && (
                  <Tag color='blue' style={{ fontSize: 12, padding: '0 4px', lineHeight: '18px' }}>@{row.username}</Tag>
                )}
              </Space>
            </Space>
          </Space>
        ),
      },
      {
        title: tp('detail.interactions.activityScore', { defaultValue: 'Activity' }),
        dataIndex: 'activity_score',
        key: 'activity_score',
        width: 120,
        sorter: true,
        render: (value: number) => {
          const score = Math.round(value)
          const color = score >= 80 ? 'green' : score >= 50 ? 'blue' : score >= 20 ? 'orange' : 'red'
          return <Tag color={color}>{score}</Tag>
        },
      },
      {
        title: tp('detail.interactions.interactionCount', { defaultValue: 'Interactions' }),
        dataIndex: 'interaction_count',
        key: 'interaction_count',
        width: 130,
        sorter: true,
      },
      {
        title: tp('detail.interactions.taskCount', { defaultValue: 'Tasks' }),
        dataIndex: 'task_count',
        key: 'task_count',
        width: 110,
        sorter: true,
      },
      {
        title: tp('detail.interactions.projectCount', { defaultValue: 'Projects' }),
        dataIndex: 'project_count',
        key: 'project_count',
        width: 110,
        sorter: true,
      },
      {
        title: tp('detail.interactions.avgPerDay', { defaultValue: 'Avg/Day' }),
        dataIndex: 'avg_interactions_per_day',
        key: 'avg_interactions_per_day',
        width: 110,
        sorter: true,
        render: (value: number) => value.toFixed(2),
      },
      {
        title: tp('detail.interactions.contentLength', { defaultValue: 'Content' }),
        key: 'content_length',
        width: 130,
        render: (_, row) => (
          <Space direction='vertical' size={2}>
            <Text>{row.total_content_length} chars</Text>
            <Text type='secondary' style={{ fontSize: 12 }}>
              avg {row.avg_content_length} chars
            </Text>
          </Space>
        ),
      },
      {
        title: tp('detail.interactions.daysSinceLast', { defaultValue: 'Days Since' }),
        dataIndex: 'days_since_last_interaction',
        key: 'days_since_last_interaction',
        width: 130,
        sorter: true,
        render: (value: number) => {
          const color = value <= 1 ? 'green' : value <= 7 ? 'blue' : value <= 30 ? 'orange' : 'red'
          return <Tag color={color}>{value} days</Tag>
        },
      },
      {
        title: tp('detail.interactions.firstInteraction', { defaultValue: 'First Seen' }),
        dataIndex: 'first_interaction_at',
        key: 'first_interaction_at',
        width: 180,
        sorter: true,
        render: (value) => formatDateTime(value),
      },
      {
        title: tp('detail.interactions.lastInteraction', { defaultValue: 'Last Interaction' }),
        dataIndex: 'last_interaction_at',
        key: 'last_interaction_at',
        width: 180,
        sorter: true,
        render: (value) => formatDateTime(value),
      },
    ],
    [tp]
  )

  return (
    <Space direction='vertical' className='agent-interactions-tab' size={12} style={{ width: '100%' }}>
      <Space direction='vertical' size={12} style={{ width: '100%' }}>
        <Space>
          <Search
            placeholder={tp('detail.interactions.search', { defaultValue: 'Search user name/email' })}
            allowClear
            value={queryInput}
            style={{ width: 300 }}
            onChange={(event) => setQueryInput(event.target.value)}
            onSearch={(value) => {
              setQuery(value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
          />
          <Button
            icon={<FilterOutlined />}
            type={showFilters ? 'primary' : 'text'}
            onClick={() => setShowFilters(!showFilters)}
            className="flat-btn flat-btn--secondary"
          >
            Filters
          </Button>
        </Space>

        {showFilters && (
          <div className='filter-panel' style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <Space direction='vertical' size={16} style={{ width: '100%' }}>
              <Space size={24}>
                <div>
                  <Text strong>Interactions Range:</Text>
                  <div style={{ marginTop: 8 }}>
                    <InputNumber
                      placeholder="Min"
                      min={0}
                      value={minInteractions}
                      onChange={(v) => setMinInteractions(v || undefined)}
                      style={{ width: 80 }}
                    />
                    <span style={{ margin: '0 8px' }}>-</span>
                    <InputNumber
                      placeholder="Max"
                      min={0}
                      value={maxInteractions}
                      onChange={(v) => setMaxInteractions(v || undefined)}
                      style={{ width: 80 }}
                    />
                  </div>
                </div>

                <div>
                  <Text strong>Tasks Range:</Text>
                  <div style={{ marginTop: 8 }}>
                    <InputNumber
                      placeholder="Min"
                      min={0}
                      value={minTasks}
                      onChange={(v) => setMinTasks(v || undefined)}
                      style={{ width: 80 }}
                    />
                    <span style={{ margin: '0 8px' }}>-</span>
                    <InputNumber
                      placeholder="Max"
                      min={0}
                      value={maxTasks}
                      onChange={(v) => setMaxTasks(v || undefined)}
                      style={{ width: 80 }}
                    />
                  </div>
                </div>

                <div>
                  <Text strong>Date Range:</Text>
                  <div style={{ marginTop: 8 }}>
                    <RangePicker
                      onChange={(dates) => {
                        if (dates) {
                          setDateRange([
                            dates[0]?.toISOString() || '',
                            dates[1]?.toISOString() || '',
                          ])
                        } else {
                          setDateRange(null)
                        }
                      }}
                    />
                  </div>
                </div>
              </Space>

              <Space>
                <Button
                  type="text"
                  onClick={() => {
                    setPagination((prev) => ({ ...prev, page: 1 }))
                    loadInteractions()
                  }}
                  className="flat-btn flat-btn--primary"
                >
                  Apply Filters
                </Button>
                <Button
                  type="text"
                  onClick={() => {
                    setMinInteractions(undefined)
                    setMaxInteractions(undefined)
                    setMinTasks(undefined)
                    setMaxTasks(undefined)
                    setDateRange(null)
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }}
                  className="flat-btn flat-btn--secondary"
                >
                  Clear
                </Button>
              </Space>
            </Space>
          </div>
        )}
      </Space>

      <Table
        rowKey='user_id'
        loading={loading}
        columns={columns}
        dataSource={items}
        scroll={{ x: 1400 }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.per_page,
          total: pagination.total,
          showSizeChanger: true,
        }}
        onChange={(pageInfo, filters, sorter) => {
          setPagination((prev) => ({
            ...prev,
            page: pageInfo.current || 1,
            per_page: pageInfo.pageSize || prev.per_page,
          }))

          // Handle sorting
          if (sorter && typeof sorter === 'object' && 'field' in sorter) {
            const field = sorter.field as string
            const order = sorter.order === 'ascend' ? 'asc' : 'desc'
            if (field && field !== sortBy) {
              setSortBy(field)
            }
            if (order !== sortOrder) {
              setSortOrder(order)
            }
          }
        }}
      />
    </Space>
  )
}

export default AgentInteractionsTab
