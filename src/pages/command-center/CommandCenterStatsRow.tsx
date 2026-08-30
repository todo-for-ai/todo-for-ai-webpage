/**
 * 指挥中心总览统计行
 *
 * 展示活跃 Agent、繁忙/离线、活跃冲突、高危安全事件四个统计卡片。
 */
import { Card, Col, Row, Statistic } from 'antd'
import { ApiOutlined, ThunderboltOutlined, WarningOutlined, SafetyOutlined } from '@ant-design/icons'
import type { FC } from 'react'

interface CommandCenterStatsRowProps {
  totalAgents: number
  activeAgents: number
  busyAgents: number
  offlineAgents: number
  conflictActive: number
  criticalEvents: number
}

const CommandCenterStatsRow: FC<CommandCenterStatsRowProps> = ({
  totalAgents,
  activeAgents,
  busyAgents,
  offlineAgents,
  conflictActive,
  criticalEvents,
}) => (
  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
    <Col xs={12} sm={6}>
      <Card variant="borderless">
        <Statistic
          title="活跃 Agent"
          value={activeAgents}
          suffix={totalAgents ? `/ ${totalAgents}` : ''}
          valueStyle={{ color: '#52c41a' }}
          prefix={<ApiOutlined />}
        />
      </Card>
    </Col>
    <Col xs={12} sm={6}>
      <Card variant="borderless">
        <Statistic
          title="繁忙 / 离线"
          value={busyAgents}
          suffix={`/ ${offlineAgents}`}
          prefix={<ThunderboltOutlined />}
        />
      </Card>
    </Col>
    <Col xs={12} sm={6}>
      <Card variant="borderless">
        <Statistic
          title="活跃冲突"
          value={conflictActive}
          valueStyle={{ color: conflictActive > 0 ? '#ff4d4f' : undefined }}
          prefix={conflictActive > 0 ? <WarningOutlined /> : undefined}
        />
      </Card>
    </Col>
    <Col xs={12} sm={6}>
      <Card variant="borderless">
        <Statistic
          title="高危安全事件"
          value={criticalEvents}
          valueStyle={{ color: criticalEvents > 0 ? '#ff4d4f' : undefined }}
          prefix={<SafetyOutlined />}
        />
      </Card>
    </Col>
  </Row>
)

export default CommandCenterStatsRow
