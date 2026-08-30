/**
 * 实时协作事件流卡片
 *
 * 展示 SSE 推送的实时协作事件，支持清空。
 */
import { Card, Space, Tag, Badge, Button, Typography } from 'antd'
import type { FC } from 'react'

const { Text } = Typography

export interface LiveEvent {
  type: string
  payload: any
  time: number
}

interface LiveEventFeedCardProps {
  events: LiveEvent[]
  onClear: () => void
}

const LiveEventFeedCard: FC<LiveEventFeedCardProps> = ({ events, onClear }) => {
  if (events.length === 0) return null

  return (
    <Card
      title={
        <Space>
          <Badge dot color="#52c41a" />
          实时协作事件
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
      extra={<Button size="small" onClick={onClear}>清空</Button>}
    >
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {events.map((ev, i) => (
          <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <Space size={4}>
              <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{ev.type}</Tag>
              <span>
                {ev.payload?.from_agent?.name && <Text type="secondary">{ev.payload.from_agent.name}</Text>}
                {ev.payload?.to_agent?.name && <Text type="secondary"> → {ev.payload.to_agent.name}</Text>}
                {ev.payload?.content && <Text>{String(ev.payload.content).slice(0, 60)}</Text>}
                {ev.payload?.task_id && <Tag style={{ fontSize: 10, margin: 0 }}>#{ev.payload.task_id}</Tag>}
              </span>
            </Space>
            <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
              {new Date(ev.time).toLocaleTimeString()}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default LiveEventFeedCard
