/**
 * 步骤重试拓扑卡片
 *
 * 展示各步骤的重试次数、首次/重试成功率。
 */
import { Card, Space, Typography } from 'antd'
import { RetweetOutlined } from '@ant-design/icons'
import type { WorkflowStepRetryTopology } from '../../api/agents'

const { Text } = Typography

interface StepRetryTopologyCardProps {
  stepRetryTopology: WorkflowStepRetryTopology | null
}

const StepRetryTopologyCard: React.FC<StepRetryTopologyCardProps> = ({ stepRetryTopology }) => {
  if (!stepRetryTopology || stepRetryTopology.steps.length === 0) return null

  const steps = stepRetryTopology.steps
  const maxRetries = Math.max(...steps.map(s => s.retries), 1)

  return (
    <Card
      title={<Space><RetweetOutlined /> 步骤重试拓扑</Space>}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {stepRetryTopology.days} 天 · {stepRetryTopology.total_retries} 次重试</Text>}
      style={{ marginBottom: 24 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => {
          const barW = Math.max((s.retries / maxRetries) * 120, 4)
          const firstColor = s.first_attempt_success_rate >= 80 ? '#52c41a' : s.first_attempt_success_rate >= 50 ? '#faad14' : '#ff4d4f'
          const retryColor = s.retry_success_rate >= 80 ? '#52c41a' : s.retry_success_rate >= 50 ? '#faad14' : '#ff4d4f'
          return (
            <div key={s.step_key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.step_key}>{s.step_key.length > 16 ? s.step_key.slice(0, 15) + '…' : s.step_key}</Text>
                <svg width={124} height={12} style={{ flexShrink: 0 }}>
                  <rect x={0} y={1} width={120} height={10} rx={2} fill="#f5f5f5" />
                  <rect x={0} y={1} width={barW} height={10} rx={2} fill="#fa8c16" opacity={0.7} />
                </svg>
                <Text style={{ fontSize: 11, color: '#fa8c16', fontWeight: 600 }}>{s.retries}</Text>
                <Text type="secondary" style={{ fontSize: 10 }}>重试率 {s.retry_rate}%</Text>
              </div>
              <div style={{ display: 'flex', gap: 12, marginLeft: 148 }}>
                <Text style={{ fontSize: 10, color: firstColor }}>首次成功 {s.first_attempt_success_rate}%</Text>
                <Text style={{ fontSize: 10, color: retryColor }}>重试成功 {s.retry_success_rate}%</Text>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default StepRetryTopologyCard
