/**
 * 运行时长分位数趋势卡片
 *
 * 展示 P50/P90/P95 分位数趋势 SVG 图。
 */
import { Card, Space, Typography } from 'antd'
import { LineChartOutlined } from '@ant-design/icons'
import type { WorkflowRunDurationPercentiles } from '../../api/agents'

const { Text } = Typography

interface RunDurationPercentilesCardProps {
  runDurationPercentiles: WorkflowRunDurationPercentiles | null
}

const RunDurationPercentilesCard: React.FC<RunDurationPercentilesCardProps> = ({ runDurationPercentiles }) => {
  if (!runDurationPercentiles || runDurationPercentiles.buckets.length === 0) return null

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
}

export default RunDurationPercentilesCard
