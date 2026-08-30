/**
 * 步骤耗时分布直方图卡片
 *
 * 展示各步骤的详细耗时分布 SVG 直方图。
 */
import { Card, Space, Typography } from 'antd'
import { BarChartOutlined } from '@ant-design/icons'
import type { WorkflowStepDurationHistogram } from '../../api/agents'

const { Text } = Typography

interface StepDurationHistCardProps {
  stepDurationHist: WorkflowStepDurationHistogram | null
}

const StepDurationHistCard: React.FC<StepDurationHistCardProps> = ({ stepDurationHist }) => {
  if (!stepDurationHist || stepDurationHist.items.length === 0) return null

  return (
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
  )
}

export default StepDurationHistCard
