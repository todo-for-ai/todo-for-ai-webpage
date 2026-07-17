import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Empty, Tag, Tooltip, Space, Typography } from 'antd'
import {
  FieldTimeOutlined,
  LineChartOutlined,
  ProjectOutlined,
  UserOutlined,
  AimOutlined,
  ClusterOutlined,
} from '@ant-design/icons'
import { tasksApi, type TaskStats, type TaskOverdueTrend, type TaskCompletionByProject, type TaskCompletionByAssignee, type TaskOverdueByAssignee, type TaskCompletionByPriority, type TaskCompletionRateByProject, type TaskOverdueClustering, type TaskPriorityTrend, type TaskCompletionForecast } from '../../api/tasks'

const { Text } = Typography

const TaskAnalyticsSection = () => {
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null)
  const [taskOverdueTrend, setTaskOverdueTrend] = useState<TaskOverdueTrend | null>(null)
  const [taskOverdueByAssignee, setTaskOverdueByAssignee] = useState<TaskOverdueByAssignee | null>(null)
  const [taskOverdueClustering, setTaskOverdueClustering] = useState<TaskOverdueClustering | null>(null)
  const [taskPriorityTrend, setTaskPriorityTrend] = useState<TaskPriorityTrend | null>(null)
  const [taskCompletionForecast, setTaskCompletionForecast] = useState<TaskCompletionForecast | null>(null)
  const [taskCompletionByProject, setTaskCompletionByProject] = useState<TaskCompletionByProject | null>(null)
  const [taskCompletionByAssignee, setTaskCompletionByAssignee] = useState<TaskCompletionByAssignee | null>(null)
  const [taskCompletionByPriority, setTaskCompletionByPriority] = useState<TaskCompletionByPriority | null>(null)
  const [taskCompletionRateByProject, setTaskCompletionRateByProject] = useState<TaskCompletionRateByProject | null>(null)


  useEffect(() => {
    tasksApi.getStats().then(setTaskStats).catch(() => {})
    tasksApi.getOverdueTrend(30).then(setTaskOverdueTrend).catch(() => {})
    tasksApi.getOverdueByAssignee(10).then(setTaskOverdueByAssignee).catch(() => {})
    tasksApi.getOverdueClustering(15).then(setTaskOverdueClustering).catch(() => {})
    tasksApi.getPriorityTrend(30).then(setTaskPriorityTrend).catch(() => {})
    tasksApi.getCompletionForecast(30).then(setTaskCompletionForecast).catch(() => {})
    tasksApi.getCompletionByProject(30, 8).then(setTaskCompletionByProject).catch(() => {})
    tasksApi.getCompletionByAssignee(30, 8).then(setTaskCompletionByAssignee).catch(() => {})
    tasksApi.getCompletionByPriority(30).then(setTaskCompletionByPriority).catch(() => {})
    tasksApi.getCompletionRateByProject(30, 10).then(setTaskCompletionRateByProject).catch(() => {})

  }, [])

  return (
    <>
      <Card
        title={<Space><FieldTimeOutlined /> 任务生命周期</Space>}
        style={{ marginBottom: 24 }}
      >
        {taskStats ? (
          taskStats.total > 0 ? (() => {
            const statusEntries = Object.entries(taskStats.by_status)
            const priorityEntries = Object.entries(taskStats.by_priority)
            const buckets = taskStats.lifecycle_buckets || {}
            const bucketEntries = Object.entries(buckets)
            const maxBucket = Math.max(1, ...bucketEntries.map(([, v]) => v))
            const statusColor = (k: string) => k === 'done' ? 'green' : k === 'cancelled' ? 'red' : k === 'in_progress' ? 'blue' : k === 'review' ? 'orange' : k === 'blocked' ? 'volcano' : 'default'
            const priorityColor = (k: string) => k === 'urgent' ? 'red' : k === 'high' ? 'orange' : k === 'medium' ? 'blue' : 'default'
            const avgLife = taskStats.avg_lifecycle_hours
            const byProject = taskStats.by_project || []
            const maxProject = Math.max(1, ...byProject.map((p) => p.count))
            return (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}><Statistic title="任务总数" value={taskStats.total} valueStyle={{ fontSize: 16 }} /></Col>
                  <Col span={6}><Statistic title="完成率" value={taskStats.completion_rate} suffix="%" valueStyle={{ fontSize: 16, color: '#52c41a' }} /></Col>
                  <Col span={6}><Statistic title="取消率" value={taskStats.cancellation_rate} suffix="%" valueStyle={{ fontSize: 16, color: taskStats.cancellation_rate > 0 ? '#ff4d4f' : undefined }} /></Col>
                  <Col span={6}><Statistic title="平均完成度" value={taskStats.avg_completion_rate} suffix="%" valueStyle={{ fontSize: 16 }} /></Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按状态:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                      {statusEntries.map(([k, v]: any) => (
                        <Tag key={k} color={statusColor(k)} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                      ))}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>按优先级:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                      {priorityEntries.map(([k, v]: any) => (
                        <Tag key={k} color={priorityColor(k)} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                      ))}
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>已完成任务生命周期分布{avgLife != null ? `（平均 ${avgLife}h）` : ''}:</Text>
                    {bucketEntries.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {bucketEntries.map(([k, v]: any) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 60, color: '#595959' }}>{k}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxBucket) * 100}%`, height: '100%', background: '#1890ff', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : <Empty description="暂无已完成任务" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={8}>
                    <Statistic
                      title="逾期任务"
                      value={taskStats.overdue_count}
                      suffix={taskStats.with_due_date > 0 ? `/ ${taskStats.with_due_date} 有截止日` : ''}
                      valueStyle={{ fontSize: 16, color: taskStats.overdue_count > 0 ? '#ff4d4f' : '#52c41a' }}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>逾期率 {taskStats.overdue_rate}%</Text>
                  </Col>
                  <Col span={16}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按项目分布:</Text>
                    {byProject.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {byProject.slice(0, 6).map((p) => (
                          <div key={p.project_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={p.name}>{p.name}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(p.count / maxProject) * 100}%`, height: '100%', background: '#1890ff', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{p.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : <Empty description="无" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                </Row>
                {(() => {
                  const matrix = taskStats.by_priority_status || {}
                  const priKeys = Object.keys(matrix)
                  if (priKeys.length === 0) return null
                  // 收集所有出现过的状态作为列
                  const statusSet = new Set<string>()
                  priKeys.forEach((p) => Object.keys(matrix[p]).forEach((s) => statusSet.add(s)))
                  const statusCols = Array.from(statusSet)
                  // 计算最大单元格计数用于色阶
                  let cellMax = 1
                  priKeys.forEach((p) => statusCols.forEach((s) => { cellMax = Math.max(cellMax, matrix[p][s] || 0) }))
                  const cellColor = (v: number) => {
                    if (!v) return '#fafafa'
                    const r = v / cellMax
                    if (r >= 0.75) return '#722ed1'
                    if (r >= 0.5) return '#9254de'
                    if (r >= 0.25) return '#b37feb'
                    return '#d3adf7'
                  }
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>优先级 × 状态分布热力:</Text>
                      <table style={{ borderCollapse: 'collapse', fontSize: 10, marginTop: 4 }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>优先级</th>
                            {statusCols.map((s) => (
                              <th key={s} style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', color: '#595959' }}>{s}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {priKeys.map((p) => (
                            <tr key={p}>
                              <td style={{ padding: '2px 6px', color: '#595959', whiteSpace: 'nowrap' }}>{p}</td>
                              {statusCols.map((s) => {
                                const v = matrix[p][s] || 0
                                return (
                                  <td key={s} style={{ padding: 0 }}>
                                    <Tooltip title={`${p} / ${s}: ${v}`}>
                                      <div style={{ width: 44, height: 22, background: cellColor(v), color: v >= cellMax * 0.5 ? '#fff' : '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 1 }}>
                                        {v || ''}
                                      </div>
                                    </Tooltip>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
                {(() => {
                  // 逾期趋势：按 due_date 分日的逾期数，火山色柱
                  if (!taskOverdueTrend || taskOverdueTrend.trend.length === 0) return null
                  const trend = taskOverdueTrend.trend
                  const maxOverdue = Math.max(1, ...trend.map((b) => b.overdue))
                  const priorityTotals = taskOverdueTrend.by_priority_totals || {}
                  const priorityEntries = Object.entries(priorityTotals)
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        逾期趋势（近 {taskOverdueTrend.days} 天，按截止日分桶，共 {taskOverdueTrend.total_overdue} 个逾期）:
                      </Text>
                      {priorityEntries.length > 0 && (
                        <div style={{ marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            按优先级累计: {priorityEntries.map(([k, v]) => `${k}=${v}`).join(' · ')}
                          </Text>
                        </div>
                      )}
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'flex-end', gap: 2, height: 56, overflowX: 'auto', paddingBottom: 2 }}>
                        {trend.map((b) => (
                          <Tooltip key={b.date} title={`${b.date}: 逾期 ${b.overdue}${Object.keys(b.by_priority).length ? ` [${Object.entries(b.by_priority).map(([k, v]) => `${k}=${v}`).join(', ')}]` : ''}`}>
                            <div style={{ flex: '0 0 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                              <div style={{ width: 10, height: `${(b.overdue / maxOverdue) * 100}%`, minHeight: 2, background: '#fa541c', borderRadius: 2 }} />
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </>
            )
          })() : <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty description="加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Task Overdue by Assignee */}
      {taskOverdueByAssignee && taskOverdueByAssignee.items.length > 0 && (
        <Card
          title={<Space><UserOutlined /> 任务逾期按负责人</Space>}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {taskOverdueByAssignee.total_overdue} 个逾期</Text>}
          style={{ marginBottom: 24 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {taskOverdueByAssignee.items.map((a) => {
              const maxOverdue = Math.max(1, taskOverdueByAssignee!.items[0].overdue)
              const priorityTags = Object.entries(a.by_priority).map(([k, v]) => {
                const color = k === 'urgent' ? 'red' : k === 'high' ? 'orange' : k === 'medium' ? 'blue' : 'default'
                return <Tag key={k} color={color} style={{ fontSize: 10 }}>{k}: {v}</Tag>
              })
              return (
                <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={a.name}>{a.name}</span>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 14, position: 'relative', overflow: 'hidden' }}>
                    <Tooltip title={`${a.name}: ${a.overdue}个逾期${a.earliest_due ? ` · 最早到期 ${a.earliest_due.slice(0, 10)}` : ''}`}>
                      <div style={{ width: `${(a.overdue / maxOverdue) * 100}%`, height: '100%', background: '#ff4d4f', borderRadius: 3 }} />
                    </Tooltip>
                  </div>
                  <span style={{ color: '#ff4d4f', minWidth: 30, textAlign: 'right' }}>{a.overdue}</span>
                  <Space size={4}>{priorityTags}</Space>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 任务逾期聚类分析 */}
      {taskOverdueClustering && taskOverdueClustering.clusters.length > 0 && (() => {
        const clusters = taskOverdueClustering.clusters
        const maxCount = Math.max(...clusters.map(c => c.count), 1)
        const barMaxW = 140
        const priorityColors: Record<string, string> = { urgent: '#ff4d4f', high: '#fa8c16', medium: '#1890ff', low: '#52c41a' }
        return (
          <Card
            title={<Space><ClusterOutlined /> 任务逾期聚类分析</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {taskOverdueClustering.total_overdue} 个逾期</Text>}
            style={{ marginBottom: 24 }}
          >
            {clusters.map((c, idx) => {
              const barW = Math.max(2, (c.count / maxCount) * barMaxW)
              const pColor = priorityColors[c.priority] || '#8c8c8c'
              return (
                <div key={idx} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.project_name}>{c.project_name}</Text>
                    <Tag color={pColor} style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>{c.priority}</Tag>
                    <svg width={barMaxW + 4} height={12} style={{ flexShrink: 0 }}>
                      <rect x={0} y={1} width={barMaxW} height={10} rx={2} fill="#f5f5f5" />
                      <rect x={0} y={1} width={barW} height={10} rx={2} fill="#ff4d4f" opacity={0.7} />
                    </svg>
                    <Text style={{ fontSize: 11, color: '#ff4d4f', minWidth: 20 }}>{c.count}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>均{c.avg_days_overdue}天超期</Text>
                  </div>
                  {c.titles.length > 0 && (
                    <Text type="secondary" style={{ fontSize: 9, marginLeft: 118, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.titles.join('; ')}>
                      {c.titles.join('; ')}
                    </Text>
                  )}
                </div>
              )
            })}
          </Card>
        )
      })()}

      {/* 任务优先级分布趋势 */}
      {taskPriorityTrend && taskPriorityTrend.trend.length > 1 && (() => {
        const trend = taskPriorityTrend.trend
        const totals = taskPriorityTrend.totals
        const w = 480
        const h = 160
        const padL = 36
        const padR = 12
        const padT = 12
        const padB = 24
        const plotW = w - padL - padR
        const plotH = h - padT - padB
        const maxVal = Math.max(1, ...trend.flatMap(t => [t.critical, t.high, t.medium, t.low]))
        const xStep = trend.length > 1 ? plotW / (trend.length - 1) : plotW
        const yScale = (v: number) => padT + plotH - (v / maxVal) * plotH
        const xOf = (i: number) => padL + i * xStep
        const lines = [
          { key: 'critical', color: '#ff4d4f', label: '紧急' },
          { key: 'high', color: '#fa8c16', label: '高' },
          { key: 'medium', color: '#1890ff', label: '中' },
          { key: 'low', color: '#52c41a', label: '低' },
        ] as const
        return (
          <Card
            title={<Space><FieldTimeOutlined /> 任务优先级分布趋势</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {taskPriorityTrend.days} 天</Text>}
            style={{ marginBottom: 24 }}
          >
            <svg width={w} height={h} style={{ overflow: 'visible' }}>
              {/* Y grid */}
              {[0, 0.25, 0.5, 0.75, 1].map(r => (
                <line key={`yg-${r}`} x1={padL} y1={yScale(r * maxVal)} x2={w - padR} y2={yScale(r * maxVal)} stroke="#f0f0f0" strokeWidth={0.5} />
              ))}
              {/* Lines */}
              {lines.map(({ key, color }) => {
                const pts = trend.map((t, i) => `${xOf(i)},${yScale(t[key])}`).join(' ')
                return (
                  <polyline key={key} points={pts} fill="none" stroke={color} strokeWidth={1.5} />
                )
              })}
              {/* Dots on last point */}
              {lines.map(({ key, color }) => {
                const last = trend[trend.length - 1]
                const i = trend.length - 1
                return <circle key={`dot-${key}`} cx={xOf(i)} cy={yScale(last[key])} r={3} fill={color} />
              })}
              {/* X labels (first + last + mid) */}
              {trend.length > 2 && (
                <>
                  <text x={padL} y={h - 4} fontSize={8} fill="#8c8c8c" textAnchor="start">{trend[0].date.slice(5)}</text>
                  <text x={xOf(Math.floor(trend.length / 2))} y={h - 4} fontSize={8} fill="#8c8c8c" textAnchor="middle">{trend[Math.floor(trend.length / 2)].date.slice(5)}</text>
                  <text x={xOf(trend.length - 1)} y={h - 4} fontSize={8} fill="#8c8c8c" textAnchor="end">{trend[trend.length - 1].date.slice(5)}</text>
                </>
              )}
            </svg>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              {lines.map(({ key, color, label }) => (
                <Text key={key} style={{ fontSize: 10 }}><span style={{ display: 'inline-block', width: 12, height: 2, background: color, verticalAlign: 'middle', marginRight: 4 }} />{label} {totals[key] ?? 0}</Text>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* 任务完成预测 */}
      {taskCompletionForecast && taskCompletionForecast.total_remaining > 0 && taskCompletionForecast.velocity > 0 && (() => {
        const fc = taskCompletionForecast
        const priorityColors: Record<string, string> = { critical: '#ff4d4f', high: '#fa8c16', medium: '#1890ff', low: '#52c41a' }
        return (
          <Card
            title={<Space><AimOutlined /> 任务完成预测</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>速度 {fc.velocity} 任务/天</Text>}
            style={{ marginBottom: 24 }}
          >
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={8}><Statistic title="剩余任务" value={fc.total_remaining} valueStyle={{ fontSize: 16 }} /></Col>
              <Col span={8}><Statistic title="预计天数" value={fc.days_to_complete ?? '—'} suffix="天" valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Col>
              <Col span={8}><Statistic title="预计完成" value={fc.estimated_completion_date ?? '—'} valueStyle={{ fontSize: 14, color: '#52c41a' }} /></Col>
            </Row>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fc.priority_forecast.filter(p => p.remaining > 0).map((p) => {
                const color = priorityColors[p.priority] || '#8c8c8c'
                return (
                  <div key={p.priority} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 11, width: 40, color, fontWeight: 600 }}>{p.priority}</Text>
                    <Text style={{ fontSize: 11 }}>剩余 {p.remaining}</Text>
                    <div style={{ flex: 1, height: 6, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(p.estimated_days / Math.max(fc.days_to_complete || 1, 1) * 100, 100)}%`, height: '100%', background: color, borderRadius: 3 }} />
                    </div>
                    <Text style={{ fontSize: 10, color: '#8c8c8c', minWidth: 80 }}>{p.estimated_date || '—'}</Text>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })()}

      {/* Task Completion by Priority */}
      {taskCompletionByPriority && taskCompletionByPriority.priorities.length > 0 && (() => {
        const priorities = taskCompletionByPriority.priorities
        const maxTotal = Math.max(1, ...priorities.map((p) => p.total))
        const priorityColors: Record<string, string> = { urgent: '#ff4d4f', high: '#fa8c16', medium: '#1890ff', low: '#52c41a' }
        return (
          <Card
            title={<Space><FieldTimeOutlined /> 任务按优先级完成率</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {taskCompletionByPriority.total} 任务</Text>}
            style={{ marginBottom: 24 }}
          >
            <div>
              {priorities.map((p) => {
                const donePct = p.total > 0 ? p.done / p.total : 0
                const cancelPct = p.total > 0 ? p.cancelled / p.total : 0
                const ipPct = p.total > 0 ? p.in_progress / p.total : 0
                const color = priorityColors[p.priority] || '#8c8c8c'
                return (
                  <div key={p.priority} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Tooltip title={`${p.priority}: 总${p.total} 完成=${p.done} 进行中=${p.in_progress} 取消=${p.cancelled} 完成率=${p.completion_rate}%`}>
                      <Text style={{ fontSize: 11, width: 60, textAlign: 'right', color }}>{p.priority}</Text>
                    </Tooltip>
                    <div style={{ flex: 1, height: 16, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${donePct * 100}%`, height: '100%', background: '#52c41a', opacity: 0.7 }} />
                      <div style={{ width: `${ipPct * 100}%`, height: '100%', background: '#1890ff', opacity: 0.5 }} />
                      <div style={{ width: `${cancelPct * 100}%`, height: '100%', background: '#d9d9d9', opacity: 0.6 }} />
                    </div>
                    <Text style={{ fontSize: 10, width: 45, color }}>{p.completion_rate}%</Text>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#52c41a' }}>■</span> 完成</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#1890ff' }}>■</span> 进行中</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#d9d9d9' }}>■</span> 取消</Text>
              </div>
            </div>
          </Card>
        )
      })()}

      {/* 任务按项目完成率对比 */}
      {taskCompletionRateByProject && taskCompletionRateByProject.projects.length > 0 && (() => {
        const projects = taskCompletionRateByProject.projects
        const maxTotal = Math.max(...projects.map(p => p.total), 1)
        const barMaxW = 180
        return (
          <Card
            title={<Space><ProjectOutlined /> 任务按项目完成率对比</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {taskCompletionRateByProject.total_tasks} 任务 · {taskCompletionRateByProject.total_done} 完成</Text>}
            style={{ marginBottom: 24 }}
          >
            {projects.map((p) => {
              const doneW = (p.done / maxTotal) * barMaxW
              const ipW = (p.in_progress / maxTotal) * barMaxW
              const cancelW = (p.cancelled / maxTotal) * barMaxW
              const rateColor = p.completion_rate >= 70 ? '#52c41a' : p.completion_rate >= 40 ? '#faad14' : '#ff4d4f'
              return (
                <div key={p.project_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Tooltip title={`${p.name}: 总${p.total} 完成=${p.done} 进行中=${p.in_progress} 取消=${p.cancelled}`}>
                    <Text style={{ fontSize: 12, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</Text>
                  </Tooltip>
                  <svg width={barMaxW + 4} height={14} style={{ flexShrink: 0 }}>
                    <rect x={0} y={2} width={barMaxW} height={10} rx={2} fill="#f5f5f5" />
                    <rect x={0} y={2} width={doneW} height={10} rx={2} fill="#52c41a" opacity={0.7} />
                    <rect x={doneW} y={2} width={ipW} height={10} fill="#1890ff" opacity={0.5} />
                    <rect x={doneW + ipW} y={2} width={cancelW} height={10} fill="#d9d9d9" opacity={0.6} />
                  </svg>
                  <Text style={{ fontSize: 11, color: rateColor, minWidth: 44 }}>{p.completion_rate}%</Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>{p.done}/{p.total}</Text>
                </div>
              )
            })}
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#52c41a' }}>■</span> 完成</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#1890ff' }}>■</span> 进行中</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#d9d9d9' }}>■</span> 取消</Text>
            </div>
          </Card>
        )
      })()}

      {/* Task Completion by Project Trend */}
      <Card
        title={<Space><LineChartOutlined /> 任务按项目完成趋势</Space>}
        style={{ marginBottom: 24 }}
      >
        {taskCompletionByProject && taskCompletionByProject.series.length > 0 ? (() => {
          const series = taskCompletionByProject.series
          const allDays = taskCompletionByProject.all_days
          const n = allDays.length
          if (n < 2) return <Empty description="样本不足" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          const maxDone = Math.max(1, ...series.flatMap((s) => s.daily.map((d) => d.done)))
          const W = 560, H = 160, padL = 12, padR = 12, padT = 10, padB = 24
          const xStep = (W - padL - padR) / Math.max(1, n - 1)
          const palette = ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#fa8c16', '#eb2f96', '#fa541c', '#08979c']
          const yOf = (v: number) => H - padB - (v / maxDone) * (H - padT - padB)
          const lineFor = (s: { daily: { done: number }[] }) =>
            s.daily.map((d, i) => `${(padL + i * xStep).toFixed(1)},${yOf(d.done).toFixed(1)}`).join(' ')
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {taskCompletionByProject.days} 天完成趋势（共 {taskCompletionByProject.total_done} 个完成，top{series.length} 项目）
              </Text>
              <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
                {[0, 0.5, 1].map((g) => {
                  const y = H - padB - g * (H - padT - padB)
                  return <line key={g} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth={1} />
                })}
                {series.map((s, idx) => (
                  <g key={s.project_id}>
                    <polyline points={lineFor(s)} fill="none" stroke={palette[idx % palette.length]} strokeWidth={1.6} opacity={0.85} />
                    <title>{`${s.name}: 共${s.total}个完成`}</title>
                  </g>
                ))}
                {/* X 轴首尾日期 */}
                <text x={padL} y={H - 6} fontSize={9} fill="#8c8c8c">{allDays[0]}</text>
                <text x={W - padR} y={H - 6} fontSize={9} fill="#8c8c8c" textAnchor="end">{allDays[n - 1]}</text>
              </svg>
              <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                {series.map((s, idx) => (
                  <Text key={s.project_id} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ color: palette[idx % palette.length] }}>●</span> {s.name} ({s.total})
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无完成数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Task Completion by Assignee Trend */}
      <Card
        title={<Space><UserOutlined /> 任务按负责人完成趋势</Space>}
        style={{ marginBottom: 24 }}
      >
        {taskCompletionByAssignee && taskCompletionByAssignee.series.length > 0 ? (() => {
          const series = taskCompletionByAssignee.series
          const allDays = taskCompletionByAssignee.all_days
          const n = allDays.length
          if (n < 2) return <Empty description="样本不足" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          const maxDone = Math.max(1, ...series.flatMap((s) => s.daily.map((d) => d.done)))
          const W = 560, H = 160, padL = 12, padR = 12, padT = 10, padB = 24
          const xStep = (W - padL - padR) / Math.max(1, n - 1)
          const palette = ['#722ed1', '#13c2c2', '#fa8c16', '#eb2f96', '#1677ff', '#52c41a', '#fa541c', '#08979c']
          const yOf = (v: number) => H - padB - (v / maxDone) * (H - padT - padB)
          const lineFor = (s: { daily: { done: number }[] }) =>
            s.daily.map((d, i) => `${(padL + i * xStep).toFixed(1)},${yOf(d.done).toFixed(1)}`).join(' ')
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {taskCompletionByAssignee.days} 天完成趋势（共 {taskCompletionByAssignee.total_done} 个完成，top{series.length} Agent）
              </Text>
              <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
                {[0, 0.5, 1].map((g) => {
                  const y = H - padB - g * (H - padT - padB)
                  return <line key={g} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth={1} />
                })}
                {series.map((s, idx) => (
                  <g key={s.agent_id}>
                    <polyline points={lineFor(s)} fill="none" stroke={palette[idx % palette.length]} strokeWidth={1.6} opacity={0.85} />
                    <title>{`${s.name}: 共${s.total}个完成`}</title>
                  </g>
                ))}
                <text x={padL} y={H - 6} fontSize={9} fill="#8c8c8c">{allDays[0]}</text>
                <text x={W - padR} y={H - 6} fontSize={9} fill="#8c8c8c" textAnchor="end">{allDays[n - 1]}</text>
              </svg>
              <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                {series.map((s, idx) => (
                  <Text key={s.agent_id} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ color: palette[idx % palette.length] }}>●</span> {s.name} ({s.total})
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无完成数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

    </>
  )
}

export default TaskAnalyticsSection
