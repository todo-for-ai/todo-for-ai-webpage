import { Tag, Tooltip } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'

interface CreatorBadgeProps {
  creatorType?: string
  creatorName?: string
  isAiTask?: boolean
}

export default function CreatorBadge({ creatorType, creatorName, isAiTask }: CreatorBadgeProps) {
  const isAI = creatorType === 'ai' || isAiTask

  if (isAI) {
    return (
      <Tooltip title={`Agent: ${creatorName || 'AI'}`}>
        <Tag icon={<RobotOutlined />} color="blue" style={{ margin: 0, cursor: 'pointer' }}>
          {creatorName || 'AI'}
        </Tag>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={creatorName || '用户'}>
      <Tag icon={<UserOutlined />} color="green" style={{ margin: 0, cursor: 'pointer' }}>
        {creatorName || '用户'}
      </Tag>
    </Tooltip>
  )
}
