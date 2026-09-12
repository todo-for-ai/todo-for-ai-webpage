/**
 * Dashboard「TopOrganizationsRow」面板（从 Dashboard.tsx 原样抽出）。
 */

import { useState } from 'react'
import { Card, Col, Row, Typography, Statistic, Table, Tag, Tooltip, Empty, Space, Button, Segmented, Select, DatePicker, Checkbox, Badge, Alert, Spin, List, Modal, Input, InputNumber, Dropdown, Progress } from 'antd'
import { CalendarOutlined, TeamOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Text } = Typography

interface Props {
  formatDateTime: any
  loading: any
  stats: any
  topOrganizations: any[]
}

export default function TopOrganizationsRow(props: Props) {
  const { formatDateTime,
    loading,
    stats,
    topOrganizations } = props
  const { tp } = usePageTranslation('dashboard')

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card title={tp('sections.topOrganizations')} variant="borderless" loading={loading}>
            {topOrganizations.length > 0 ? (
              <List
                dataSource={(topOrganizations as any[]) || undefined}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<TeamOutlined style={{ color: '#1677ff' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{item.organization_name}</span>
                          <Tag color="blue">
                            {tp('labels.myRole')}: {item.my_role}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div>
                            {tp('stats.activeAgents7d')}: <strong>{item.active_agents_7d}</strong> / {tp('stats.totalAgents')}:{' '}
                            <strong>{item.total_agents}</strong>
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            <CalendarOutlined style={{ marginRight: '4px' }} />
                            {tp('labels.lastAgentActivity')}: {formatDateTime(item.last_agent_activity_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <TeamOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>{tp('empty.noOrganizations')}</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </>
  )
}
