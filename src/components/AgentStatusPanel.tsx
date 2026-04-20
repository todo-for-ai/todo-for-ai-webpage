import React, { useState, useEffect, useCallback } from 'react'
import { Card, Tag, Spin, Empty, Row, Col, Progress, Tooltip, Badge, Statistic, message } from 'antd'
import {
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { agentStatusApi } from '../api/agentStatus'
import type { WorkspaceHealthSummary, AgentRuntimeStatusValue } from '../api/agentStatus'

interface AgentStatusPanelProps {
  workspaceId: number
}

const STATUS_CONFIG: Record<AgentRuntimeStatusValue, { color: string; icon: React.ReactNode; label: string }> = {
  running: { color: 'green', icon: <CheckCircleOutlined />, label: 'Running' },
  idle: { color: 'blue', icon: <ClockCircleOutlined />, label: 'Idle' },
  busy: { color: 'orange', icon: <ThunderboltOutlined />, label: 'Busy' },
  error: { color: 'red', icon: <ExclamationCircleOutlined />, label: 'Error' },
  inactive: { color: 'default', icon: <StopOutlined />, label: 'Inactive' },
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({ workspaceId }) => {
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState<WorkspaceHealthSummary | null>(null)

  const loadHealth = useCallback(async () => {
    try {
      setLoading(true)
      const data = await agentStatusApi.getWorkspaceHealth(workspaceId)
      setHealth(data)
    } catch (error) {
      console.error('Failed to load agent health:', error)
      message.error('Failed to load agent status')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void loadHealth()
  }, [loadHealth])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void loadHealth()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadHealth])

  if (loading && !health) {
    return (
      <Card className='flat-card'>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      </Card>
    )
  }

  if (!health || health.agents.length === 0) {
    return (
      <Card className='flat-card' title={<span><RobotOutlined style={{ marginRight: 8 }} />Agent Status</span>}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No agents found' />
      </Card>
    )
  }

  return (
    <Card className='flat-card' title={<span><RobotOutlined style={{ marginRight: 8 }} />Agent Status</span>}>
      {/* Summary statistics row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title='Total' value={health.total_agents} valueStyle={{ fontSize: 20 }} />
        </Col>
        <Col span={6}>
          <Statistic
            title='Active'
            value={health.active_agents}
            valueStyle={{ fontSize: 20, color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title='Idle'
            value={health.idle_agents}
            valueStyle={{ fontSize: 20, color: '#1890ff' }}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title='Error'
            value={health.error_agents}
            valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
            prefix={<ExclamationCircleOutlined />}
          />
        </Col>
      </Row>

      {/* Agent cards grid */}
      <Row gutter={[12, 12]}>
        {health.agents.map((agent) => {
          const config = STATUS_CONFIG[agent.status]
          return (
            <Col key={agent.agent_id} xs={24} sm={12} md={8} lg={6}>
              <Card
                className='flat-card'
                size='small'
                style={{ height: '100%' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <RobotOutlined style={{ marginRight: 6 }} />
                    {agent.agent_name}
                  </span>
                  <Tag color={config.color} icon={config.icon}>
                    {config.label}
                  </Tag>
                </div>

                <div style={{ fontSize: 12, color: '#666' }}>
                  <div style={{ marginBottom: 4 }}>
                    Active Tasks: <Badge count={agent.active_tasks} size='small' style={{ backgroundColor: '#1890ff' }} />
                  </div>

                  {agent.cpu_usage !== null && (
                    <Tooltip title={`CPU: ${agent.cpu_usage}%`}>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ marginRight: 8 }}>CPU</span>
                        <Progress
                          percent={agent.cpu_usage}
                          size='small'
                          strokeColor={agent.cpu_usage > 80 ? '#ff4d4f' : '#52c41a'}
                          style={{ display: 'inline-block', width: 100 }}
                        />
                      </div>
                    </Tooltip>
                  )}

                  {agent.memory_usage !== null && (
                    <Tooltip title={`Memory: ${agent.memory_usage}%`}>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ marginRight: 8 }}>Mem</span>
                        <Progress
                          percent={agent.memory_usage}
                          size='small'
                          strokeColor={agent.memory_usage > 80 ? '#ff4d4f' : '#1890ff'}
                          style={{ display: 'inline-block', width: 100 }}
                        />
                      </div>
                    </Tooltip>
                  )}

                  <div style={{ marginTop: 4 }}>
                    Uptime: {formatUptime(agent.uptime_seconds)}
                  </div>

                  {agent.last_heartbeat && (
                    <Tooltip title={`Last heartbeat: ${new Date(agent.last_heartbeat).toLocaleString()}`}>
                      <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                        Last seen: {new Date(agent.last_heartbeat).toLocaleTimeString()}
                      </div>
                    </Tooltip>
                  )}
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>
    </Card>
  )
}

export default AgentStatusPanel
