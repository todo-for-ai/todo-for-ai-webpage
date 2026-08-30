/**
 * 维护操作卡片
 *
 * 提供提升逾期任务优先级和执行健康检查两个快捷操作。
 */
import { Card, Space, Button, message } from 'antd'
import { ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import { agentsApi } from '../../api/agents'

interface MaintenanceActionsCardProps {
  onRefreshStats: () => void
}

const MaintenanceActionsCard: FC<MaintenanceActionsCardProps> = ({ onRefreshStats }) => (
  <Card title="维护操作" size="small" style={{ marginBottom: 16 }}>
    <Space>
      <Button
        size="small"
        icon={<ThunderboltOutlined />}
        onClick={async () => {
          try {
            const result = await agentsApi.escalateOverdueTasks()
            message.success(`已提升 ${result.escalated_count} 个逾期任务优先级`)
          } catch {
            message.error('提升逾期任务优先级失败')
          }
        }}
      >
        提升逾期任务优先级
      </Button>
      <Button
        size="small"
        icon={<ReloadOutlined />}
        onClick={async () => {
          try {
            const result = await agentsApi.healthCheck()
            message.success(
              `健康检查完成: ${result.stale_agents} 个离线 Agent, ${result.expired_leases} 个过期租约, ${result.escalated_tasks} 个提升任务`
            )
            onRefreshStats()
          } catch {
            message.error('健康检查失败')
          }
        }}
      >
        执行健康检查
      </Button>
    </Space>
  </Card>
)

export default MaintenanceActionsCard
