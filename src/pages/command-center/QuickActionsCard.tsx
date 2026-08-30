/**
 * 指挥中心快捷操作卡片
 *
 * 提供立即编排、自动解决冲突、导出安全事件三个快捷操作按钮。
 */
import { Card, Space, Button, Popconfirm } from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import type { FC } from 'react'

interface QuickActionsCardProps {
  conflictActive: number
  actionLoading: string | null
  onOrchestrate: () => void
  onAutoResolve: () => void
  onExport: () => void
}

const QuickActionsCard: FC<QuickActionsCardProps> = ({
  conflictActive,
  actionLoading,
  onOrchestrate,
  onAutoResolve,
  onExport,
}) => (
  <Card variant="borderless" style={{ marginBottom: 16 }}>
    <Space wrap>
      <Popconfirm
        title="立即执行全局编排？"
        description="健康检查 + 工作流超时 + 触发器 + 冲突自动解决"
        onConfirm={onOrchestrate}
      >
        <Button type="primary" icon={<ThunderboltOutlined />} loading={actionLoading === 'orchestrate'}>
          立即编排
        </Button>
      </Popconfirm>
      <Popconfirm
        title="自动解决低严重度冲突？"
        description="仅处理非 CRITICAL 且策略安全的冲突"
        onConfirm={onAutoResolve}
      >
        <Button icon={<CheckCircleOutlined />} loading={actionLoading === 'resolve'} disabled={conflictActive === 0}>
          自动解决冲突
        </Button>
      </Popconfirm>
      <Button icon={<DownloadOutlined />} onClick={onExport} loading={actionLoading === 'export'}>
        导出安全事件
      </Button>
    </Space>
  </Card>
)

export default QuickActionsCard
