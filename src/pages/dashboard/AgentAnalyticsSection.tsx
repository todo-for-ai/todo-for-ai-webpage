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

const { Text } = Typography

const IDLE_STAGE_COLOR: Record<string, string> = { active: '#52c41a', idle: '#1890ff', stale: '#faad14', dormant: '#ff4d4f', never: '#8c8c8c' }
const IDLE_STAGE_ZH: Record<string, string> = { active: '活跃', idle: '空闲', stale: '陈旧', dormant: '休眠', never: '从未' }
const stageColor = (s: string) => IDLE_STAGE_COLOR[s] || '#8c8c8c'
const stageZh = (s: string) => IDLE_STAGE_ZH[s] || s

const AgentAnalyticsSection = () => {
  const [agentHealth, setAgentHealth] = useState<AgentHealth | null>(null)
  const [agentHealthTrend, setAgentHealthTrend] = useState<AgentHealthTrend | null>(null)
  const [healthTrendAgentId, setHealthTrendAgentId] = useState<number | undefined>(undefined)
  const [healthTrendLoading, setHealthTrendLoading] = useState(false)
  const [agentHealthAlerts, setAgentHealthAlerts] = useState<AgentHealthAlerts | null>(null)
  const [healthStateTransitions, setHealthStateTransitions] = useState<AgentHealthStateTransitions | null>(null)
  const [healthWeights, setHealthWeights] = useState<HealthWeights>({ w_reputation: 0.4, w_completion: 0.3, w_conflict: 0.15, w_violation: 0.15 })
  const [healthAlertsLoading, setHealthAlertsLoading] = useState(false)
  const [agentProductivity, setAgentProductivity] = useState<AgentProductivity | null>(null)
  const [productivityTrend, setProductivityTrend] = useState<AgentProductivityTrend | null>(null)
  const [productivityAlerts, setProductivityAlerts] = useState<AgentProductivityAlerts | null>(null)
  const [productivityByKind, setProductivityByKind] = useState<AgentProductivityByKind | null>(null)
  const [agentRunResourceUsage, setAgentRunResourceUsage] = useState<AgentRunResourceUsage | null>(null)
  const [agentProdWeeklyComparison, setAgentProdWeeklyComparison] = useState<AgentProductivityWeeklyComparison | null>(null)
  const [productivityHourly, setProductivityHourly] = useState<AgentProductivityHourlyHeatmap | null>(null)
  const [productivityCalendar, setProductivityCalendar] = useState<AgentProductivityCalendarHeatmap | null>(null)
  const [agentFailureReasons, setAgentFailureReasons] = useState<AgentFailureReasons | null>(null)
  const [agentFailureErrorPatterns, setAgentFailureErrorPatterns] = useState<AgentFailureErrorPatterns | null>(null)
  const [capabilityGapAnalysis, setCapabilityGapAnalysis] = useState<AgentCapabilityGapAnalysis | null>(null)
  const [skillMatching, setSkillMatching] = useState<AgentSkillMatching | null>(null)
  const [handoffStats, setHandoffStats] = useState<AgentTaskHandoffStats | null>(null)
  const [workloadForecast, setWorkloadForecast] = useState<AgentWorkloadForecast | null>(null)
  const [specializationEvo, setSpecializationEvo] = useState<AgentSpecializationEvolution | null>(null)
  const [decayAlerts, setDecayAlerts] = useState<AgentExperiencesDecayAlerts | null>(null)
  const [crossProjEff, setCrossProjEff] = useState<AgentCrossProjectEfficiency | null>(null)
  const [capSupplyDemand, setCapSupplyDemand] = useState<AgentCapabilitySupplyDemand | null>(null)
  const [idleRanking, setIdleRanking] = useState<AgentIdleRanking | null>(null)
  const [taskAllocationFairness, setTaskAllocationFairness] = useState<TaskAllocationFairness | null>(null)
  const [agentRunResourceTrend, setAgentRunResourceTrend] = useState<AgentRunResourceTrend | null>(null)
  const [propagationNet, setPropagationNet] = useState<KnowledgePropagationNetwork | null>(null)
  const [protocolLatency, setProtocolLatency] = useState<ProtocolDecisionLatency | null>(null)
  const [depChain, setDepChain] = useState<TaskDependencyChainAnalysis | null>(null)
  const [commentSentiment, setCommentSentiment] = useState<TaskCommentSentimentTrend | null>(null)
  const [reworkAnalysis, setReworkAnalysis] = useState<TaskReworkAnalysis | null>(null)

  const reloadHealthTrend = (agentId?: number) => {
    setHealthTrendLoading(true)
    agentsApi.getAgentHealthTrend(30, agentId).then(setAgentHealthTrend).catch(() => {}).finally(() => setHealthTrendLoading(false))
  }

  const reloadHealthAlerts = (weights: HealthWeights) => {
    setHealthAlertsLoading(true)
    agentsApi.getAgentHealthAlerts(weights).then(setAgentHealthAlerts).catch(() => {}).finally(() => setHealthAlertsLoading(false))
  }

  useEffect(() => {
    agentsApi.getAgentHealth(30).then(setAgentHealth).catch(() => {})
    agentsApi.getAgentHealthTrend(30).then(setAgentHealthTrend).catch(() => {})
    agentsApi.getAgentHealthStateTransitions(30).then(setHealthStateTransitions).catch(() => {})
    agentsApi.getAgentHealthAlerts({ w_reputation: 0.4, w_completion: 0.3, w_conflict: 0.15, w_violation: 0.15 }).then(setAgentHealthAlerts).catch(() => {})
    agentsApi.getAgentProductivity(30, 20).then(setAgentProductivity).catch(() => {})
    agentsApi.getAgentProductivityTrend(30).then(setProductivityTrend).catch(() => {})
    agentsApi.getAgentProductivityAlerts().then(setProductivityAlerts).catch(() => {})
    agentsApi.getAgentProductivityByKind(30).then(setProductivityByKind).catch(() => {})
    agentsApi.getAgentRunResourceUsage(30, 8).then(setAgentRunResourceUsage).catch(() => {})
    agentsApi.getAgentProductivityWeeklyComparison(10).then(setAgentProdWeeklyComparison).catch(() => {})
    agentsApi.getAgentProductivityHourlyHeatmap(30, 15).then(setProductivityHourly).catch(() => {})
    agentsApi.getAgentProductivityCalendarHeatmap(90, 10).then(setProductivityCalendar).catch(() => {})
    agentsApi.getAgentFailureReasons(30, 15).then(setAgentFailureReasons).catch(() => {})
    agentsApi.getAgentFailureErrorPatterns(30, 10, 40).then(setAgentFailureErrorPatterns).catch(() => {})
    agentsApi.getAgentCapabilityGapAnalysis(10, 0.5).then(setCapabilityGapAnalysis).catch(() => {})
    agentsApi.getTaskAllocationFairness(30).then(setTaskAllocationFairness).catch(() => {})
    agentsApi.getAgentRunResourceTrend(14, 10).then(setAgentRunResourceTrend).catch(() => {})
    agentsApi.getAgentSkillMatching(10).then(setSkillMatching).catch(() => {})
    agentsApi.getAgentTaskHandoffStats(30, 10).then(setHandoffStats).catch(() => {})
    agentsApi.getAgentWorkloadForecast(30, 3, 10).then(setWorkloadForecast).catch(() => {})
    agentsApi.getAgentSpecializationEvolution(12, 8).then(setSpecializationEvo).catch(() => {})
    agentsApi.getAgentExperiencesDecayAlerts(30, 0.1, 10).then(setDecayAlerts).catch(() => {})
    agentsApi.getAgentCrossProjectEfficiency(30, 20).then(setCrossProjEff).catch(() => {})
    agentsApi.getAgentCapabilitySupplyDemand(20).then(setCapSupplyDemand).catch(() => {})
    agentsApi.getAgentIdleRanking(20).then(setIdleRanking).catch(() => {})
    agentsApi.getKnowledgePropagationNetwork(90, 20).then(setPropagationNet).catch(() => {})
    agentsApi.getProtocolDecisionLatency(30).then(setProtocolLatency).catch(() => {})
    tasksApi.getDependencyChain(10).then(setDepChain).catch(() => {})
    tasksApi.getCommentSentimentTrend(30).then(setCommentSentiment).catch(() => {})
    tasksApi.getReworkAnalysis(30, 15).then(setReworkAnalysis).catch(() => {})
  }, [])

  return (
    <>
      <AgentAnalyticsOverviewCard
        agentHealth={ agentHealth }
        agentHealthTrend={ agentHealthTrend }
        healthTrendAgentId={ healthTrendAgentId }
        setHealthTrendAgentId={ setHealthTrendAgentId }
        healthTrendLoading={ healthTrendLoading }
        productivityTrend={ productivityTrend }
        reloadHealthTrend={ reloadHealthTrend }
      />

      {/* Agent Productivity */}
      <AgentProductivityCard
        agentProductivity={agentProductivity}
        productivityTrend={productivityTrend}
      />

      {/* Productivity by Kind Comparison */}
      <Card
        title={<Space><ThunderboltOutlined /> 按 Agent 类别 产出对比</Space>}
        style={{ marginBottom: 24 }}
      >
        {productivityByKind ? (
          productivityByKind.items.length > 0 ? (() => {
            const kindColor: Record<string, string> = { assistant: '#1677ff', worker: '#52c41a', orchestrator: '#722ed1', reviewer: '#13c2c2' }
            const maxTotal = Math.max(1, ...productivityByKind.items.map((k) => k.total))
            const maxHours = Math.max(1, ...productivityByKind.items.map((k) => k.avg_completion_hours ?? 0))
            const columns = [
              { title: '类别', dataIndex: 'kind', key: 'kind', render: (k: string) => <Tag color={kindColor[k] || 'default'}>{k}</Tag> },
              { title: 'Agent数', dataIndex: 'agent_count', key: 'agent_count', width: 80 },
              { title: '分配', dataIndex: 'total', key: 'total', width: 80, render: (v: number) => <Space size={4}>{v}<div style={{ width: 60, height: 6, background: '#f0f0f0', borderRadius: 3 }}><div style={{ width: `${(v / maxTotal) * 100}%`, height: '100%', background: '#1677ff', borderRadius: 3 }} /></div></Space> },
              { title: '完成', dataIndex: 'done', key: 'done', width: 70 },
              { title: '完成率', dataIndex: 'completion_rate', key: 'completion_rate', width: 90, render: (v: number) => <Tag color={v >= 80 ? 'green' : v >= 50 ? 'orange' : 'red'}>{v}%</Tag> },
              { title: '失败率', dataIndex: 'failure_rate', key: 'failure_rate', width: 90, render: (v: number) => <Tag color={v <= 10 ? 'green' : v <= 30 ? 'orange' : 'red'}>{v}%</Tag> },
              { title: '平均完成(h)', dataIndex: 'avg_completion_hours', key: 'avg_completion_hours', width: 140, render: (v: number | null) => v == null ? '-' : <Space size={4}><span style={{ minWidth: 36, textAlign: 'right' }}>{v}</span><div style={{ width: 70, height: 8, background: '#f0f0f0', borderRadius: 4 }}><div style={{ width: `${(v / maxHours) * 100}%`, height: '100%', background: '#fa8c16', borderRadius: 4 }} /></div></Space> },
            ]
            return <Table size="small" pagination={false} columns={columns} dataSource={productivityByKind.items} rowKey="kind" />
          })() : <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty description="加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Productivity Hourly Heatmap */}
      <Card
        title={<Space><HeatMapOutlined /> Agent 产出 小时维度热力</Space>}
        style={{ marginBottom: 24 }}
      >
        {productivityHourly && productivityHourly.agents.length > 0 ? (() => {
          const agents = productivityHourly.agents
          const matrix = productivityHourly.matrix
          const maxCell = Math.max(1, productivityHourly.max_cell)
          const hours = Array.from({ length: 24 }, (_, i) => i)
          const cellColor = (v: number) => {
            if (!v) return '#fafafa'
            const r = v / maxCell
            if (r >= 0.75) return '#722ed1'
            if (r >= 0.5) return '#1890ff'
            if (r >= 0.25) return '#69b1ff'
            return '#bae0ff'
          }
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {productivityHourly.days} 天完成时段分布（行=Agent，列=小时 0-23，峰值 {productivityHourly.peak_hour != null ? `${productivityHourly.peak_hour}时` : '—'}）
              </Text>
              <div style={{ marginTop: 4, overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', textAlign: 'left', position: 'sticky', left: 0, background: '#fff' }}>Agent</th>
                      {hours.map((h) => (
                        <th key={h} style={{ padding: '2px 1px', borderBottom: '1px solid #f0f0f0', color: h === productivityHourly.peak_hour ? '#722ed1' : '#8c8c8c', fontWeight: h === productivityHourly.peak_hour ? 'bold' : 'normal' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a) => {
                      const row = matrix[String(a.agent_id)] || {}
                      return (
                        <tr key={a.agent_id}>
                          <td style={{ padding: '2px 6px', color: '#595959', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#fff' }} title={`${a.name} (完成${a.done})`}>{a.name.length > 10 ? a.name.slice(0, 9) + '…' : a.name}</td>
                          {hours.map((h) => {
                            const v = row[String(h)] || 0
                            return (
                              <td key={h} style={{ padding: 0 }}>
                                <Tooltip title={`${a.name} ${h}时: ${v}`}>
                                  <div style={{ width: 20, height: 18, background: cellColor(v), color: v >= maxCell * 0.5 ? '#fff' : '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 0.5 }}>
                                    {v || ''}
                                  </div>
                                </Tooltip>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                <Text type="secondary" style={{ fontSize: 10 }}>色阶:</Text>
                {[
                  { c: '#bae0ff', l: '低' },
                  { c: '#69b1ff', l: '中低' },
                  { c: '#1890ff', l: '中' },
                  { c: '#722ed1', l: '高' },
                ].map(({ c, l }) => (
                  <Text key={l} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ display: 'inline-block', width: 12, height: 10, background: c, borderRadius: 2, verticalAlign: 'middle' }} /> {l}
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无完成时段数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Agent 产出日历热力图 */}
      {productivityCalendar && productivityCalendar.agents.length > 0 && (() => {
        const agents = productivityCalendar.agents
        const matrix = productivityCalendar.matrix
        const maxCell = Math.max(1, productivityCalendar.max_cell)
        const dateRange = productivityCalendar.date_range
        // Render a grid: each row = agent, columns = weeks (7 days per col)
        // Group dates by week
        const weeks: string[][] = []
        let cur: string[] = []
        for (const d of dateRange) {
          cur.push(d)
          if (cur.length === 7) { weeks.push(cur); cur = [] }
        }
        if (cur.length > 0) weeks.push(cur)
        const cellColor = (v: number) => {
          if (!v) return '#f0f0f0'
          const r = v / maxCell
          if (r >= 0.75) return '#135200'
          if (r >= 0.5) return '#389e0d'
          if (r >= 0.25) return '#95de64'
          return '#d9f7be'
        }
        const cellSize = 13
        const gap = 2
        const labelW = 80
        const svgW = labelW + weeks.length * (cellSize + gap) + 20
        const svgH = labelW + agents.length * (cellSize + gap) + 30
        return (
          <Card
            title={<Space><CalendarOutlined /> 产出日历热力</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {productivityCalendar.days} 天</Text>}
            style={{ marginBottom: 24 }}
          >
            <div style={{ overflowX: 'auto' }}>
              <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
                {/* Week labels (month) */}
                {weeks.map((w, wi) => {
                  const month = w[0]?.slice(5, 7)
                  const showLabel = wi === 0 || (w[0] && weeks[wi - 1]?.[0]?.slice(5, 7) !== month)
                  return showLabel ? (
                    <text key={`wm-${wi}`} x={labelW + wi * (cellSize + gap)} y={14} fontSize={9} fill="#8c8c8c">{month}月</text>
                  ) : null
                })}
                {/* Agent rows */}
                {agents.map((a, ai) => {
                  const row = matrix[String(a.agent_id)] || {}
                  return (
                    <g key={`ar-${a.agent_id}`}>
                      <text x={labelW - 4} y={28 + ai * (cellSize + gap) + cellSize / 2 + 2} fontSize={9} fill="#595959" textAnchor="end">{a.name.length > 8 ? a.name.slice(0, 7) + '…' : a.name}</text>
                      {weeks.map((w, wi) => (
                        <g key={`wk-${wi}`}>
                          {w.map((d, di) => {
                            const v = row[d] || 0
                            const isFuture = d > new Date().toISOString().slice(0, 10)
                            return (
                              <Tooltip key={d} title={`${a.name} ${d}: ${v} 完成`}>
                                <rect
                                  x={labelW + wi * (cellSize + gap)}
                                  y={28 + ai * (cellSize + gap) + di * (cellSize + gap)}
                                  width={cellSize}
                                  height={cellSize}
                                  rx={2}
                                  fill={isFuture ? '#fafafa' : cellColor(v)}
                                  stroke="#fff"
                                  strokeWidth={0.5}
                                />
                              </Tooltip>
                            )
                          })}
                        </g>
                      ))}
                    </g>
                  )
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 10 }}>少</Text>
              {['#f0f0f0', '#d9f7be', '#95de64', '#389e0d', '#135200'].map((c, i) => (
                <div key={i} style={{ width: 12, height: 10, background: c, borderRadius: 2 }} />
              ))}
              <Text type="secondary" style={{ fontSize: 10 }}>多</Text>
            </div>
          </Card>
        )
      })()}

      {/* Agent Run Resource Usage */}
      {agentRunResourceUsage && agentRunResourceUsage.items.length > 0 && (() => {
        const items = agentRunResourceUsage.items
        const maxHours = Math.max(1, ...items.map((it) => it.total_hours))
        return (
          <Card
            title={<Space><ThunderboltOutlined /> Agent 运行资源排行</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {agentRunResourceUsage.total_runs} 次</Text>}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {items.map((it) => (
                <div key={it.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={it.name}>{it.name}</span>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 14, position: 'relative', overflow: 'hidden' }}>
                    <Tooltip title={`${it.name}: ${it.total_runs}次 总${it.total_hours}h 均${it.avg_run_minutes}min`}>
                      <div style={{ width: `${(it.total_hours / maxHours) * 100}%`, height: '100%', background: '#722ed1', borderRadius: 3, opacity: 0.7 }} />
                    </Tooltip>
                  </div>
                  <span style={{ color: '#722ed1', minWidth: 40, textAlign: 'right', fontSize: 11 }}>{it.total_hours}h</span>
                  <Text type="secondary" style={{ fontSize: 10 }}>{it.total_runs}次 均{it.avg_run_minutes}min</Text>
                </div>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* Agent 产出效率周间对比 */}
      {agentProdWeeklyComparison && agentProdWeeklyComparison.agents.length > 0 && (() => {
        const agents = agentProdWeeklyComparison.agents
        const maxWeek = Math.max(...agents.map(a => Math.max(a.this_week, a.last_week)), 1)
        const barMaxW = 140
        return (
          <Card
            title={<Space><SwapOutlined /> Agent 产出周间对比</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>本周 {agentProdWeeklyComparison.total_this_week} · 上周 {agentProdWeeklyComparison.total_last_week}</Text>}
            style={{ marginBottom: 24 }}
          >
            {agents.map((a) => {
              const thisW = Math.max(2, (a.this_week / maxWeek) * barMaxW)
              const lastW = Math.max(2, (a.last_week / maxWeek) * barMaxW)
              const changeColor = a.change_pct > 0 ? '#52c41a' : a.change_pct < 0 ? '#ff4d4f' : '#8c8c8c'
              const arrow = a.change_pct > 0 ? '↑' : a.change_pct < 0 ? '↓' : '→'
              return (
                <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12 }}>
                  <Text style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.name}>{a.name}</Text>
                  <Tooltip title={`上周: ${a.last_week}`}>
                    <svg width={barMaxW + 4} height={10} style={{ flexShrink: 0 }}>
                      <rect x={0} y={1} width={barMaxW} height={8} rx={2} fill="#f5f5f5" />
                      <rect x={0} y={1} width={lastW} height={8} rx={2} fill="#bfbfbf" opacity={0.5} />
                    </svg>
                  </Tooltip>
                  <Tooltip title={`本周: ${a.this_week}`}>
                    <svg width={barMaxW + 4} height={10} style={{ flexShrink: 0 }}>
                      <rect x={0} y={1} width={barMaxW} height={8} rx={2} fill="#f5f5f5" />
                      <rect x={0} y={1} width={thisW} height={8} rx={2} fill="#1890ff" opacity={0.7} />
                    </svg>
                  </Tooltip>
                  <Text style={{ color: changeColor, minWidth: 50, fontSize: 11 }}>{arrow}{Math.abs(a.change_pct)}%</Text>
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#bfbfbf' }}>■</span> 上周</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#1890ff' }}>■</span> 本周</Text>
            </div>
          </Card>
        )
      })()}

      {/* Agent Failure Reasons */}
      <AgentFailureReasonsCard agentFailureReasons={agentFailureReasons} />

      {/* Agent Failure Error Pattern Clustering */}
      <AgentErrorPatternsCard agentFailureErrorPatterns={agentFailureErrorPatterns} />

      {/* Agent Capability Gap Analysis */}
      <Card
        title={<Space><AuditOutlined /> Agent 能力缺口分析</Space>}
        style={{ marginBottom: 24 }}
      >
        {capabilityGapAnalysis && capabilityGapAnalysis.agents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {capabilityGapAnalysis.agents.map((a, ai) => (
              <div key={ai} style={{ background: '#fafafa', borderRadius: 4, padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text strong>{a.agent_name}</Text>
                  <Space size={8}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{a.total_capabilities} 项能力</Text>
                    <Tag color={a.coverage_score >= 80 ? 'green' : a.coverage_score >= 50 ? 'orange' : 'red'}>
                      覆盖率 {a.coverage_score}%
                    </Tag>
                  </Space>
                </div>
                {/* Coverage bar */}
                <div style={{ background: '#f0f0f0', borderRadius: 3, height: 8, marginBottom: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${a.coverage_score}%`, height: '100%', background: a.coverage_score >= 80 ? '#52c41a' : a.coverage_score >= 50 ? '#fa8c16' : '#ff4d4f', borderRadius: 3 }} />
                </div>
                {/* Gaps */}
                {a.gaps.length > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>缺口（有经验但未声明）:</Text>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                      {a.gaps.map((g, gi) => (
                        <Tooltip key={gi} title={`${g.success_count}次成功 · 置信度${(g.avg_confidence * 100).toFixed(0)}% · ${g.failure_count}次失败`}>
                          <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{g.domain}</Tag>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
                {/* Overclaims */}
                {a.overclaims.length > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 10 }}>过度声明（无成功经验支撑）:</Text>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                      {a.overclaims.map((o, oi) => (
                        <Tooltip key={oi} title={`${o.failure_count}次失败 · 风险${o.risk}`}>
                          <Tag color={o.risk === 'high' ? 'red' : o.risk === 'medium' ? 'orange' : 'default'} style={{ fontSize: 10, margin: 0 }}>{o.capability}</Tag>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无能力缺口数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Task Allocation Fairness */}
      {taskAllocationFairness && taskAllocationFairness.agents.length > 0 && (
        <Card
          title={<Space><PieChartOutlined /> 任务分配公平性</Space>}
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Tag color={taskAllocationFairness.gini < 0.2 ? 'green' : taskAllocationFairness.gini < 0.4 ? 'orange' : 'red'}>
                Gini {taskAllocationFairness.gini}
              </Tag>
              <Tag>{taskAllocationFairness.fairness_level === 'equal' ? '均衡' : taskAllocationFairness.fairness_level === 'moderate' ? '适中' : '不均衡'}</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>近 {taskAllocationFairness.days} 天 · {taskAllocationFairness.total_tasks} 任务</Text>
            </Space>
          }
        >
          {/* Lorenz curve SVG */}
          {taskAllocationFairness.lorenz_curve.length > 1 && (() => {
            const w = 280
            const h = 180
            const pad = 30
            const pw = w - pad * 2
            const ph = h - pad * 2
            const pts = taskAllocationFairness.lorenz_curve
            const linePoints = pts.map((p, i) => `${pad + (p.agent_percent / 100) * pw},${pad + ph - (p.task_percent / 100) * ph}`).join(' ')
            const equalityLine = `${pad},${pad + ph} ${pad + pw},${pad}`
            return (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <svg width={w} height={h} style={{ overflow: 'visible' }}>
                  <line x1={pad} y1={pad + ph} x2={pad + pw} y2={pad} stroke="#d9d9d9" strokeWidth={1} strokeDasharray="4,2" />
                  <polyline points={equalityLine} fill="none" stroke="#e8e8e8" strokeWidth={1} strokeDasharray="4,2" />
                  <polyline points={linePoints} fill="none" stroke="#1890ff" strokeWidth={2} />
                  <line x1={pad} y1={pad} x2={pad} y2={pad + ph} stroke="#bfbfbf" strokeWidth={1} />
                  <line x1={pad} y1={pad + ph} x2={pad + pw} y2={pad + ph} stroke="#bfbfbf" strokeWidth={1} />
                  <text x={pad + pw / 2} y={h - 2} fontSize={9} fill="#8c8c8c" textAnchor="middle">Agent 累计占比 %</text>
                  <text x={4} y={pad + ph / 2} fontSize={9} fill="#8c8c8c" textAnchor="middle" transform={`rotate(-90, 4, ${pad + ph / 2})`}>任务累计占比 %</text>
                </svg>
                <Text type="secondary" style={{ fontSize: 10 }}>Lorenz 曲线 — 越偏离对角线越不均衡</Text>
              </div>
            )
          })()}
          {/* Agent bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {taskAllocationFairness.agents.map((a, ai) => {
              const maxT = Math.max(1, ...taskAllocationFairness.agents.map(x => x.total))
              return (
                <div key={ai} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                  <span style={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={a.name}>{a.name}</span>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 2, height: 12, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(a.completed / maxT) * 100}%`, height: '100%', background: '#52c41a' }} />
                    <div style={{ width: `${(a.in_progress / maxT) * 100}%`, height: '100%', background: '#1890ff' }} />
                    <div style={{ width: `${(a.assigned / maxT) * 100}%`, height: '100%', background: '#d9d9d9' }} />
                  </div>
                  <Tooltip title={`完成 ${a.completed} · 进行中 ${a.in_progress} · 待认领 ${a.assigned}`}>
                    <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{a.total}</span>
                  </Tooltip>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#52c41a' }}>■ 完成</span>
            <span style={{ fontSize: 10, color: '#1890ff' }}>■ 进行中</span>
            <span style={{ fontSize: 10, color: '#d9d9d9' }}>■ 待认领</span>
          </div>
        </Card>
      )}

      {/* Agent Run Resource Trend */}
      {agentRunResourceTrend && agentRunResourceTrend.agents.length > 0 && (
        <Card
          title={<Space><LineChartOutlined /> Agent 运行资源趋势</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {agentRunResourceTrend.days} 天</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agentRunResourceTrend.agents.map((a, ai) => {
              const maxCount = Math.max(1, ...a.count_series)
              const maxDur = Math.max(1, ...a.duration_series.filter(d => d > 0))
              const sparkW = 200
              const sparkH = 24
              return (
                <div key={ai} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{a.agent_name}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>{a.total_runs} 次运行</Text>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 9 }}>运行次数</Text>
                      <svg width={sparkW} height={sparkH} style={{ display: 'block' }}>
                        {a.count_series.filter(v => v > 0).length > 1 && (() => {
                          const pts = a.count_series.map((v, i) => `${(i / (a.count_series.length - 1)) * sparkW},${sparkH - (v / maxCount) * (sparkH - 2)}`).join(' ')
                          return <polyline points={pts} fill="none" stroke="#1890ff" strokeWidth={1.5} />
                        })()}
                      </svg>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 9 }}>平均时长(s)</Text>
                      <svg width={sparkW} height={sparkH} style={{ display: 'block' }}>
                        {a.duration_series.filter(v => v > 0).length > 1 && (() => {
                          const pts = a.duration_series.map((v, i) => `${(i / (a.duration_series.length - 1)) * sparkW},${sparkH - (v / maxDur) * (sparkH - 2)}`).join(' ')
                          return <polyline points={pts} fill="none" stroke="#fa8c16" strokeWidth={1.5} />
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#1890ff' }}>— 运行次数</span>
            <span style={{ fontSize: 10, color: '#fa8c16' }}>— 平均时长</span>
          </div>
        </Card>
      )}

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

export default AgentAnalyticsSection
