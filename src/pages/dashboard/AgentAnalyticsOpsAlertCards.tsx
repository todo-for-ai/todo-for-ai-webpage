import { useState, useEffect, useCallback } from 'react'
import AgentAnalyticsOverviewCard from './AgentAnalyticsOverviewCard'
import { Card, Row, Col, Statistic, Empty, Tag, Tooltip, Space, Typography, Select, Button, Table, Spin, InputNumber } from 'antd'
import {
  FundOutlined,
  ThunderboltOutlined,
  HeatMapOutlined,
  BugOutlined,
  ClusterOutlined,
  AuditOutlined,
  RadarChartOutlined,
  RiseOutlined,
  SwapOutlined,
  ShareAltOutlined,
  DeploymentUnitOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  CalendarOutlined,
  ReloadOutlined,
  WarningOutlined,
  ApartmentOutlined,
  PieChartOutlined,
  LineChartOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import { agentsApi, type AgentHealth, type AgentHealthTrend, type AgentHealthAlerts, type AgentHealthStateTransitions, type HealthWeights, type AgentProductivity, type AgentProductivityTrend, type AgentProductivityAlerts, type AgentProductivityByKind, type AgentProductivityHourlyHeatmap, type AgentProductivityCalendarHeatmap, type AgentProductivityWeeklyComparison, type AgentFailureReasons, type AgentFailureErrorPatterns, type AgentCapabilityGapAnalysis, type AgentRunResourceUsage, type AgentSkillMatching, type AgentTaskHandoffStats, type AgentWorkloadForecast, type AgentSpecializationEvolution, type AgentExperiencesDecayAlerts, type AgentCrossProjectEfficiency, type AgentCapabilitySupplyDemand, type AgentIdleRanking, type TaskAllocationFairness, type AgentRunResourceTrend, type KnowledgePropagationNetwork, type ProtocolDecisionLatency } from '../../api/agents'
import { tasksApi, type TaskDependencyChainAnalysis, type TaskCommentSentimentTrend, type TaskReworkAnalysis } from '../../api/tasks'
import MiniTrendChart from '../../components/MiniTrendChart'
import WorkflowRunTrendChart from '../../components/WorkflowRunTrendChart'
import AgentHealthCard from './AgentHealthCard'
import AgentProductivityCard from './AgentProductivityCard'
import AgentFailureReasonsCard from './AgentFailureReasonsCard'
import AgentErrorPatternsCard from './AgentErrorPatternsCard'
import { stageColor, stageZh } from './agentAnalyticsShared'
import type { useAgentAnalyticsData } from './useAgentAnalyticsData'

const { Text } = Typography

type Bundle = ReturnType<typeof useAgentAnalyticsData>

/**
 * 闲置排行/知识传播/协议时延/交接统计/低效与健康告警/健康状态流转/冲突监控卡。props 收数据 hook 全量包，由 AgentAnalyticsSection 原样拆出。
 */
export function AgentAnalyticsOpsAlertCards(props: Bundle) {
  const {
    agentHealthAlerts,
    handoffStats,
    healthAlertsLoading,
    healthStateTransitions,
    healthWeights,
    idleRanking,
    productivityAlerts,
    propagationNet,
    protocolLatency,
    reloadHealthAlerts,
    setHealthWeights,
  } = props

  return (
    <>
      {/* Agent Idle Ranking */}
      {idleRanking && idleRanking.total_agents > 0 && (
        <Card
          title={<Space><ClockCircleOutlined /> Agent 闲置排行</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>{idleRanking.total_agents} Agent · {Object.entries(idleRanking.stage_counts).map(([k, v]) => `${stageZh(k)} ${v}`).join(' · ')}</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {idleRanking.agents.map((a, ai) => {
              const maxHours = Math.max(1, ...idleRanking.agents.map(x => x.idle_hours ?? 0))
              const hours = a.idle_hours ?? 0
              const dur = a.idle_hours == null ? '从未' : hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`
              return (
                <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <Text style={{ minWidth: 110, fontSize: 12 }} ellipsis>{a.agent_name}</Text>
                  <Tag color={stageColor(a.stage)} style={{ fontSize: 10, margin: 0 }}>{stageZh(a.stage)}</Tag>
                  <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(hours / maxHours) * 100}%`, height: '100%', background: stageColor(a.stage) }} />
                  </div>
                  <Text style={{ minWidth: 42, fontSize: 11, textAlign: 'right' }} type="secondary">{dur}</Text>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Knowledge Propagation Network */}
      {propagationNet && propagationNet.nodes.length > 0 && (
        <Card
          title={<Space><ShareAltOutlined /> 知识传播网络</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {propagationNet.days} 天 · 分享 {propagationNet.total_shared_experiences} · 复用 {propagationNet.total_reuses}</Text>}
        >
          {(() => {
            const nodes = propagationNet.nodes
            const edges = propagationNet.edges
            const size = 280
            const cx = size / 2
            const cy = size / 2
            const radius = size / 2 - 30
            const pos: Record<number, { x: number; y: number }> = {}
            nodes.forEach((n, i) => {
              const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2
              pos[n.agent_id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
            })
            const maxReuse = Math.max(1, ...nodes.map(n => n.total_reuses))
            const maxW = Math.max(1, ...edges.map(e => e.weight))
            return (
              <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
                {edges.map((e, ei) => {
                  const s = pos[e.source]
                  const t = pos[e.target]
                  if (!s || !t) return null
                  return <line key={`e${ei}`} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#722ed1" strokeWidth={0.5 + (e.weight / maxW) * 2.5} strokeOpacity={0.4} />
                })}
                {nodes.map((n) => {
                  const p = pos[n.agent_id]
                  if (!p) return null
                  const r = 6 + (n.total_reuses / maxReuse) * 10
                  return (
                    <g key={`n${n.agent_id}`}>
                      <circle cx={p.x} cy={p.y} r={r} fill="#722ed1" fillOpacity={0.7} />
                      <text x={p.x} y={p.y - r - 3} fontSize={8} fill="#595959" textAnchor="middle">{n.agent_name}</text>
                      <title>{`${n.agent_name}: 分享${n.shared_experiences} 复用${n.total_reuses}`}</title>
                    </g>
                  )
                })}
              </svg>
            )
          })()}
        </Card>
      )}

      {/* Protocol Decision Latency */}
      {protocolLatency && protocolLatency.types.length > 0 && (
        <Card
          title={<Space><FieldTimeOutlined /> 协议决策延迟</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {protocolLatency.days} 天 · {protocolLatency.total} 个已决议</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {protocolLatency.types.map((t, ti) => {
              const maxAvg = Math.max(1, ...protocolLatency.types.map(x => x.avg_seconds))
              const barW = 160
              const fmt = (s: number) => s >= 3600 ? `${(s / 3600).toFixed(1)}h` : s >= 60 ? `${(s / 60).toFixed(1)}m` : `${s}s`
              return (
                <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ minWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.protocol_type}>{t.protocol_type}</span>
                  <svg width={barW} height={10} style={{ display: 'block' }}>
                    <rect x={0} y={1} width={barW * t.avg_seconds / maxAvg} height={8} fill="#722ed1" rx={2} />
                  </svg>
                  <Text type="secondary" style={{ fontSize: 10 }}>均{fmt(t.avg_seconds)} · 中位{fmt(t.median_seconds)} · {fmt(t.min_seconds)}~{fmt(t.max_seconds)} · {t.count}次</Text>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Agent Task Handoff Stats */}
      {handoffStats && handoffStats.handoffs.length > 0 && (
        <Card
          title={<Space><SwapOutlined /> Agent 任务交接统计</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {handoffStats.days} 天</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {handoffStats.handoffs.map((h, hi) => {
              const maxCount = Math.max(1, handoffStats.handoffs[0].count)
              const barW = 160
              return (
                <div key={hi} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.from_agent}>{h.from_agent}</span>
                  <span style={{ color: '#1890ff' }}>→</span>
                  <span style={{ minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.to_agent}>{h.to_agent}</span>
                  <svg width={barW} height={10} style={{ display: 'block' }}>
                    <rect x={0} y={1} width={barW * h.count / maxCount} height={8} fill="#1890ff" rx={2} />
                  </svg>
                  <Text type="secondary" style={{ fontSize: 10 }}>{h.count}次{h.avg_duration_seconds != null ? ` 均${h.avg_duration_seconds}s` : ''}</Text>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Low-efficiency Agent Alerts */}
      {productivityAlerts && productivityAlerts.items.length > 0 && (
        <Card
          title={<Space><WarningOutlined /> 低效率 Agent 预警</Space>}
          style={{ marginBottom: 24 }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            近 {productivityAlerts.days} 天，完成率 &lt;{productivityAlerts.min_completion_rate}% 或失败率 &gt;{productivityAlerts.max_failure_rate}%（最少 {productivityAlerts.min_assignments} 次分配），共 {productivityAlerts.items.length} 个
          </Text>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {productivityAlerts.items.map((a) => (
              <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
                <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name}</span>
                <Tag style={{ fontSize: 10 }}>分配 {a.total}</Tag>
                <Tag color="green" style={{ fontSize: 10 }}>完成 {a.done}</Tag>
                <Tag color="red" style={{ fontSize: 10 }}>失败 {a.failed}</Tag>
                <span style={{ color: '#ff4d4f', minWidth: 70 }}>完成率 {a.completion_rate}%</span>
                <span style={{ color: '#fa8c16', minWidth: 60 }}>失败率 {a.failure_rate}%</span>
                {a.reasons.map((r) => (
                  <Tag key={r} color="volcano" style={{ fontSize: 10 }}>{r}</Tag>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Low-health Agent Alerts */}
      {agentHealthAlerts && (
        <Card
          title={<Space><WarningOutlined /> 低健康 Agent 预警</Space>}
          style={{ marginBottom: 24 }}
          extra={
            <Space size={4} wrap>
              <Tooltip title="声誉权重"><InputNumber size="small" min={0} max={1} step={0.05} style={{ width: 56 }} value={healthWeights.w_reputation} onChange={(v) => setHealthWeights((w) => ({ ...w, w_reputation: v ?? 0 }))} /></Tooltip>
              <Tooltip title="完成率权重"><InputNumber size="small" min={0} max={1} step={0.05} style={{ width: 56 }} value={healthWeights.w_completion} onChange={(v) => setHealthWeights((w) => ({ ...w, w_completion: v ?? 0 }))} /></Tooltip>
              <Tooltip title="冲突权重"><InputNumber size="small" min={0} max={1} step={0.05} style={{ width: 56 }} value={healthWeights.w_conflict} onChange={(v) => setHealthWeights((w) => ({ ...w, w_conflict: v ?? 0 }))} /></Tooltip>
              <Tooltip title="违规权重"><InputNumber size="small" min={0} max={1} step={0.05} style={{ width: 56 }} value={healthWeights.w_violation} onChange={(v) => setHealthWeights((w) => ({ ...w, w_violation: v ?? 0 }))} /></Tooltip>
              <Button size="small" type="primary" loading={healthAlertsLoading} onClick={() => reloadHealthAlerts(healthWeights)}>应用权重</Button>
            </Space>
          }
        >
          <Spin spinning={healthAlertsLoading}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            健康分 &lt;{agentHealthAlerts.min_health_score} 的 Agent（近 {agentHealthAlerts.days} 天），共 {agentHealthAlerts.items.length} 个
          </Text>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agentHealthAlerts.items.length === 0 ? (
              <Empty description="暂无低健康 Agent" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : agentHealthAlerts.items.map((a) => (
              <div key={a.agent_id} style={{ padding: '6px 8px', background: '#fff1f0', borderRadius: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
                  <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name}</span>
                  <span style={{ color: '#ff4d4f', minWidth: 44, fontWeight: 500 }}>{a.health_score}</span>
                  {a.reasons.map((r) => (
                    <Tag key={r} color="volcano" style={{ fontSize: 10 }}>{r}</Tag>
                  ))}
                </div>
                {a.recommendations && a.recommendations.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 11, color: '#8c8c8c' }}>
                    <BulbOutlined style={{ color: '#faad14', marginRight: 4 }} />
                    {a.recommendations.join('；')}
                  </div>
                )}
              </div>
            ))}
          </div>
          </Spin>
        </Card>
      )}

      {/* 健康状态流转 */}
      {healthStateTransitions && healthStateTransitions.flows.length > 0 && (() => {
        const states = healthStateTransitions.states
        const flows = healthStateTransitions.flows
        const stateColors: Record<string, string> = { healthy: '#52c41a', degraded: '#faad14', critical: '#ff4d4f' }
        const w = 360
        const h = 200
        const padL = 60
        const padR = 60
        const padT = 20
        const padB = 20
        const barH = 28
        const gapY = 12
        const srcX = padL
        const dstX = w - padR
        const srcNames = states.map(s => s.name)
        const dstNames = states.map(s => s.name)
        const srcY = (name: string) => padT + srcNames.indexOf(name) * (barH + gapY) + barH / 2
        const dstY = (name: string) => padT + dstNames.indexOf(name) * (barH + gapY) + barH / 2
        const maxVal = Math.max(...flows.map(f => f.value), 1)
        return (
          <Card
            title={<Space><SwapOutlined /> 健康状态流转</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {healthStateTransitions.days} 天 · {healthStateTransitions.total_transitions} 次转换</Text>}
            style={{ marginBottom: 24 }}
          >
            <svg width={w} height={h} style={{ overflow: 'visible' }}>
              {/* Source labels */}
              {srcNames.map((name, i) => (
                <g key={`src-${name}`}>
                  <rect x={srcX - 50} y={padT + i * (barH + gapY)} width={48} height={barH} rx={4} fill={stateColors[name] || '#8c8c8c'} opacity={0.15} />
                  <text x={srcX - 26} y={padT + i * (barH + gapY) + barH / 2 + 3} fontSize={10} fill={stateColors[name] || '#595959'} textAnchor="middle" fontWeight={500}>{name}</text>
                </g>
              ))}
              {/* Target labels */}
              {dstNames.map((name, i) => (
                <g key={`dst-${name}`}>
                  <rect x={dstX + 2} y={padT + i * (barH + gapY)} width={48} height={barH} rx={4} fill={stateColors[name] || '#8c8c8c'} opacity={0.15} />
                  <text x={dstX + 26} y={padT + i * (barH + gapY) + barH / 2 + 3} fontSize={10} fill={stateColors[name] || '#595959'} textAnchor="middle" fontWeight={500}>{name}</text>
                </g>
              ))}
              {/* Flow paths */}
              {flows.map((f, i) => {
                const sy = srcY(f.source)
                const dy = dstY(f.target)
                const thickness = Math.max(2, (f.value / maxVal) * 14)
                const midX = (srcX + dstX) / 2
                const color = stateColors[f.source] || '#8c8c8c'
                return (
                  <g key={`flow-${i}`}>
                    <path
                      d={`M ${srcX} ${sy} C ${midX} ${sy}, ${midX} ${dy}, ${dstX} ${dy}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={thickness}
                      opacity={0.4}
                    />
                    <text x={midX} y={(sy + dy) / 2 - 4} fontSize={9} fill="#595959" textAnchor="middle">{f.value}</text>
                  </g>
                )
              })}
            </svg>
          </Card>
        )
      })()}

      {/* Conflict Monitor */}
    </>
  )
}
