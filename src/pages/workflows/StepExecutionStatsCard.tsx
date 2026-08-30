/**
 * 步骤执行统计卡片
 *
 * 展示步骤执行统计、运行趋势、失败步骤跨维度关联。
 */
import { Card, Tag, Tooltip, Typography } from 'antd'
import type {
  WorkflowStepStats,
  WorkflowRunTrend,
  WorkflowFailureCorrelation,
  WorkflowFailureCorrelationByStep,
  WorkflowFailedStepsByDuration,
} from '../../api/agents'
import WorkflowRunTrendChart from '../../components/WorkflowRunTrendChart'

const { Text } = Typography

interface StepExecutionStatsCardProps {
  stepStats: WorkflowStepStats | null
  runTrend: WorkflowRunTrend | null
  failureCorrelation: WorkflowFailureCorrelation | null
  failureCorrelationByStep: WorkflowFailureCorrelationByStep | null
  failedStepsByDuration: WorkflowFailedStepsByDuration | null
}

const StepExecutionStatsCard: React.FC<StepExecutionStatsCardProps> = ({
  stepStats,
  runTrend,
  failureCorrelation,
  failureCorrelationByStep,
  failedStepsByDuration,
}) => {
  if (!stepStats || stepStats.items.length === 0) return null

  return (
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
  )
}

export default StepExecutionStatsCard
