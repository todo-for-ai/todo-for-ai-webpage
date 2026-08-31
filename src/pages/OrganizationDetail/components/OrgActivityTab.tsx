/**
 * 活动标签页组件
 */

import { Empty, Table } from 'antd'
import type { OrganizationEvent } from '../../../api/organizationEvents'
import type { EventsPagination } from '../types'
import { formatDateTime } from '../utils'
import { EVENT_LABEL_KEY_MAP } from '../constants'

interface OrgActivityTabProps {
  events: OrganizationEvent[]
  loading: boolean
  pagination: EventsPagination | null
  tp: (key: string, options?: { defaultValue?: string }) => string
  onPageChange: (page: number) => void
}

export const OrgActivityTab: React.FC<OrgActivityTabProps> = ({
  events,
  loading,
  pagination,
  tp,
  onPageChange,
}) => {
  const formatEventType = (eventType: string): string => {
    const key = EVENT_LABEL_KEY_MAP[eventType]
    if (key) {
      return tp(`detail.activity.eventTypes.${key}`, { defaultValue: eventType })
    }
    return eventType
  }

  const columns = [
    {
      title: tp('detail.activity.columns.time'),
      key: 'occurred_at',
      width: 180,
      render: (_: unknown, record: OrganizationEvent) =>
        formatDateTime(record.occurred_at || record.created_at || undefined, 'zh-CN'),
    },
    {
      title: tp('detail.activity.columns.event'),
      key: 'event',
      render: (_: unknown, record: OrganizationEvent) => {
        const detailText =
          record.message ||
          record.payload?.task_title ||
          record.payload?.project_name ||
          ''
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{formatEventType(record.event_type)}</div>
            {detailText ? (
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>{detailText}</div>
            ) : null}
          </div>
        )
      },
    },
    {
      title: tp('detail.activity.columns.actor'),
      key: 'actor',
      width: 160,
      render: (_: unknown, record: OrganizationEvent) => (
        <span>{record.actor_name || record.actor_id || '-'}</span>
      ),
    },
  ]

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={events}
      columns={columns}
      pagination={{
        current: pagination?.page || 1,
        pageSize: pagination?.per_page || 20,
        total: pagination?.total || 0,
        showSizeChanger: false,
      }}
      onChange={(paginationConfig) => {
        onPageChange(paginationConfig.current || 1)
      }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={tp('detail.activity.empty')}
          />
        ),
      }}
    />
  )
}
