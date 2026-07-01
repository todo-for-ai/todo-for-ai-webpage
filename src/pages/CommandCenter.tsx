import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Row, Col, Statistic, Spin, message, List, Tag, Space, Button, Tooltip, Empty, Badge, Alert, Popconfirm, Modal, Form, Select, Input, Segmented, Dropdown } from 'antd'
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
  LineChartOutlined,
  ShareAltOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { dashboardApi } from '../api/dashboard'
import { agentsApi, type OrchestratorStatus } from '../api/agents'
import dayjs from 'dayjs'
import SecurityTrendSection from '../components/SecurityTrendSection'
import SecurityEventListItem from '../components/SecurityEventListItem'
import SecurityEventDetailModal from '../components/SecurityEventDetailModal'
import CollaborationGraphView from '../components/CollaborationGraphView'
import PlatformActivityTrendSection from '../components/PlatformActivityTrendSection'
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
  const [orchDailyTrend, setOrchDailyTrend] = useState<any>(null)
  const [collabGraph, setCollabGraph] = useState<any>(null)
  const [collabGraphLoading, setCollabGraphLoading] = useState(false)
  const collabSvgRef = useRef<SVGSVGElement>(null)
  // 节点点击展开的协作明细 Modal
  const [collabDetail, setCollabDetail] = useState<{ agentId: number; name: string; list: any[]; loading: boolean } | null>(null)
  const [graphWindow, setGraphWindow] = useState<string>('30')
  const [graphLayout, setGraphLayout] = useState<'circular' | 'grid'>('circular')
  const [graphKinds, setGraphKinds] = useState<string[]>([])
  const [graphSearch, setGraphSearch] = useState('')

  // 协作图摘要（反映 kind 筛选）
  const collabSummary = useMemo(() => {
    if (!collabGraph) return null
    const kindSet = graphKinds.length > 0 ? new Set(graphKinds) : null
    const nodes = kindSet ? collabGraph.nodes.filter((n: any) => n.kind && kindSet.has(n.kind)) : collabGraph.nodes
    const visibleIds = new Set(nodes.map((n: any) => n.id))
    const edges = kindSet ? collabGraph.edges.filter((e: any) => visibleIds.has(e.source) && visibleIds.has(e.target)) : collabGraph.edges
    if (edges.length === 0) return { nodeCount: nodes.length, edgeCount: 0, topPair: null }
    const top = edges.reduce((m: any, e: any) => (e.count > m.count ? e : m), edges[0])
    const topPair = { source: nodes.find((n: any) => n.id === top.source)?.name, target: nodes.find((n: any) => n.id === top.target)?.name, count: top.count }
    return { nodeCount: nodes.length, edgeCount: edges.length, topPair }
  }, [collabGraph, graphKinds])

  // 协作明细 Modal 内嵌迷你子图：以选中 Agent 为中心
  const collabDetailGraph = useMemo(() => {
    if (!collabDetail || collabDetail.list.length === 0) return null
    const center = collabDetail
    const nodes = [
      { id: center.agentId, name: center.name, kind: undefined, messages: 0 },
      ...collabDetail.list.map((c: any) => ({ id: c.agent_id, name: c.name, kind: undefined, messages: c.total })),
    ]
    nodes[0].messages = collabDetail.list.reduce((s: number, c: any) => s + (c.total || 0), 0)
    const edges = collabDetail.list.map((c: any) => ({
      source: Math.min(center.agentId, c.agent_id),
      target: Math.max(center.agentId, c.agent_id),
      count: c.total,
      ...(center.agentId < c.agent_id
        ? { source_to_target: c.sent, target_to_source: c.received }
        : { source_to_target: c.received, target_to_source: c.sent }),
    }))
    return { nodes, edges, total_edges: edges.length }
  }, [collabDetail])
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveForm, setResolveForm] = useState<any>({ conflict_id: 0, strategy: 'manual', description: '' })
  const [eventDetail, setEventDetail] = useState<any>(null)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string>('')  // 'orchestrate' | 'resolve' | 'export'
  const [trendWindow, setTrendWindow] = useState<string>('30')
  const [trendSeverity, setTrendSeverity] = useState<string>('')
  const [trendEventType, setTrendEventType] = useState<string>('')

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const trendSince = trendWindow === 'all' ? undefined : dayjs().subtract(Number(trendWindow), 'day').toISOString()
      const trendParams: any = trendSince ? { since: trendSince } : {}
      if (trendSeverity) trendParams.severity = trendSeverity
      if (trendEventType) trendParams.event_type = trendEventType
      const [monitor, conflicts, conflictList, events, trend, byAgent, status, orchTrend] = await Promise.all([
        dashboardApi.getAgentMonitor({ hours: '24' }).catch(() => null),
        agentsApi.getConflictsDashboard().catch(() => null),
        agentsApi.listConflicts({ active_only: 'true' }).catch(() => ({ items: [] })),
        agentsApi.getSecurityEvents({ per_page: 10 }).catch(() => ({ items: [] })),
        agentsApi.getSecurityEventsDailyTrend(trendParams).catch(() => null),
        agentsApi.getSecurityEventsByAgent({}).catch(() => null),
        agentsApi.getOrchestratorStatus().catch(() => null),
        agentsApi.getOrchestratorDailyTrend(trendParams).catch(() => null),
      ])
      setMonitorData(monitor)
      setConflictData(conflicts)
      setConflictList(conflictList?.items || [])
      setSecurityEvents(events?.items || [])
      setSecurityTrend(trend)
      setSecurityByAgent(byAgent)
      setOrchestratorStatus(status)
      setOrchDailyTrend(orchTrend)
      setLastRefresh(new Date().toLocaleTimeString('zh-CN'))
    } catch {
      if (!silent) message.error('加载指挥中心数据失败')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [trendWindow, trendSeverity, trendEventType])

  useEffect(() => {
    loadAll()
    // 每 60 秒自动刷新一次
    const id = setInterval(() => loadAll(true), 60000)
    return () => clearInterval(id)
  }, [loadAll])

  // Agent 协作关系图（独立加载，避免 loadAll 膨胀）
  const loadCollabGraph = useCallback(async (window: string) => {
    setCollabGraphLoading(true)
    try {
      const since = window === 'all' ? undefined : dayjs().subtract(Number(window), 'day').toISOString()
      const g = await agentsApi.getCollaborationGraph(since ? { limit: 50, since } : { limit: 50 }).catch(() => null)
      setCollabGraph(g)
    } catch {
      // silent
    } finally {
      setCollabGraphLoading(false)
    }
  }, [])

  // 点击协作图节点：加载该 Agent 的 top 协作者明细
  const loadCollabDetail = useCallback(async (agentId: number, name: string) => {
    setCollabDetail({ agentId, name, list: [], loading: true })
    try {
      const result = await agentsApi.getAgentCollaborators(agentId, { limit: 10 })
      setCollabDetail({ agentId, name, list: result?.collaborators || [], loading: false })
    } catch {
      setCollabDetail({ agentId, name, list: [], loading: false })
    }
  }, [])

  useEffect(() => {
    loadCollabGraph(graphWindow)
  }, [loadCollabGraph, graphWindow])

  // SSE 实时刷新：任一协作相关事件触发静默刷新
  useCollaborationSSE({
    enabled: true,
    onEvent: useCallback((event: any) => {
      // 任一协作事件可能影响四块数据，静默全量刷新
      loadAll(true)
      // Agent 直接消息事件刷新协作关系图
      if ((event?.event_type || '') === 'agent.direct_message') {
        loadCollabGraph(graphWindow)
      }
    }, [loadAll, loadCollabGraph, graphWindow]),
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

  // 打开单个冲突解决 Modal
  const openResolveConflict = (c: any) => {
    setResolveForm({ conflict_id: c.id, strategy: c.suggested_strategy || 'manual', description: '' })
    setResolveOpen(true)
  }

  // 提交解决冲突
  const submitResolveConflict = async () => {
    try {
      const result = await agentsApi.resolveConflict(resolveForm.conflict_id, resolveForm.strategy, resolveForm.description)
      message.success('冲突已解决')
      setResolveOpen(false)
      await loadAll(true)
      if (result?.actions?.length) message.info(`执行 ${result.actions.length} 项动作`, 4)
    } catch {
      message.error('解决失败')
    }
  }

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

  // 导出协作关系图为 CSV（反映当前 kind 筛选）
  const exportCollabGraph = useCallback(() => {
    if (!collabGraph || (!collabGraph.nodes?.length && !collabGraph.edges?.length)) {
      message.warning('暂无协作关系数据可导出')
      return
    }
    const kindSet = graphKinds.length > 0 ? new Set(graphKinds) : null
    const nodes = kindSet ? collabGraph.nodes.filter((n: any) => n.kind && kindSet.has(n.kind)) : collabGraph.nodes
    const visibleIds = new Set(nodes.map((n: any) => n.id))
    const edges = kindSet ? collabGraph.edges.filter((e: any) => visibleIds.has(e.source) && visibleIds.has(e.target)) : collabGraph.edges
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines: string[] = []
    lines.push('# 节点')
    lines.push(['id', 'name', 'kind', 'messages'].map(esc).join(','))
    nodes.forEach((n: any) => lines.push([n.id, n.name, n.kind ?? '', n.messages].map(esc).join(',')))
    lines.push('')
    lines.push('# 边')
    lines.push(['source', 'target', 'count', 'source_to_target', 'target_to_source'].map(esc).join(','))
    edges.forEach((e: any) => lines.push([e.source, e.target, e.count, e.source_to_target ?? 0, e.target_to_source ?? 0].map(esc).join(',')))
    const text = '﻿' + lines.join('\n')
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collaboration_graph_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('协作关系图已导出为 CSV')
  }, [collabGraph, graphKinds])

  // 导出协作关系图为 SVG 图片
  const exportCollabGraphSvg = useCallback(() => {
    const svg = collabSvgRef.current
    if (!svg) {
      message.warning('暂无可导出的图形')
      return
    }
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const text = new XMLSerializer().serializeToString(clone)
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + text], { type: 'image/svg+xml;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collaboration_graph_${new Date().toISOString().slice(0, 10)}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('协作关系图已导出为 SVG')
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

        {/* 平台活动统一趋势：编排活动 + 安全事件同时间轴 */}
        <Card
          title={<Space><LineChartOutlined /> 平台活动统一趋势</Space>}
          variant="borderless"
          style={{ marginBottom: 16 }}
          extra={
            <Space wrap>
              <Segmented
                size="small"
                value={trendEventType || 'all'}
                onChange={(v) => setTrendEventType(v === 'all' ? '' : v as string)}
                options={[
                  { value: 'all', label: '全类型' },
                  { value: 'sandbox_violation', label: '沙盒' },
                  { value: 'conflict', label: '冲突' },
                  { value: 'audit', label: '审计' },
                ]}
              />
              <Segmented
                size="small"
                value={trendSeverity || 'all'}
                onChange={(v) => setTrendSeverity(v === 'all' ? '' : v as string)}
                options={[
                  { value: 'all', label: '全部' },
                  { value: 'CRITICAL', label: '高危' },
                  { value: 'WARNING', label: '警告' },
                  { value: 'INFO', label: '普通' },
                ]}
              />
              <Segmented
                size="small"
                value={trendWindow}
                onChange={(v) => setTrendWindow(v as string)}
                options={[
                  { value: '7', label: '7天' },
                  { value: '30', label: '30天' },
                  { value: 'all', label: '全部' },
                ]}
              />
            </Space>
          }
        >
          <PlatformActivityTrendSection
            orchestratorTrend={orchDailyTrend}
            securityTrend={securityTrend}
          />
        </Card>

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
                      onShowDetail={(ev) => setEventDetail(ev)}
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
                          <List.Item
                            style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: 4 }}
                            onClick={() => openResolveConflict(c)}
                          >
                            <Space align="start" style={{ width: '100%' }}>
                              <Tag color={sevColor} style={{ marginTop: 2 }}>{sev}</Tag>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text ellipsis style={{ display: 'block', fontSize: 12, color: '#1890ff' }}>
                                  {c.title || c.conflict_type || `冲突 #${c.id}`}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>#{c.id} · {c.status}{c.suggested_strategy ? ` · 建议 ${c.suggested_strategy}` : ''}</Text>
                              </div>
                              <Tag style={{ fontSize: 11 }}>解决 →</Tag>
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
                          {orchestratorStatus.last_run.trigger_run_ids && orchestratorStatus.last_run.trigger_run_ids.length > 0 && (
                            <>
                              <Text type="secondary"> · </Text>
                              <Dropdown
                                menu={{
                                  items: orchestratorStatus.last_run.trigger_run_ids.map((rid: number) => ({ key: String(rid), label: `Run #${rid}` })),
                                  onClick: ({ key }) => navigate(`/todo-for-ai/pages/workflows?run_id=${key}`),
                                }}
                              >
                                <Tag color="purple" style={{ cursor: 'pointer' }}>查看运行 →</Tag>
                              </Dropdown>
                            </>
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

        {/* Agent 协作关系图 */}
        <Card
          title={
            <Space>
              <ShareAltOutlined /> Agent 协作关系图
              {collabSummary && (
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                  {collabSummary.nodeCount} 节点 · {collabSummary.edgeCount} 边
                  {collabSummary.topPair && ` · 最活跃: ${collabSummary.topPair.source} ↔ ${collabSummary.topPair.target} (${collabSummary.topPair.count})`}
                </Text>
              )}
            </Space>
          }
          variant="borderless"
          style={{ marginTop: 16 }}
          extra={
            <Space size="small" wrap>
              <Segmented
                size="small"
                value={graphLayout}
                onChange={(v) => setGraphLayout(v as 'circular' | 'grid')}
                options={[
                  { label: '环形', value: 'circular' },
                  { label: '网格', value: 'grid' },
                ]}
              />
              <Segmented
                size="small"
                value={graphWindow}
                onChange={(v) => setGraphWindow(v as string)}
                options={[
                  { label: '7天', value: '7' },
                  { label: '30天', value: '30' },
                  { label: '全部', value: 'all' },
                ]}
              />
              <Select
                size="small"
                mode="multiple"
                maxTagCount="responsive"
                style={{ minWidth: 140 }}
                placeholder="全部类型"
                value={graphKinds}
                onChange={setGraphKinds}
                options={[
                  { value: 'coordinator', label: '协调者' },
                  { value: 'autonomous', label: '自主型' },
                  { value: 'assistant', label: '助手型' },
                  { value: 'external', label: '外部' },
                ]}
              />
              <Dropdown menu={{
                items: [
                  { key: 'csv', label: '导出 CSV', onClick: exportCollabGraph },
                  { key: 'svg', label: '导出 SVG', onClick: exportCollabGraphSvg },
                ],
              }}>
                <Button size="small" icon={<DownloadOutlined />}>导出</Button>
              </Dropdown>
              <Input
                size="small"
                allowClear
                style={{ width: 140 }}
                placeholder="搜索 Agent 名称"
                prefix={<SearchOutlined />}
                value={graphSearch}
                onChange={(e) => setGraphSearch(e.target.value)}
              />
            </Space>
          }
        >
          <CollaborationGraphView
            ref={collabSvgRef}
            data={collabGraph}
            size={380}
            layout={graphLayout}
            filterKinds={graphKinds.length > 0 ? graphKinds : undefined}
            searchTerm={graphSearch || undefined}
            onNodeClick={(agentId) => {
              const node = collabGraph?.nodes.find((n: any) => n.id === agentId)
              loadCollabDetail(agentId, node?.name || `Agent#${agentId}`)
            }}
          />
        </Card>
      </Spin>

      {/* 解决冲突 Modal */}
      <Modal
        title={`解决冲突 #${resolveForm.conflict_id}`}
        open={resolveOpen}
        onCancel={() => setResolveOpen(false)}
        onOk={submitResolveConflict}
        okText="解决"
      >
        <Form layout="vertical">
          <Form.Item label="解决策略" required>
            <Select value={resolveForm.strategy} onChange={(v) => setResolveForm({ ...resolveForm, strategy: v })}>
              <Select.Option value="first_wins">先到先得 (保留最早分配)</Select.Option>
              <Select.Option value="highest_reputation">最高声誉 (声誉最佳者胜出)</Select.Option>
              <Select.Option value="least_loaded">最少负载 (活跃任务最少者胜出)</Select.Option>
              <Select.Option value="auto_retry">自动重试 (取消过期/重新排队)</Select.Option>
              <Select.Option value="split">拆分 (分配给多方)</Select.Option>
              <Select.Option value="escalate">升级 (转交协调者)</Select.Option>
              <Select.Option value="manual">人工 (仅记录)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="解决说明">
            <Input.TextArea value={resolveForm.description} onChange={(e) => setResolveForm({ ...resolveForm, description: e.target.value })} placeholder="可选: 解决备注" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 安全事件详情 Modal */}
      <SecurityEventDetailModal
        event={eventDetail}
        onClose={() => setEventDetail(null)}
        onRunClick={(runId) => navigate(`/todo-for-ai/pages/workflows?run_id=${runId}`)}
      />

      {/* 协作图节点点击：协作明细 Modal */}
      <Modal
        title={`${collabDetail?.name || ''} 的协作伙伴`}
        open={!!collabDetail}
        onCancel={() => setCollabDetail(null)}
        footer={[
          <Button key="detail" type="link" onClick={() => { if (collabDetail) navigate(`/todo-for-ai/pages/agents?agent_id=${collabDetail.agentId}`) }}>
            查看 Agent 详情
          </Button>,
          <Button key="close" onClick={() => setCollabDetail(null)}>关闭</Button>,
        ]}
      >
        <Spin spinning={collabDetail?.loading}>
          {collabDetail && collabDetail.list.length > 0 ? (
            <>
              {collabDetailGraph && (
                <div style={{ marginBottom: 12 }}>
                  <CollaborationGraphView
                    data={collabDetailGraph}
                    size={260}
                    layout="grid"
                    centerNodeId={collabDetail.agentId}
                  />
                </div>
              )}
              <List
                size="small"
                dataSource={collabDetail.list}
                renderItem={(c: any) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#1890ff' }}>{c.name}</Text>
                      <Space size={4}>
                        <Tag>发 {c.sent}</Tag>
                        <Tag>收 {c.received}</Tag>
                        <Tag color="blue">合计 {c.total}</Tag>
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            </>
          ) : (
            <Text type="secondary">暂无协作伙伴记录</Text>
          )}
        </Spin>
      </Modal>
    </div>
  )
}

export default CommandCenter
