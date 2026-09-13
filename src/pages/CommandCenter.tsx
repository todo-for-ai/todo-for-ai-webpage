import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Card, Row, Col, Statistic, Spin, message, List, Tag, Space, Button, Tooltip, Empty, Badge, Alert, Popconfirm, Modal, Form, Select, Input, InputNumber, Segmented, Dropdown, Checkbox, Slider } from 'antd'
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
  ExpandOutlined,
} from '@ant-design/icons'
import { dashboardApi } from '../api/dashboard'
import { agentsApi, type OrchestratorStatus, type ConflictsTrend, type ConflictsByAgent, type ConflictsStrategyStats } from '../api/agents'
import dayjs from 'dayjs'
import SecurityTrendSection from '../components/SecurityTrendSection'
import SecurityEventListItem from '../components/SecurityEventListItem'
import SecurityEventDetailModal from '../components/SecurityEventDetailModal'
import CollaborationGraphView from '../components/CollaborationGraphView'
import PlatformActivityTrendSection from '../components/PlatformActivityTrendSection'
import ConflictsTrendChart from '../components/ConflictsTrendChart'
import { useCollaborationSSE } from '../hooks/useCollaborationSSE'
import { useTranslation } from '../i18n/hooks/useTranslation'
import { CommandCenterStatsRow, SecurityEventTrendAlert, QuickActionsCard, AgentMonitorCard, SecurityEventsCard, OrchestratorStatusCard, PRApprovalsCard } from './command-center'
import { PageIntro } from '../components/common/PageIntro'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const { Title, Text, Paragraph } = Typography

/**
 * Agent 协作指挥中心：单一页面聚合 Agent 监控、安全事件、冲突、编排状态
 * 四大数据源，作为统一指挥入口。支持手动刷新与 SSE 实时刷新。
 */
import { useCommandCenterData } from './commandCenter/useCommandCenterData'
import { useCommandCenterCollabGraph } from './commandCenter/useCommandCenterCollabGraph'
import { CommandCenterCollabCard } from './commandCenter/CommandCenterCollabCard'
import { CommandCenterModals } from './commandCenter/CommandCenterModals'

