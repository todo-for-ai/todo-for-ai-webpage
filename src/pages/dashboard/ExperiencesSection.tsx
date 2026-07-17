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
  ShareAltOutlined,
  RadarChartOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import { agentsApi, type ExperiencesStats, type ExperiencesLowConfidence, type ExperiencesScatter, type ExperiencesReuseTrend, type ExperiencesConfidenceDecayForecast, type ExperiencesDecayByDomain, type ExperiencesDecayByTaskType, type ExperiencesConfidenceDistribution, type ExperiencesSourceDistribution, type ExperiencesPropagationChain, type ExperiencesSkillCoverageRadar } from '../../api/agents'

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
                  <Col span={6}><Statistic title="已共享" value={experiencesStats.shared} valueStyle={{ fontSize: 16, color: '#722ed1' }} prefix={<ShareAltOutlined />} /></Col>
                  <Col span={6}><Statistic title="累计复用" value={experiencesStats.total_reuses} valueStyle={{ fontSize: 16 }} suffix="次" /></Col>
                  <Col span={6}><Statistic title="平均置信度" value={avgConf ?? '—'} valueStyle={{ fontSize: 16, color: confColor }} /></Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按域分布:</Text>
                    {domains.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {domains.slice(0, 8).map(([k, v]: any) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={k}>{k}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxDomain) * 100}%`, height: '100%', background: '#722ed1', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : <Empty description="无" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按经验类型:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                      {types.map(([k, v]: any) => (
                        <Tag key={k} color="purple" style={{ fontSize: 11 }}>{k}: {v}</Tag>
                      ))}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>按任务类型:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                      {tasks.length > 0 ? tasks.slice(0, 10).map(([k, v]: any) => (
                        <Tag key={k} color="blue" style={{ fontSize: 11 }}>{k}: {v}</Tag>
                      )) : <Text type="secondary" style={{ fontSize: 12 }}>无</Text>}
                    </Space>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>按置信度区间:</Text>
                    {confBuckets.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {confBuckets.map(([k, v]: any) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 70, color: '#595959' }}>{k}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxBucket) * 100}%`, height: '100%', background: bucketColor(k), borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 30, textAlign: 'right' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : <Empty description="无" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 12 }}>复用最多(top5):</Text>
                    {topReused.length > 0 ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {topReused.slice(0, 5).map((t) => (
                          <Tooltip key={t.id} title={t.key_learnings || '无摘要'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                              <span style={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${t.domain} / ${t.experience_type}`}>{t.domain} / {t.experience_type}</span>
                              <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ width: `${(t.times_reused / maxReuse) * 100}%`, height: '100%', background: '#13c2c2', borderRadius: 3 }} />
                              </div>
                              <span style={{ color: '#8c8c8c', minWidth: 50, textAlign: 'right' }}>{t.times_reused}次</span>
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    ) : <Empty description="暂无复用" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />}
                  </Col>
                </Row>
                {matrixDomains.length > 0 && allTaskTypes.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>域×任务类型覆盖热力（top6 域 × top8 任务类型）:</Text>
                    <div style={{ marginTop: 6, overflowX: 'auto' }}>
                      <table style={{ borderCollapse: 'collapse', fontSize: 10 }}>
                        <thead>
                          <tr>
                            <th style={{ padding: '2px 6px', textAlign: 'left', color: '#8c8c8c' }}>域 \ 任务</th>
                            {allTaskTypes.map((t) => (
                              <th key={t} style={{ padding: '2px 6px', color: '#8c8c8c', fontWeight: 400, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t}>{t}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {matrixDomains.map((d) => (
                            <tr key={d}>
                              <td style={{ padding: '2px 6px', color: '#595959', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d}>{d}</td>
                              {allTaskTypes.map((t) => {
                                const v = (matrix[d] || {})[t] || 0
                                return (
                                  <td key={t} style={{ padding: 0 }}>
                                    <Tooltip title={`${d} × ${t}: ${v}`}>
                                      <div style={{ width: 34, height: 18, background: heatColor(v), borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v > 0 ? (v / matrixMax >= 0.5 ? '#fff' : '#595959') : '#bfbfbf' }}>
                                        {v > 0 ? v : ''}
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
                  </div>
                )}
                {(() => {
                  const domainReuses = Object.entries(experiencesStats.by_domain_reuses || {}).filter(([, v]) => v > 0)
                  if (domainReuses.length === 0) return null
                  const maxReuse = Math.max(1, ...domainReuses.map(([, v]) => v))
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>域复用排行（累计复用次数）:</Text>
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {domainReuses.slice(0, 8).map(([d, v]) => (
                          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={d}>{d}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxReuse) * 100}%`, height: '100%', background: '#13c2c2', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 50, textAlign: 'right' }}>{v}次</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                {(() => {
                  const taskTypeReuses = Object.entries(experiencesStats.by_task_type_reuses || {}).filter(([, v]) => v > 0)
                  if (taskTypeReuses.length === 0) return null
                  const maxReuse = Math.max(1, ...taskTypeReuses.map(([, v]) => v))
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>任务类型复用排行（累计复用次数）:</Text>
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {taskTypeReuses.slice(0, 8).map(([t, v]) => (
                          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={t}>{t}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxReuse) * 100}%`, height: '100%', background: '#fa8c16', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 50, textAlign: 'right' }}>{v}次</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                {(() => {
                  const expTypeReuses = Object.entries(experiencesStats.by_experience_type_reuses || {}).filter(([, v]) => v > 0)
                  if (expTypeReuses.length === 0) return null
                  const maxReuse = Math.max(1, ...expTypeReuses.map(([, v]) => v))
                  return (
                    <div style={{ marginTop: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>经验类型复用排行（累计复用次数）:</Text>
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {expTypeReuses.slice(0, 8).map(([t, v]) => (
                          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={t}>{t}</span>
                            <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                              <div style={{ width: `${(v / maxReuse) * 100}%`, height: '100%', background: '#722ed1', borderRadius: 3 }} />
                            </div>
                            <span style={{ color: '#8c8c8c', minWidth: 50, textAlign: 'right' }}>{v}次</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </>
            )
          })() : <Empty description="暂无有效经验" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty description="加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Low Confidence Experiences */}
      <Card
        title={<Space><WarningOutlined /> 低置信度经验清单 <Tag color="volcano">置信度 &lt; {experiencesLowConfidence?.max_confidence ?? 0.5}</Tag></Space>}
        style={{ marginBottom: 24 }}
      >
        {experiencesLowConfidence ? (
          experiencesLowConfidence.items.length > 0 ? (
            <List
              size="small"
              dataSource={experiencesLowConfidence.items}
              renderItem={(item, idx) => {
                const conf = item.confidence ?? 0
                const confColor = conf < 0.3 ? '#ff4d4f' : conf < 0.4 ? '#faad14' : '#fa8c16'
                return (
                  <List.Item>
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space size={4} wrap>
                        <Tag color="volcano">#{item.id}</Tag>
                        <Tag color="purple">{item.domain}</Tag>
                        {item.task_type && <Tag>{item.task_type}</Tag>}
                        <Tag color="cyan">{item.experience_type}</Tag>
                        <Tag color={confColor} style={{ fontWeight: 600 }}>置信度 {conf.toFixed(2)}</Tag>
                        <Tag>复用 {item.times_reused} 次</Tag>
                      </Space>
                      {item.key_learnings && (
                        <Tooltip title={item.key_learnings}>
                          <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: '100%' }}>
                            {item.key_learnings}
                          </Typography.Text>
                        </Tooltip>
                      )}
                    </Space>
                  </List.Item>
                )
              }}
            />
          ) : <Empty description="暂无低置信度经验" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty description="加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Experiences Confidence × Reuse Scatter */}
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
          // 点颜色按 domain 哈希
          const palette = ['#1677ff', '#52c41a', '#722ed1', '#13c2c2', '#fa8c16', '#eb2f96', '#fa541c', '#08979c']
          const domainIdx: Record<string, number> = {}
          let di = 0
          const colorFor = (d: string) => {
            if (!(d in domainIdx)) { domainIdx[d] = di++; }
            return palette[domainIdx[d] % palette.length]
          }
          // 聚类：同位置点叠加计数
          const cell: Record<string, { x: number; y: number; n: number; c: string; conf: number; reuse: number }> = {}
          pts.forEach((p) => {
            const c = p.confidence ?? 0
            const key = `${c.toFixed(2)}|${p.times_reused}`
            if (!cell[key]) cell[key] = { x: xOf(c), y: yOf(p.times_reused), n: 0, c: colorFor(p.domain), conf: c, reuse: p.times_reused }
            cell[key].n += 1
          })
          const cells = Object.values(cell)
          const domains = Object.keys(domainIdx).slice(0, 8)
          return (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                共 {pts.length} 条经验（X=置信度 0-1，Y=复用次数，点大小=同位置叠加数，颜色=域）
              </Text>
              <svg width={W} height={H} style={{ display: 'block', marginTop: 4 }}>
                {/* 网格线 */}
                {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                  <g key={g}>
                    <line x1={xOf(g)} y1={padT} x2={xOf(g)} y2={H - padB} stroke="#f0f0f0" strokeWidth={1} />
                    <text x={xOf(g)} y={H - padB + 14} fontSize={9} fill="#8c8c8c" textAnchor="middle">{g.toFixed(2)}</text>
                  </g>
                ))}
                <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#d9d9d9" strokeWidth={1} />
                <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#d9d9d9" strokeWidth={1} />
                <text x={6} y={H / 2} fontSize={9} fill="#8c8c8c" transform={`rotate(-90 6 ${H / 2})`} textAnchor="middle">复用次数</text>
                {/* 散点 */}
                {cells.map((cell, i) => (
                  <circle
                    key={i}
                    cx={cell.x}
                    cy={cell.y}
                    r={3 + Math.min(6, cell.n)}
                    fill={cell.c}
                    fillOpacity={0.6}
                  >
                    <title>{`置信度=${cell.conf.toFixed(2)} 复用=${cell.reuse} 叠加=${cell.n}`}</title>
                  </circle>
                ))}
              </svg>
              <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                {domains.map((d) => (
                  <Text key={d} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ color: colorFor(d) }}>●</span> {d}
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无经验散点数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Experiences Confidence Box Plot by Domain */}
      <Card
        title={<Space><BarChartOutlined /> 经验置信度 按域箱线图</Space>}
        style={{ marginBottom: 24 }}
      >
        {experiencesScatter && experiencesScatter.points.length > 0 ? (() => {
          // 按 domain 分组计算置信度五数
          const byDomain: Record<string, number[]> = {}
          experiencesScatter.points.forEach((p) => {
            if (p.confidence == null) return
            const d = p.domain
            byDomain[d] = byDomain[d] || []
            byDomain[d].push(p.confidence)
          })
          const domains = Object.entries(byDomain)
            .map(([d, cs]) => ({ d, n: cs.length, sorted: cs.slice().sort((a, b) => a - b) }))
            .filter((x) => x.n >= 2) // 至少 2 个才有箱线意义
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
                {/* X 轴刻度 */}
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
                      {/* 须线 */}
                      <line x1={xMin} y1={y} x2={xMax} y2={y} stroke="#8c8c8c" strokeWidth={1} />
                      <line x1={xMin} y1={y - 5} x2={xMin} y2={y + 5} stroke="#8c8c8c" strokeWidth={1} />
                      <line x1={xMax} y1={y - 5} x2={xMax} y2={y + 5} stroke="#8c8c8c" strokeWidth={1} />
                      {/* 箱体 */}
                      <rect x={xQ1} y={y - 7} width={Math.max(1, xQ3 - xQ1)} height={14} fill="#69b1ff" fillOpacity={0.4} stroke="#1890ff" strokeWidth={1} />
                      {/* 中位线 */}
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

      {/* Experiences Reuse-Decay Trend */}
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
          const yRC = (v: number) => padT + ih - (v / maxRC) * ih
          const yConf = (v: number) => padT + ih - v * ih
          // polyline paths
          const rcPath = trend.map((b, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yRC(b.reuse_count).toFixed(1)}`).join(' ')
          const confPath = trend.map((b, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yConf(b.avg_confidence).toFixed(1)}`).join(' ')
          // gridlines
          const gridYs = [0, 0.25, 0.5, 0.75, 1]
          const fmtDate = (d: string) => {
            const parts = d.split('-')
            return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d
          }
          return (
            <div style={{ overflowX: 'auto' }}>
              <svg width={W} height={H} style={{ display: 'block' }}>
                {/* y gridlines (confidence axis 0-1) */}
                {gridYs.map((g) => {
                  const y = padT + ih - g * ih
                  return (
                    <g key={g}>
                      <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f0f0f0" strokeWidth={1} />
                      <text x={padL - 4} y={y + 3} fontSize={9} fill="#8c8c8c" textAnchor="end">{g.toFixed(2)}</text>
                    </g>
                  )
                })}
                {/* right axis labels reuse_count */}
                {[0, 0.5, 1].map((g) => {
                  const y = padT + ih - g * ih
                  const v = Math.round(g * maxRC)
                  return <text key={`r${g}`} x={W - padR + 4} y={y + 3} fontSize={9} fill="#13c2c2" textAnchor="start">{v}</text>
                })}
                {/* decayed bars (background) */}
                {trend.map((b, i) => {
                  if (b.decayed === 0) return null
                  const bh = (b.decayed / Math.max(1, ...trend.map((x) => x.decayed))) * ih * 0.5
                  return <rect key={`d${i}`} x={xFor(i) - 4} y={padT + ih - bh} width={8} height={bh} fill="#ff4d4f" fillOpacity={0.18} />
                })}
                {/* reuse_count line (cyan) */}
                <path d={rcPath} fill="none" stroke="#13c2c2" strokeWidth={2} />
                {trend.map((b, i) => (
                  <circle key={`rc${i}`} cx={xFor(i)} cy={yRC(b.reuse_count)} r={2.5} fill="#13c2c2">
                    <title>{`${fmtDate(b.date)} 累计复用=${b.reuse_count} 复用经验=${b.reused} 平均置信度=${b.avg_confidence} 已衰减=${b.decayed}`}</title>
                  </circle>
                ))}
                {/* avg_confidence line (purple) */}
                <path d={confPath} fill="none" stroke="#722ed1" strokeWidth={2} strokeDasharray="4 3" />
                {trend.map((b, i) => (
                  <circle key={`cf${i}`} cx={xFor(i)} cy={yConf(b.avg_confidence)} r={2.5} fill="#722ed1">
                    <title>{`${fmtDate(b.date)} 平均置信度=${b.avg_confidence} 累计复用=${b.reuse_count} 已衰减=${b.decayed}`}</title>
                  </circle>
                ))}
                {/* x axis labels (first/mid/last) */}
                {trend.length > 0 && [0, Math.floor((trend.length - 1) / 2), trend.length - 1].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
                  <text key={`x${i}`} x={xFor(i)} y={H - 8} fontSize={9} fill="#8c8c8c" textAnchor="middle">{fmtDate(trend[i].date)}</text>
                ))}
              </svg>
              <div style={{ display: 'flex', gap: 16, marginTop: 2, flexWrap: 'wrap' }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#13c2c2' }}>━</span> 累计复用次数(左)</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#722ed1' }}>┄</span> 平均置信度(右 0-1)</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>▏</span> 当日已衰减经验数</Text>
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无复用趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* 置信度衰减预测 */}
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
        // Connect trend last point to forecast first point
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
              {/* 0.5 threshold line */}
              {(() => {
                const y05 = yFor(0.5)
                return <line x1={padL} y1={y05} x2={W - padR} y2={y05} stroke="#ff4d4f" strokeDasharray="4 3" strokeWidth={0.5} />
              })()}
              {/* Y grid */}
              {[0.2, 0.4, 0.6, 0.8, 1.0].filter(v => v >= minC && v <= maxC).map(v => {
                const y = yFor(v)
                return <line key={v} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f5f5f5" strokeWidth={0.5} />
              })}
              {/* Historical line */}
              <path d={trendPts} fill="none" stroke="#722ed1" strokeWidth={1.5} />
              {/* Bridge */}
              {bridge && <path d={bridge} fill="none" stroke="#fa8c16" strokeWidth={1.5} strokeDasharray="3 3" />}
              {/* Forecast line */}
              {forecastPts && <path d={forecastPts} fill="none" stroke="#fa8c16" strokeWidth={1.5} strokeDasharray="3 3" />}
              {/* Forecast dots */}
              {forecast.map((f, i) => (
                <circle key={`fc${i}`} cx={xFor(fcStart + i + 1)} cy={yFor(f.predicted_confidence)} r={3} fill="#fa8c16" fillOpacity={0.7}>
                  <title>{f.date}: 预测={f.predicted_confidence}</title>
                </circle>
              ))}
              {/* X labels */}
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

      {/* Experiences Decay by Domain */}
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
                const activePct = d.total > 0 ? d.active / d.total : 0
                const decayedPct = d.total > 0 ? d.decayed / d.total : 0
                return (
                  <div key={d.domain} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Tooltip title={`${d.domain}: 总${d.total} 活跃=${d.active} 衰减=${d.decayed} 平均置信度=${d.avg_confidence} 复用=${d.reuses}`}>
                      <Text style={{ fontSize: 11, width: 100, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.domain}</Text>
                    </Tooltip>
                    <div style={{ flex: 1, height: 16, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${activePct * 100}%`, height: '100%', background: '#52c41a', opacity: 0.7 }} />
                      <div style={{ width: `${decayedPct * 100}%`, height: '100%', background: '#ff4d4f', opacity: 0.6 }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 10, width: 50 }}>{d.total}</Text>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#52c41a' }}>■</span> 活跃(置信度≥0.5)</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>■</span> 衰减(置信度{"<"}0.5)</Text>
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无经验衰减数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card
        title={<Space><HeatMapOutlined /> 经验按任务类型衰减对比</Space>}
        extra={experiencesDecayByTaskType ? (
          <Space size="small">
            <Text type="secondary" style={{ fontSize: 12 }}>活跃 <b style={{ color: '#52c41a' }}>{experiencesDecayByTaskType.total_active}</b></Text>
            <Text type="secondary" style={{ fontSize: 12 }}>衰减 <b style={{ color: '#ff4d4f' }}>{experiencesDecayByTaskType.total_decayed}</b></Text>
          </Space>
        ) : null}
        style={{ marginBottom: 24 }}
      >
        {experiencesDecayByTaskType && experiencesDecayByTaskType.task_types.length > 0 ? (() => {
          const taskTypes = experiencesDecayByTaskType.task_types
          return (
            <div>
              {taskTypes.map((t) => {
                const activePct = t.total > 0 ? t.active / t.total : 0
                const decayedPct = t.total > 0 ? t.decayed / t.total : 0
                return (
                  <div key={t.task_type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Tooltip title={`${t.task_type}: 总${t.total} 活跃=${t.active} 衰减=${t.decayed} 平均置信度=${t.avg_confidence} 复用=${t.reuses}`}>
                      <Text style={{ fontSize: 11, width: 100, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.task_type}</Text>
                    </Tooltip>
                    <div style={{ flex: 1, height: 16, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${activePct * 100}%`, height: '100%', background: '#52c41a', opacity: 0.7 }} />
                      <div style={{ width: `${decayedPct * 100}%`, height: '100%', background: '#ff4d4f', opacity: 0.6 }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 10, width: 50 }}>{t.total}</Text>
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#52c41a' }}>■</span> 活跃(置信度≥0.5)</Text>
                <Text type="secondary" style={{ fontSize: 10 }}><span style={{ color: '#ff4d4f' }}>■</span> 衰减(置信度{"<"}0.5)</Text>
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无经验衰减数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card
        title={<Space><HeatMapOutlined /> 经验置信度区间分布</Space>}
        extra={experiencesConfidenceDistribution ? (
          <Text type="secondary" style={{ fontSize: 12 }}>共 {experiencesConfidenceDistribution.total} 条</Text>
        ) : null}
        style={{ marginBottom: 24 }}
      >
        {experiencesConfidenceDistribution && experiencesConfidenceDistribution.bins.length > 0 ? (() => {
          const bins = experiencesConfidenceDistribution.bins
          const maxCount = Math.max(1, ...bins.map((b) => b.count))
          // 5档色阶：红→深橙→橙→黄绿→绿
          const barColors = ['#ff4d4f', '#fa541c', '#fa8c16', '#73d13d', '#52c41a']
          return (
            <div>
              {bins.map((b, i) => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Tooltip title={`${b.label}: ${b.count}条(${b.percentage}%) 均复用=${b.avg_reuses}`}>
                    <Text style={{ fontSize: 11, width: 45, textAlign: 'right' }}>{b.label}</Text>
                  </Tooltip>
                  <div style={{ flex: 1, height: 18, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(b.count / maxCount) * 100}%`, height: '100%', background: barColors[i], opacity: 0.75, borderRadius: 3 }} />
                  </div>
                  <Text type="secondary" style={{ fontSize: 10, width: 55 }}>{b.count}({b.percentage}%)</Text>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {bins.map((b, i) => (
                  <Text key={b.label} type="secondary" style={{ fontSize: 9 }}>
                    <span style={{ color: barColors[i] }}>■</span> {b.label}
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无置信度分布数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card
        title={<Space><HeatMapOutlined /> 经验来源分布</Space>}
        extra={experiencesSourceDistribution ? (
          <Text type="secondary" style={{ fontSize: 12 }}>共 {experiencesSourceDistribution.total} 条</Text>
        ) : null}
        style={{ marginBottom: 24 }}
      >
        {experiencesSourceDistribution && experiencesSourceDistribution.sources.length > 0 ? (() => {
          const sources = experiencesSourceDistribution.sources
          const maxCount = Math.max(1, ...sources.map((s) => s.count))
          const sourceColors: Record<string, string> = { manual: '#722ed1', workflow: '#1890ff', auto_step: '#13c2c2' }
          const sourceLabels: Record<string, string> = { manual: '手动创建', workflow: '工作流生成', auto_step: '步骤自动提取' }
          return (
            <div>
              {sources.map((s) => (
                <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Tooltip title={`${sourceLabels[s.source] || s.source}: ${s.count}条(${s.percentage}%) 均置信度=${s.avg_confidence} 均复用=${s.avg_reuses}`}>
                    <Text style={{ fontSize: 11, width: 80, textAlign: 'right', color: sourceColors[s.source] || '#8c8c8c' }}>{sourceLabels[s.source] || s.source}</Text>
                  </Tooltip>
                  <div style={{ flex: 1, height: 20, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${(s.count / maxCount) * 100}%`, height: '100%', background: sourceColors[s.source] || '#8c8c8c', opacity: 0.7, borderRadius: 3 }} />
                  </div>
                  <Text type="secondary" style={{ fontSize: 10, width: 55 }}>{s.count}({s.percentage}%)</Text>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {sources.map((s) => (
                  <Text key={s.source} type="secondary" style={{ fontSize: 10 }}>
                    <span style={{ color: sourceColors[s.source] || '#8c8c8c' }}>■</span> {sourceLabels[s.source] || s.source}
                  </Text>
                ))}
              </div>
            </div>
          )
        })() : (
          <Empty description="暂无来源分布数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* 经验共享传播链 */}
      {experiencesPropagationChain && experiencesPropagationChain.chains.length > 0 && (() => {
        const chains = experiencesPropagationChain.chains
        const maxReuses = Math.max(...chains.map(c => c.total_reuses), 1)
        const barMaxW = 180
        return (
          <Card
            title={<Space><ApartmentOutlined /> 经验共享传播链</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{experiencesPropagationChain.total_shared} 条共享 · {experiencesPropagationChain.total_propagated} 次传播</Text>}
            style={{ marginBottom: 24 }}
          >
            {chains.map((c) => {
              const barW = Math.max(2, (c.total_reuses / maxReuses) * barMaxW)
              const domains = c.top_domains.slice(0, 3).join('/')
              return (
                <div key={c.source_agent_id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <Text style={{ fontSize: 12, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.source_agent_name}>{c.source_agent_name}</Text>
                    <svg width={barMaxW + 4} height={12} style={{ flexShrink: 0 }}>
                      <rect x={0} y={1} width={barMaxW} height={10} rx={2} fill="#f5f5f5" />
                      <rect x={0} y={1} width={barW} height={10} rx={2} fill="#722ed1" opacity={0.7} />
                    </svg>
                    <Text style={{ fontSize: 11, color: '#722ed1', minWidth: 30 }}>{c.total_reuses}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>{c.shared_count}条共享</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 10, marginLeft: 108 }}>
                    {domains ? `[${domains}]` : ''} {c.top_experiences.slice(0, 2).map(e => `${e.domain || '?'}(${e.times_reused})`).join(', ')}
                  </Text>
                </div>
              )
            })}
          </Card>
        )
      })()}

      {/* Agent 技能覆盖雷达 */}
      {skillCoverageRadar && skillCoverageRadar.agents.length > 0 && skillCoverageRadar.domain_labels.length >= 3 && (() => {
        const agents = skillCoverageRadar.agents
        const labels = skillCoverageRadar.domain_labels
        const n = labels.length
        const cx = 140
        const cy = 140
        const r = 110
        const angleStep = (2 * Math.PI) / n
        const colors = ['#1890ff', '#722ed1', '#fa8c16', '#52c41a', '#eb2f96', '#13c2c2']
        return (
          <Card
            title={<Space><RadarChartOutlined /> Agent 技能覆盖雷达</Space>}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{n} 个技能维度 · {agents.length} 个 Agent</Text>}
            style={{ marginBottom: 24 }}
          >
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <svg width={280} height={280} style={{ flexShrink: 0 }}>
                {/* Grid rings */}
                {[20, 40, 60, 80, 100].map(pct => {
                  const rr = r * pct / 100
                  const pts = Array.from({ length: n }, (_, i) => {
                    const a = -Math.PI / 2 + i * angleStep
                    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`
                  }).join(' ')
                  return <polygon key={`ring-${pct}`} points={pts} fill="none" stroke="#f0f0f0" strokeWidth={0.5} />
                })}
                {/* Axis lines + labels */}
                {labels.map((l, i) => {
                  const a = -Math.PI / 2 + i * angleStep
                  const ex = cx + r * Math.cos(a)
                  const ey = cy + r * Math.sin(a)
                  const lx = cx + (r + 16) * Math.cos(a)
                  const ly = cy + (r + 16) * Math.sin(a)
                  return (
                    <g key={`ax-${i}`}>
                      <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e8e8e8" strokeWidth={0.5} />
                      <text x={lx} y={ly + 3} fontSize={9} fill="#8c8c8c" textAnchor="middle">{l.length > 6 ? l.slice(0, 5) + '…' : l}</text>
                    </g>
                  )
                })}
                {/* Agent polygons */}
                {agents.map((ag, ai) => {
                  const color = colors[ai % colors.length]
                  const pts = ag.scores.map((s, i) => {
                    const a = -Math.PI / 2 + i * angleStep
                    const rr = r * s / 100
                    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`
                  }).join(' ')
                  return <polygon key={`ag-${ag.agent_id}`} points={pts} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={1.5} />
                })}
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                {agents.map((ag, ai) => (
                  <Text key={ag.agent_id} style={{ fontSize: 11 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, background: colors[ai % colors.length], borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} />
                    {ag.name} ({ag.total_experiences}条)
                  </Text>
                ))}
              </div>
            </div>
          </Card>
        )
      })()}

    </>
  )
}

export default ExperiencesSection
