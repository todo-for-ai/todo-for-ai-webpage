import React from 'react'
import { Row, Col, Card, Statistic } from 'antd'
import {
  UserOutlined,
  StopOutlined,
  CrownOutlined,
  TeamOutlined
} from '@ant-design/icons'

interface UserStats {
  total: number
  active: number
  suspended: number
  admins: number
}

interface UserStatsCardsProps {
  stats: UserStats
  tp: (key: string) => string
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({ stats, tp }) => {
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card>
          <Statistic
            title={tp('stats.totalUsers')}
            value={stats.total}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title={tp('stats.activeUsers')}
            value={stats.active}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title={tp('stats.suspendedUsers')}
            value={stats.suspended}
            prefix={<StopOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title={tp('stats.admins')}
            value={stats.admins}
            prefix={<CrownOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
    </Row>
  )
}

export default UserStatsCards