const CommandCenter: React.FC = () => {
  const { tc } = usePageTranslation('common')
  const { tn } = useTranslation()
  const navigate = useNavigate()
  const data = useCommandCenterData()
  const graph = useCommandCenterCollabGraph()
  const {
    graphWindow,
    setGraphWindow,
    graphLayout,
    setGraphLayout,
    FORCE_PARAMS_KEY,
    loadForceParams,
    initialForceParams,
    forceRepulsion,
    setForceRepulsion,
    forceLinkDistance,
    setForceLinkDistance,
    graphKinds,
    setGraphKinds,
    graphSearch,
    setGraphSearch,
    graphMinCount,
    setGraphMinCount,
    graphResetKey,
    setGraphResetKey,
    graphShowLabels,
    setGraphShowLabels,
    graphFullscreen,
    setGraphFullscreen,
    graphFullscreenSize,
    setGraphFullscreenSize,
    collabSummary,
    collabDetailGraph,
    loadCollabGraph,
    loadCollabDetail,
    exportCollabGraph,
    exportCollabGraphSvg,
    exportCollabGraphPng,
    monitorSummary,
    activeAgents,
    totalAgents,
    busyAgents,
    offlineAgents,
    conflictTotal,
    conflictActive,
    criticalEvents,
    trendDays,
    trendTotal,
    lastDay,
    prevDay,
    dayDelta,
    dayDeltaPct,
    loading,
    setLoading,
    monitorData,
    setMonitorData,
    conflictData,
    setConflictData,
    conflictList,
    setConflictList,
    conflictTrend,
    setConflictTrend,
    conflictsByAgent,
    setConflictsByAgent,
    conflictStrategyStats,
    setConflictStrategyStats,
    securityEvents,
    setSecurityEvents,
    securityTrend,
    setSecurityTrend,
    securityByAgent,
    setSecurityByAgent,
    orchestratorStatus,
    setOrchestratorStatus,
    orchDailyTrend,
    setOrchDailyTrend,
    collabGraph,
    setCollabGraph,
    collabGraphLoading,
    setCollabGraphLoading,
    collabSvgRef,
    collabDetail,
    setCollabDetail,
    resolveOpen,
    setResolveOpen,
    resolveForm,
    setResolveForm,
    eventDetail,
    setEventDetail,
    lastRefresh,
    setLastRefresh,
    actionLoading,
    setActionLoading,
    trendWindow,
    setTrendWindow,
    trendSeverity,
    setTrendSeverity,
    trendEventType,
    setTrendEventType,
    loadAll,
    runOrchestration,
    autoResolveConflicts,
    openResolveConflict,
    submitResolveConflict,
    exportSecurityEvents,
  } = { ...data, ...graph }

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

  return (
    <div>
      <PageIntro
        storageKey="page-intro:commandCenter:v1"
        title={tc('pageIntro.commandCenter.title')}
        description={tc('pageIntro.commandCenter.desc')}
      />
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
      <QuickActionsCard
        conflictActive={conflictActive}
        actionLoading={actionLoading}
        onOrchestrate={runOrchestration}
        onAutoResolve={autoResolveConflicts}
        onExport={exportSecurityEvents}
      />

      <Spin spinning={loading}>
        {/* 顶部总览统计 */}
        <CommandCenterStatsRow
          totalAgents={totalAgents}
          activeAgents={activeAgents}
          busyAgents={busyAgents}
          offlineAgents={offlineAgents}
          conflictActive={conflictActive}
          criticalEvents={criticalEvents}
        />

        {/* 安全事件环比提示 */}
        <SecurityEventTrendAlert trend={securityTrend} />

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
            <AgentMonitorCard
              monitorData={monitorData}
              activeAgents={activeAgents}
              busyAgents={busyAgents}
              offlineAgents={offlineAgents}
            />
          </Col>

          {/* 安全事件近况 */}
          <Col xs={24} lg={12}>
            <SecurityEventsCard
              securityEvents={securityEvents}
              securityTrend={securityTrend}
              securityByAgent={securityByAgent}
              criticalEvents={criticalEvents}
              onShowDetail={(ev) => setEventDetail(ev)}
            />
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
                  {/* 检测 vs 解决趋势 */}
                  {conflictTrend && conflictTrend.trend.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>近 {conflictTrend.days} 天检测/解决趋势</Text>
                      <div style={{ marginTop: 4 }}>
                        <ConflictsTrendChart buckets={conflictTrend.trend} width={300} height={84} />
                      </div>
                    </div>
                  )}
                  {/* 解决耗时统计 */}
                  {conflictData?.resolution_latency?.count ? (() => {
                    const lat = conflictData.resolution_latency
                    const fmt = (s: number | null) => {
                      if (s == null) return '-'
                      if (s < 60) return `${Math.round(s)}s`
                      if (s < 3600) return `${(s / 60).toFixed(1)}m`
                      if (s < 86400) return `${(s / 3600).toFixed(1)}h`
                      return `${(s / 86400).toFixed(1)}d`
                    }
                    const b = lat.by_bucket
                    return (
                      <div style={{ marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          解决耗时（{lat.count}个）：均 {fmt(lat.avg_seconds)} · 中位 {fmt(lat.median_seconds)} · 最长 {fmt(lat.max_seconds)}
                        </Text>
                        <Space wrap size={[4, 4]} style={{ marginTop: 4 }}>
                          <Tag style={{ fontSize: 11 }} color="green">&lt;1h: {b.under_1h}</Tag>
                          <Tag style={{ fontSize: 11 }} color="blue">1-24h: {b['1h_to_24h']}</Tag>
                          <Tag style={{ fontSize: 11 }} color="orange">1-7d: {b['1d_to_7d']}</Tag>
                          <Tag style={{ fontSize: 11 }} color="red">&gt;7d: {b.over_7d}</Tag>
                        </Space>
                      </div>
                    )
                  })() : null}
                  {/* 冲突按 Agent 分布 */}
                  {conflictsByAgent && conflictsByAgent.items.length > 0 ? (() => {
                    const items = conflictsByAgent.items
                    const maxTotal = Math.max(1, ...items.map((it) => it.total))
                    return (
                      <div style={{ marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>冲突最多的 Agent（共/活跃）</Text>
                        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {items.slice(0, 6).map((it) => (
                            <div key={it.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                              <span style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${it.name} #${it.agent_id}`}>
                                {it.name || `#${it.agent_id}`}
                              </span>
                              <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ width: `${(it.total / maxTotal) * 100}%`, height: '100%', background: it.active > 0 ? '#ff4d4f' : '#faad14', borderRadius: 3 }} />
                              </div>
                              <span style={{ color: '#8c8c8c', minWidth: 56, textAlign: 'right' }}>{it.total}{it.active > 0 ? ` (${it.active}活跃)` : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })() : null}
                  {/* 解决策略效果 */}
                  {conflictStrategyStats && conflictStrategyStats.items.length > 0 ? (() => {
                    const items = conflictStrategyStats.items
                    const maxUses = Math.max(1, ...items.map((it) => it.uses))
                    return (
                      <div style={{ marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>解决策略效果（用次/复发率）</Text>
                        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {items.slice(0, 6).map((it) => {
                            const rate = Math.round(it.recurrence_rate * 100)
                            const rateColor = rate >= 50 ? '#ff4d4f' : rate >= 20 ? '#faad14' : '#52c41a'
                            return (
                              <div key={it.strategy} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={it.strategy}>{it.strategy}</span>
                                <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                                  <div style={{ width: `${(it.uses / maxUses) * 100}%`, height: '100%', background: '#1890ff', borderRadius: 3 }} />
                                </div>
                                <span style={{ color: rateColor, minWidth: 70, textAlign: 'right' }}>{it.uses}次 · 复发{rate}%</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })() : null}
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
            <OrchestratorStatusCard orchestratorStatus={orchestratorStatus} />
          </Col>

          {/* L0/L1 PR 审批队列（自主等级渐进审批） */}
          <Col xs={24} lg={12}>
            <PRApprovalsCard />
          </Col>
        </Row>

        {/* Agent 协作关系图 */}
      <CommandCenterCollabCard data={data} graph={graph} tc={tc} tn={tn} navigate={navigate} />
      </Spin>

      <CommandCenterModals data={data} graph={graph} tc={tc} tn={tn} navigate={navigate} />
    </div>
  )
}

export default CommandCenter
