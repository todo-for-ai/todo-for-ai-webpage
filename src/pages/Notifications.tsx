import { useEffect, useState } from 'react'
import { Badge, Button, Card, List, Segmented, Space, Tag, Typography, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { NotificationItem } from '../api/notificationTypes'
import { useNotifications, notificationLevelColorMap } from '../modules/notifications'

const { Title, Paragraph, Text } = Typography

const Notifications = () => {
  const navigate = useNavigate()
  const [onlyUnread, setOnlyUnread] = useState(false)
  const { loading, items, unreadCount, markAsRead, markAllAsRead } = useNotifications({
    unreadOnly: onlyUnread,
    page: 1,
    perPage: 50,
  })

  useEffect(() => {
    document.title = '通知中心 - Todo for AI'
  }, [onlyUnread])

  const handleOpenNotification = async (item: NotificationItem) => {
    try {
      if (!item.is_read) {
        await markAsRead(item.id)
      }
      if (item.link_url) {
        navigate(item.link_url)
      }
    } catch (error: any) {
      message.error(error?.message || '打开通知失败')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      message.success('已全部标记为已读')
    } catch (error: any) {
      message.error(error?.message || '批量已读失败')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">通知中心</Title>
        <Paragraph className="page-description">
          查看任务创建、完成、被分配和被提及等站内消息，并管理未读状态。
        </Paragraph>
      </div>

      <Card
        extra={(
          <Space>
            <Segmented
              value={onlyUnread ? 'unread' : 'all'}
              onChange={(value) => setOnlyUnread(value === 'unread')}
              options={[
                { label: '全部', value: 'all' },
                { label: '仅未读', value: 'unread' },
              ]}
            />
            <Button onClick={() => void handleMarkAllRead()}>全部已读</Button>
          </Space>
        )}
      >
        <Paragraph>
          当前未读：<Badge count={unreadCount} overflowCount={99} />
        </Paragraph>

        <List
          loading={loading}
          dataSource={items}
          locale={{ emptyText: '暂无通知' }}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => void handleOpenNotification(item)}
            >
              <List.Item.Meta
                title={(
                  <Space wrap>
                    <Text strong={!item.is_read}>{item.title}</Text>
                    <Tag color={notificationLevelColorMap[item.level] || 'blue'}>{item.level}</Tag>
                    {!item.is_read && <Tag color="gold">未读</Tag>}
                  </Space>
                )}
                description={(
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">{item.body || item.event_type}</Text>
                    <Text type="secondary">{new Date(item.created_at).toLocaleString()}</Text>
                  </Space>
                )}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default Notifications
