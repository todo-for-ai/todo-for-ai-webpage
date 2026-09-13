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
 * 能力缺口/任务分配公平性/运行资源趋势卡。props 收数据 hook 全量包，由 AgentAnalyticsSection 原样拆出。
 */
export function AgentAnalyticsCapabilityCards(props: Bundle) {
  const {
    agentRunResourceTrend,
    capabilityGapAnalysis,
    taskAllocationFairness,
  } = props

  return (
    <>
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
    </>
  )
}
