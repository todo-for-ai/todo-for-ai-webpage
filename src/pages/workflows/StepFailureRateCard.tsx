/**
 * 步骤失败率排行卡片
 *
 * 展示各步骤的失败率排行条形图。
 */
import { Card, Space, Typography } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import type { WorkflowStepFailureRate } from '../../api/agents'

const { Text } = Typography

interface StepFailureRateCardProps {
  stepFailureRate: WorkflowStepFailureRate | null
}

const StepFailureRateCard: React.FC<StepFailureRateCardProps> = ({ stepFailureRate }) => {
  if (!stepFailureRate || stepFailureRate.items.length === 0) return null

  const items = stepFailureRate.items
  const maxRate = Math.max(...items.map(it => it.failure_rate), 1)
  const barMaxW = 200

  return (
    <Card
      title={<Space><WarningOutlined /> 步骤失败率排行</Space>}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>共 {stepFailureRate.total_steps} 步 · {stepFailureRate.total_failed} 失败</Text>}
      style={{ marginBottom: 24 }}
    >
      {items.map((it, idx) => {
        const barW = Math.max(2, (it.failure_rate / maxRate) * barMaxW)
        const ratio = it.failure_rate / 100
        const barColor = ratio < 0.1 ? '#52c41a' : ratio < 0.3 ? '#faad14' : '#ff4d4f'
        return (
          <div key={it.step_key} style={{ display: 'flex', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <Text style={{ width: 140, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.step_key}>{it.step_key}</Text>
            <svg width={barMaxW + 4} height={14} style={{ flexShrink: 0 }}>
              <rect x={0} y={2} width={barMaxW} height={10} rx={2} fill="#f5f5f5" />
              <rect x={0} y={2} width={barW} height={10} rx={2} fill={barColor} />
            </svg>
            <Text style={{ fontSize: 11, color: barColor, minWidth: 44 }}>{it.failure_rate.toFixed(1)}%</Text>
            <Text type="secondary" style={{ fontSize: 10 }}>{it.failed}/{it.total}</Text>
          </div>
        )
      })}
    </Card>
  )
}

export default StepFailureRateCard
