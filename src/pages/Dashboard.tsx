import { useEffect, useState, useCallback } from 'react'
import { Typography, Card, Row, Col, Statistic, Spin, message, List, Tag, Select, Table, Tooltip, Empty, Space, Button } from 'antd'
import {
  ProjectOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SwapOutlined,
  DashboardOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { dashboardApi, type DashboardStats } from '../api/dashboard'
import { agentsApi } from '../api/agents'
import ActivityHeatmap from '../components/ActivityHeatmap'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography

const _formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
  return `${(seconds / 3600).toFixed(1)}小时`
}

const _KIND_LABELS: Record<string, string> = {
  assistant: '助手',
  autonomous: '自主',
  coordinator: '协调者',
  external: '外部',
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { tp, tc, pageTitle } = usePageTranslation('dashboard')

  // Collaboration metrics state
  const [collabMetrics, setCollabMetrics] = useState<any>(null)
  const [collabLoading, setCollabLoading] = useState(false)
  const [collabDays, setCollabDays] = useState(7)

  // Agent monitor state
  const [monitorData, setMonitorData] = useState<any>(null)
  const [monitorLoading, setMonitorLoading] = useState(false)
  const [monitorHours, setMonitorHours] = useState(24)

  // Sandbox monitor state
  const [sandboxData, setSandboxData] = useState<any>(null)
  const [sandboxLoading, setSandboxLoading] = useState(false)

  // Conflict monitor state
  const [conflictData, setConflictData] = useState<any>(null)
  const [conflictLoading, setConflictLoading] = useState(false)

  const agentCollaboration = stats?.agent_collaboration
  const reviewOrExpiredAssignments =
    (agentCollaboration?.assignments.review || 0) + (agentCollaboration?.assignments.expired_leases || 0)
  const hasExpiredLeases = (agentCollaboration?.assignments.expired_leases || 0) > 0

  // 设置网页标题
  useEffect(() => {
    document.title = `${pageTitle} - Todo for AI`

    // 组件卸载时恢复默认标题
    return () => {
      document.title = 'Todo for AI'
    }
  }, [pageTitle])

  // 加载仪表盘数据
  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
      message.error(tc('messages.error.general'))
    } finally {
      setLoading(false)
    }
  }

  const loadCollabMetrics = useCallback(async () => {
    setCollabLoading(true)
    try {
      const result = await agentsApi.getCollaborationMetrics({ days: collabDays })
      setCollabMetrics(result)
    } catch {
      // silent
    } finally {
      setCollabLoading(false)
    }
  }, [collabDays])

  useEffect(() => {
    loadCollabMetrics()
  }, [loadCollabMetrics])

  const loadMonitorData = useCallback(async () => {
    setMonitorLoading(true)
    try {
      const result = await dashboardApi.getAgentMonitor({ hours: String(monitorHours) })
      setMonitorData(result)
    } catch {
      // silent
    } finally {
      setMonitorLoading(false)
    }
  }, [monitorHours])

  useEffect(() => {
    loadMonitorData()
  }, [loadMonitorData])

  const loadSandboxData = useCallback(async () => {
    setSandboxLoading(true)
    try {
      const result = await agentsApi.getSandboxDashboard()
      setSandboxData(result)
    } catch {
      // silent
    } finally {
      setSandboxLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSandboxData()
  }, [loadSandboxData])

  const loadConflictData = useCallback(async () => {
    setConflictLoading(true)
    try {
      const result = await agentsApi.getConflictsDashboard()
      setConflictData(result)
    } catch {
      // silent
    } finally {
      setConflictLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConflictData()
  }, [loadConflictData])

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  // 获取任务状态标签颜色
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'todo': 'default',
      'in_progress': 'processing',
      'review': 'warning',
      'done': 'success',
      'cancelled': 'error'
    }
    return colors[status] || 'default'
  }

  // 获取任务状态文本
  const getStatusText = (status: string) => {
    const statusKey = `taskStatus.${status}`
    try {
      return tp(statusKey)
    } catch {
      return status
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      </div>
    )
  }
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          {pageTitle}
        </Title>
        <Paragraph className="page-description">
          {tp('subtitle')}
        </Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('stats.totalProjects')}
              value={stats?.projects.total || 0}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('misc.totalTasks')}
              value={stats?.tasks.total || 0}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('taskStatus.in_progress')}
              value={(stats?.tasks.in_progress || 0) + (stats?.tasks.review || 0)}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={tp('taskStatus.ai_executing')}
              value={stats?.tasks.ai_executing || 0}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Agent 协作概览 */}
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

      {/* 活跃度热力图 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <ActivityHeatmap />
        </Col>
      </Row>

      {/* 协作指标 */}
      <Card
        title={
          <span>
            <DashboardOutlined style={{ marginRight: 8 }} />
            多 Agent 协作指标
          </span>
        }
        extra={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Select
              size="small"
              value={collabDays}
              onChange={setCollabDays}
              style={{ width: 120 }}
              options={[
                { value: 1, label: '最近 1 天' },
                { value: 7, label: '最近 7 天' },
                { value: 30, label: '最近 30 天' },
                { value: 90, label: '最近 90 天' },
              ]}
            />
            <Tooltip title="刷新">
              <ReloadOutlined spin={collabLoading} onClick={loadCollabMetrics} style={{ cursor: 'pointer' }} />
            </Tooltip>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Spin spinning={collabLoading}>
          {collabMetrics ? (
            <>
              {/* Core stats row */}
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="任务完成率"
                    value={collabMetrics.tasks?.completion_rate ?? 0}
                    suffix="%"
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: (collabMetrics.tasks?.completion_rate ?? 0) >= 70 ? '#52c41a' : '#faad14', fontSize: 20 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Agent 利用率"
                    value={collabMetrics.agents?.utilization_pct ?? 0}
                    suffix="%"
                    prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: (collabMetrics.agents?.utilization_pct ?? 0) >= 60 ? '#1890ff' : '#faad14', fontSize: 20 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="工作流成功率"
                    value={collabMetrics.workflows?.success_rate ?? 0}
                    suffix="%"
                    prefix={<ApartmentOutlined style={{ color: '#722ed1' }} />}
                    valueStyle={{ color: (collabMetrics.workflows?.success_rate ?? 0) >= 80 ? '#52c41a' : '#faad14', fontSize: 20 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="任务交接"
                    value={collabMetrics.handoffs ?? 0}
                    prefix={<SwapOutlined style={{ color: '#fa8c16' }} />}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
              </Row>

              {/* Task breakdown + Agent status */}
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12}>
                  <Card size="small" title="任务状态" extra={<Tag>共 {collabMetrics.tasks?.total ?? 0} 个</Tag>}>
                    <Row gutter={8}>
                      <Col span={8}><Statistic title="进行中" value={collabMetrics.tasks?.in_progress ?? 0} valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Col>
                      <Col span={8}><Statistic title="已阻塞" value={collabMetrics.tasks?.blocked ?? 0} valueStyle={{ fontSize: 16, color: '#ff4d4f' }} /></Col>
                      <Col span={8}><Statistic title="待审查" value={collabMetrics.tasks?.review ?? 0} valueStyle={{ fontSize: 16, color: '#faad14' }} /></Col>
                    </Row>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#8c8c8c' }}>
                      平均完成时间: {_formatDuration(collabMetrics.tasks?.avg_completion_seconds ?? 0)}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" title="Agent 状态" extra={<Tag>共 {collabMetrics.agents?.total ?? 0} 个</Tag>}>
                    <Row gutter={8}>
                      <Col span={8}><Statistic title="活跃" value={collabMetrics.agents?.active ?? 0} valueStyle={{ fontSize: 16, color: '#52c41a' }} prefix={<ThunderboltOutlined />} /></Col>
                      <Col span={8}><Statistic title="暂停" value={collabMetrics.agents?.paused ?? 0} valueStyle={{ fontSize: 16, color: '#faad14' }} /></Col>
                      <Col span={8}><Statistic title="离线" value={collabMetrics.agents?.offline ?? 0} valueStyle={{ fontSize: 16, color: '#8c8c8c' }} /></Col>
                    </Row>
                    {collabMetrics.agents?.kind_distribution && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {Object.entries(collabMetrics.agents.kind_distribution).map(([k, v]) => (
                          <Tag key={k} color="blue" style={{ fontSize: 11 }}>{_KIND_LABELS[k] || k}: {v as number}</Tag>
                        ))}
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>

              {/* Trend chart */}
              {collabMetrics.trend?.length > 0 && (
                <Card size="small" title="任务趋势" style={{ marginBottom: 16 }} extra={<span style={{ fontSize: 11, color: '#8c8c8c' }}><span style={{ color: '#1890ff' }}>■</span> 创建 <span style={{ color: '#52c41a' }}>■</span> 完成</span>}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, padding: '0 4px' }}>
                    {collabMetrics.trend.map((t: any, i: number) => {
                      const maxVal = Math.max(...collabMetrics.trend.map((x: any) => Math.max(x.created, x.completed)), 1)
                      return (
                        <Tooltip key={i} title={`${t.date}: 创建 ${t.created}, 完成 ${t.completed}`}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 16 }}>
                            <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 60 }}>
                              <div style={{ width: 8, height: Math.max(2, (t.created / maxVal) * 56), background: '#1890ff', borderRadius: 2 }} />
                              <div style={{ width: 8, height: Math.max(2, (t.completed / maxVal) * 56), background: '#52c41a', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 9, color: '#8c8c8c', marginTop: 2 }}>{t.date.slice(5)}</span>
                          </div>
                        </Tooltip>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Top agents */}
              {collabMetrics.top_agents?.length > 0 && (
                <Card size="small" title="Top Agent（完成任务数）">
                  <Table
                    size="small"
                    dataSource={collabMetrics.top_agents}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: '排名', width: 60, render: (_: any, __: any, i: number) => <Tag color={i < 3 ? 'gold' : 'default'}>{i + 1}</Tag> },
                      { title: 'Agent', dataIndex: 'name', render: (name: string, r: any) => <>{name} <Tag>{_KIND_LABELS[r.kind] || r.kind}</Tag></> },
                      { title: '完成任务', dataIndex: 'completed_count', sorter: (a: any, b: any) => a.completed_count - b.completed_count },
                    ]}
                  />
                </Card>
              )}

              {/* Agent performance analysis */}
              {collabMetrics.agent_performance?.length > 0 && (
                <Card size="small" title="Agent 性能分析" style={{ marginTop: 16 }}>
                  <Table
                    size="small"
                    dataSource={collabMetrics.agent_performance}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: 'Agent', dataIndex: 'name' },
                      { title: '总分配', dataIndex: 'total_assignments', width: 80 },
                      { title: '完成', dataIndex: 'done', width: 60 },
                      { title: '失败', dataIndex: 'failed', width: 60, render: (v: number) => v > 0 ? <span style={{ color: '#ff4d4f' }}>{v}</span> : v },
                      {
                        title: '成功率',
                        dataIndex: 'success_rate',
                        width: 100,
                        sorter: (a: any, b: any) => a.success_rate - b.success_rate,
                        render: (rate: number) => (
                          <span style={{ color: rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f' }}>
                            {rate}%
                          </span>
                        ),
                      },
                    ]}
                  />
                </Card>
              )}
            </>
          ) : (
            <Empty description="暂无协作数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

      {/* Agent Real-time Monitor */}
      <Card
        title={<Space><DashboardOutlined /> Agent 实时监控</Space>}
        style={{ marginBottom: 24 }}
        extra={<Space><Select size="small" value={monitorHours} onChange={setMonitorHours} style={{ width: 100 }} options={[{ value: 6, label: '6小时' }, { value: 24, label: '24小时' }, { value: 72, label: '3天' }, { value: 168, label: '7天' }]} /><Button size="small" icon={<ReloadOutlined />} onClick={loadMonitorData} loading={monitorLoading} /></Space>}
      >
        <Spin spinning={monitorLoading}>
          {monitorData ? (
            <>
              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col span={6}><Statistic title="总 Agent" value={monitorData.summary?.total_agents || 0} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={6}><Statistic title="活跃" value={monitorData.summary?.active || 0} valueStyle={{ fontSize: 16, color: '#52c41a' }} prefix={<ThunderboltOutlined />} /></Col>
                <Col span={6}><Statistic title="离线" value={monitorData.summary?.offline || 0} valueStyle={{ fontSize: 16, color: '#8c8c8c' }} /></Col>
                <Col span={6}><Statistic title="活跃任务" value={monitorData.summary?.total_active_tasks || 0} valueStyle={{ fontSize: 16 }} /></Col>
              </Row>
              <Table
                size="small"
                dataSource={monitorData.agents || []}
                rowKey="agent_id"
                pagination={monitorData.agents?.length > 10 ? { pageSize: 10 } : false}
                scroll={{ x: 800 }}
                columns={[
                  {
                    title: 'Agent',
                    width: 160,
                    render: (_: any, r: any) => (
                      <Space>
                        <Tag color={r.real_status === 'active' ? 'green' : r.real_status === 'offline' ? 'default' : 'orange'}>{r.real_status}</Tag>
                        <span>{r.agent_name}</span>
                      </Space>
                    ),
                  },
                  { title: '类型', dataIndex: 'agent_kind', width: 70, render: (v: string) => _KIND_LABELS[v] || v },
                  { title: '角色', dataIndex: 'collaboration_role', width: 80, render: (v: string) => <Tag color="blue" style={{ fontSize: 10 }}>{v}</Tag> },
                  {
                    title: '任务',
                    dataIndex: 'active_task_count',
                    width: 60,
                    render: (v: number) => v > 0 ? <span style={{ color: '#1890ff', fontWeight: 600 }}>{v}</span> : <span style={{ color: '#8c8c8c' }}>0</span>,
                  },
                  {
                    title: '声誉',
                    width: 80,
                    render: (_: any, r: any) => r.reputation ? <span style={{ color: r.reputation.score >= 70 ? '#52c41a' : r.reputation.score >= 40 ? '#faad14' : '#ff4d4f' }}>{r.reputation.score?.toFixed(0)}</span> : '-',
                  },
                  {
                    title: '经验',
                    width: 70,
                    render: (_: any, r: any) => <span>{r.experience_count || 0}<Text type="secondary" style={{ fontSize: 10 }}>({r.shared_experience_count || 0}共享)</Text></span>,
                  },
                  {
                    title: '跨项目',
                    dataIndex: 'cross_project_count',
                    width: 70,
                    render: (v: number) => v > 0 ? <Tag color="cyan" style={{ fontSize: 10 }}>{v}</Tag> : '-',
                  },
                  {
                    title: '活动趋势',
                    dataIndex: 'activity_trend',
                    width: 120,
                    render: (trend: any[]) => {
                      if (!trend || trend.length === 0) return <Text type="secondary" style={{ fontSize: 10 }}>无数据</Text>
                      const maxCount = Math.max(...trend.map((t: any) => t.count), 1)
                      return (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 24 }}>
                          {trend.slice(-24).map((t: any, i: number) => (
                            <div key={i} style={{ width: 4, height: Math.max(1, (t.count / maxCount) * 20), background: '#1890ff', borderRadius: 1, opacity: 0.4 + (t.count / maxCount) * 0.6 }} />
                          ))}
                        </div>
                      )
                    },
                  },
                  {
                    title: '最后在线',
                    dataIndex: 'last_seen_at',
                    width: 100,
                    render: (v: string) => {
                      if (!v) return '-'
                      const diff = Math.floor((Date.now() - new Date(v).getTime()) / 60000)
                      if (diff < 1) return <span style={{ color: '#52c41a' }}>刚刚</span>
                      if (diff < 60) return <span style={{ color: '#52c41a' }}>{diff}分钟前</span>
                      if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
                      return `${Math.floor(diff / 1440)}天前`
                    },
                  },
                ]}
              />
            </>
          ) : (
            <Empty description="暂无监控数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

      {/* Sandbox Security Monitor */}
      <Card
        title={<Space><SafetyOutlined /> 沙盒安全监控</Space>}
        style={{ marginBottom: 24 }}
        extra={<Space><Button size="small" icon={<ReloadOutlined />} onClick={loadSandboxData} loading={sandboxLoading} /></Space>}
      >
        <Spin spinning={sandboxLoading}>
          {sandboxData ? (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={4}><Statistic title="沙盒策略" value={sandboxData.total_sandboxes || 0} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={4}><Statistic title="执行总数" value={sandboxData.total_executions || 0} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={4}><Statistic title="运行中" value={sandboxData.running_executions || 0} valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Col>
                <Col span={4}><Statistic title="违规总数" value={sandboxData.total_violations || 0} valueStyle={{ fontSize: 16, color: (sandboxData.total_violations || 0) > 0 ? '#ff4d4f' : undefined }} prefix={(sandboxData.total_violations || 0) > 0 ? <WarningOutlined /> : undefined} /></Col>
                <Col span={12}>
                  <Space size={[8, 8]} wrap>
                    <Text type="secondary" style={{ fontSize: 12 }}>按级别:</Text>
                    {Object.entries(sandboxData.by_level || {}).map(([k, v]: any) => (
                      <Tag key={k} color={k === 'strict' ? 'red' : k === 'permissive' ? 'green' : 'orange'} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={24}>
                  <Text type="secondary" style={{ fontSize: 12 }}>执行状态分布:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(sandboxData.by_status || {}).map(([k, v]: any) => (
                      <Tag key={k} color={k === 'completed' ? 'green' : k === 'running' ? 'blue' : k === 'violated' ? 'red' : k === 'revoked' ? 'orange' : k === 'failed' ? 'volcano' : 'default'} style={{ fontSize: 11 }}>
                        {k}: {v}
                      </Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
            </>
          ) : (
            <Empty description="暂无沙盒数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

      {/* Conflict Monitor */}
      <Card
        title={<Space><WarningOutlined /> 协作冲突监控</Space>}
        style={{ marginBottom: 24 }}
        extra={<Space><Button size="small" icon={<ReloadOutlined />} onClick={loadConflictData} loading={conflictLoading} /></Space>}
      >
        <Spin spinning={conflictLoading}>
          {conflictData ? (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}><Statistic title="冲突总数" value={conflictData.total || 0} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={6}><Statistic title="活跃冲突" value={conflictData.active || 0} valueStyle={{ fontSize: 16, color: (conflictData.active || 0) > 0 ? '#ff4d4f' : undefined }} prefix={(conflictData.active || 0) > 0 ? <WarningOutlined /> : undefined} /></Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按严重度:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(conflictData.by_severity || {}).map(([k, v]: any) => (
                      <Tag key={k} color={k === 'critical' ? 'red' : k === 'warning' ? 'orange' : 'blue'} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按类型:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(conflictData.by_type || {}).map(([k, v]: any) => v > 0 ? (
                      <Tag key={k} color="purple" style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ) : null)}
                  </Space>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按状态:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(conflictData.by_status || {}).map(([k, v]: any) => v > 0 ? (
                      <Tag key={k} color={k === 'resolved' ? 'green' : k === 'detected' ? 'red' : k === 'ignored' ? 'default' : 'blue'} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ) : null}
                  </Space>
                </Col>
              </Row>
            </>
          ) : (
            <Empty description="暂无冲突数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

      {/* 最近项目和任务 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={tp('sections.recentProjects')} variant="borderless">
            {stats?.recent_projects && stats.recent_projects.length > 0 ? (
              <List
                dataSource={stats.recent_projects}
                renderItem={(project) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<ProjectOutlined style={{ color: '#1890ff' }} />}
                      title={project.name}
                      description={
                        <div>
                          <div>{project.description || tp('misc.noDescription')}</div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            <CalendarOutlined style={{ marginRight: '4px' }} />
                            {formatDate(project.updated_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <ProjectOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>{tc('empty.noProjects')}</div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={tp('sections.recentTasks')} variant="borderless">
            {stats?.recent_tasks && stats.recent_tasks.length > 0 ? (
              <List
                dataSource={stats.recent_tasks}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CheckSquareOutlined style={{ color: '#52c41a' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{task.title}</span>
                          <Tag color={getStatusColor(task.status)}>
                            {getStatusText(task.status)}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ color: '#666' }}>
                            {task.project?.name || tp('misc.unknownProject')}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            <CalendarOutlined style={{ marginRight: '4px' }} />
                            {formatDate(task.updated_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <CheckSquareOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>{tc('empty.noTasks')}</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
