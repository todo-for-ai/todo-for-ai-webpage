/**
 * Agent 统计概览条
 *
 * 展示 Agent 总数、在线数、协调器数、执行中、待审核、离线数。
 */
import { Card, Row, Col, Typography } from 'antd'
import {
  DashboardOutlined,
  CheckCircleOutlined,
  DeploymentUnitOutlined,
  PlayCircleOutlined,
  BellOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { FC } from 'react'
import type { Agent, ReviewQueueItem } from '../../api/agents'

const { Text } = Typography

interface AgentStatsBarProps {
  agents: Agent[]
  reviewQueue: ReviewQueueItem[]
}

const AgentStatsBar: FC<AgentStatsBarProps> = ({ agents, reviewQueue }) => (
  <Card style={{ marginBottom: 16 }} size="small">
    <Row gutter={16}>
      <Col span={4}>
        <div style={{ textAlign: 'center' }}>
          <DashboardOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600 }}>{agents.length}</div>
          <Text type="secondary">Agent 总数</Text>
        </div>
      </Col>
      <Col span={4}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
          <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
            {agents.filter(a => a.status === 'active').length}
          </div>
          <Text type="secondary">在线</Text>
        </div>
      </Col>
      <Col span={4}>
        <div style={{ textAlign: 'center' }}>
          <DeploymentUnitOutlined style={{ fontSize: 20, color: '#722ed1' }} />
          <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#722ed1' }}>
            {agents.filter(a => a.kind === 'coordinator' && a.status === 'active').length}
          </div>
          <Text type="secondary">协调器</Text>
        </div>
      </Col>
      <Col span={4}>
        <div style={{ textAlign: 'center' }}>
          <PlayCircleOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
          <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>
            {agents.filter(a => a.stats?.active_assignments && a.stats.active_assignments > 0).length}
          </div>
          <Text type="secondary">执行中</Text>
        </div>
      </Col>
      <Col span={4}>
        <div style={{ textAlign: 'center' }}>
          <BellOutlined style={{ fontSize: 20, color: '#eb2f96' }} />
          <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#eb2f96' }}>
            {reviewQueue.length}
          </div>
          <Text type="secondary">待审核</Text>
        </div>
      </Col>
      <Col span={4}>
        <div style={{ textAlign: 'center' }}>
          <ThunderboltOutlined style={{ fontSize: 20, color: '#13c2c2' }} />
          <div style={{ marginTop: 4, fontSize: 24, fontWeight: 600, color: '#13c2c2' }}>
            {agents.filter(a => a.status === 'offline').length}
          </div>
          <Text type="secondary">离线</Text>
        </div>
      </Col>
    </Row>
  </Card>
)

export default AgentStatsBar
