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
 * 产出与热力图卡片族（按类别对比/小时热力/日历热力/运行资源/周间对比/失败原因/错误模式）。props 收数据 hook 全量包，由 AgentAnalyticsSection 原样拆出。
 */
export function AgentAnalyticsProductivityCards(props: Bundle) {
  const {
    agentFailureErrorPatterns,
    agentFailureReasons,
    agentProdWeeklyComparison,
    agentProductivity,
    agentRunResourceUsage,
    productivityByKind,
    productivityCalendar,
    productivityHourly,
    productivityTrend,
  } = props

  return (
    <>
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
    </>
  )
}
