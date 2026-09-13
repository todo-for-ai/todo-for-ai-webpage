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
import type { useExperiencesData } from './useExperiencesData'

const { Text } = Typography

type Bundle = ReturnType<typeof useExperiencesData>

/**
 * 经验库统计与低置信经验卡。props 收数据 hook 全量包，由 ExperiencesSection 原样拆出。
 */
export function ExperiencesConfidenceCard(props: Bundle) {
  const {
    experiencesStats,
  } = props

  return (
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
  )
}
