import { Space, Tag } from 'antd'
import './ActivitySummary.css'

interface ActivitySummaryProps {
  sourceSummary: Record<string, number>
  levelSummary: Record<string, number>
  getActivitySourceLabel: (value?: string | null) => string
  getActivityLevelLabel: (value?: string | null) => string
}

export function ActivitySummary({
  sourceSummary,
  levelSummary,
  getActivitySourceLabel,
  getActivityLevelLabel,
}: ActivitySummaryProps) {
  return (
    <Space wrap size={[8, 8]} className='activity-summary'>
      {Object.entries(sourceSummary).map(([sourceKey, count]) => (
        <Tag key={sourceKey}>
          {getActivitySourceLabel(sourceKey)}: {count}
        </Tag>
      ))}
      {Object.entries(levelSummary).map(([levelKey, count]) => (
        <Tag key={`level-${levelKey}`}>
          {getActivityLevelLabel(levelKey)}: {count}
        </Tag>
      ))}
    </Space>
  )
}
