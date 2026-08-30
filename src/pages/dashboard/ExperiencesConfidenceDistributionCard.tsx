/**
 * 经验置信度区间分布卡片
 *
 * 展示经验按置信度区间的分布条形图。
 */
import { Card, Empty, Space, Tooltip, Typography } from 'antd'
import { HeatMapOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { ExperiencesConfidenceDistribution } from '../../api/agents'

const { Text } = Typography

interface ExperiencesConfidenceDistributionCardProps {
  experiencesConfidenceDistribution: ExperiencesConfidenceDistribution | null
}

const ExperiencesConfidenceDistributionCard: FC<ExperiencesConfidenceDistributionCardProps> = ({ experiencesConfidenceDistribution }) => (
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
)

export default ExperiencesConfidenceDistributionCard