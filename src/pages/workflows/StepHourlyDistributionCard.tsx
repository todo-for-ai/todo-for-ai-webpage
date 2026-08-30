/**
 * 步骤执行时段分布卡片
 *
 * 展示各步骤按小时的执行热力图。
 */
import { Card, Space, Typography } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import type { WorkflowStepHourlyDistribution } from '../../api/agents'

const { Text } = Typography

interface StepHourlyDistributionCardProps {
  stepHourlyDistribution: WorkflowStepHourlyDistribution | null
}

const StepHourlyDistributionCard: React.FC<StepHourlyDistributionCardProps> = ({ stepHourlyDistribution }) => {
  if (!stepHourlyDistribution || stepHourlyDistribution.steps.length === 0) return null

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
}

export default StepHourlyDistributionCard
