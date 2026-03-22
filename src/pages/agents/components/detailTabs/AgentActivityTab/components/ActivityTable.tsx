import { useMemo } from 'react'
import { Badge, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AgentActivityItem } from '../../../../../../api/agents'
import { usePageTranslation } from '../../../../../../i18n/hooks/useTranslation'
import { formatDateTime } from '../../shared'
import './ActivityTable.css'

const { Text } = Typography

interface ActivityTableProps {
  loading: boolean
  items: AgentActivityItem[]
  pagination: {
    page: number
    per_page: number
    total: number
  }
  activityLevelStatus: Record<string, 'error' | 'default' | 'success' | 'warning' | 'processing'>
  getActivitySourceLabel: (value?: string | null) => string
  getActivityLevelLabel: (value?: string | null) => string
  onPaginationChange: (page: number, pageSize: number) => void
  onRowClick: (record: AgentActivityItem) => void
}

export function ActivityTable({
  loading,
  items,
  pagination,
  activityLevelStatus,
  getActivitySourceLabel,
  getActivityLevelLabel,
  onPaginationChange,
  onRowClick,
}: ActivityTableProps) {
  const { tp } = usePageTranslation('agents')

  const columns: ColumnsType<AgentActivityItem> = useMemo(
    () => [
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
        render: (value) => (
          <Badge status={activityLevelStatus[value] || 'default'} text={getActivityLevelLabel(value)} />
        ),
      },
      {
        title: tp('detail.activity.related', { defaultValue: 'Related' }),
        key: 'related',
        width: 250,
        render: (_, row) => (
          <Space direction='vertical' size={2}>
            {row.task_id ? (
              <Text type='secondary'>
                {`${tp('detail.activity.taskId', { defaultValue: 'Task ID' })}: ${row.task_id}${row.task_title ? ` | ${row.task_title}` : ''}`}
              </Text>
            ) : null}
            {row.project_id ? (
              <Text type='secondary'>
                {`${tp('detail.activity.projectId', { defaultValue: 'Project ID' })}: ${row.project_id}${row.project_name ? ` | ${row.project_name}` : ''}`}
              </Text>
            ) : null}
            {row.run_id ? (
              <Text type='secondary'>{`${tp('detail.activity.runId', { defaultValue: 'Run ID' })}: ${row.run_id}`}</Text>
            ) : null}
            {row.attempt_id ? (
              <Text type='secondary'>{`${tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}: ${row.attempt_id}`}</Text>
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
          <Space direction='vertical' size={2}>
            <span>{value || '-'}</span>
            {typeof row.risk_score === 'number' ? (
              <Text type='secondary'>{`${tp('detail.activity.riskScore', { defaultValue: 'Risk Score' })}: ${row.risk_score}`}</Text>
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
    ],
    [tp, getActivitySourceLabel, getActivityLevelLabel, activityLevelStatus]
  )

  return (
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
        onClick: () => onRowClick(record),
        style: { cursor: 'pointer' },
      })}
      onChange={(pageInfo) => {
        onPaginationChange(pageInfo.current || 1, pageInfo.pageSize || pagination.per_page)
      }}
      className='activity-table'
    />
  )
}
