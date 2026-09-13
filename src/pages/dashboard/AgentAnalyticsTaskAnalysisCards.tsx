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
import type { useAgentAnalyticsData } from './useAgentAnalyticsData'

const { Text } = Typography

type Bundle = ReturnType<typeof useAgentAnalyticsData>

/**
 * 依赖链/技能匹配/评论情感/返工/工作负载/专业化演化/衰减告警/跨项目效率/能力供需卡。props 收数据 hook 全量包，由 AgentAnalyticsSection 原样拆出。
 */
export function AgentAnalyticsTaskAnalysisCards(props: Bundle) {
  const {
    capSupplyDemand,
    commentSentiment,
    crossProjEff,
    decayAlerts,
    depChain,
    reworkAnalysis,
    skillMatching,
    specializationEvo,
    workloadForecast,
  } = props

  return (
    <>
      {/* Task Dependency Chain */}
      {depChain && depChain.chains.length > 0 && (
        <Card
          title={<Space><ApartmentOutlined /> 任务依赖链分析</Space>}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {depChain.chains.map((c, ci) => {
              const barW = 200
              const barH = 8
              const pct = c.progress_pct
              return (
                <div key={ci} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{c.root_title}</Text>
                    <Space size={4}>
                      <Tag style={{ fontSize: 10 }}>深度 {c.depth}</Tag>
                      <Tag color="blue" style={{ fontSize: 10 }}>{c.total_tasks} 任务</Tag>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width={barW} height={barH + 4} style={{ display: 'block' }}>
                      <rect x={0} y={2} width={barW} height={barH} fill="#f0f0f0" rx={2} />
                      <rect x={0} y={2} width={barW * pct / 100} height={barH} fill="#52c41a" rx={2} />
                    </svg>
                    <Text type="secondary" style={{ fontSize: 10 }}>{c.completed}/{c.total_tasks} 完成 ({pct}%)</Text>
                    {c.in_progress > 0 && <Tag color="processing" style={{ fontSize: 9 }}>{c.in_progress} 进行中</Tag>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Agent Skill Matching */}
      {skillMatching && skillMatching.tasks.length > 0 && (
        <Card
          title={<Space><RadarChartOutlined /> Agent 技能匹配推荐</Space>}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {skillMatching.tasks.map((t, ti) => (
              <div key={ti} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                <Text strong style={{ fontSize: 12 }}>{t.task_title}</Text>
                <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {t.recommendations.map((r, ri) => (
                    <Tag key={ri} color={r.match_score >= 50 ? 'green' : 'blue'} style={{ fontSize: 10 }}>
                      {r.agent_name} ({r.match_score}%)
                    </Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Task Comment Sentiment Trend */}
      {commentSentiment && commentSentiment.trend.length > 0 && (
        <Card
          title={<Space><SmileOutlined /> 评论情感趋势</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {commentSentiment.days} 天</Text>}
        >
          {(() => {
            const trend = commentSentiment.trend
            const maxVal = Math.max(1, ...trend.map(d => d.positive + d.negative + d.neutral))
            const svgW = 400
            const svgH = 100
            const xStep = svgW / Math.max(1, trend.length - 1)
            const toY = (v: number) => svgH - (v / maxVal) * (svgH - 4)
            const posPts = trend.map((d, i) => `${i * xStep},${toY(d.positive)}`).join(' ')
            const negPts = trend.map((d, i) => `${i * xStep},${toY(d.negative)}`).join(' ')
            const neuPts = trend.map((d, i) => `${i * xStep},${toY(d.neutral)}`).join(' ')
            return (
              <svg width={svgW} height={svgH} style={{ display: 'block' }}>
                {trend.length > 1 && (
                  <>
                    <polyline points={posPts} fill="none" stroke="#52c41a" strokeWidth={1.5} />
                    <polyline points={negPts} fill="none" stroke="#ff4d4f" strokeWidth={1.5} />
                    <polyline points={neuPts} fill="none" stroke="#d9d9d9" strokeWidth={1.5} />
                  </>
                )}
              </svg>
            )
          })()}
          <div style={{ display: 'flex', gap: 16, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#52c41a' }}>— 积极</span>
            <span style={{ fontSize: 10, color: '#ff4d4f' }}>— 消极</span>
            <span style={{ fontSize: 10, color: '#d9d9d9' }}>— 中性</span>
          </div>
        </Card>
      )}

      {/* Task Rework Analysis */}
      {reworkAnalysis && reworkAnalysis.total_reworked > 0 && (
        <Card
          title={<Space><ReloadOutlined /> 任务返工分析</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {reworkAnalysis.days} 天 · {reworkAnalysis.total_reworked} 任务 {reworkAnalysis.total_rework_events} 次返工</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reworkAnalysis.tasks.map((t, ti) => {
              const maxC = Math.max(1, ...reworkAnalysis.tasks.map(x => x.rework_count))
              const barW = 120
              return (
                <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ minWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.title}>{t.title}</span>
                  <svg width={barW} height={10} style={{ display: 'block' }}>
                    <rect x={0} y={1} width={barW * t.rework_count / maxC} height={8} fill="#fa8c16" rx={2} />
                  </svg>
                  <Tag color="orange" style={{ fontSize: 10 }}>{t.rework_count}次</Tag>
                  <Text type="secondary" style={{ fontSize: 9 }}>{t.project_name}</Text>
                </div>
              )
            })}
          </div>
          {reworkAnalysis.by_project.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>按项目：</Text>
              {reworkAnalysis.by_project.map((p, pi) => (
                <Tag key={pi} color="volcano" style={{ fontSize: 9, margin: '2px' }}>{p.project_name}: {p.rework_count}</Tag>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Agent Workload Forecast */}
      {workloadForecast && workloadForecast.agents.length > 0 && (
        <Card
          title={<Space><ThunderboltOutlined /> Agent 工作负载预测</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {workloadForecast.days} 天 · 预测 {workloadForecast.horizon} 天</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workloadForecast.agents.map((a, ai) => {
              const all = [...a.series, ...a.forecast]
              const maxV = Math.max(1, ...all)
              const w = 180
              const h = 28
              const totalLen = a.series.length + a.forecast.length
              const histPts = a.series.map((v, i) => `${(i / (totalLen - 1)) * w},${h - (v / maxV) * (h - 2)}`).join(' ')
              const fcStartIdx = a.series.length - 1
              const fcPts = a.forecast.map((v, k) => `${((fcStartIdx + k) / (totalLen - 1)) * w},${h - (v / maxV) * (h - 2)}`).join(' ')
              const trendColor = a.trend === 'up' ? '#ff4d4f' : a.trend === 'down' ? '#52c41a' : '#8c8c8c'
              return (
                <div key={ai} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{a.agent_name}</Text>
                    <Space size={4}>
                      <Tag color={a.trend === 'up' ? 'red' : a.trend === 'down' ? 'green' : 'default'} style={{ fontSize: 10 }}>{a.trend === 'up' ? '↑上升' : a.trend === 'down' ? '↓下降' : '→平稳'}</Tag>
                      <Tag style={{ fontSize: 10 }}>预测 +{a.forecast_total}</Tag>
                    </Space>
                  </div>
                  <svg width={w} height={h} style={{ display: 'block' }}>
                    {a.series.length > 1 && <polyline points={histPts} fill="none" stroke="#1890ff" strokeWidth={1.5} />}
                    {a.forecast.length > 0 && <polyline points={fcPts} fill="none" stroke={trendColor} strokeWidth={1.5} strokeDasharray="4 3" />}
                  </svg>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#1890ff' }}>— 历史</span>
            <span style={{ fontSize: 10, color: '#ff4d4f' }}>┄ 预测</span>
          </div>
        </Card>
      )}

      {/* Agent Specialization Evolution */}
      {specializationEvo && specializationEvo.agents.length > 0 && (
        <Card
          title={<Space><RiseOutlined /> Agent 专长演化</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {specializationEvo.weeks} 周 · 周域覆盖数</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {specializationEvo.agents.map((a, ai) => {
              const maxV = Math.max(1, ...a.series)
              const cellW = 18
              const h = 18
              return (
                <div key={ai} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{a.agent_name}</Text>
                    <Space size={4}>
                      <Tag color="purple" style={{ fontSize: 10 }}>累计 {a.total_domains} 域</Tag>
                      <Tag style={{ fontSize: 10 }}>峰值 {a.peak_domains}</Tag>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', gap: 1 }}>
                    {a.series.map((v, wi) => (
                      <svg key={wi} width={cellW} height={h} style={{ display: 'block' }}>
                        <title>{`${specializationEvo.week_labels[wi]}: ${v} 域`}</title>
                        <rect x={0} y={h - (v / maxV) * (h - 2)} width={cellW - 1} height={(v / maxV) * (h - 2)} fill={`rgba(114, 46, 209, ${0.3 + (v / maxV) * 0.7})`} rx={1} />
                      </svg>
                    ))}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    {a.domains.map((d, di) => (
                      <Tag key={di} style={{ fontSize: 9, margin: '1px' }}>{d}</Tag>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Agent Experiences Decay Alerts */}
      {decayAlerts && decayAlerts.alerts.length > 0 && (
        <Card
          title={<Space><WarningOutlined /> 经验置信度衰减告警</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {decayAlerts.days} 天 · 阈值 {decayAlerts.min_drop} · {decayAlerts.total_alerts} 条</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {decayAlerts.alerts.map((a, ai) => {
              const maxDrop = Math.max(0.01, ...decayAlerts.alerts.map(x => x.drop))
              return (
                <div key={ai} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{a.agent_name}</Text>
                    <Space size={4}>
                      <Tag color="volcano" style={{ fontSize: 10 }}>降 {a.drop.toFixed(2)}</Tag>
                      <Tag style={{ fontSize: 10 }}>{a.recommendation === 'review_recent_experiences' ? '建议复核' : '持续观察'}</Tag>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#8c8c8c' }}>
                    <span>前半段 {a.older_avg_confidence.toFixed(2)} ({a.older_count})</span>
                    <span>→</span>
                    <span>后半段 {a.newer_avg_confidence.toFixed(2)} ({a.newer_count})</span>
                  </div>
                  <div style={{ marginTop: 4, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(a.drop / maxDrop) * 100}%`, height: '100%', background: a.drop >= 0.2 ? '#ff4d4f' : '#faad14' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Cross-Project Agent Efficiency */}
      {crossProjEff && crossProjEff.total_authorizations > 0 && (
        <Card
          title={<Space><DeploymentUnitOutlined /> 跨项目借调效率</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {crossProjEff.days} 天 · 利用率 {(crossProjEff.utilization_rate * 100).toFixed(0)}%</Text>}
        >
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={6}><Statistic title="总授权" value={crossProjEff.total_authorizations} valueStyle={{ fontSize: 16 }} /></Col>
            <Col span={6}><Statistic title="活跃" value={crossProjEff.active_count} valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Col>
            <Col span={6}><Statistic title="已利用" value={crossProjEff.utilized_count} valueStyle={{ fontSize: 16, color: '#52c41a' }} /></Col>
            <Col span={6}><Statistic title="闲置" value={crossProjEff.idle_count} valueStyle={{ fontSize: 16, color: crossProjEff.idle_count > 0 ? '#faad14' : undefined }} /></Col>
          </Row>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {crossProjEff.authorizations.map((a, ai) => {
              const maxDone = Math.max(1, ...crossProjEff.authorizations.map(x => x.tasks_completed_in_host))
              return (
                <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <Text style={{ minWidth: 110, fontSize: 12 }} ellipsis>{a.agent_name}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>→</Text>
                  <Text style={{ minWidth: 120, fontSize: 12 }} ellipsis>{a.host_project_name}</Text>
                  <div style={{ flex: 1, height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${(a.tasks_completed_in_host / maxDone) * 100}%`, height: '100%', background: a.utilized ? '#1890ff' : '#d9d9d9' }} />
                  </div>
                  <Tag color={a.utilized ? 'blue' : 'default'} style={{ fontSize: 10, margin: 0 }}>{a.tasks_completed_in_host}</Tag>
                  {!a.is_active && <Tag style={{ fontSize: 9, margin: 0 }}>未激活</Tag>}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Capability Supply-Demand */}
      {capSupplyDemand && capSupplyDemand.total_capabilities > 0 && (
        <Card
          title={<Space><SwapOutlined /> 能力供需匹配</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>{capSupplyDemand.agent_total} Agent · {capSupplyDemand.active_task_total} 活跃任务 · {capSupplyDemand.bottleneck_count} 瓶颈/缺口</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {capSupplyDemand.capabilities.map((c, ci) => {
              const maxV = Math.max(1, ...capSupplyDemand.capabilities.map(x => Math.max(x.supply, x.demand)))
              const half = 80
              const statusColor: Record<string, string> = { missing: '#ff4d4f', bottleneck: '#fa8c16', surplus: '#1890ff', unused_supply: '#8c8c8c', balanced: '#52c41a' }
              const statusText: Record<string, string> = { missing: '缺口', bottleneck: '瓶颈', surplus: '过剩', unused_supply: '闲置', balanced: '平衡' }
              return (
                <div key={ci} style={{ background: '#fafafa', borderRadius: 4, padding: '5px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <Text strong style={{ fontSize: 12 }}>{c.capability}</Text>
                    <Space size={4}>
                      <Tag color="blue" style={{ fontSize: 10 }}>供 {c.supply}</Tag>
                      <Tag color="red" style={{ fontSize: 10 }}>需 {c.demand}</Tag>
                      <Tag color={statusColor[c.status]} style={{ fontSize: 10 }}>{statusText[c.status]}</Tag>
                    </Space>
                  </div>
                  <svg width={half * 2} height={10} style={{ display: 'block' }}>
                    <title>{`供给 ${c.supply} / 需求 ${c.demand}`}</title>
                    <line x1={half} y1={0} x2={half} y2={10} stroke="#d9d9d9" strokeWidth={1} />
                    <rect x={half - (c.supply / maxV) * half} y={2} width={(c.supply / maxV) * half} height={6} fill="#1890ff" fillOpacity={0.7} rx={1} />
                    <rect x={half} y={2} width={(c.demand / maxV) * half} height={6} fill="#ff4d4f" fillOpacity={0.7} rx={1} />
                  </svg>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </>
  )
}
