import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Row, Col, Statistic, Spin, message, List, Tag, Space, Button, Tooltip, Empty, Badge, Alert, Popconfirm } from 'antd'
import {
  ReloadOutlined,
  ApiOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  ControlOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { dashboardApi } from '../api/dashboard'
import { agentsApi, type OrchestratorStatus } from '../api/agents'
import SecurityTrendSection from '../components/SecurityTrendSection'
import SecurityEventListItem from '../components/SecurityEventListItem'
import { useCollaborationSSE } from '../hooks/useCollaborationSSE'
import { useTranslation } from '../i18n/hooks/useTranslation'

const { Title, Text, Paragraph } = Typography

/**
 * Agent 协作指挥中心：单一页面聚合 Agent 监控、安全事件、冲突、编排状态
 * 四大数据源，作为统一指挥入口。支持手动刷新与 SSE 实时刷新。
 */
const CommandCenter: React.FC = () => {
  const { tn } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [monitorData, setMonitorData] = useState<any>(null)
  const [conflictData, setConflictData] = useState<any>(null)
  const [conflictList, setConflictList] = useState<any[]>([])
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [securityTrend, setSecurityTrend] = useState<any>(null)
  const [securityByAgent, setSecurityByAgent] = useState<any>(null)
  const [orchestratorStatus, setOrchestratorStatus] = useState<OrchestratorStatus | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string>('')  // 'orchestrate' | 'resolve' | 'export'

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [monitor, conflicts, conflictList, events, trend, byAgent, status] = await Promise.all([
        dashboardApi.getAgentMonitor({ hours: '24' }).catch(() => null),
        agentsApi.getConflictsDashboard().catch(() => null),
        agentsApi.listConflicts({ active_only: 'true' }).catch(() => ({ items: [] })),
        agentsApi.getSecurityEvents({ per_page: 10 }).catch(() => ({ items: [] })),
        agentsApi.getSecurityEventsDailyTrend({}).catch(() => null),
        agentsApi.getSecurityEventsByAgent({}).catch(() => null),
        agentsApi.getOrchestratorStatus().catch(() => null),
      ])
      setMonitorData(monitor)
      setConflictData(conflicts)
      setConflictList(conflictList?.items || [])
      setSecurityEvents(events?.items || [])
      setSecurityTrend(trend)
      setSecurityByAgent(byAgent)
      setOrchestratorStatus(status)
      setLastRefresh(new Date().toLocaleTimeString('zh-CN'))
    } catch {
      if (!silent) message.error('加载指挥中心数据失败')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
    // 每 60 秒自动刷新一次
    const id = setInterval(() => loadAll(true), 60000)
    return () => clearInterval(id)
  }, [loadAll])

  // SSE 实时刷新：任一协作相关事件触发静默刷新
  useCollaborationSSE({
    enabled: true,
    onEvent: useCallback(() => {
      // 任一协作事件可能影响四块数据，静默全量刷新
      loadAll(true)
    }, [loadAll]),
  })

  // 快捷操作：立即编排
  const runOrchestration = useCallback(async () => {
    setActionLoading('orchestrate')
    try {
      const result = await agentsApi.orchestrate()
      message.success(`编排完成（${result.duration_seconds}s，触发 ${result.triggers_fired}，解决冲突 ${result.conflicts_auto_resolved}）`)
      await loadAll(true)
    } catch {
      message.error('执行编排失败')
    } finally {
      setActionLoading('')
    }
  }, [loadAll])

  // 快捷操作：自动解决低严重度冲突
  const autoResolveConflicts = useCallback(async () => {
    setActionLoading('resolve')
    try {
      const result = await agentsApi.autoResolveConflicts()
      const resolved = result?.resolved || 0
      message.success(resolved > 0 ? `已自动解决 ${resolved} 个冲突` : '无符合条件的冲突可自动解决')
      await loadAll(true)
    } catch {
      message.error('自动解决冲突失败')
    } finally {
      setActionLoading('')
    }
  }, [loadAll])

  // 快捷操作：导出安全事件 CSV
  const exportSecurityEvents = useCallback(async () => {
    setActionLoading('export')
    try {
      const csv = await agentsApi.exportSecurityEvents({})
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security_events_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('安全事件已导出')
    } catch {
      message.error('导出安全事件失败')
    } finally {
      setActionLoading('')
    }
  }, [])

  const monitorSummary = monitorData?.summary || {}
  const activeAgents = monitorSummary.active || 0
  const totalAgents = monitorSummary.total || 0
  const busyAgents = monitorSummary.busy || 0
  const offlineAgents = monitorSummary.offline || 0

  const conflictTotal = conflictData?.total || 0
  const conflictActive = conflictData?.active || 0

  const criticalEvents = securityEvents.filter((e: any) => e.severity === 'CRITICAL').length

  // 安全事件最近环比（基于按天趋势的最后两天）
  const trendDays = securityTrend?.days || []
  const trendTotal = securityTrend?.totals?.total ?? 0
  const lastDay = trendDays.length > 0 ? trendDays[trendDays.length - 1].total : 0
  const prevDay = trendDays.length > 1 ? trendDays[trendDays.length - 2].total : 0
  const dayDelta = lastDay - prevDay
  const dayDeltaPct = prevDay > 0 ? Math.round((dayDelta / prevDay) * 100) : (dayDelta > 0 ? 100 : 0)

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        variant="borderless"
        title={
          <Space>
            <ControlOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>Agent 协作指挥中心</Title>
          </Space>
        }
        extra={
          <Space>
            {lastRefresh && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> 上次刷新 {lastRefresh}（60s 自动刷新）
              </Text>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => loadAll()} loading={loading}>刷新</Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          message="统一指挥视图"
          description="聚合 Agent 监控、安全审计事件、协作冲突、全局编排状态四大数据源，提供单一指挥入口。数据每 60 秒自动刷新，协作事件实时推送。"
        />
      </Card>

      {/* 快捷操作 */}
      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Popconfirm
            title="立即执行全局编排？"
            description="健康检查 + 工作流超时 + 触发器 + 冲突自动解决"
            onConfirm={runOrchestration}
          >
            <Button type="primary" icon={<ThunderboltOutlined />} loading={actionLoading === 'orchestrate'}>
              立即编排
            </Button>
          </Popconfirm>
          <Popconfirm
            title="自动解决低严重度冲突？"
            description="仅处理非 CRITICAL 且策略安全的冲突"
            onConfirm={autoResolveConflicts}
          >
            <Button icon={<CheckCircleOutlined />} loading={actionLoading === 'resolve'} disabled={conflictActive === 0}>
              自动解决冲突
            </Button>
          </Popconfirm>
          <Button icon={<DownloadOutlined />} onClick={exportSecurityEvents} loading={actionLoading === 'export'}>
            导出安全事件
          </Button>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {/* 顶部总览统计 */}
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

        {/* 安全事件环比提示 */}
        {trendDays.length > 0 && (
          <Alert
            style={{ marginBottom: 16 }}
            type={dayDelta > 0 ? 'warning' : dayDelta < 0 ? 'success' : 'info'}
            showIcon
            icon={dayDelta > 0 ? <ArrowUpOutlined /> : dayDelta < 0 ? <ArrowDownOutlined /> : undefined}
            message={
              <span style={{ fontSize: 13 }}>
                近 {trendDays.length} 天累计安全事件 <Text strong>{trendTotal}</Text> 起
                {trendDays.length > 1 && (
                  <>，最近一日 <Text strong>{lastDay}</Text> 起
                    {dayDelta !== 0 && (
                      <Text type={dayDelta > 0 ? 'danger' : 'success'}>
                        {' '}{dayDelta > 0 ? '↑' : '↓'} {Math.abs(dayDelta)}（{Math.abs(dayDeltaPct)}%）
                      </Text>
                    )}
                    {dayDelta === 0 && <Text type="secondary"> · 与前日持平</Text>}
                  </>
                )}
              </span>
            }
          />
        )}

        <Row gutter={[16, 16]}>
          {/* Agent 监控 */}
          <Col xs={24} lg={12}>
            <Card
              title={<Space><ApiOutlined /> Agent 监控（24h）</Space>}
              variant="borderless"
              extra={<Badge status={activeAgents > 0 ? 'success' : 'default'} text={activeAgents > 0 ? `${activeAgents} 在线` : '无在线'} />}
            >
              {monitorData ? (
                <>
                  <Row gutter={16}>
                    <Col span={8}><Statistic title="在线" value={activeAgents} valueStyle={{ fontSize: 16, color: '#52c41a' }} /></Col>
                    <Col span={8}><Statistic title="繁忙" value={busyAgents} valueStyle={{ fontSize: 16, color: '#faad14' }} /></Col>
                    <Col span={8}><Statistic title="离线" value={offlineAgents} valueStyle={{ fontSize: 16, color: '#ff4d4f' }} /></Col>
                  </Row>
                  {monitorData.agents && monitorData.agents.length > 0 ? (
                    <List
                      size="small"
                      style={{ marginTop: 12 }}
                      dataSource={monitorData.agents.slice(0, 6)}
                      renderItem={(a: any) => (
                        <List.Item
                          style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: 4 }}
                          onClick={() => navigate(`/todo-for-ai/pages/agents?agent_id=${a.id}`)}
                        >
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text ellipsis style={{ maxWidth: 160, color: '#1890ff' }}>{a.name || `Agent#${a.id}`}</Text>
                            <Space size={4}>
                              <Tag color={a.status === 'active' ? 'green' : a.status === 'busy' ? 'orange' : 'default'}>
                                {a.status || 'unknown'}
                              </Tag>
                              {a.current_task && <Tag color="blue">任务#{a.current_task}</Tag>}
                            </Space>
                          </Space>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无 Agent" style={{ marginTop: 12 }} />
                  )}
                </>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无监控数据" />
              )}
            </Card>
          </Col>

          {/* 安全事件近况 */}
          <Col xs={24} lg={12}>
            <Card
              title={<Space><SafetyOutlined /> 安全事件近况</Space>}
              variant="borderless"
              extra={criticalEvents > 0 ? <Tag color="error">{criticalEvents} 高危</Tag> : <Tag>正常</Tag>}
            >
              {/* 按天趋势 + Agent 排行（公共组件，Agent 可点击跳转详情） */}
              <SecurityTrendSection
                trend={securityTrend}
                byAgent={securityByAgent}
                onAgentClick={(agentId) => agentId && navigate(`/todo-for-ai/pages/agents?agent_id=${agentId}`)}
              />
              {securityEvents.length > 0 ? (
                <List
                  size="small"
                  dataSource={securityEvents.slice(0, 8)}
                  renderItem={(e: any) => (
                    <SecurityEventListItem
                      event={e}
                      variant="compact"
                      onRunClick={(runId) => navigate(`/todo-for-ai/pages/workflows?run_id=${runId}`)}
                    />
                  )}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无安全事件" />
              )}
            </Card>
          </Col>

          {/* 协作冲突 */}
          <Col xs={24} lg={12}>
            <Card
              title={<Space><WarningOutlined /> 协作冲突</Space>}
              variant="borderless"
              extra={conflictActive > 0 ? <Badge status="error" text={`${conflictActive} 活跃`} /> : <Badge status="success" text="无活跃" />}
            >
              {conflictData ? (
                <>
                  <Row gutter={16}>
                    <Col span={8}><Statistic title="冲突总数" value={conflictTotal} valueStyle={{ fontSize: 16 }} /></Col>
                    <Col span={8}><Statistic title="活跃" value={conflictActive} valueStyle={{ fontSize: 16, color: conflictActive > 0 ? '#ff4d4f' : undefined }} /></Col>
                    <Col span={8}><Statistic title="已解决" value={conflictData.resolved || 0} valueStyle={{ fontSize: 16, color: '#52c41a' }} /></Col>
                  </Row>
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按严重度：</Text>
                    <Space wrap size={[4, 4]} style={{ marginTop: 4 }}>
                      {Object.entries(conflictData.by_severity || {}).map(([k, v]: any) => v > 0 ? (
                        <Tag key={k} color={k === 'CRITICAL' ? 'red' : k === 'WARNING' ? 'orange' : 'blue'}>{k}: {v}</Tag>
                      ) : null)}
                      {Object.keys(conflictData.by_severity || {}).length === 0 && <Text type="secondary">无</Text>}
                    </Space>
                  </div>
                  {/* 活跃冲突列表 */}
                  {conflictList.length > 0 ? (
                    <List
                      size="small"
                      style={{ marginTop: 12 }}
                      dataSource={conflictList.slice(0, 5)}
                      renderItem={(c: any) => {
                        const sev = c.severity || 'INFO'
                        const sevColor = sev === 'CRITICAL' ? 'red' : sev === 'WARNING' ? 'orange' : 'blue'
                        return (
                          <List.Item>
                            <Space align="start" style={{ width: '100%' }}>
                              <Tag color={sevColor} style={{ marginTop: 2 }}>{sev}</Tag>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text ellipsis style={{ display: 'block', fontSize: 12 }}>
                                  {c.title || c.conflict_type || `冲突 #${c.id}`}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>#{c.id} · {c.status}</Text>
                              </div>
                            </Space>
                          </List.Item>
                        )
                      }}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无活跃冲突" style={{ marginTop: 12 }} />
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Button
                      size="small"
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() => navigate('/todo-for-ai/pages/agents?conflicts=1')}
                    >
                      查看全部 / 管理 →
                    </Button>
                  </div>
                </>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无冲突数据" />
              )}
            </Card>
          </Col>

          {/* 全局编排状态 */}
          <Col xs={24} lg={12}>
            <Card
              title={<Space><ThunderboltOutlined /> 全局编排状态</Space>}
              variant="borderless"
              extra={orchestratorStatus ? (
                <Badge status={orchestratorStatus.enabled ? 'success' : 'default'} text={orchestratorStatus.enabled ? '自动调度' : '手动'} />
              ) : null}
            >
              {orchestratorStatus ? (
                <>
                  <Row gutter={16}>
                    <Col span={12}><Statistic title="调度模式" value={orchestratorStatus.enabled ? '自动' : '手动'} valueStyle={{ fontSize: 16 }} /></Col>
                    <Col span={12}>
                      <Statistic
                        title="运行间隔"
                        value={orchestratorStatus.interval_seconds || 0}
                        suffix="s"
                        valueStyle={{ fontSize: 16 }}
                      />
                    </Col>
                  </Row>
                  {orchestratorStatus.last_run ? (
                    <Alert
                      style={{ marginTop: 12 }}
                      type={orchestratorStatus.last_run.error_count > 0 ? 'warning' : 'info'}
                      showIcon
                      message="上次运行"
                      description={
                        <span style={{ fontSize: 12 }}>
                          {orchestratorStatus.last_run.summary}
                          <Text type="secondary"> · 耗时 {orchestratorStatus.last_run.duration_seconds}s</Text>
                          {orchestratorStatus.last_run.error_count > 0 && (
                            <Text type="danger"> · {orchestratorStatus.last_run.error_count} 错误</Text>
                          )}
                        </span>
                      }
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚未运行编排" style={{ marginTop: 12 }} />
                  )}
                </>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无编排状态" />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}

export default CommandCenter
