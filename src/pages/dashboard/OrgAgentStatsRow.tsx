/**
 * Dashboard「OrgAgentStatsRow」面板（从 Dashboard.tsx 原样抽出）。
 */

import { useState } from 'react'
import { Card, Col, Row, Typography, Statistic, Table, Tag, Tooltip, Empty, Space, Button, Segmented, Select, DatePicker, Checkbox, Badge, Alert, Spin, List, Modal, Input, InputNumber, Dropdown, Progress } from 'antd'
import { ClockCircleOutlined, RobotOutlined, TeamOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Text } = Typography

interface Props {
  loading: any
  orgSummary: any
  stats: any
}

export default function OrgAgentStatsRow(props: Props) {
  const { loading,
    orgSummary,
    stats } = props
  const { tp } = usePageTranslation('dashboard')

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.totalOrganizations')}
              value={orgSummary.total || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.totalAgents')}
              value={orgSummary.total_agents || 0}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#531dab' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title={tp('stats.activeAgents7d')}
              value={orgSummary.active_agents_7d || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#389e0d' }}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}
