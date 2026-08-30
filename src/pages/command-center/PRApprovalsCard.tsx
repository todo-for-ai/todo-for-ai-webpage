/**
 * 指挥中心 PR 审批卡片（L0 审批队列前端入口）
 *
 * 展示当前用户可管理项目中待审批的 PR 创建/合并请求（AgentTaskEvent
 * interaction_request 事件），支持批准（执行对应动作）与拒绝。
 */
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, List, Popconfirm, Space, Tag, Tooltip } from 'antd'
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MergeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { FC } from 'react'
import { App } from 'antd'
import { tasksApi, type PendingPrApproval } from '../../api/tasks'

const TYPE_META: Record<PendingPrApproval['interaction_type'], { label: string; color: string }> = {
  pr_create: { label: '创建 PR', color: 'blue' },
  pr_merge: { label: '合并 PR', color: 'purple' },
}

const PRApprovalsCard: FC = () => {
  const { message } = App.useApp()
  const [items, setItems] = useState<PendingPrApproval[]>([])
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await tasksApi.getPendingPrApprovals()
      setItems(data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const decide = useCallback(
    async (item: PendingPrApproval, decision: 'approved' | 'rejected') => {
      setActing(item.interaction_id)
      try {
        await tasksApi.approvePrInteraction(item.task_id, {
          interaction_id: item.interaction_id,
          decision,
        })
        message.success(decision === 'approved' ? '已批准并执行' : '已拒绝')
        await load()
      } catch (error: any) {
        message.error(error?.message || '审批操作失败')
      } finally {
        setActing(null)
      }
    },
    [message, load],
  )

  return (
    <Card
      title={
        <span>
          <MergeOutlined /> PR 审批队列
        </span>
      }
      extra={
        <Button size="small" icon={<ReloadOutlined />} onClick={load} loading={loading}>
          刷新
        </Button>
      }
      variant="borderless"
      style={{ marginBottom: 16 }}
    >
      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: '没有待审批的 PR 请求' }}
        renderItem={(item) => {
          const meta = TYPE_META[item.interaction_type] ?? { label: item.interaction_type, color: 'default' }
          return (
            <List.Item
              actions={[
                <Popconfirm
                  key="approve"
                  title={item.interaction_type === 'pr_merge' ? '批准并合并该 PR？' : '批准并创建该 PR？'}
                  onConfirm={() => decide(item, 'approved')}
                >
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    loading={acting === item.interaction_id}
                  >
                    批准
                  </Button>
                </Popconfirm>,
                <Popconfirm
                  key="reject"
                  title="拒绝该请求？"
                  onConfirm={() => decide(item, 'rejected')}
                >
                  <Button danger size="small" icon={<CloseCircleOutlined />}>
                    拒绝
                  </Button>
                </Popconfirm>,
              ]}
            >
              <Space direction="vertical" size={0}>
                <Space wrap>
                  <Tag color={meta.color}>{meta.label}</Tag>
                  <a
                    href={`/todo-for-ai/pages/tasks/${item.task_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ApiOutlined /> 任务 #{item.task_id}
                  </a>
                  {item.task_title && <span>{item.task_title}</span>}
                </Space>
                <Space wrap size={4}>
                  {item.repo_full_name && <Tooltip title={item.repo_full_name}><Tag>{item.repo_full_name}</Tag></Tooltip>}
                  {item.pr_number && <Tag>PR #{item.pr_number}</Tag>}
                  {item.head_branch && <Tag color="cyan">{item.head_branch}</Tag>}
                  {item.requested_at && (
                    <span style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary, #999)' }}>
                      {new Date(item.requested_at).toLocaleString()}
                    </span>
                  )}
                </Space>
              </Space>
            </List.Item>
          )
        }}
      />
    </Card>
  )
}

export default PRApprovalsCard
