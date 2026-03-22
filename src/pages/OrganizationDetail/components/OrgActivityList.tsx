/**
 * 组织活动列表组件
 */

import { Button, Space, Spin, Tag, Tooltip, Typography } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { LinkButton } from '../../../components/SmartLink'
import { formatFullDateTime, formatRelativeTimeI18n } from '../../../utils/dateUtils'
import { EVENT_LABEL_KEY_MAP } from '../constants'
import type { OrganizationEvent } from '../../../api/organizationEvents'
import './OrgActivityList.css'

const { Text } = Typography

interface OrgActivityListProps {
  events: OrganizationEvent[]
  loading: boolean
  tp: (key: string, options?: { defaultValue?: string }) => string
  onViewAll: () => void
}

export const OrgActivityList: React.FC<OrgActivityListProps> = ({
  events,
  loading,
  tp,
  onViewAll,
}) => {
  const formatEventType = (eventType: string): string => {
    const key = EVENT_LABEL_KEY_MAP[eventType]
    if (key) {
      return tp(`detail.activity.eventTypes.${key}`, { defaultValue: eventType })
    }
    return eventType
  }

  const getEventSummary = (record: OrganizationEvent): string => {
    const payload = record.payload || {}
    const changedFields = Array.isArray(payload.changed_fields)
      ? payload.changed_fields.filter(Boolean).join(', ')
      : ''

    return (
      record.message ||
      payload.task_title ||
      payload.project_name ||
      payload.organization_name ||
      payload.agent_name ||
      changedFields ||
      formatEventType(record.event_type)
    )
  }

  const getEventTimestamp = (record: OrganizationEvent): string =>
    record.occurred_at || record.created_at

  return (
    <div className="org-activity-list">
      <div className="org-activity-list__header">
        <div>
          <Text strong>{tp('detail.recentActivity.title')}</Text>
          <div className="org-activity-list__subtitle">{tp('detail.recentActivity.subtitle')}</div>
        </div>
        <Button type="link" size="small" onClick={onViewAll}>
          {tp('detail.recentActivity.viewAll')}
        </Button>
      </div>

      {loading && events.length === 0 ? (
        <div className="org-activity-list__empty">
          <Spin size="small" />
        </div>
      ) : events.length > 0 ? (
        <div className="org-activity-list__items">
          {events.slice(0, 5).map((record) => {
            const eventAt = getEventTimestamp(record)
            return (
              <div key={record.id} className="org-activity-list__item">
                <div className="org-activity-list__icon">
                  <HistoryOutlined />
                </div>
                <div className="org-activity-list__content">
                  <div className="org-activity-list__title">{formatEventType(record.event_type)}</div>
                  <div className="org-activity-list__body">{getEventSummary(record)}</div>
                  <div className="org-activity-list__meta">
                    <span>{tp('detail.recentActivity.actor')}: {record.actor_name || record.actor_type || '-'}</span>
                    <Tooltip title={formatFullDateTime(eventAt)}>
                      <span>{formatRelativeTimeI18n(eventAt, tp)}</span>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="org-activity-list__empty">
          <Text type="secondary">{tp('detail.recentActivity.empty')}</Text>
        </div>
      )}
    </div>
  )
}
