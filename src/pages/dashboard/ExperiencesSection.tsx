/**
 * 经验库分析区块
 *
 * 展示经验库统计、低置信度经验、衰减趋势等分析卡片。
 */
import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Empty, Tag, Tooltip, Space, Typography, List } from 'antd'
import {
  BookOutlined,
  WarningOutlined,
  DotChartOutlined,
  BarChartOutlined,
  LineChartOutlined,
  FundOutlined,
  HeatMapOutlined,
} from '@ant-design/icons'
import {
  agentsApi,
  type ExperiencesStats,
  type ExperiencesLowConfidence,
  type ExperiencesScatter,
  type ExperiencesReuseTrend,
  type ExperiencesConfidenceDecayForecast,
  type ExperiencesDecayByDomain,
  type ExperiencesDecayByTaskType,
  type ExperiencesConfidenceDistribution,
  type ExperiencesSourceDistribution,
  type ExperiencesPropagationChain,
  type ExperiencesSkillCoverageRadar,
} from '../../api/agents'
import LowConfidenceExperiencesCard from './LowConfidenceExperiencesCard'
import ExperiencesConfidenceDistributionCard from './ExperiencesConfidenceDistributionCard'
import ExperiencesSourceDistributionCard from './ExperiencesSourceDistributionCard'
import ExperiencesPropagationChainCard from './ExperiencesPropagationChainCard'
import SkillCoverageRadarCard from './SkillCoverageRadarCard'

const { Text } = Typography

