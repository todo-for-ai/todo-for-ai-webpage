/**
 * Agent 监控卡片
 *
 * 展示 Agent 在线状态、繁忙/离线统计及列表。
 */
import { useNavigate } from 'react-router-dom'
import { Badge, Card, Col, Empty, List, Row, Space, Statistic, Tag, Typography } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import type { FC } from 'react'

const { Text } = Typography

interface AgentMonitorCardProps {
  monitorData: any
  activeAgents: number
  busyAgents: number
  offlineAgents: number
}

const AgentMonitorCard: FC<AgentMonitorCardProps> = ({
  monitorData,
  activeAgents,
  busyAgents,
  offlineAgents,
}) => {
  const navigate = useNavigate()

  return (
    <Card
      title={<Space><ApiOutlined /> Agent 监控（24h）</Space>}
      variant="borderless"
      extra={<Badge status={activeAgents > 0 ? 'success' : 'default'} text={activeAgents > 0 ? `${activeAgents} 在线` : '无在线'} />}
    >
      {monitorData ? (
        <>
          <Row gutter={16}>
            <Col span={8}><Statistic title="在线" value={activeAgents} valueStyle={{ fontSize: 16, color: '#52c41a' }} /></Col>
            <Col span={8}><Statistic title="繁忙" value={busyAgents} valueStyle={{ fontSize: 16, color: '#faad14' }} /></Col>
            <Col span={8}><Statistic title="离线" value={offlineAgents} valueStyle={{ fontSize: 16, color: '#ff4d4f' }} /></Col>
          </Row>
          {monitorData.agents && monitorData.agents.length > 0 ? (
            <List
              size="small"
              style={{ marginTop: 12 }}
              dataSource={monitorData.agents.slice(0, 6)}
              renderItem={(a: any) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: 4 }}
                  onClick={() => navigate(`/todo-for-ai/pages/agents?agent_id=${a.id}`)}
                >
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text ellipsis style={{ maxWidth: 160, color: '#1890ff' }}>{a.name || `Agent#${a.id}`}</Text>
                    <Space size={4}>
                      <Tag color={a.status === 'active' ? 'green' : a.status === 'busy' ? 'orange' : 'default'}>
                        {a.status || 'unknown'}
                      </Tag>
                      {a.current_task && <Tag color="blue">任务#{a.current_task}</Tag>}
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无 Agent" style={{ marginTop: 12 }} />
          )}
        </>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无监控数据" />
      )}
    </Card>
  )
}

export default AgentMonitorCard