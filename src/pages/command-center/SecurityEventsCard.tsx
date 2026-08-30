/**
 * 安全事件近况卡片
 *
 * 展示安全事件趋势和事件列表。
 */
import { useNavigate } from 'react-router-dom'
import { Badge, Card, Empty, List, Space, Tag, Typography } from 'antd'
import { SafetyOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import SecurityTrendSection from '../../components/SecurityTrendSection'
import SecurityEventListItem from '../../components/SecurityEventListItem'

interface SecurityEventsCardProps {
  securityEvents: any[]
  securityTrend: any
  securityByAgent: any
  criticalEvents: number
  onShowDetail: (event: any) => void
}

const SecurityEventsCard: FC<SecurityEventsCardProps> = ({
  securityEvents,
  securityTrend,
  securityByAgent,
  criticalEvents,
  onShowDetail,
}) => {
  const navigate = useNavigate()

  return (
    <Card
      title={<Space><SafetyOutlined /> 安全事件近况</Space>}
      variant="borderless"
      extra={criticalEvents > 0 ? <Tag color="error">{criticalEvents} 高危</Tag> : <Tag>正常</Tag>}
    >
      <SecurityTrendSection
        trend={securityTrend}
        byAgent={securityByAgent}
        onAgentClick={(agentId) => agentId && navigate(`/todo-for-ai/pages/agents?agent_id=${agentId}`)}
      />
      {securityEvents.length > 0 ? (
        <List
          size="small"
          dataSource={securityEvents.slice(0, 8)}
          renderItem={(e: any) => (
            <SecurityEventListItem
              event={e}
              variant="compact"
              onRunClick={(runId) => navigate(`/todo-for-ai/pages/workflows?run_id=${runId}`)}
              onShowDetail={(ev) => onShowDetail(ev)}
            />
          )}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无安全事件" />
      )}
    </Card>
  )
}

export default SecurityEventsCard