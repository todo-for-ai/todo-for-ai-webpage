import React from 'react'
import { Card, Tag, Space, Tooltip, Typography } from 'antd'
import {
  LineChartOutlined, WarningOutlined, HeatMapOutlined, PieChartOutlined,
  RetweetOutlined, ClockCircleOutlined, ApartmentOutlined, DotChartOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import {
  type WorkflowStepStats,
  type WorkflowStepDurationHistogram,
  type WorkflowRunDurationPercentiles,
  type WorkflowStepFailureRate,
  type WorkflowStepCofailureMatrix,
  type WorkflowSuccessRateByWorkflow,
  type WorkflowStepRetryTopology,
  type WorkflowStepHourlyDistribution,
  type WorkflowStepDependencyBottleneck,
  type WorkflowSimilarityMatrix,
  type WorkflowRunTrend,
  type WorkflowFailureCorrelation,
  type WorkflowFailureCorrelationByStep,
  type WorkflowFailedStepsByDuration,
  type WorkflowStepBottleneckTimeline,
  type WorkflowStructuralComplexity,
} from '../../api/agents'
import WorkflowRunTrendChart from '../../components/WorkflowRunTrendChart'

const { Text } = Typography

interface WorkflowAnalyticsCardsProps {
  stepStats: WorkflowStepStats | null
  stepDurationHistogram: WorkflowStepDurationHistogram | null
  runDurationPercentiles: WorkflowRunDurationPercentiles | null
  stepFailureRate: WorkflowStepFailureRate | null
  stepCofailureMatrix: WorkflowStepCofailureMatrix | null
  successRateByWorkflow: WorkflowSuccessRateByWorkflow | null
  stepRetryTopology: WorkflowStepRetryTopology | null
  stepHourlyDistribution: WorkflowStepHourlyDistribution | null
  stepDependencyBottleneck: WorkflowStepDependencyBottleneck | null
  similarityMatrix: WorkflowSimilarityMatrix | null
  stepDurationHist: WorkflowStepDurationHistogram | null
  stepBottleneckTl: WorkflowStepBottleneckTimeline | null
  structuralComplexity: WorkflowStructuralComplexity | null
  runTrend: WorkflowRunTrend | null
  failureCorrelation: WorkflowFailureCorrelation | null
  failureCorrelationByStep: WorkflowFailureCorrelationByStep | null
  failedStepsByDuration: WorkflowFailedStepsByDuration | null
}

const WorkflowAnalyticsCards: React.FC<WorkflowAnalyticsCardsProps> = ({
  stepStats,
  stepDurationHistogram,
  runDurationPercentiles,
  stepFailureRate,
  stepCofailureMatrix,
  successRateByWorkflow,
  stepRetryTopology,
  stepHourlyDistribution,
  stepDependencyBottleneck,
  similarityMatrix,
  stepDurationHist,
  stepBottleneckTl,
  structuralComplexity,
  runTrend,
  failureCorrelation,
  failureCorrelationByStep,
  failedStepsByDuration,
}) => {
  return (
    <>
      {/* Step execution stats */}
      {stepStats && stepStats.items.length > 0 && (
        <Card title="步骤执行统计" size="small" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {stepStats.items.slice(0, 10).map((s) => {
              const rate = Math.round((s.success_rate || 0) * 100)
              const rateColor = rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f'
              const dur = s.avg_duration_seconds != null ? `${s.avg_duration_seconds}s` : '-'
              return (
                <div key={s.step_key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={s.step_key}>{s.step_key}</span>
                  <Tag color="blue" style={{ fontSize: 10 }}>{s.total}次</Tag>
                  <span style={{ color: rateColor, minWidth: 80 }}>成功率 {rate}%</span>
                  <Tag color={s.failed > 0 ? 'red' : 'default'} style={{ fontSize: 10 }}>失败 {s.failed}</Tag>
                  {s.skipped > 0 && <Tag style={{ fontSize: 10 }}>跳过 {s.skipped}</Tag>}
                  {s.retries > 0 && <Tag color="orange" style={{ fontSize: 10 }}>重试 {s.retries}</Tag>}
                  <span style={{ color: '#8c8c8c' }}>均耗时 {dur}</span>
                </div>
              )
            })}
          </div>
          {runTrend && runTrend.trend.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {runTrend.days} 天运行趋势（累计成功 {runTrend.total_succeeded} / 失败 {runTrend.total_failed} / 失败步骤 {runTrend.total_failed_steps ?? 0}）
              </Text>
              <div style={{ marginTop: 4 }}>
                <WorkflowRunTrendChart buckets={runTrend.trend} width={520} height={84} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#52c41a' }}>●</span> 成功</Text>
                <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#ff4d4f' }}>●</span> 失败</Text>
                <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#fa8c16' }}>┄</span> 失败步骤</Text>
              </div>
            </div>
          )}
          {failureCorrelation && failureCorrelation.total_failed_steps > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                失败步骤跨维度关联（近 {failureCorrelation.days} 天，±{failureCorrelation.window_hours}h 窗口，共 {failureCorrelation.total_failed_steps} 个失败步骤）
              </Text>
              <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                <Tag color={failureCorrelation.conflict_rate > 0 ? 'orange' : 'default'} style={{ fontSize: 11 }}>
                  伴随冲突 {failureCorrelation.with_conflict} ({failureCorrelation.conflict_rate}%)
                </Tag>
                <Tag color={failureCorrelation.violation_rate > 0 ? 'red' : 'default'} style={{ fontSize: 11 }}>
                  伴随沙盒违规 {failureCorrelation.with_violation} ({failureCorrelation.violation_rate}%)
                </Tag>
                <Tag color={failureCorrelation.both_rate > 0 ? 'volcano' : 'default'} style={{ fontSize: 11 }}>
                  同时伴随两者 {failureCorrelation.with_both} ({failureCorrelation.both_rate}%)
                </Tag>
              </div>
              {failureCorrelation.top_agents.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>关联最多的 Agent:</Text>
                  {failureCorrelation.top_agents.map((a) => (
                    <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      <span style={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name} #{a.agent_id}</span>
                      <Tag style={{ fontSize: 10 }}>失败 {a.failed_steps}</Tag>
                      <Tag color={a.with_conflict > 0 ? 'orange' : 'default'} style={{ fontSize: 10 }}>冲突 {a.with_conflict}</Tag>
                      <Tag color={a.with_violation > 0 ? 'red' : 'default'} style={{ fontSize: 10 }}>违规 {a.with_violation}</Tag>
                    </div>
                  ))}
                </div>
              )}
              {failureCorrelationByStep && failureCorrelationByStep.items.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>按步骤的失败伴随率:</Text>
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {failureCorrelationByStep.items.slice(0, 10).map((s) => (
                      <div key={s.step_key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span style={{ width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={s.step_key}>{s.step_key}</span>
                        <Tag style={{ fontSize: 10 }}>失败 {s.failed}</Tag>
                        <Tag color={s.conflict_rate > 0 ? 'orange' : 'default'} style={{ fontSize: 10 }}>冲突 {s.conflict_rate}%</Tag>
                        <Tag color={s.violation_rate > 0 ? 'red' : 'default'} style={{ fontSize: 10 }}>违规 {s.violation_rate}%</Tag>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const matrix = failureCorrelationByStep.step_conflict_type_matrix || {}
                    const stepKeys = Object.keys(matrix)
                    if (stepKeys.length === 0) return null
                    const typeSet = new Set<string>()
                    stepKeys.forEach((sk) => Object.keys(matrix[sk]).forEach((t) => typeSet.add(t)))
                    const typeCols = Array.from(typeSet)
                    if (typeCols.length === 0) return null
                    let cellMax = 1
                    stepKeys.forEach((sk) => typeCols.forEach((t) => { cellMax = Math.max(cellMax, matrix[sk][t] || 0) }))
                    const cellColor = (v: number) => {
                      if (!v) return '#fafafa'
                      const r = v / cellMax
                      if (r >= 0.75) return '#fa541c'
                      if (r >= 0.5) return '#fa8c16'
                      if (r >= 0.25) return '#ffc069'
                      return '#ffe7ba'
                    }
                    return (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>步骤 × 冲突类型热力:</Text>
                        <table style={{ borderCollapse: 'collapse', fontSize: 10, marginTop: 4 }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>步骤</th>
                              {typeCols.map((t) => (
                                <th key={t} style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', color: '#595959', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }} title={t}>{t}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {stepKeys.map((sk) => (
                              <tr key={sk}>
                                <td style={{ padding: '2px 6px', color: '#595959', whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }} title={sk}>{sk}</td>
                                {typeCols.map((t) => {
                                  const v = matrix[sk][t] || 0
                                  return (
                                    <td key={t} style={{ padding: 0 }}>
                                      <Tooltip title={`${sk} / ${t}: ${v}`}>
                                        <div style={{ width: 50, height: 20, background: cellColor(v), color: v >= cellMax * 0.5 ? '#fff' : '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 1 }}>
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
                </div>
              )}
              {failedStepsByDuration && failedStepsByDuration.items.length > 0 && (() => {
                const maxAvg = Math.max(1, ...failedStepsByDuration.items.map((s) => s.avg_duration_seconds))
                return (
                  <div style={{ marginTop: 10 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      失败步骤耗时排行（近 {failedStepsByDuration.days} 天，共 {failedStepsByDuration.total_failed_steps} 次失败，按平均耗时降序）:
                    </Text>
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {failedStepsByDuration.items.slice(0, 10).map((s) => (
                        <div key={s.step_key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                          <span style={{ width: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={s.step_key}>{s.step_key}</span>
                          <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: `${(s.avg_duration_seconds / maxAvg) * 100}%`, height: '100%', background: '#fa541c', borderRadius: 3 }} />
                          </div>
                          <Tooltip title={`中位 ${s.median_duration_seconds}s · 最长 ${s.max_duration_seconds}s`}>
                            <span style={{ color: '#8c8c8c', minWidth: 110, textAlign: 'right' }}>{s.failures}次 / 均{s.avg_duration_seconds}s</span>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </Card>
      )}

      {/* Step Duration Histogram */}
      {stepDurationHistogram && stepDurationHistogram.items.length > 0 && (
        <Card title="步骤耗时分布" size="small" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stepDurationHistogram.items.slice(0, 8).map((item) => {
              const bins = stepDurationHistogram.bin_labels
              const maxBin = Math.max(1, ...Object.values(item.bins))
              return (
                <div key={item.step_key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <Tooltip title={`n=${item.sample_size} 中位=${item.median_seconds}s P95=${item.p95_seconds}s 范围=${item.min_seconds}-${item.max_seconds}s`}>
                      <span style={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={item.step_key}>{item.step_key}</span>
                    </Tooltip>
                    <div style={{ flex: 1, display: 'flex', gap: 1, height: 14, alignItems: 'flex-end' }}>
                      {bins.map((label) => {
                        const v = item.bins[label] ?? 0
                        const h = maxBin > 0 ? (v / maxBin) * 14 : 0
                        const colorMap: Record<string, string> = { '0-30s': '#52c41a', '30-120s': '#a0d911', '2-5m': '#faad14', '5-15m': '#fa8c16', '15-30m': '#fa541c', '30m+': '#ff4d4f' }
                        return (
                          <Tooltip key={label} title={`${label}: ${v}次`}>
                            <div style={{ flex: 1, height: Math.max(1, h), background: colorMap[label] || '#bfbfbf', borderRadius: 1, opacity: v > 0 ? 0.85 : 0.2 }} />
                          </Tooltip>
                        )
                      })}
                    </div>
                    <Text type="secondary" style={{ fontSize: 10, minWidth: 80, textAlign: 'right' }}>
                      中位{item.median_seconds}s P95={item.p95_seconds}s
                    </Text>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            {stepDurationHistogram.bin_labels.map((label) => {
              const colorMap: Record<string, string> = { '0-30s': '#52c41a', '30-120s': '#a0d911', '2-5m': '#faad14', '5-15m': '#fa8c16', '15-30m': '#fa541c', '30m+': '#ff4d4f' }
              return (
                <Text key={label} type="secondary" style={{ fontSize: 10 }}>
                  <span style={{ display: 'inline-block', width: 10, height: 8, background: colorMap[label] || '#bfbfbf', borderRadius: 1, verticalAlign: 'middle' }} /> {label}
                </Text>
              )
            })}
          </div>
        </Card>
      )}

      {/* Run Duration Percentiles Trend */}
      {runDurationPercentiles && runDurationPercentiles.buckets.length > 0 && (() => {
        const buckets = runDurationPercentiles.buckets
        const maxP95 = Math.max(1, ...buckets.map((b) => b.p95))
        const w = 320
        const h = 120
        const padL = 30
        const padR = 10
        const padT = 10
        const padB = 20
        const plotW = w - padL - padR
        const plotH = h - padT - padB
        const xStep = buckets.length > 1 ? plotW / (buckets.length - 1) : 0
        const toY = (v: number) => padT + plotH - (v / maxP95) * plotH
        const p50Pts = buckets.map((b, i) => `${padL + i * xStep},${toY(b.p50)}`).join(' ')
        const p90Pts = buckets.map((b, i) => `${padL + i * xStep},${toY(b.p90)}`).join(' ')
        const p95Pts = buckets.map((b, i) => `${padL + i * xStep},${toY(b.p95)}`).join(' ')
        return (
          <Card
            title={<Space><LineChartOutlined /> 运行时长分位数趋势</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {runDurationPercentiles.total_runs} 次 · 均时 {runDurationPercentiles.total_avg_duration}s</Text>}
            style={{ marginBottom: 24 }}
          >
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
              {/* Y轴参考线 */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = padT + plotH * (1 - pct)
                const val = Math.round(maxP95 * pct)
                return (
                  <g key={pct}>
                    <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#f0f0f0" strokeWidth={0.5} />
                    <text x={padL - 4} y={y + 3} fontSize={8} fill="#8c8c8c" textAnchor="end">{val}s</text>
                  </g>
                )
              })}
              {/* P95 区域填充 */}
              <polyline points={p95Pts} fill="none" stroke="#ff4d4f" strokeWidth={1.5} strokeOpacity={0.6} />
              {/* P90 线 */}
              <polyline points={p90Pts} fill="none" stroke="#fa8c16" strokeWidth={1.5} strokeOpacity={0.7} />
              {/* P50 线 */}
              <polyline points={p50Pts} fill="none" stroke="#52c41a" strokeWidth={2} />
              {/* X轴日期标签 */}
              {buckets.filter((_, i) => i % Math.max(1, Math.floor(buckets.length / 6)) === 0).map((b, i, arr) => {
                const idx = buckets.indexOf(b)
                const x = padL + idx * xStep
                return <text key={i} x={x} y={h - 2} fontSize={8} fill="#8c8c8c" textAnchor="middle">{b.date.slice(5)}</text>
              })}
            </svg>
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#52c41a' }}>━</span> P50</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#fa8c16' }}>━</span> P90</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>━</span> P95</Text>
            </div>
          </Card>
        )
      })()}

      {/* 步骤失败率排行 */}
      {stepFailureRate && stepFailureRate.items.length > 0 && (() => {
        const items = stepFailureRate.items
        const maxRate = Math.max(...items.map(it => it.failure_rate), 1)
        const barMaxW = 200
        return (
          <Card
            title={<Space><WarningOutlined /> 步骤失败率排行</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {stepFailureRate.total_steps} 步 · {stepFailureRate.total_failed} 失败</Text>}
            style={{ marginBottom: 24 }}
          >
            {items.map((it, idx) => {
              const barW = Math.max(2, (it.failure_rate / maxRate) * barMaxW)
              const ratio = it.failure_rate / 100
              const barColor = ratio < 0.1 ? '#52c41a' : ratio < 0.3 ? '#faad14' : '#ff4d4f'
              return (
                <div key={it.step_key} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
                  <Text style={{ width: 140, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.step_key}>{it.step_key}</Text>
                  <svg width={barMaxW + 4} height={14} style={{ flexShrink: 0 }}>
                    <rect x={0} y={2} width={barMaxW} height={10} rx={2} fill="#f5f5f5" />
                    <rect x={0} y={2} width={barW} height={10} rx={2} fill={barColor} />
                  </svg>
                  <Text style={{ fontSize: 11, color: barColor, minWidth: 44 }}>{it.failure_rate.toFixed(1)}%</Text>
                  <Text type="secondary" style={{ fontSize: 10 }}>{it.failed}/{it.total}</Text>
                </div>
              )
            })}
          </Card>
        )
      })()}

      {/* 步骤共失败热力矩阵 */}
      {stepCofailureMatrix && stepCofailureMatrix.step_keys.length >= 2 && (() => {
        const keys = stepCofailureMatrix.step_keys
        const n = keys.length
        const matrix = stepCofailureMatrix.matrix
        const maxCo = Math.max(stepCofailureMatrix.max_cofailure, 1)
        const cellSize = 32
        const labelW = 80
        const totalW = labelW + n * cellSize + 4
        const totalH = labelW + n * cellSize + 4
        const cofColor = (v: number) => {
          if (v === 0) return '#fafafa'
          const t = v / maxCo
          return t < 0.33 ? '#fff1f0' : t < 0.66 ? '#ffa39e' : '#ff4d4f'
        }
        return (
          <Card
            title={<Space><HeatMapOutlined /> 步骤共失败热力矩阵</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{stepCofailureMatrix.total_runs_with_multi_failure} 次多步失败</Text>}
            style={{ marginBottom: 24 }}
          >
            <svg width={totalW} height={totalH} style={{ overflow: 'visible' }}>
              {/* Column headers */}
              {keys.map((k, j) => (
                <text key={`ch-${j}`} x={labelW + j * cellSize + cellSize / 2} y={labelW - 4} fontSize={8} fill="#8c8c8c" textAnchor="middle" transform={`rotate(-45, ${labelW + j * cellSize + cellSize / 2}, ${labelW - 4})`}>{k.step_key.length > 8 ? k.step_key.slice(0, 8) + '…' : k.step_key}</text>
              ))}
              {/* Rows */}
              {keys.map((rowK, i) => {
                const row = matrix[rowK.step_key] || {}
                return (
                  <g key={`row-${i}`}>
                    {/* Row header */}
                    <text x={labelW - 4} y={labelW + i * cellSize + cellSize / 2 + 3} fontSize={8} fill="#595959" textAnchor="end">{rowK.step_key.length > 10 ? rowK.step_key.slice(0, 10) + '…' : rowK.step_key}</text>
                    {/* Cells */}
                    {keys.map((colK, j) => {
                      const v = row[colK.step_key] ?? (i === j ? rowK.failures : 0)
                      const isDiag = i === j
                      const fill = isDiag ? '#f0f0f0' : cofColor(v)
                      const textFill = isDiag ? '#8c8c8c' : v >= maxCo * 0.66 ? '#fff' : '#595959'
                      return (
                        <g key={`cell-${i}-${j}`}>
                          <rect x={labelW + j * cellSize} y={labelW + i * cellSize} width={cellSize - 1} height={cellSize - 1} rx={2} fill={fill} stroke="#fff" strokeWidth={0.5} />
                          <text x={labelW + j * cellSize + cellSize / 2} y={labelW + i * cellSize + cellSize / 2 + 3} fontSize={9} fill={textFill} textAnchor="middle" fontWeight={v > 0 && !isDiag ? 600 : 400}>{v > 0 ? v : ''}</text>
                        </g>
                      )
                    })}
                  </g>
                )
              })}
            </svg>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <Text type="secondary" style={{ fontSize: 10 }}>共现强度:</Text>
              <div style={{ display: 'flex', gap: 2 }}>
                {['#fafafa', '#fff1f0', '#ffa39e', '#ff4d4f'].map((c, i) => (
                  <div key={i} style={{ width: 16, height: 10, background: c, border: '1px solid #f0f0f0', borderRadius: 1 }} />
                ))}
              </div>
              <Text type="secondary" style={{ fontSize: 9 }}>低 → 高</Text>
            </div>
          </Card>
        )
      })()}

      {/* 工作流成功率对比 */}
      {successRateByWorkflow && successRateByWorkflow.workflows.length > 0 && (() => {
        const wfs = successRateByWorkflow.workflows
        const maxTotal = Math.max(...wfs.map(w => w.total), 1)
        return (
          <Card
            title={<Space><PieChartOutlined /> 工作流成功率对比</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>近 30 天 · Top {wfs.length}</Text>}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {wfs.map((w, i) => {
                const barW = Math.max(w.total / maxTotal * 100, 4)
                const succW = w.succeeded / w.total * barW
                const failW = w.failed / w.total * barW
                const cancelW = w.cancelled / w.total * barW
                const dur = w.avg_duration >= 3600 ? `${(w.avg_duration / 3600).toFixed(1)}h` : w.avg_duration >= 60 ? `${(w.avg_duration / 60).toFixed(1)}m` : `${w.avg_duration.toFixed(0)}s`
                return (
                  <div key={w.workflow_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <Text style={{ fontSize: 12, fontWeight: 500, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</Text>
                      <Text style={{ fontSize: 11, color: w.success_rate >= 80 ? '#52c41a' : w.success_rate >= 50 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>{w.success_rate}% 成功</Text>
                    </div>
                    <div style={{ display: 'flex', height: 14, borderRadius: 3, overflow: 'hidden', background: '#f5f5f5' }}>
                      {w.succeeded > 0 && <div style={{ width: `${succW}%`, background: '#52c41a', minWidth: 2 }} title={`成功: ${w.succeeded}`} />}
                      {w.failed > 0 && <div style={{ width: `${failW}%`, background: '#ff4d4f', minWidth: 2 }} title={`失败: ${w.failed}`} />}
                      {w.cancelled > 0 && <div style={{ width: `${cancelW}%`, background: '#d9d9d9', minWidth: 2 }} title={`取消: ${w.cancelled}`} />}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 1 }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>共 {w.total} 次</Text>
                      <Text type="secondary" style={{ fontSize: 10 }}>平均耗时 {dur}</Text>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })()}

      {/* 步骤重试拓扑 */}
      {stepRetryTopology && stepRetryTopology.steps.length > 0 && (() => {
        const steps = stepRetryTopology.steps
        const maxRetries = Math.max(...steps.map(s => s.retries), 1)
        return (
          <Card
            title={<Space><RetweetOutlined /> 步骤重试拓扑</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {stepRetryTopology.days} 天 · {stepRetryTopology.total_retries} 次重试</Text>}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {steps.map((s, i) => {
                const barW = Math.max((s.retries / maxRetries) * 120, 4)
                const firstColor = s.first_attempt_success_rate >= 80 ? '#52c41a' : s.first_attempt_success_rate >= 50 ? '#faad14' : '#ff4d4f'
                const retryColor = s.retry_success_rate >= 80 ? '#52c41a' : s.retry_success_rate >= 50 ? '#faad14' : '#ff4d4f'
                return (
                  <div key={s.step_key}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Text style={{ fontSize: 12, fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.step_key}>{s.step_key.length > 16 ? s.step_key.slice(0, 15) + '…' : s.step_key}</Text>
                      <svg width={124} height={12} style={{ flexShrink: 0 }}>
                        <rect x={0} y={1} width={120} height={10} rx={2} fill="#f5f5f5" />
                        <rect x={0} y={1} width={barW} height={10} rx={2} fill="#fa8c16" opacity={0.7} />
                      </svg>
                      <Text style={{ fontSize: 11, color: '#fa8c16', fontWeight: 600 }}>{s.retries}</Text>
                      <Text type="secondary" style={{ fontSize: 10 }}>重试率 {s.retry_rate}%</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginLeft: 148 }}>
                      <Text style={{ fontSize: 10, color: firstColor }}>首次成功 {s.first_attempt_success_rate}%</Text>
                      <Text style={{ fontSize: 10, color: retryColor }}>重试成功 {s.retry_success_rate}%</Text>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })()}

      {/* 步骤执行时段分布 */}
      {stepHourlyDistribution && stepHourlyDistribution.steps.length > 0 && (() => {
        const steps = stepHourlyDistribution.steps
        const hours = Array.from({ length: 24 }, (_, i) => i)
        const maxCell = Math.max(1, ...steps.flatMap(s => Object.values(s.hours)))
        const cellColor = (v: number) => {
          if (!v) return '#f0f0f0'
          const r = v / maxCell
          if (r >= 0.75) return '#1890ff'
          if (r >= 0.5) return '#69b1ff'
          if (r >= 0.25) return '#bae0ff'
          return '#e6f7ff'
        }
        const cellSize = 18
        const labelW = 100
        const svgW = labelW + 24 * cellSize + 10
        const svgH = 18 + steps.length * (cellSize + 1)
        return (
          <Card
            title={<Space><ClockCircleOutlined /> 步骤执行时段分布</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {stepHourlyDistribution.days} 天</Text>}
            style={{ marginBottom: 24 }}
          >
            <div style={{ overflowX: 'auto' }}>
              <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
                {/* Hour labels */}
                {hours.map(h => (
                  <text key={`h-${h}`} x={labelW + h * cellSize + cellSize / 2} y={10} fontSize={7} fill="#8c8c8c" textAnchor="middle">{h}</text>
                ))}
                {/* Step rows */}
                {steps.map((s, i) => (
                  <g key={`sr-${s.step_key}`}>
                    <text x={labelW - 4} y={18 + i * (cellSize + 1) + cellSize / 2 + 2} fontSize={8} fill="#595959" textAnchor="end">{s.step_key.length > 12 ? s.step_key.slice(0, 11) + '…' : s.step_key}</text>
                    {hours.map(h => {
                      const v = s.hours[String(h)] || 0
                      return (
                        <rect key={`c-${h}`} x={labelW + h * cellSize} y={18 + i * (cellSize + 1)} width={cellSize - 1} height={cellSize - 1} rx={1.5} fill={cellColor(v)}>
                          <title>{`${s.step_key} ${h}时: ${v}`}</title>
                        </rect>
                      )
                    })}
                  </g>
                ))}
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <Text type="secondary" style={{ fontSize: 10 }}>少</Text>
              {['#f0f0f0', '#e6f7ff', '#bae0ff', '#69b1ff', '#1890ff'].map((c, i) => (
                <div key={i} style={{ width: 12, height: 8, background: c, borderRadius: 1 }} />
              ))}
              <Text type="secondary" style={{ fontSize: 10 }}>多</Text>
              <Text type="secondary" style={{ fontSize: 10, marginLeft: 8 }}>工时占比 = {(steps[0]?.business_hours_ratio ?? 0)}%+</Text>
            </div>
          </Card>
        )
      })()}

      {/* Step Dependency Bottleneck */}
      {stepDependencyBottleneck && stepDependencyBottleneck.workflows.length > 0 && (
        <Card
          title={<Space><ApartmentOutlined /> 步骤依赖瓶颈分析</Space>}
          style={{ marginBottom: 24 }}
        >
          {stepDependencyBottleneck.workflows.map((wf, wfi) => {
            const maxDur = Math.max(1, ...wf.all_steps.map(s => s.avg_duration))
            return (
              <div key={wfi} style={{ marginBottom: wfi < stepDependencyBottleneck.workflows.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text strong>{wf.workflow_name}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>关键路径耗时 {wf.critical_path_duration}s · {wf.active_steps}/{wf.total_steps} 活跃步骤</Text>
                </div>
                {/* Critical path chain */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', marginBottom: 6 }}>
                  {wf.critical_path.map((cs, ci) => (
                    <span key={ci} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      {ci > 0 && <span style={{ color: '#bfbfbf' }}>→</span>}
                      <Tooltip title={`${cs.name}: ${cs.avg_duration}s (瓶颈 ${cs.bottleneck_score}%)`}>
                        <Tag color={cs.bottleneck_score >= 40 ? 'red' : cs.bottleneck_score >= 25 ? 'orange' : 'blue'} style={{ fontSize: 10, margin: 0 }}>
                          {cs.step_key} {cs.avg_duration}s
                        </Tag>
                      </Tooltip>
                    </span>
                  ))}
                </div>
                {/* All steps bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {wf.all_steps.map((s, si) => (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <span style={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: s.is_on_critical_path ? '#cf1322' : '#595959', fontWeight: s.is_on_critical_path ? 600 : 400 }} title={s.name}>{s.step_key}</span>
                      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 2, height: 10, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ width: `${(s.avg_duration / maxDur) * 100}%`, height: '100%', background: s.is_on_critical_path ? '#ff4d4f' : '#1890ff', borderRadius: 2 }} />
                      </div>
                      <span style={{ color: '#8c8c8c', minWidth: 40, textAlign: 'right' }}>{s.avg_duration}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {/* Workflow Run Similarity Matrix */}
      {similarityMatrix && similarityMatrix.workflows.length > 0 && (
        <Card
          title={<Space><DotChartOutlined /> 运行相似度矩阵</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {similarityMatrix.days} 天 · Jaccard 相似度</Text>}
        >
          {similarityMatrix.workflows.map((wf, wfi) => {
            const n = wf.matrix.length
            if (n < 2) return null
            const cellSize = Math.min(28, Math.max(14, Math.floor(240 / n)))
            const svgW = 40 + n * cellSize
            const svgH = 30 + n * cellSize
            const simColor = (v: number) => {
              if (v >= 0.8) return '#52c41a'
              if (v >= 0.6) return '#73d13d'
              if (v >= 0.4) return '#faad14'
              if (v >= 0.2) return '#fa8c16'
              return '#ff4d4f'
            }
            return (
              <div key={wfi} style={{ marginBottom: wfi < similarityMatrix.workflows.length - 1 ? 16 : 0 }}>
                <Text strong style={{ fontSize: 12 }}>{wf.workflow_name}</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{wf.run_count} 次运行</Text>
                <div style={{ overflowX: 'auto', marginTop: 4 }}>
                  <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
                    {/* Column labels */}
                    {wf.run_ids.map((_, ci) => (
                      <text key={`cl-${ci}`} x={40 + ci * cellSize + cellSize / 2} y={10} fontSize={7} fill="#8c8c8c" textAnchor="middle">#{wf.run_ids[ci]}</text>
                    ))}
                    {/* Row labels + cells */}
                    {wf.matrix.map((row, ri) => (
                      <g key={`row-${ri}`}>
                        <text x={36} y={30 + ri * cellSize + cellSize / 2 + 3} fontSize={7} fill="#8c8c8c" textAnchor="end">#{wf.run_ids[ri]}</text>
                        {row.map((v, ci) => (
                          <Tooltip key={`c-${ri}-${ci}`} title={`#${wf.run_ids[ri]} ↔ #${wf.run_ids[ci]}: ${(v * 100).toFixed(0)}%`}>
                            <rect x={40 + ci * cellSize} y={30 + ri * cellSize} width={cellSize - 1} height={cellSize - 1} rx={2} fill={ri === ci ? '#e6f7ff' : simColor(v)} />
                          </Tooltip>
                        ))}
                      </g>
                    ))}
                  </svg>
                </div>
                {/* Most / least similar */}
                <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 10 }}>
                  {wf.most_similar.length > 0 && (
                    <div>
                      <Text type="secondary">最相似: </Text>
                      {wf.most_similar.map((p, pi) => (
                        <Tag key={pi} color="green" style={{ fontSize: 9, margin: '0 2px' }}>#{p.run_a}↔#{p.run_b} {(p.similarity * 100).toFixed(0)}%</Tag>
                      ))}
                    </div>
                  )}
                  {wf.least_similar.length > 0 && (
                    <div>
                      <Text type="secondary">最不相似: </Text>
                      {wf.least_similar.map((p, pi) => (
                        <Tag key={pi} color="red" style={{ fontSize: 9, margin: '0 2px' }}>#{p.run_a}↔#{p.run_b} {(p.similarity * 100).toFixed(0)}%</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </Card>
      )}

      {/* Step Duration Histogram (detailed) */}
      {stepDurationHist && stepDurationHist.items.length > 0 && (
        <Card
          title={<Space><BarChartOutlined /> 步骤耗时分布直方图</Space>}
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>样本数: {stepDurationHist.items.reduce((sum, item) => sum + item.sample_size, 0)}</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stepDurationHist.items.slice(0, 5).map((s, si) => {
              const binEntries = Object.entries(s.bins)
              const maxCount = Math.max(1, ...binEntries.map(([, count]) => count))
              const barW = 32
              const barGap = 4
              const svgH = 60
              return (
                <div key={si} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{s.step_key}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>样本: {s.sample_size}, 中位数: {s.median_seconds}s</Text>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <svg width={binEntries.length * (barW + barGap)} height={svgH} style={{ display: 'block' }}>
                      {binEntries.map(([range, count], bi) => {
                        const h = maxCount > 0 ? (count / maxCount) * (svgH - 16) : 0
                        return (
                          <g key={bi}>
                            <rect x={bi * (barW + barGap)} y={svgH - 12 - h} width={barW} height={Math.max(h, 1)} fill="#1890ff" rx={2} />
                            <text x={bi * (barW + barGap) + barW / 2} y={svgH - 2} fontSize={7} fill="#8c8c8c" textAnchor="middle">{range}</text>
                            {count > 0 && (
                              <text x={bi * (barW + barGap) + barW / 2} y={svgH - 14 - h} fontSize={7} fill="#595959" textAnchor="middle">{count}</text>
                            )}
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Step Bottleneck Timeline */}
      {stepBottleneckTl && stepBottleneckTl.steps.length > 0 && (
        <Card
          title={<Space><LineChartOutlined /> 步骤瓶颈时序</Space>}
          size="small"
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {stepBottleneckTl.days} 天 · 日均耗时趋势</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stepBottleneckTl.steps.map((s, si) => {
              const nonzero = s.series.filter(v => v > 0)
              const maxV = Math.max(1, ...nonzero)
              const w = 300
              const h = 30
              const pts = s.series.map((v, i) => `${(i / Math.max(1, s.series.length - 1)) * w},${h - (v / maxV) * (h - 2)}`).join(' ')
              const changeColor = s.change_pct > 20 ? '#ff4d4f' : s.change_pct < -20 ? '#52c41a' : '#1890ff'
              return (
                <div key={si} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <Text strong style={{ fontSize: 12 }}>{s.step_key}</Text>
                    <Space size={4}>
                      <Tag style={{ fontSize: 10 }}>均 {s.avg_duration}s</Tag>
                      <Tag color={s.change_pct > 20 ? 'red' : s.change_pct < -20 ? 'green' : 'blue'} style={{ fontSize: 10 }}>{s.change_pct > 0 ? '+' : ''}{s.change_pct}%</Tag>
                    </Space>
                  </div>
                  <svg width={w} height={h} style={{ display: 'block' }}>
                    {nonzero.length > 1 && <polyline points={pts} fill="none" stroke={changeColor} strokeWidth={1.5} />}
                  </svg>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, justifyContent: 'center' }}>
            <span style={{ fontSize: 10, color: '#52c41a' }}>— 改善(&lt;-20%)</span>
            <span style={{ fontSize: 10, color: '#1890ff' }}>— 稳定</span>
            <span style={{ fontSize: 10, color: '#ff4d4f' }}>— 恶化(&gt;+20%)</span>
          </div>
        </Card>
      )}

      {/* Workflow Structural Complexity */}
      {structuralComplexity && structuralComplexity.total_workflows > 0 && (
        <Card
          title={<Space><ApartmentOutlined /> 结构复杂度</Space>}
          size="small"
          style={{ marginBottom: 24 }}
          extra={<Text type="secondary" style={{ fontSize: 12 }}>{structuralComplexity.total_workflows} 个工作流 · 均步数 {structuralComplexity.avg_steps} · 均深度 {structuralComplexity.avg_depth}</Text>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {structuralComplexity.workflows.map((w, wi) => {
              const maxDepthAll = Math.max(1, ...structuralComplexity.workflows.map(x => x.max_depth))
              return (
                <div key={wi} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 12 }}>{w.workflow_name} <Tag style={{ fontSize: 9 }}>v{w.version}</Tag></Text>
                    <Space size={4}>
                      <Tag color={w.max_depth >= 5 ? 'red' : w.max_depth >= 3 ? 'orange' : 'green'} style={{ fontSize: 10 }}>深度 {w.max_depth}</Tag>
                      <Tag style={{ fontSize: 10 }}>{w.step_count} 步</Tag>
                      <Tag style={{ fontSize: 10 }}>{w.total_edges} 边</Tag>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(w.max_depth / maxDepthAll) * 100}%`, height: '100%', background: w.max_depth >= 5 ? '#ff4d4f' : w.max_depth >= 3 ? '#faad14' : '#52c41a' }} />
                    </div>
                    <Space size={4} style={{ fontSize: 10 }}>
                      <Tag style={{ fontSize: 9 }}>根 {w.root_count}</Tag>
                      <Tag style={{ fontSize: 9 }}>叶 {w.leaf_count}</Tag>
                      <Tag style={{ fontSize: 9 }}>扇入 {w.avg_fan_in}</Tag>
                    </Space>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </>
  )
}

export default WorkflowAnalyticsCards
