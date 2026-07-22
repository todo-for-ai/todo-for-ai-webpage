import React from 'react'
import { Button, Card, Progress, Select, Space, Table, Tag, Typography } from 'antd'
import { CheckCircleOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ReviewQueueAction, ReviewQueueItem } from '../../../api/agents'
import { reviewActionOptions, reviewActionLabel, reviewActionColor, stateColor, formatDateTime } from '../utils'

const { Text } = Typography

export interface ReviewQueueSectionProps {
  items: ReviewQueueItem[]
  loading: boolean
  actionFilter: ReviewQueueAction
  onActionFilterChange: (value: ReviewQueueAction) => void
  onRefresh: () => void
  onUpdateItem: (item: ReviewQueueItem, action: 'approve' | 'resume' | 'cancel') => void
}

const ReviewQueueSection: React.FC<ReviewQueueSectionProps> = ({
  items,
  loading,
  actionFilter,
  onActionFilterChange,
  onRefresh,
  onUpdateItem,
}) => {
  const columns = [
    {
      title: '任务',
      key: 'task',
      render: (_: unknown, record: ReviewQueueItem) => (
        <Space direction="vertical" size={2}>
          <Text strong>#{record.assignment.task_id} {record.task?.title || record.assignment.task?.title || '未加载任务标题'}</Text>
          <Text type="secondary">{record.task?.project?.name || record.assignment.task?.project?.name || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Agent',
      key: 'agent',
      width: 180,
      render: (_: unknown, record: ReviewQueueItem) => (
        <Space direction="vertical" size={2}>
          <Text>{record.agent?.name || record.assignment.agent?.name || `Agent #${record.assignment.agent_id}`}</Text>
          <Text type="secondary">{record.agent?.model || record.agent?.kind || record.assignment.agent?.kind || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '处理类型',
      dataIndex: 'action',
      key: 'action',
      width: 130,
      render: (action: ReviewQueueItem['action']) => (
        <Tag color={reviewActionColor[action]}>{reviewActionLabel[action]}</Tag>
      ),
    },
    {
      title: '派发状态',
      key: 'state',
      width: 120,
      render: (_: unknown, record: ReviewQueueItem) => (
        <Tag color={stateColor[record.assignment.state]}>{record.assignment.state}</Tag>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 130,
      render: (_: unknown, record: ReviewQueueItem) => (
        <Progress percent={record.assignment.progress_rate || 0} size="small" />
      ),
    },
    {
      title: '更新时间',
      key: 'updated_at',
      width: 190,
      render: (_: unknown, record: ReviewQueueItem) => formatDateTime(record.assignment.updated_at),
    },
    {
      title: '操作',
      key: 'actions',
      width: 300,
      render: (_: unknown, record: ReviewQueueItem) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} href={`/todo-for-ai/pages/tasks/${record.assignment.task_id}`}>
            详情
          </Button>
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => onUpdateItem(record, 'approve')}>
            通过
          </Button>
          <Button size="small" onClick={() => onUpdateItem(record, 'resume')}>
            继续
          </Button>
          <Button size="small" danger onClick={() => onUpdateItem(record, 'cancel')}>
            取消
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="人工审核队列"
      style={{ marginBottom: 16 }}
      extra={(
        <Space>
          <Select
            value={actionFilter}
            style={{ width: 140 }}
            onChange={onActionFilterChange}
            options={reviewActionOptions}
          />
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>刷新</Button>
        </Space>
      )}
    >
      <Table
        columns={columns}
        dataSource={items}
        rowKey={record => record.assignment.id}
        loading={loading}
        pagination={{ pageSize: 5 }}
      />
    </Card>
  )
}

export default ReviewQueueSection
