/**
 * Dashboard「Agent 分析总览」面板（从 AgentAnalyticsSection.tsx 原样抽出）。
 */

import MiniTrendChart from '../../components/MiniTrendChart'
import { FundOutlined } from '@ant-design/icons'
import { Card, Empty, Select, Space, Tag, Tooltip, Typography } from 'antd'

const { Text } = Typography

interface Props {
  agentHealth: any
  agentHealthTrend: any
  healthTrendAgentId: any
  setHealthTrendAgentId: any
  healthTrendLoading: any
  productivityTrend: any
  reloadHealthTrend: any
}

export default function AgentAnalyticsOverviewCard(props: Props) {
  const { agentHealth,
    agentHealthTrend,
    healthTrendAgentId, setHealthTrendAgentId,
    healthTrendLoading,
    productivityTrend,
    reloadHealthTrend } = props

  return (
      <Card
        title={<Space><FundOutlined /> Agent 综合健康度</Space>}
        style={{ marginBottom: 24 }}
      >
        {agentHealth && agentHealth.items.length > 0 ? (() => {
          const items = agentHealth.items
          const healthColor = (s: number) => s >= 80 ? '#52c41a' : s >= 60 ? '#faad14' : s >= 40 ? '#fa8c16' : '#ff4d4f'
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>近 {agentHealth.days} 天（声誉 0.4 + 完成 0.3 + 冲突 0.15 + 违规 0.15，按健康分降序）</Text>
              {items.map((a) => (
                <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
                  <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name}</span>
                  <div style={{ flex: '0 1 120px', background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: `${a.health_score}%`, height: '100%', background: healthColor(a.health_score), borderRadius: 3 }} />
                  </div>
                  <span style={{ color: healthColor(a.health_score), minWidth: 44, textAlign: 'right', fontWeight: 500 }}>{a.health_score}</span>
                  <Tooltip title={`声誉 ${a.sub_scores.reputation} · 完成 ${a.sub_scores.completion} · 冲突 ${a.sub_scores.conflict} · 违规 ${a.sub_scores.violation}`}>
                    <Tag style={{ fontSize: 10, cursor: 'default' }}>声誉 {a.sub_scores.reputation}</Tag>
                  </Tooltip>
                  <Tag color={a.sub_scores.completion >= 80 ? 'green' : a.sub_scores.completion >= 50 ? 'orange' : 'red'} style={{ fontSize: 10 }}>完成 {a.completion_rate != null ? `${a.completion_rate}%` : '—'}</Tag>
                  <Tag color={a.conflicts > 0 ? 'orange' : 'default'} style={{ fontSize: 10 }}>冲突 {a.conflicts}</Tag>
                  <Tag color={a.sandbox_violations > 0 ? 'red' : 'default'} style={{ fontSize: 10 }}>违规 {a.sandbox_violations}</Tag>
                </div>
              ))}
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>健康分色阶 ≥80 绿 / ≥60 橙 / ≥40 浅橙 / &lt;40 红</Text>
              {(() => {
                // Top3 Agent 四子分数雷达对比
                const top = items.slice(0, 3)
                if (top.length === 0) return null
                const axes = [
                  { key: 'reputation', label: '声誉' },
                  { key: 'completion', label: '完成' },
                  { key: 'conflict', label: '冲突' },
                  { key: 'violation', label: '违规' },
                ] as const
                const cx = 130, cy = 110, R = 80
                const ringColors = ['#52c41a', '#1677ff', '#722ed1']
                const angleFor = (i: number) => -Math.PI / 2 + (i / axes.length) * Math.PI * 2
                // 4 轴雷达：每个轴均匀分布在圆周上
                const pointFor = (vals: Record<string, number>, i: number) => {
                  const v = vals[axes[i].key] ?? 0
                  const ratio = Math.max(0, Math.min(1, v / 100))
                  return { x: cx + R * ratio * Math.cos(angleFor(i)), y: cy + R * ratio * Math.sin(angleFor(i)) }
                }
                const polyFor = (vals: Record<string, number>) =>
                  axes.map((_, i) => { const p = pointFor(vals, i); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')
                return (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Top{top.length} Agent 子分数雷达对比:</Text>
                    <svg width={260} height={220} style={{ display: 'block', marginTop: 4 }}>
                      {/* 同心圆网格 */}
                      {[0.25, 0.5, 0.75, 1].map((g) => (
                        <polygon
                          key={g}
                          points={axes.map((_, i) => {
                            const x = cx + R * g * Math.cos(angleFor(i))
                            const y = cy + R * g * Math.sin(angleFor(i))
                            return `${x.toFixed(1)},${y.toFixed(1)}`
                          }).join(' ')}
                          fill="none"
                          stroke="#f0f0f0"
                          strokeWidth={1}
                        />
                      ))}
                      {/* 轴线 + 标签 */}
                      {axes.map((ax, i) => {
                        const x = cx + R * Math.cos(angleFor(i))
                        const y = cy + R * Math.sin(angleFor(i))
                        const lx = cx + (R + 14) * Math.cos(angleFor(i))
                        const ly = cy + (R + 14) * Math.sin(angleFor(i))
                        return (
                          <g key={ax.key}>
                            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#e8e8e8" strokeWidth={1} />
                            <text x={lx} y={ly} fontSize={10} fill="#8c8c8c" textAnchor="middle" dominantBaseline="middle">{ax.label}</text>
                          </g>
                        )
                      })}
                      {/* 每个 Agent 的雷达多边形 */}
                      {top.map((a, idx) => (
                        <g key={a.agent_id}>
                          <polygon
                            points={polyFor(a.sub_scores as unknown as Record<string, number>)}
                            fill={ringColors[idx % ringColors.length]}
                            fillOpacity={0.12}
                            stroke={ringColors[idx % ringColors.length]}
                            strokeWidth={1.5}
                          />
                          <title>{`${a.name}: 声誉${a.sub_scores.reputation} 完成${a.sub_scores.completion} 冲突${a.sub_scores.conflict} 违规${a.sub_scores.violation}`}</title>
                        </g>
                      ))}
                    </svg>
                    <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                      {top.map((a, idx) => (
                        <Text key={a.agent_id} type="secondary" style={{ fontSize: 10 }}>
                          <span style={{ color: ringColors[idx % ringColors.length] }}>●</span> {a.name} ({a.health_score})
                        </Text>
                      ))}
                    </div>
                  </div>
                )
              })()}
              {(() => {
                // Agent × 维度子分数热力（声誉/完成/冲突/违规）
                const top = items.slice(0, 12)
                if (top.length === 0) return null
                const dims = [
                  { key: 'reputation', label: '声誉' },
                  { key: 'completion', label: '完成' },
                  { key: 'conflict', label: '冲突' },
                  { key: 'violation', label: '违规' },
                ] as const
                const cellColor = (v: number) => {
                  if (v >= 80) return '#52c41a'
                  if (v >= 60) return '#a0d911'
                  if (v >= 40) return '#faad14'
                  if (v >= 20) return '#fa8c16'
                  return '#ff4d4f'
                }
                return (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Agent × 维度子分数热力（top{top.length}）:</Text>
                    <div style={{ marginTop: 4, overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', textAlign: 'left', position: 'sticky', left: 0, background: '#fff' }}>Agent</th>
                            {dims.map((d) => (
                              <th key={d.key} style={{ padding: '2px 8px', borderBottom: '1px solid #f0f0f0', color: '#8c8c8c' }}>{d.label}</th>
                            ))}
                            <th style={{ padding: '2px 8px', borderBottom: '1px solid #f0f0f0', color: '#8c8c8c' }}>综合</th>
                          </tr>
                        </thead>
                        <tbody>
                          {top.map((a) => (
                            <tr key={a.agent_id}>
                              <td style={{ padding: '2px 6px', color: '#595959', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#fff' }} title={a.name}>{a.name.length > 10 ? a.name.slice(0, 9) + '…' : a.name}</td>
                              {dims.map((d) => {
                                const v = a.sub_scores[d.key] ?? 0
                                return (
                                  <td key={d.key} style={{ padding: 0 }}>
                                    <Tooltip title={`${a.name} ${d.label}: ${v}`}>
                                      <div style={{ width: 46, height: 22, background: cellColor(v), color: v >= 50 ? '#fff' : '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 1, fontSize: 10 }}>
                                        {v}
                                      </div>
                                    </Tooltip>
                                  </td>
                                )
                              })}
                              <td style={{ padding: 0 }}>
                                <div style={{ width: 46, height: 22, background: cellColor(a.health_score), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 1, fontSize: 10, fontWeight: 'bold' }}>
                                  {a.health_score}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>色阶:</Text>
                      {[
                        { c: '#ff4d4f', l: '<20' },
                        { c: '#fa8c16', l: '≥20' },
                        { c: '#faad14', l: '≥40' },
                        { c: '#a0d911', l: '≥60' },
                        { c: '#52c41a', l: '≥80' },
                      ].map(({ c, l }) => (
                        <Text key={l} type="secondary" style={{ fontSize: 10 }}>
                          <span style={{ display: 'inline-block', width: 12, height: 10, background: c, borderRadius: 2, verticalAlign: 'middle' }} /> {l}
                        </Text>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })() : (
          <Empty description="暂无 Agent" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
        {/* 健康度趋势 Agent 维度筛选 */}
        {agentHealth && agentHealth.items.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>趋势下钻:</Text>
            <Select
              size="small"
              style={{ width: 200 }}
              allowClear
              placeholder="全舰队"
              value={healthTrendAgentId}
              onChange={(v) => { setHealthTrendAgentId(v); reloadHealthTrend(v) }}
              options={agentHealth.items.map((a) => ({ value: a.agent_id, label: `${a.name} #${a.agent_id}` }))}
              loading={healthTrendLoading}
            />
            {agentHealthTrend?.agent_name && <Tag color="purple" style={{ fontSize: 10 }}>{agentHealthTrend.agent_name}</Tag>}
          </div>
        )}
        {agentHealthTrend && agentHealthTrend.trend.length > 0 && (() => {
          const valid = agentHealthTrend.trend.filter((b) => b.avg_reputation != null)
          // 事件标记：仅含有冲突或违规的天
          const eventDays = agentHealthTrend.trend.filter((b) => (b.conflicts || 0) > 0 || (b.sandbox_violations || 0) > 0)
          const maxEvents = Math.max(1, ...agentHealthTrend.trend.map((b) => (b.conflicts || 0) + (b.sandbox_violations || 0)))
          const trendW = 520
          const daySpan = agentHealthTrend.trend.length
          return (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {agentHealthTrend.days} 天声誉趋势（累计正向 {agentHealthTrend.total_positive} / 负向 {agentHealthTrend.total_negative} / 冲突 {agentHealthTrend.total_conflicts || 0} / 违规 {agentHealthTrend.total_violations || 0}）
              </Text>
              {valid.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <MiniTrendChart
                    series={[{ key: 'avg_reputation', label: '平均声誉', color: '#722ed1', values: valid.map((b) => b.avg_reputation as number) }]}
                    labels={valid.map((b) => b.date)}
                    height={84}
                  />
                </div>
              )}
              {/* 按 kind 分组趋势线 */}
              {(() => {
                const kindAvgs: Record<string, number[]> = {}
                const kindColors: Record<string, string> = { coordinator: '#722ed1', autonomous: '#13c2c2', assistant: '#1890ff', external: '#fa8c16' }
                const allDates = agentHealthTrend!.trend.map((b) => b.date)
                agentHealthTrend!.trend.forEach((b) => {
                  if (!b.by_kind_avg) return
                  Object.entries(b.by_kind_avg).forEach(([k, v]) => {
                    if (!kindAvgs[k]) kindAvgs[k] = new Array(allDates.length).fill(null as unknown as number)
                    const idx = allDates.indexOf(b.date)
                    if (idx >= 0) kindAvgs[k][idx] = v as number
                  })
                })
                const kinds = Object.keys(kindAvgs).filter((k) => kindAvgs[k].some((v) => v != null))
                if (kinds.length < 2) return null
                const kW = 260, kH = 70, kPadL = 24, kPadR = 4, kPadT = 4, kPadB = 14
                const kPlotW = kW - kPadL - kPadR
                const kPlotH = kH - kPadT - kPadB
                const kXStep = allDates.length > 1 ? kPlotW / (allDates.length - 1) : 0
                return (
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>按 Kind 分组趋势</Text>
                    <svg width={kW} height={kH} style={{ display: 'block' }}>
                      {[0, 50, 100].map((v) => {
                        const y = kPadT + kPlotH - (v / 100) * kPlotH
                        return <line key={v} x1={kPadL} y1={y} x2={kW - kPadR} y2={y} stroke="#f0f0f0" strokeWidth={0.5} />
                      })}
                      {kinds.map((k) => {
                        const pts = kindAvgs[k].map((v, i) => {
                          if (v == null) return ''
                          const x = kPadL + i * kXStep
                          const y = kPadT + kPlotH - (v / 100) * kPlotH
                          return `${x.toFixed(1)},${y.toFixed(1)}`
                        }).filter(Boolean).join(' ')
                        if (!pts) return null
                        return <polyline key={k} points={pts} fill="none" stroke={kindColors[k] || '#8c8c8c'} strokeWidth={1.5} />
                      })}
                    </svg>
                    <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                      {kinds.map((k) => (
                        <Text key={k} type="secondary" style={{ fontSize: 10 }}>
                          <span style={{ color: kindColors[k] || '#8c8c8c' }}>━</span> {k}
                        </Text>
                      ))}
                    </div>
                  </div>
                )
              })()}
              {eventDays.length > 0 && daySpan > 1 && (
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>事件标记（与上方趋势同 x 轴）</Text>
                  <svg width={trendW} height={28} style={{ display: 'block' }}>
                    {agentHealthTrend.trend.map((b, i) => {
                      const x = (i / (daySpan - 1)) * (trendW - 8) + 4
                      const c = b.conflicts || 0
                      const v = b.sandbox_violations || 0
                      const r = 3 + 4 * ((c + v) / maxEvents)
                      return (
                        <g key={b.date}>
                          {c > 0 && <circle cx={x} cy={10} r={r} fill="#ff4d4f" opacity={0.85} />}
                          {v > 0 && <circle cx={x} cy={22} r={r} fill="#fa8c16" opacity={0.85} />}
                          <title>{b.date}: 冲突 {c} / 违规 {v}</title>
                        </g>
                      )
                    })}
                  </svg>
                  <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#ff4d4f' }}>●</span> 冲突</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#fa8c16' }}>●</span> 沙盒违规</Text>
                  </div>
                </div>
              )}
              {/* 异常检测标记 */}
              {(() => {
                if (valid.length < 5) return null
                const vals = valid.map((b) => b.avg_reputation as number)
                const mean = vals.reduce((s, v) => s + v, 0) / vals.length
                const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length)
                // 异常点：值 < 均值-2σ 或连续3天下降的起始
                const anomalies: { idx: number; type: string; val: number }[] = []
                vals.forEach((v, i) => {
                  if (std > 0 && v < mean - 2 * std) anomalies.push({ idx: i, type: 'spike', val: v })
                  if (i >= 2 && vals[i] < vals[i - 1] && vals[i - 1] < vals[i - 2]) {
                    if (!anomalies.find(a => a.idx === i - 2)) anomalies.push({ idx: i - 2, type: 'decline', val: vals[i - 2] })
                  }
                })
                if (anomalies.length === 0) return null
                const aW = 520, aH = 36, aPadL = 4, aPadR = 4
                const aXStep = (aW - aPadL - aPadR) / Math.max(1, valid.length - 1)
                const minV = Math.min(...vals)
                const maxV = Math.max(...vals)
                const range = maxV - minV || 1
                return (
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>异常检测（均值={mean.toFixed(1)} σ={std.toFixed(1)}）</Text>
                    <svg width={aW} height={aH} style={{ display: 'block' }}>
                      {/* 均值线 */}
                      {(() => {
                        const y = 4 + (1 - (mean - minV) / range) * 24
                        return <line x1={aPadL} y1={y} x2={aW - aPadR} y2={y} stroke="#d9d9d9" strokeDasharray="3 2" strokeWidth={0.5} />
                      })()}
                      {/* -2σ 阈值线 */}
                      {(() => {
                        const thresh = mean - 2 * std
                        if (thresh < minV) return null
                        const y = 4 + (1 - (thresh - minV) / range) * 24
                        return <line x1={aPadL} y1={y} x2={aW - aPadR} y2={y} stroke="#ff4d4f" strokeDasharray="4 3" strokeWidth={0.5} />
                      })()}
                      {/* 异常点 */}
                      {anomalies.map((a, ai) => {
                        const x = aPadL + a.idx * aXStep
                        const y = 4 + (1 - (a.val - minV) / range) * 24
                        const isDecline = a.type === 'decline'
                        return (
                          <g key={ai}>
                            <circle cx={x} cy={y} r={5} fill={isDecline ? '#fa8c16' : '#ff4d4f'} fillOpacity={0.25} stroke={isDecline ? '#fa8c16' : '#ff4d4f'} strokeWidth={1} />
                            <circle cx={x} cy={y} r={2} fill={isDecline ? '#fa8c16' : '#ff4d4f'} />
                            <title>{valid[a.idx].date}: {a.type === 'spike' ? '突降异常' : '连续下降'} 声誉={a.val.toFixed(1)}</title>
                          </g>
                        )
                      })}
                    </svg>
                    <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                      <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>◉</span> 突降(&lt;μ-2σ)</Text>
                      <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#fa8c16' }}>◉</span> 连续下降(3天)</Text>
                      <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#d9d9d9' }}>---</span> 均值</Text>
                    </div>
                  </div>
                )
              })()}
              {(() => {
                // 双轴对比：声誉（紫，左轴）× 产出完成数（绿，右轴），按 date 对齐
                if (!productivityTrend || productivityTrend.trend.length < 2 || daySpan < 2) return null
                const prodByDate: Record<string, number> = {}
                productivityTrend.trend.forEach((b) => { prodByDate[b.date] = (prodByDate[b.date] || 0) + b.done })
                const maxRep = 100
                const maxDone = Math.max(1, ...Object.values(prodByDate))
                const W = trendW, H = 70, padL = 4, padR = 4, padT = 6, padB = 14
                const xStep = (W - padL - padR) / Math.max(1, daySpan - 1)
                const repPts: string[] = []
                const donePts: string[] = []
                agentHealthTrend.trend.forEach((b, i) => {
                  const x = padL + i * xStep
                  if (b.avg_reputation != null) {
                    const y = H - padB - (b.avg_reputation / maxRep) * (H - padT - padB)
                    repPts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
                  }
                  const d = prodByDate[b.date] || 0
                  const dy = H - padB - (d / maxDone) * (H - padT - padB)
                  donePts.push(`${x.toFixed(1)},${dy.toFixed(1)}`)
                })
                if (repPts.length < 2 && donePts.length < 2) return null
                return (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>声誉 × 产出完成数 双轴对比:</Text>
                    <svg width={W} height={H} style={{ display: 'block' }}>
                      {repPts.length >= 2 && <polyline points={repPts.join(' ')} fill="none" stroke="#722ed1" strokeWidth={1.6} opacity={0.85} />}
                      {donePts.length >= 2 && <polyline points={donePts.join(' ')} fill="none" stroke="#52c41a" strokeWidth={1.6} strokeDasharray="4 3" opacity={0.85} />}
                    </svg>
                    <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#722ed1' }}>━</span> 平均声誉(0-100)</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#52c41a' }}>┄</span> 完成数(max {maxDone})</Text>
                      {(() => {
                        // Pearson 相关系数：声誉 vs 产出完成数
                        const pairs: [number, number][] = []
                        agentHealthTrend.trend.forEach((b) => {
                          if (b.avg_reputation == null) return
                          const d = prodByDate[b.date] || 0
                          pairs.push([b.avg_reputation, d])
                        })
                        if (pairs.length < 3) return null
                        const n = pairs.length
                        const sumX = pairs.reduce((s, p) => s + p[0], 0)
                        const sumY = pairs.reduce((s, p) => s + p[1], 0)
                        const sumXY = pairs.reduce((s, p) => s + p[0] * p[1], 0)
                        const sumX2 = pairs.reduce((s, p) => s + p[0] * p[0], 0)
                        const sumY2 = pairs.reduce((s, p) => s + p[1] * p[1], 0)
                        const denom = Math.sqrt(Math.max(0, (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)))
                        const r = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
                        const rLabel = Math.abs(r) >= 0.7 ? '强' : Math.abs(r) >= 0.4 ? '中' : '弱'
                        const rColor = Math.abs(r) >= 0.7 ? '#722ed1' : Math.abs(r) >= 0.4 ? '#1890ff' : '#8c8c8c'
                        return (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            相关性 r=<b style={{ color: rColor }}>{r.toFixed(2)}</b>({rLabel}, n={n})
                          </Text>
                        )
                      })()}
                    </div>
                  </div>
                )
              })()}
              {(() => {
                // 按 kind 分层声誉曲线（各 kind 每日平均声誉）
                const kindOverall = agentHealthTrend.by_kind_overall || {}
                const kinds = Object.keys(kindOverall).slice(0, 6)
                if (kinds.length === 0) return null
                const trend = agentHealthTrend.trend
                const n = trend.length
                if (n < 2) return null
                const W = 520, H = 70, padL = 4, padR = 4, padT = 6, padB = 14
                const xStep = (W - padL - padR) / Math.max(1, n - 1)
                const palette = ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#fa8c16', '#8c8c8c']
                const kindColor: Record<string, string> = { assistant: '#1677ff', worker: '#52c41a', orchestrator: '#722ed1', reviewer: '#13c2c2', planner: '#fa8c16', observer: '#8c8c8c' }
                const lineFor = (kind: string) => {
                  const pts: string[] = []
                  trend.forEach((b, i) => {
                    const v = b.by_kind_avg?.[kind]
                    if (v == null) return
                    const x = padL + i * xStep
                    const y = H - padB - (v / 100) * (H - padT - padB)
                    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
                  })
                  return pts.join(' ')
                }
                return (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按 kind 分层声誉趋势:</Text>
                    <svg width={W} height={H} style={{ display: 'block' }}>
                      {kinds.map((k, idx) => {
                        const pts = lineFor(k)
                        if (pts.split(' ').length < 2) return null
                        const c = kindColor[k] || palette[idx % palette.length]
                        return <polyline key={k} points={pts} fill="none" stroke={c} strokeWidth={1.6} opacity={0.85} />
                      })}
                    </svg>
                    <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                      {kinds.map((k, idx) => {
                        const c = kindColor[k] || palette[idx % palette.length]
                        return (
                          <Text key={k} type="secondary" style={{ fontSize: 10 }}>
                            <span style={{ color: c }}>●</span> {k} ({kindOverall[k]})
                          </Text>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )
        })()}
      </Card>
  )
}
