/**
 * Dashboard「AgentStatsRow」面板（从 Dashboard.tsx 原样抽出）。
 */

import { useState } from 'react'
import { Card, Col, Row, Typography, Statistic, Table, Tag, Tooltip, Empty, Space, Button, Segmented, Select, DatePicker, Checkbox, Badge, Alert, Spin, List, Modal, Input, InputNumber, Dropdown, Progress } from 'antd'
import { CheckSquareOutlined, ClockCircleOutlined, ProjectOutlined, RobotOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Text } = Typography

interface Props {
  loading: any
  owned: any
  stats: any
}

export default function AgentStatsRow(props: Props) {
  const { loading,
    owned,
    stats } = props
  const { tp } = usePageTranslation('dashboard')

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.ownedProjects')}
              value={owned.projects.total || 0}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.ownedTasks')}
              value={owned.tasks.total || 0}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.ownedInProgress')}
              value={(owned.tasks.in_progress || 0) + (owned.tasks.review || 0)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.ownedAiExecuting')}
              value={owned.tasks.ai_executing || 0}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}
