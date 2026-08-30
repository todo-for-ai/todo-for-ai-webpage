/**
 * 低置信度经验清单卡片
 *
 * 展示置信度低于阈值的经验列表。
 */
import { Card, Empty, List, Space, Tag, Tooltip, Typography } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { ExperiencesLowConfidence } from '../../api/agents'

const { Text } = Typography

interface LowConfidenceExperiencesCardProps {
  experiencesLowConfidence: ExperiencesLowConfidence | null
}

const LowConfidenceExperiencesCard: FC<LowConfidenceExperiencesCardProps> = ({ experiencesLowConfidence }) => (
  <Card
    title={<Space><WarningOutlined /> 低置信度经验清单 <Tag color="volcano">置信度 &lt; {experiencesLowConfidence?.max_confidence ?? 0.5}</Tag></Space>}
    style={{ marginBottom: 24 }}
  >
    {experiencesLowConfidence ? (
      experiencesLowConfidence.items.length > 0 ? (
        <List
          size="small"
          dataSource={experiencesLowConfidence.items}
          renderItem={(item) => {
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
                      <Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: '100%' }}>
                        {item.key_learnings}
                      </Text>
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
)

export default LowConfidenceExperiencesCard