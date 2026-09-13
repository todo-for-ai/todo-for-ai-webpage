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

interface Props {
  taskStats: TaskStats | null
  taskOverdueTrend: TaskOverdueTrend | null
}

/**
 * 任务生命周期与逾期趋势分析卡。由 TaskAnalyticsSection 原样拆出。
 */
export function TaskOverdueAnalyticsCard({ taskStats, taskOverdueTrend }: Props) {
  return (
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
  )
}
