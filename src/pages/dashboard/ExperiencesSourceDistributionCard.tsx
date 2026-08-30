/**
 * 经验来源分布卡片
 *
 * 展示经验按来源（手动/工作流/自动）的分布。
 */
import { Card, Empty, Space, Tooltip, Typography } from 'antd'
import { HeatMapOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { ExperiencesSourceDistribution } from '../../api/agents'

const { Text } = Typography

interface ExperiencesSourceDistributionCardProps {
  experiencesSourceDistribution: ExperiencesSourceDistribution | null
}

const ExperiencesSourceDistributionCard: FC<ExperiencesSourceDistributionCardProps> = ({ experiencesSourceDistribution }) => (
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
)

export default ExperiencesSourceDistributionCard