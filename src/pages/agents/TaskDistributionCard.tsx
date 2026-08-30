/**
 * 任务分布统计卡片
 *
 * 展示任务总数、已完成、完成率，以及按状态分布和协作派发统计。
 */
import { Card, Row, Col, Divider, Space, Tag, Typography } from 'antd'
import type { FC } from 'react'
import type { DashboardStats } from '../../api/dashboard'

const { Text } = Typography

interface TaskDistributionCardProps {
  stats: DashboardStats
}

const TaskDistributionCard: FC<TaskDistributionCardProps> = ({ stats }) => (
  <Card title="任务分布" size="small" style={{ marginBottom: 16 }}>
    <Row gutter={16}>
      <Col span={8}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.tasks.total}</div>
          <Text type="secondary">任务总数</Text>
        </div>
      </Col>
      <Col span={8}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a' }}>{stats.tasks.done}</div>
          <Text type="secondary">已完成</Text>
        </div>
      </Col>
      <Col span={8}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#1890ff' }}>
            {stats.tasks.total > 0
              ? Math.round((stats.tasks.done / stats.tasks.total) * 100)
              : 0}%
          </div>
          <Text type="secondary">完成率</Text>
        </div>
      </Col>
    </Row>
    <Divider style={{ margin: '12px 0' }} />
    <Space size={[8, 8]} wrap>
      <Tag color="default">待办 {stats.tasks.todo}</Tag>
      <Tag color="blue">进行中 {stats.tasks.in_progress}</Tag>
      <Tag color="purple">待审核 {stats.tasks.review}</Tag>
      <Tag color="green">已完成 {stats.tasks.done}</Tag>
      {stats.tasks.ai_executing > 0 && (
        <Tag color="geekblue">AI 执行中 {stats.tasks.ai_executing}</Tag>
      )}
    </Space>
    {stats.agent_collaboration && (
      <>
        <Divider style={{ margin: '12px 0' }} />
        <Text type="secondary" style={{ fontSize: 12 }}>协作派发：</Text>
        <Space size={[8, 8]} wrap style={{ marginTop: 4 }}>
          <Tag color="processing">活跃 {stats.agent_collaboration.assignments.active}</Tag>
          <Tag color="gold">等人工 {stats.agent_collaboration.assignments.waiting_human}</Tag>
          <Tag color="purple">审核 {stats.agent_collaboration.assignments.review}</Tag>
          {stats.agent_collaboration.assignments.expired_leases > 0 && (
            <Tag color="red">过期 {stats.agent_collaboration.assignments.expired_leases}</Tag>
          )}
        </Space>
      </>
    )}
  </Card>
)

export default TaskDistributionCard
