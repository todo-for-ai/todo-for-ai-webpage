import React, { useState, useEffect } from 'react'
import { Badge, Dropdown, List, Space, Tag, Typography, Button, Spin } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../modules/notifications'
import type { NotificationItem } from '../api/notificationTypes'

const { Text } = Typography

const NotificationBell: React.FC = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { loading, items, unreadCount, markAsRead, markAllAsRead, reload } = useNotifications({
    page: 1,
    perPage: 10,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      void reload()
    }, 30000)
    return () => clearInterval(interval)
  }, [reload])

  const handleClickItem = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markAsRead(item.id)
    }
    setOpen(false)
    if (item.link_url) {
      navigate(item.link_url)
    } else {
      navigate('/todo-for-ai/pages/notifications')
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const listContent = (
    <div style={{ width: 360, maxHeight: 400, overflowY: 'auto' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>通知中心</Text>
        {items.length > 0 && (
          <Button size="small" type="link" onClick={() => void handleMarkAllRead()}>
            全部已读
          </Button>
        )}
      </div>
      <Spin spinning={loading}>
        <List
          dataSource={items.slice(0, 8)}
          locale={{ emptyText: <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>暂无通知</div> }}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '10px 16px', opacity: item.is_read ? 0.7 : 1 }}
              onClick={() => void handleClickItem(item)}
            >
              <List.Item.Meta
                title={(
                  <Space size={4}>
                    <Text strong={!item.is_read}>{item.title}</Text>
                    {!item.is_read && <Tag color="gold" style={{ margin: 0 }}>未读</Tag>}
                  </Space>
                )}
                description={(
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.body || item.event_type}
                  </Text>
                )}
              />
            </List.Item>
          )}
        />
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <Button type="link" size="small" onClick={() => { setOpen(false); navigate('/todo-for-ai/pages/notifications') }}>
            查看全部通知
          </Button>
        </div>
      </Spin>
    </div>
  )

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => listContent}
      placement="bottomRight"
      trigger={['click']}
    >
      <div style={{ cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
        <Badge count={unreadCount} overflowCount={99} size="small">
          <BellOutlined style={{ fontSize: 20, color: '#666' }} />
        </Badge>
      </div>
    </Dropdown>
  )
}

export default NotificationBell
