/**
 * Dashboard「CollabOverviewRow」面板（从 Dashboard.tsx 原样抽出）。
 */

import { useState } from 'react'
import { Card, Col, Row, Typography, Statistic, Table, Tag, Tooltip, Empty, Space, Button, Segmented, Select, DatePicker, Checkbox, Badge, Alert, Spin, List, Modal, Input, InputNumber, Dropdown, Progress } from 'antd'
import { ExclamationCircleOutlined, FieldTimeOutlined, RobotOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Text } = Typography

interface Props {
  agentCollaboration: any
  hasExpiredLeases: any
  reviewOrExpiredAssignments: any
}

export default function CollabOverviewRow(props: Props) {
  const { agentCollaboration,
    hasExpiredLeases,
    reviewOrExpiredAssignments } = props
  const { tp } = usePageTranslation('dashboard')

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('agentCollaboration.activeAgents')}
              value={agentCollaboration?.agents.active || 0}
              prefix={<TeamOutlined />}
              suffix={`/ ${agentCollaboration?.agents.total || 0}`}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('agentCollaboration.activeAssignments')}
              value={agentCollaboration?.assignments.active || 0}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('agentCollaboration.waitingHuman')}
              value={agentCollaboration?.assignments.waiting_human || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('agentCollaboration.reviewAndExpired')}
              value={reviewOrExpiredAssignments}
              prefix={hasExpiredLeases ? <FieldTimeOutlined /> : <SafetyCertificateOutlined />}
              valueStyle={{ color: hasExpiredLeases ? '#cf1322' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    </>
  )
}
