/**
 * 协作通知弹出框
 *
 * 展示协作通知列表，支持全部已读标记。
 */
import { Popover, Badge, Button, Tag, Typography } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import type { FC } from 'react'

const { Text } = Typography

interface NotificationItem {
  id: number | string
  event_type: string
  is_read: boolean
  agent_name?: string
  task_title?: string
  task_id?: number
  created_at: string
}

interface NotificationPopoverProps {
  unreadCount: number
  notifications: NotificationItem[]
  loading: boolean
  onMarkAllRead: () => void
  onOpen: () => void
}

const NotificationPopover: FC<NotificationPopoverProps> = ({
  unreadCount,
  notifications,
  loading,
  onMarkAllRead,
  onOpen,
}) => (
  <Popover
    title={
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>协作通知</span>
        {unreadCount > 0 && (
          <Button size="small" type="link" onClick={onMarkAllRead}>全部已读</Button>
        )}
      </div>
    }
    content={
      <div style={{ maxWidth: 360, maxHeight: 400, overflow: 'auto' }}>
        {loading && <Text type="secondary">加载中…</Text>}
        {!loading && notifications.length === 0 && (
          <Text type="secondary">暂无通知</Text>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            style={{
              padding: '6px 8px',
              borderBottom: '1px solid #f0f0f0',
              background: n.is_read ? 'transparent' : '#f6ffed',
              borderRadius: 4,
              marginBottom: 2,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color="blue" style={{ margin: 0 }}>{n.event_type}</Tag>
              {!n.is_read && <Tag color="green" style={{ margin: 0, fontSize: 10 }}>新</Tag>}
            </div>
            <div style={{ marginTop: 4, fontSize: 13 }}>
              {n.agent_name && <Text strong>{n.agent_name}</Text>}
              {n.task_title && <Text type="secondary"> — {n.task_title}</Text>}
              {!n.task_title && n.task_id && <Text type="secondary"> — 任务 #{n.task_id}</Text>}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              {new Date(n.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    }
    trigger="click"
    onOpenChange={(open) => { if (open) onOpen() }}
  >
    <Badge count={unreadCount} size="small" offset={[-4, 4]}>
      <Button icon={<BellOutlined />} shape="circle" size="small" />
    </Badge>
  </Popover>
)

export default NotificationPopover
