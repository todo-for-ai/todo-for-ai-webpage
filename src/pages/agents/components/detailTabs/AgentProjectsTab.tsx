import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
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

type SortField = 'project_name' | 'touched_task_count' | 'committed_task_count' | 'interaction_log_count' | 'interaction_days' | 'submission_rate' | 'activity_score' | 'last_activity_at'

export function AgentProjectsTab({ workspaceId, agentId, active }: AgentProjectsTabProps) {
  const { tp } = usePageTranslation('agents')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AgentProjectInsightItem[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [query, setQuery] = useState('')
  const [queryInput, setQueryInput] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('last_activity_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      setItems(data.items || [])
      setPagination(data.pagination || emptyPagination)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId, pagination.page, pagination.per_page, query, sortBy, sortOrder])

  useEffect(() => {
    if (!active) {
      return
    }
    void loadProjects()
  }, [active, loadProjects])

  const goToProjectDetail = useCallback(
    (projectId: number) => {
      const query = workspaceId ? `?workspace_id=${workspaceId}` : ''
      navigate(`/todo-for-ai/pages/projects/${projectId}${query}`)
    },
    [navigate, workspaceId]
  )

  const getProjectStatusMeta = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) {
        return {
          label: '-',
          color: 'default' as const,
        }
      }
      if (key === 'active') {
        return {
          label: tp('detail.projects.statusValues.active', { defaultValue: 'Active' }),
          color: 'green' as const,
        }
      }
      if (key === 'archived') {
        return {
          label: tp('detail.projects.statusValues.archived', { defaultValue: 'Archived' }),
          color: 'orange' as const,
        }
      }
      if (key === 'deleted') {
        return {
          label: tp('detail.projects.statusValues.deleted', { defaultValue: 'Deleted' }),
          color: 'red' as const,
        }
      }
      return {
        label: key,
        color: 'blue' as const,
      }
    },
    [tp]
  )

  const columns: ColumnsType<AgentProjectInsightItem> = useMemo(
    () => [
      {
        title: tp('detail.projects.project', { defaultValue: 'Project' }),
        key: 'project_name',
        dataIndex: 'project_name',
        width: 240,
        sorter: true,
        render: (_, row) => (
          <Space direction='vertical' size={2}>
            <Typography.Link
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                goToProjectDetail(row.project_id)
              }}
            >
              {row.project_name}
            </Typography.Link>
            <Text type='secondary'>{'#' + row.project_id}</Text>
          </Space>
        ),
      },
      {
        title: tp('detail.projects.status', { defaultValue: 'Status' }),
        dataIndex: 'project_status',
        key: 'project_status',
        width: 120,
        render: (value) => {
          const meta = getProjectStatusMeta(value)
          return <Tag color={meta.color}>{meta.label}</Tag>
        },
      },
      {
        title: tp('detail.projects.color', { defaultValue: 'Color' }),
        key: 'project_color',
        dataIndex: 'project_color',
        width: 120,
        render: (value) => {
          const color = String(value || '').trim()
          if (!color) {
            return <Text type='secondary'>{tp('detail.projects.noColor', { defaultValue: '-' })}</Text>
          }
          return (
            <span className='agent-projects-tab__color'>
              <span className='agent-projects-tab__color-swatch' style={{ backgroundColor: color }} />
              <span className='agent-projects-tab__color-code'>{color}</span>
            </span>
          )
        },
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
        sorter: true,
      },
      {
        title: tp('detail.projects.committedTasks', { defaultValue: 'Committed Tasks' }),
        dataIndex: 'committed_task_count',
        key: 'committed_task_count',
        width: 140,
        sorter: true,
      },
      {
        title: tp('detail.projects.commitRate', { defaultValue: 'Commit Rate' }),
        key: 'submission_rate',
        dataIndex: 'submission_rate',
        width: 130,
        sorter: true,
        render: (value, row) => {
          const touched = Number(row.touched_task_count || 0)
          const committed = Number(row.committed_task_count || 0)
          if (touched <= 0) {
            return <Text type='secondary'>-</Text>
          }
          const rate = value ?? Math.round((committed / touched) * 100)
          return <Tag color={rate >= 70 ? 'green' : rate >= 40 ? 'blue' : 'orange'}>{rate}%</Tag>
        },
      },
      {
        title: tp('detail.projects.interactionDays', { defaultValue: 'Interaction Days' }),
        dataIndex: 'interaction_days',
        key: 'interaction_days',
        width: 140,
        sorter: true,
      },
      {
        title: tp('detail.projects.interactionLogs', { defaultValue: 'Interaction Logs' }),
        dataIndex: 'interaction_log_count',
        key: 'interaction_log_count',
        width: 140,
        sorter: true,
      },
      {
        title: tp('detail.projects.activityScore', { defaultValue: 'Activity Score' }),
        dataIndex: 'activity_score',
        key: 'activity_score',
        width: 140,
        sorter: true,
        render: (value) => {
          const score = Number(value || 0)
          return <Tag color={score >= 80 ? 'green' : score >= 50 ? 'blue' : score >= 20 ? 'orange' : 'red'}>{score.toFixed(1)}</Tag>
        },
      },
      {
        title: tp('detail.projects.activitySignals', { defaultValue: 'Activity Signals' }),
        key: 'activity_signals',
        width: 140,
        render: (_, row) => {
          const touched = Number(row.touched_task_count || 0)
          const logs = Number(row.interaction_log_count || 0)
          return touched + logs
        },
      },
      {
        title: tp('detail.projects.lastActivity', { defaultValue: 'Last Activity' }),
        dataIndex: 'last_activity_at',
        key: 'last_activity_at',
        width: 180,
        sorter: true,
        render: (value) => formatDateTime(value),
      },
    ],
    [tp, getProjectStatusMeta, goToProjectDetail]
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
        scroll={{ x: 1320 }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.per_page,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onRow={(record) => ({
          onClick: (event) => {
            const target = event.target as HTMLElement
            if (target.closest('a')) {
              return
            }
            goToProjectDetail(record.project_id)
          },
          style: { cursor: 'pointer' },
        })}
        onChange={(paginationInfo, filters, sorter) => {
          setPagination((prev) => ({
            ...prev,
            page: paginationInfo.current || 1,
            per_page: paginationInfo.pageSize || prev.per_page,
          }))

          // Handle sorting
          if (sorter && typeof sorter === 'object' && 'field' in sorter) {
            const sortField = sorter.field as SortField
            const sortDirection = sorter.order === 'ascend' ? 'asc' : 'desc'
            if (sortField && sortField !== sortBy) {
              setSortBy(sortField)
            }
            if (sortDirection !== sortOrder) {
              setSortOrder(sortDirection)
            }
          }
        }}
      />
    </Space>
  )
}

export default AgentProjectsTab

