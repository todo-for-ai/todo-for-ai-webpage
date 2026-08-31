import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
  message,
} from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  approvalsApi,
  type ApprovalStats,
  type PendingApproval,
} from '../api/approvals'
import { getErrorMessage } from '../utils/errorUtils'

interface ApprovalQueueProps {
  workspaceId: number
}

const RISK_COLORS: Record<string, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'green',
}

const SENSITIVITY_COLORS: Record<string, string> = {
  restricted: 'red',
  confidential: 'orange',
  internal: 'blue',
  public: 'green',
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ workspaceId }) => {
  const [items, setItems] = useState<PendingApproval[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ApprovalStats>({ pending: 0, approved_today: 0 })

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<PendingApproval | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)

  // Action loading per row (track by event_id)
  const [actioningIds, setActioningIds] = useState<Set<number>>(new Set())

  const loadStats = useCallback(async () => {
    try {
      const data = await approvalsApi.getStats(workspaceId)
      setStats(data)
    } catch (error) {
      console.error('Failed to load approval stats:', error)
    }
  }, [workspaceId])

  const loadPending = useCallback(async () => {
    try {
      setLoading(true)
      const data = await approvalsApi.getPending(workspaceId, page)
      setItems(data.items || [])
      setTotal(data.total)
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to load pending approvals'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, page])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadPending()
  }, [loadPending])

  const refreshAll = useCallback(() => {
    loadStats()
    loadPending()
  }, [loadStats, loadPending])

  const handleApprove = async (record: PendingApproval) => {
    try {
      setActioningIds((prev) => new Set(prev).add(record.event_id))
      await approvalsApi.approve(workspaceId, record.task_id, record.interaction_id)
      message.success('Approved')
      refreshAll()
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to approve'))
    } finally {
      setActioningIds((prev) => {
        const next = new Set(prev)
        next.delete(record.event_id)
        return next
      })
    }
  }

  const openRejectModal = (record: PendingApproval) => {
    setRejectTarget(record)
    setRejectReason('')
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    if (!rejectReason.trim()) {
      message.warning('Please provide a reason for rejection')
      return
    }

    try {
      setRejectLoading(true)
      setActioningIds((prev) => new Set(prev).add(rejectTarget.event_id))
      await approvalsApi.reject(
        workspaceId,
        rejectTarget.task_id,
        rejectTarget.interaction_id,
        rejectReason.trim()
      )
      message.success('Rejected')
      setRejectTarget(null)
      setRejectReason('')
      refreshAll()
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to reject'))
    } finally {
      setRejectLoading(false)
      if (rejectTarget) {
        setActioningIds((prev) => {
          const next = new Set(prev)
          next.delete(rejectTarget.event_id)
          return next
        })
      }
    }
  }

  const columns: ColumnsType<PendingApproval> = [
    {
      title: 'Agent',
      dataIndex: 'agent_name',
      key: 'agent',
      render: (name: string | null, record) => (
        <Space>
          <RobotOutlined style={{ color: '#1677ff' }} />
          <span>{name || record.agent_id}</span>
        </Space>
      ),
    },
    {
      title: 'Task',
      dataIndex: 'task_title',
      key: 'task',
      render: (title: string | null, record) => title || `#${record.task_id}`,
    },
    {
      title: 'Type',
      dataIndex: 'interaction_type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Risk',
      dataIndex: 'risk_tier',
      key: 'risk',
      render: (tier: string) => (
        <Tag color={RISK_COLORS[tier.toLowerCase()] || 'default'}>{tier}</Tag>
      ),
    },
    {
      title: 'Sensitivity',
      dataIndex: 'sensitivity_level',
      key: 'sensitivity',
      render: (level: string) => (
        <Tag color={SENSITIVITY_COLORS[level.toLowerCase()] || 'default'}>{level}</Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'time',
      render: (val: string) => new Date(val).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PendingApproval) => {
        const isLoading = actioningIds.has(record.event_id)
        return (
          <Space>
            <Popconfirm
              title="Approve this interaction?"
              onConfirm={() => handleApprove(record)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={isLoading}
              >
                Approve
              </Button>
            </Popconfirm>
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => openRejectModal(record)}
              disabled={isLoading}
            >
              Reject
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <Card title="Approval Queue">
      <Space style={{ marginBottom: 16 }}>
        <Badge count={stats.pending} offset={[6, 0]} size="small">
          <Tag color="orange">Pending</Tag>
        </Badge>
        <Tag color="green">Approved today: {stats.approved_today}</Tag>
      </Space>

      {loading && items.length === 0 ? (
        <Spin style={{ display: 'block', margin: '20px auto' }} />
      ) : items.length === 0 ? (
        <Empty description="No pending approvals" />
      ) : (
        <Table
          rowKey="event_id"
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            showSizeChanger: false,
          }}
          onChange={(paginationInfo) => {
            setPage(paginationInfo.current || 1)
          }}
          size="small"
        />
      )}

      <Modal
        title="Reject Interaction"
        open={!!rejectTarget}
        onOk={handleReject}
        onCancel={() => {
          setRejectTarget(null)
          setRejectReason('')
        }}
        confirmLoading={rejectLoading}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: 12 }}>
          Please provide a reason for rejecting this interaction.
        </div>
        <Input.TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason for rejection..."
          rows={3}
        />
      </Modal>
    </Card>
  )
}

export default ApprovalQueue
