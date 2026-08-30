/**
 * 定时触发器卡片
 *
 * 展示工作流的 Cron 和一次性触发器列表。
 */
import { Button, Card, Empty, Popconfirm, Space, Spin, Table, Tag, Tooltip } from 'antd'
import { ClockCircleOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import type { FC } from 'react'

interface TriggerItem {
  id: number
  name: string
  workflow_id: number
  cron_expr?: string
  one_shot_at?: string
  next_fire_at?: string
  fire_count?: number
  is_active: boolean
}

interface ScheduledTriggersCardProps {
  triggers: TriggerItem[]
  triggerLoading: boolean
  workflows: Array<{ id: number; name: string }>
  onRefresh: () => void
  onAddTrigger: () => void
  onToggleTrigger: (trigger: TriggerItem) => void
  onDeleteTrigger: (id: number) => void
}

const ScheduledTriggersCard: FC<ScheduledTriggersCardProps> = ({
  triggers,
  triggerLoading,
  workflows,
  onRefresh,
  onAddTrigger,
  onToggleTrigger,
  onDeleteTrigger,
}) => (
  <Card
    title={
      <Space>
        <ClockCircleOutlined />
        定时触发器
      </Space>
    }
    extra={
      <Space>
        <Button size="small" onClick={onRefresh}>刷新</Button>
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddTrigger}
        >
          添加触发器
        </Button>
      </Space>
    }
  >
    <Spin spinning={triggerLoading}>
      {triggers.length === 0 ? (
        <Empty description="暂无触发器。添加一个 Cron 或一次性触发器来自动执行工作流" />
      ) : (
        <Table
          size="small"
          dataSource={triggers}
          rowKey="id"
          pagination={false}
          columns={[
            {
              title: '名称',
              dataIndex: 'name',
              render: (name: string, r: TriggerItem) => (
                <Space>
                  <span>{name}</span>
                  <Tag color={r.is_active ? 'green' : 'default'}>{r.is_active ? '启用' : '停用'}</Tag>
                </Space>
              ),
            },
            {
              title: '工作流',
              dataIndex: 'workflow_id',
              render: (id: number) => {
                const wf = workflows.find(w => w.id === id)
                return wf ? wf.name : `#${id}`
              },
            },
            {
              title: '调度',
              render: (_: unknown, r: TriggerItem) => (
                r.cron_expr
                  ? <Tooltip title="Cron 表达式"><Tag color="blue">{r.cron_expr}</Tag></Tooltip>
                  : r.one_shot_at
                    ? <Tooltip title="一次性触发"><Tag color="orange">{new Date(r.one_shot_at).toLocaleString()}</Tag></Tooltip>
                    : <Tag>未设置</Tag>
              ),
            },
            {
              title: '下次触发',
              dataIndex: 'next_fire_at',
              render: (v: string) => v ? new Date(v).toLocaleString() : '-',
            },
            {
              title: '已触发',
              dataIndex: 'fire_count',
              render: (v: number) => v ?? 0,
            },
            {
              title: '操作',
              render: (_: unknown, r: TriggerItem) => (
                <Space>
                  <Button size="small" onClick={() => onToggleTrigger(r)}>
                    {r.is_active ? '停用' : '启用'}
                  </Button>
                  <Popconfirm title="确定删除此触发器？" onConfirm={() => onDeleteTrigger(r.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      )}
    </Spin>
  </Card>
)

export default ScheduledTriggersCard
