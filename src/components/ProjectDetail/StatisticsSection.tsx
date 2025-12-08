import React from 'react'
import { Row, Col, Card, Statistic } from 'antd'
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

interface ProjectStats {
  total_tasks: number
  todo_tasks: number
  in_progress_tasks: number
  done_tasks: number
  context_rules_count: number
}

interface StatisticsSectionProps {
  stats: ProjectStats
}

export const StatisticsSection: React.FC<StatisticsSectionProps> = ({ stats }) => {
  const { tp } = usePageTranslation('projectDetail')

  return (
    <Row gutter={[8, 8]} style={{ marginBottom: '12px' }}>
      <Col xs={24} sm={12} md={6}>
        <Card style={{ padding: '8px 12px' }} bodyStyle={{ padding: '8px' }}>
          <Statistic
            title={tp('overview.stats.totalTasks')}
            value={stats.total_tasks}
            prefix={<CheckSquareOutlined style={{ fontSize: '14px' }} />}
            valueStyle={{ color: '#1890ff', fontSize: '18px' }}
            style={{ textAlign: 'center' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card style={{ padding: '8px 12px' }} bodyStyle={{ padding: '8px' }}>
          <Statistic
            title={tp('overview.stats.todoTasks')}
            value={stats.todo_tasks}
            prefix={<ClockCircleOutlined style={{ fontSize: '14px' }} />}
            valueStyle={{ color: '#faad14', fontSize: '18px' }}
            style={{ textAlign: 'center' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card style={{ padding: '8px 12px' }} bodyStyle={{ padding: '8px' }}>
          <Statistic
            title={tp('overview.stats.inProgressTasks')}
            value={stats.in_progress_tasks}
            prefix={<ClockCircleOutlined style={{ fontSize: '14px' }} />}
            valueStyle={{ color: '#1890ff', fontSize: '18px' }}
            style={{ textAlign: 'center' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card style={{ padding: '8px 12px' }} bodyStyle={{ padding: '8px' }}>
          <Statistic
            title={tp('overview.stats.doneTasks')}
            value={stats.done_tasks}
            prefix={<CheckCircleOutlined style={{ fontSize: '14px' }} />}
            valueStyle={{ color: '#52c41a', fontSize: '18px' }}
            style={{ textAlign: 'center' }}
          />
        </Card>
      </Col>
    </Row>
  )
}