const ExperiencesSection = () => {
  const [experiencesStats, setExperiencesStats] = useState<ExperiencesStats | null>(null)
  const [experiencesLowConfidence, setExperiencesLowConfidence] = useState<ExperiencesLowConfidence | null>(null)
  const [experiencesScatter, setExperiencesScatter] = useState<ExperiencesScatter | null>(null)
  const [experiencesReuseTrend, setExperiencesReuseTrend] = useState<ExperiencesReuseTrend | null>(null)
  const [experiencesDecayForecast, setExperiencesDecayForecast] = useState<ExperiencesConfidenceDecayForecast | null>(null)
  const [experiencesDecayByDomain, setExperiencesDecayByDomain] = useState<ExperiencesDecayByDomain | null>(null)
  const [experiencesDecayByTaskType, setExperiencesDecayByTaskType] = useState<ExperiencesDecayByTaskType | null>(null)
  const [experiencesConfidenceDistribution, setExperiencesConfidenceDistribution] = useState<ExperiencesConfidenceDistribution | null>(null)
  const [experiencesSourceDistribution, setExperiencesSourceDistribution] = useState<ExperiencesSourceDistribution | null>(null)
  const [experiencesPropagationChain, setExperiencesPropagationChain] = useState<ExperiencesPropagationChain | null>(null)
  const [skillCoverageRadar, setSkillCoverageRadar] = useState<ExperiencesSkillCoverageRadar | null>(null)

  useEffect(() => {
    agentsApi.getExperiencesStats().then(setExperiencesStats).catch(() => {})
    agentsApi.getExperiencesLowConfidence().then(setExperiencesLowConfidence).catch(() => {})
    agentsApi.getExperiencesScatter(200).then(setExperiencesScatter).catch(() => {})
    agentsApi.getExperiencesReuseTrend(30).then(setExperiencesReuseTrend).catch(() => {})
    agentsApi.getExperiencesConfidenceDecayForecast(30).then(setExperiencesDecayForecast).catch(() => {})
    agentsApi.getExperiencesDecayByDomain(15).then(setExperiencesDecayByDomain).catch(() => {})
    agentsApi.getExperiencesDecayByTaskType(15).then(setExperiencesDecayByTaskType).catch(() => {})
    agentsApi.getExperiencesConfidenceDistribution().then(setExperiencesConfidenceDistribution).catch(() => {})
    agentsApi.getExperiencesSourceDistribution().then(setExperiencesSourceDistribution).catch(() => {})
    agentsApi.getExperiencesPropagationChain(10).then(setExperiencesPropagationChain).catch(() => {})
    agentsApi.getExperiencesSkillCoverageRadar(6, 8).then(setSkillCoverageRadar).catch(() => {})
  }, [])

  return (
    <>
      <Card
        title={<Space><BookOutlined /> 经验库统计</Space>}
        style={{ marginBottom: 24 }}
      >
        {experiencesStats ? (
          experiencesStats.total > 0 ? (() => {
            const domains = Object.entries(experiencesStats.by_domain)
            const tasks = Object.entries(experiencesStats.by_task_type)
            const types = Object.entries(experiencesStats.by_experience_type)
            const maxDomain = Math.max(1, ...domains.map(([, v]) => v))
            const avgConf = experiencesStats.avg_confidence
            const confColor = avgConf == null ? undefined : avgConf >= 0.8 ? '#52c41a' : avgConf >= 0.5 ? '#faad14' : '#ff4d4f'
            const confBuckets = Object.entries(experiencesStats.by_confidence_bucket || {})
            const maxBucket = Math.max(1, ...confBuckets.map(([, v]) => v))
            const bucketColor = (k: string) => k === '0.85-1.0' ? '#52c41a' : k === '0.7-0.85' ? '#73d13d' : k === '0.5-0.7' ? '#faad14' : k === '0.3-0.5' ? '#fa8c16' : '#ff4d4f'
            const topReused = experiencesStats.top_reused || []
            const maxReuse = Math.max(1, ...topReused.map((t) => t.times_reused))
            const matrix = experiencesStats.by_domain_tasktype || {}
            const matrixDomains = Object.entries(matrix).sort((a, b) => Object.values(b[1]).reduce((s: number, n: any) => s + n, 0) - Object.values(a[1]).reduce((s: number, n: any) => s + n, 0)).slice(0, 6).map(([d]) => d)
            const allTaskTypes = Array.from(new Set(matrixDomains.flatMap((d) => Object.keys(matrix[d] || {})))).slice(0, 8)
            const matrixMax = Math.max(1, ...matrixDomains.flatMap((d) => Object.values(matrix[d] || {})))
            const heatColor = (v: number) => {
              const r = v / matrixMax
              if (r >= 0.75) return '#722ed1'
              if (r >= 0.5) return '#9254de'
              if (r >= 0.25) return '#b37feb'
              if (r > 0) return '#d3adf7'
              return '#f5f5f5'
            }
            return (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}><Statistic title="有效经验" value={experiencesStats.total} valueStyle={{ fontSize: 16 }} /></Col>
                  <Col span={6}><Statistic title="平均置信度" value={avgConf?.toFixed(2) ?? '-'} valueStyle={{ fontSize: 16, color: confColor }} /></Col>
                  <Col span={6}><Statistic title="域数" value={domains.length} valueStyle={{ fontSize: 16 }} /></Col>
                  <Col span={6}><Statistic title="任务类型数" value={tasks.length} valueStyle={{ fontSize: 16 }} /></Col>
                </Row>
                {/* 按域分布条形图 */}
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按域分布：</Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {domains.slice(0, 8).map(([d, c]) => (
                      <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 11, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d}>{d}</Text>
                        <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 14, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ width: `${(c / maxDomain) * 100}%`, height: '100%', background: '#1677ff', borderRadius: 3 }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: 10, minWidth: 40 }}>{c}</Text>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 按任务类型分布 */}
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按任务类型分布：</Text>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {tasks.slice(0, 10).map(([t, c]) => (
                      <Tooltip key={t} title={t}>
                        <Tag color="blue">{t.length > 12 ? t.slice(0, 11) + '…' : t}: {c}</Tag>
                      </Tooltip>
                    ))}
                  </div>
                </div>
                {/* 按经验类型分布 */}
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按经验类型分布：</Text>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {types.map(([t, c]) => (
                      <Tag key={t} color="purple">{t}: {c}</Tag>
                    ))}
                  </div>
                </div>
                {/* 置信度分布条形图 */}
                {confBuckets.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>置信度区间分布：</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {confBuckets.map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 11, width: 45 }}>{k}</Text>
                          <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: `${(v / maxBucket) * 100}%`, height: '100%', background: bucketColor(k), borderRadius: 3 }} />
                          </div>
                          <Text type="secondary" style={{ fontSize: 10 }}>{v}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Top 复用经验 */}
                {topReused.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Top 复用经验：</Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {topReused.slice(0, 5).map((t) => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Tag color="purple">#{t.id}</Tag>
                          <Text style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.key_learnings}>{t.key_learnings}</Text>
                          <div style={{ width: 80, background: '#f0f0f0', borderRadius: 3, height: 10, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ width: `${(t.times_reused / maxReuse) * 100}%`, height: '100%', background: '#13c2c2', borderRadius: 3 }} />
                          </div>
                          <Text type="secondary" style={{ fontSize: 10 }}>复用 {t.times_reused}</Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* 域×任务类型热力矩阵 */}
                {matrixDomains.length > 0 && allTaskTypes.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>域 × 任务类型热力矩阵：</Text>
                    <table style={{ borderCollapse: 'collapse', fontSize: 10, marginTop: 6 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>域</th>
                          {allTaskTypes.map((tt) => (
                            <th key={tt} style={{ padding: '2px 4px', borderBottom: '1px solid #f0f0f0', color: '#8c8c8c', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis' }} title={tt}>{tt.length > 6 ? tt.slice(0, 5) + '…' : tt}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrixDomains.map((d) => (
                          <tr key={d}>
                            <td style={{ padding: '2px 6px', color: '#595959', whiteSpace: 'nowrap' }}>{d.length > 10 ? d.slice(0, 9) + '…' : d}</td>
                            {allTaskTypes.map((tt) => {
                              const v = matrix[d]?.[tt] || 0
                              return (
                                <td key={tt} style={{ padding: 0 }}>
                                  <Tooltip title={`${d} / ${tt}: ${v}`}>
                                    <div style={{ width: 50, height: 18, background: heatColor(v), color: v >= matrixMax * 0.5 ? '#fff' : '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 1 }}>
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
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>密度:</Text>
                      {['#f5f5f5', '#d3adf7', '#b37feb', '#9254de', '#722ed1'].map((c, i) => (
                        <div key={i} style={{ width: 12, height: 8, background: c, borderRadius: 1 }} />
                      ))}
                      <Text type="secondary" style={{ fontSize: 9 }}>低 → 高</Text>
                    </div>
                  </div>
                )}
              </>
            )
          })() : <Empty description="暂无有效经验" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty description="加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Low Confidence Experiences */}
      <LowConfidenceExperiencesCard experiencesLowConfidence={experiencesLowConfidence} />

      {/* Confidence × Reuse Scatter */}
      <Card
        title={<Space><DotChartOutlined /> 经验置信度 × 复用次数 散点</Space>}
        style={{ marginBottom: 24 }}
      >
        {experiencesScatter && experiencesScatter.points.length > 0 ? (() => {
          const pts = experiencesScatter.points
          const maxReuses = Math.max(1, experiencesScatter.max_reuses)
          const W = 560, H = 220, padL = 36, padR = 12, padT = 12, padB = 28
          const xOf = (c: number) => padL + (c / 1) * (W - padL - padR)
          const yOf = (r: number) => H - padB - (r / maxReuses) * (H - padT - padB)
          const palette = ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#fa8c16', '#eb2f96', '#fa541c', '#08979c']
          const domainIdx: Record<string, number> = {}
          let di = 0
          const colorFor = (d: string) => {
            if (!(d in domainIdx)) { domainIdx[d] = di++; }
            return palette[domainIdx[d] % palette.length]
          }
          const cell: Record<string, { x: number; y: number; n: number; c: string; conf: number; reuse: number }> = {}
          pts.forEach((p) => {
            const c = p.confidence ?? 0
            const key = `${c.toFixed(2)}|${p.times_reused}`
            if (!cell[key]) cell[key] = { x: xOf(c), y: yOf(p.times_reused), n: 0, c: colorFor(p.domain), conf: c, reuse: p.times_reused }
            cell[key].n += 1
          })
          const cells = Object.values(cell)
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {pts.length} 条经验（X=置信度 0-1，Y=复用次数，点大小=同位置叠加数，颜色=域）
              </Text>
              <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
                {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                  <g key={g}>
                    <line x1={xOf(g)} y1={padT} x2={xOf(g)} y2={H - padB} stroke="#f0f0f0" strokeWidth={1} />
                    <text x={xOf(g)} y={H - padB + 14} fontSize={9} fill="#8c8c8c" textAnchor="middle">{g.toFixed(2)}</text>
                  </g>
                ))}
                <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#d9d9d9" strokeWidth={1} />
                <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#d9d9d9" strokeWidth={1} />
                <text x={6} y={H / 2} fontSize={9} fill="#8c8c8c" transform={`rotate(-90 6 ${H / 2})`} textAnchor="middle">复用次数</text>
                {cells.map((cell, i) => (
                  <circle key={i} cx={cell.x} cy={cell.y} r={Math.max(3, Math.min(10, cell.n + 2))} fill={cell.c} fillOpacity={0.6}>
                    <title>{`置信度=${cell.conf.toFixed(2)} 复用=${cell.reuse} 叠加=${cell.n}`}</title>
                  </circle>
                ))}
              </svg>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {Object.keys(domainIdx).slice(0, 6).map((d, i) => (
                  <Text key={d} type="secondary" style={{ fontSize: 10 }}><span style={{ color: palette[i] }}>●</span> {d}</Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无经验散点数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Confidence Box Plot by Domain */}
      <Card
        title={<Space><BarChartOutlined /> 经验置信度 按域箱线图</Space>}
        style={{ marginBottom: 24 }}
      >
        {experiencesScatter && experiencesScatter.points.length > 0 ? (() => {
          const byDomain: Record<string, number[]> = {}
          experiencesScatter.points.forEach((p) => {
            if (p.confidence == null) return
            const d = p.domain
            byDomain[d] = byDomain[d] || []
            byDomain[d].push(p.confidence)
          })
          const domains = Object.entries(byDomain)
            .map(([d, cs]) => ({ d, n: cs.length, sorted: cs.slice().sort((a, b) => a - b) }))
            .filter((x) => x.n >= 2)
            .sort((a, b) => b.n - a.n)
            .slice(0, 8)
          if (domains.length === 0) return <Empty description="样本不足" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          const quint = (sorted: number[]) => {
            const n = sorted.length
            const q = (p: number) => {
              const idx = (p / 100) * (n - 1)
              const lo = Math.floor(idx), hi = Math.ceil(idx)
              return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
            }
            return { min: sorted[0], q1: q(25), median: q(50), q3: q(75), max: sorted[n - 1] }
          }
          const W = 560, H = 30 * domains.length + 30, padL = 110, padR = 16, padT = 14
          const xOf = (v: number) => padL + v * (W - padL - padR)
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                按域的置信度分布（min / Q1 / 中位 / Q3 / max，仅显示样本≥2 的 top8 域）
              </Text>
              <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
                {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                  <g key={g}>
                    <line x1={xOf(g)} y1={padT - 6} x2={xOf(g)} y2={H - 4} stroke="#f0f0f0" strokeWidth={1} />
                    <text x={xOf(g)} y={H - 2} fontSize={8} fill="#8c8c8c" textAnchor="middle">{g.toFixed(2)}</text>
                  </g>
                ))}
                {domains.map((dom, i) => {
                  const q = quint(dom.sorted)
                  const y = padT + i * 30 + 12
                  const xMin = xOf(q.min), xMax = xOf(q.max), xQ1 = xOf(q.q1), xQ3 = xOf(q.q3), xMed = xOf(q.median)
                  return (
                    <g key={dom.d}>
                      <text x={padL - 6} y={y + 3} fontSize={10} fill="#595959" textAnchor="end">{dom.d.length > 12 ? dom.d.slice(0, 11) + '…' : dom.d}</text>
                      <line x1={xMin} y1={y} x2={xMax} y2={y} stroke="#8c8c8c" strokeWidth={1} />
                      <line x1={xMin} y1={y - 5} x2={xMin} y2={y + 5} stroke="#8c8c8c" strokeWidth={1} />
                      <line x1={xMax} y1={y - 5} x2={xMax} y2={y + 5} stroke="#8c8c8c" strokeWidth={1} />
                      <rect x={xQ1} y={y - 7} width={Math.max(1, xQ3 - xQ1)} height={14} fill="#69b1ff" fillOpacity={0.4} stroke="#1890ff" strokeWidth={1} />
                      <line x1={xMed} y1={y - 7} x2={xMed} y2={y + 7} stroke="#722ed1" strokeWidth={1.5} />
                      <title>{`${dom.d}: n=${dom.n} min=${q.min.toFixed(2)} Q1=${q.q1.toFixed(2)} 中位=${q.median.toFixed(2)} Q3=${q.q3.toFixed(2)} max=${q.max.toFixed(2)}`}</title>
                      <text x={W - padR + 2} y={y + 3} fontSize={9} fill="#8c8c8c">n={dom.n}</text>
                    </g>
                  )
                })}
              </svg>
              <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#1890ff' }}>▭</span> Q1-Q3 箱体</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#722ed1' }}>│</span> 中位数</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#8c8c8c' }}>├─┤</span> min-max 须线</Text>
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无经验数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Reuse-Decay Trend */}
      <Card
        title={<Space><LineChartOutlined /> 经验复用 × 衰减趋势</Space>}
        extra={experiencesReuseTrend ? (
          <Space size={16}>
            <Text type="secondary" style={{ fontSize: 12 }}>被复用 <b style={{ color: '#13c2c2' }}>{experiencesReuseTrend.total_reused}</b></Text>
            <Text type="secondary" style={{ fontSize: 12 }}>累计复用 <b style={{ color: '#722ed1' }}>{experiencesReuseTrend.total_reuse_count}</b></Text>
            <Text type="secondary" style={{ fontSize: 12 }}>已衰减 <b style={{ color: '#ff4d4f' }}>{experiencesReuseTrend.decayed_count}</b>/{experiencesReuseTrend.total_experiences}</Text>
          </Space>
        ) : null}
        style={{ marginBottom: 16 }}
      >
        {experiencesReuseTrend && experiencesReuseTrend.trend.length > 0 ? (() => {
          const trend = experiencesReuseTrend.trend
          const W = 760, H = 200, padL = 40, padR = 40, padT = 14, padB = 28
          const iw = W - padL - padR, ih = H - padT - padB
          const maxRC = Math.max(1, ...trend.map((b) => b.reuse_count))
          const xFor = (i: number) => padL + (trend.length === 1 ? iw / 2 : (i / (trend.length - 1)) * iw)
          const yFor = (v: number) => padT + ih - (v / maxRC) * ih
          const reusePts = trend.map((b, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(b.reuse_count).toFixed(1)}`).join(' ')
          const decayPts = trend.map((b, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${(padT + ih * (1 - b.decay_rate)).toFixed(1)}`).join(' ')
          return (
            <div>
              <svg width={W} height={H} style={{ display: 'block' }}>
                {[0.25, 0.5, 0.75, 1].map((p) => {
                  const y = padT + ih * (1 - p)
                  return <line key={p} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth={0.5} />
                })}
                <path d={reusePts} fill="none" stroke="#13c2c2" strokeWidth={1.5} />
                <path d={decayPts} fill="none" stroke="#fa8c16" strokeWidth={1.5} strokeDasharray="4 3" />
                {trend.filter((_, i) => i % Math.max(1, Math.floor(trend.length / 8)) === 0).map((b, i, arr) => (
                  <g key={i}>
                    <text x={xFor(trend.indexOf(b))} y={H - 8} fontSize={8} fill="#8c8c8c" textAnchor="middle">{b.date.slice(5)}</text>
                  </g>
                ))}
              </svg>
              <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#13c2c2' }}>━</span> 复用次数</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#fa8c16' }}>┄</span> 衰减比例</Text>
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无复用趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Decay Forecast */}
      {experiencesDecayForecast && experiencesDecayForecast.trend.length >= 3 && (() => {
        const trend = experiencesDecayForecast.trend
        const forecast = experiencesDecayForecast.forecast
        const slope = experiencesDecayForecast.slope
        const rSq = experiencesDecayForecast.r_squared
        const daysToDecay = experiencesDecayForecast.days_to_decay
        const all = [...trend.map(t => t.avg_confidence), ...forecast.map(f => f.predicted_confidence)]
        const minC = Math.min(...all, 0)
        const maxC = Math.max(...all, 1)
        const range = maxC - minC || 1
        const W = 400, H = 120, padL = 32, padR = 8, padT = 8, padB = 20
        const iw = W - padL - padR, ih = H - padT - padB
        const total = trend.length + forecast.length
        const xFor = (i: number) => padL + (total <= 1 ? iw / 2 : (i / (total - 1)) * iw)
        const yFor = (v: number) => padT + ih - ((v - minC) / range) * ih
        const trendPts = trend.map((t, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(t.avg_confidence).toFixed(1)}`).join(' ')
        const fcStart = trend.length - 1
        const forecastPts = forecast.map((f, i) => {
          const x = xFor(fcStart + i + 1)
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yFor(f.predicted_confidence).toFixed(1)}`
        }).join(' ')
        const bridge = trend.length > 0 && forecast.length > 0
          ? `M${xFor(fcStart).toFixed(1)},${yFor(trend[trend.length - 1].avg_confidence).toFixed(1)} L${xFor(fcStart + 1).toFixed(1)},${yFor(forecast[0].predicted_confidence).toFixed(1)}`
          : ''
        return (
          <Card
            title={<Space><FundOutlined /> 置信度衰减预测</Space>}
            extra={
              <Space size={12}>
                <Text type="secondary" style={{ fontSize: 10 }}>斜率={slope}</Text>
                <Text type="secondary" style={{ fontSize: 10 }}>R²={rSq}</Text>
                {daysToDecay != null && <Text style={{ fontSize: 10, color: '#ff4d4f' }}>≈{daysToDecay}天后{"<"}0.5</Text>}
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <svg width={W} height={H} style={{ display: 'block' }}>
              {(() => {
                const y05 = yFor(0.5)
                return <line x1={padL} y1={y05} x2={W - padR} y2={y05} stroke="#ff4d4f" strokeDasharray="4 3" strokeWidth={0.5} />
              })()}
              {[0.2, 0.4, 0.6, 0.8, 1.0].filter(v => v >= minC && v <= maxC).map(v => {
                const y = yFor(v)
                return <line key={v} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f5f5f5" strokeWidth={0.5} />
              })}
              <path d={trendPts} fill="none" stroke="#722ed1" strokeWidth={1.5} />
              {bridge && <path d={bridge} fill="none" stroke="#fa8c16" strokeWidth={1.5} strokeDasharray="3 3" />}
              {forecastPts && <path d={forecastPts} fill="none" stroke="#fa8c16" strokeWidth={1.5} strokeDasharray="3 3" />}
              {forecast.map((f, i) => (
                <circle key={`fc${i}`} cx={xFor(fcStart + i + 1)} cy={yFor(f.predicted_confidence)} r={3} fill="#fa8c16" fillOpacity={0.7}>
                  <title>{f.date}: 预测={f.predicted_confidence}</title>
                </circle>
              ))}
              {[0, Math.floor((trend.length - 1) / 2), trend.length - 1].filter((v, i, a) => a.indexOf(v) === i && v >= 0).map(i => (
                <text key={`xl${i}`} x={xFor(i)} y={H - 4} fontSize={8} fill="#8c8c8c" textAnchor="middle">{trend[i].date.slice(5)}</text>
              ))}
              {forecast.length > 0 && <text x={xFor(total - 1)} y={H - 4} fontSize={8} fill="#fa8c16" textAnchor="middle">{forecast[forecast.length - 1].date.slice(5)}</text>}
            </svg>
            <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#722ed1' }}>━</span> 历史</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#fa8c16' }}>┄</span> 预测</Text>
              <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>---</span> 0.5 衰减线</Text>
            </div>
          </Card>
        )
      })()}

      {/* Decay by Domain */}
      <Card
        title={<Space><HeatMapOutlined /> 经验按域衰减对比</Space>}
        extra={experiencesDecayByDomain ? (
          <Space size={16}>
            <Text type="secondary" style={{ fontSize: 12 }}>活跃 <b style={{ color: '#52c41a' }}>{experiencesDecayByDomain.total_active}</b></Text>
            <Text type="secondary" style={{ fontSize: 12 }}>衰减 <b style={{ color: '#ff4d4f' }}>{experiencesDecayByDomain.total_decayed}</b></Text>
          </Space>
        ) : null}
        style={{ marginBottom: 16 }}
      >
        {experiencesDecayByDomain && experiencesDecayByDomain.domains.length > 0 ? (() => {
          const domains = experiencesDecayByDomain.domains
          const maxTotal = Math.max(1, ...domains.map((d) => d.total))
          return (
            <div>
              {domains.map((d) => {
                const activeW = (d.active / maxTotal) * 100
                const decayedW = (d.decayed / maxTotal) * 100
                const decayRate = d.total > 0 ? ((d.decayed / d.total) * 100).toFixed(0) : '0'
                return (
                  <div key={d.domain} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Text style={{ fontSize: 12, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.domain}>{d.domain}</Text>
                      <div style={{ flex: 1, height: 16, display: 'flex', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${activeW}%`, height: '100%', background: '#52c41a' }} title={`活跃: ${d.active}`} />
                        <div style={{ width: `${decayedW}%`, height: '100%', background: '#ff4d4f' }} title={`衰减: ${d.decayed}`} />
                      </div>
                      <Text type="secondary" style={{ fontSize: 10, minWidth: 60 }}>{d.active}/{d.total}</Text>
                      <Tag color={Number(decayRate) > 30 ? 'red' : 'default'} style={{ fontSize: 10 }}>{decayRate}% 衰减</Tag>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })() : (
          <Empty description="暂无经验衰减数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Confidence Distribution */}
      <ExperiencesConfidenceDistributionCard experiencesConfidenceDistribution={experiencesConfidenceDistribution} />

      {/* Source Distribution */}
      <ExperiencesSourceDistributionCard experiencesSourceDistribution={experiencesSourceDistribution} />

      {/* Propagation Chain */}
      <ExperiencesPropagationChainCard experiencesPropagationChain={experiencesPropagationChain} />

      {/* Skill Coverage Radar */}
      <SkillCoverageRadarCard skillCoverageRadar={skillCoverageRadar} />
    </>
  )
}

export default ExperiencesSection