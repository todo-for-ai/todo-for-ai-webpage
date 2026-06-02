import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Empty,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { RobotOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { taskReviewApi, type ReviewTask } from '../api/taskReview.js'
import { getErrorMessage } from '../utils/errorUtils.js'
import TaskReviewPanel from './TaskReviewPanel.js'

interface ReviewQueueProps {
  workspaceId: number
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return `${diffSec} 秒前`
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  return `${diffDay} 天前`
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ workspaceId }) => {
  const [items, setItems] = useState<ReviewTask[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [reviewTarget, setReviewTarget] = useState<ReviewTask | null>(null)

  const loadPending = useCallback(async () => {
    try {
      setLoading(true)
      const data = await taskReviewApi.listPending(workspaceId, page)
      setItems(data.items || [])
      setTotal(data.total)
    } catch (error) {
      message.error(getErrorMessage(error, '加载待审查任务失败'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, page])

  useEffect(() => {
    loadPending()
  }, [loadPending])

  const handleReviewed = useCallback(() => {
    setReviewTarget(null)
    loadPending()
  }, [loadPending])

  const columns: ColumnsType<ReviewTask> = [
    {
      title: '任务名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record) => (
        <Typography.Text ellipsis title={title}>
          {title || `#${record.id}`}
        </Typography.Text>
      ),
    },
    {
      title: '创建者',
      dataIndex: 'creator_type',
      key: 'creator',
      width: 120,
      render: (creatorType: string) => {
        const isAI = creatorType === 'ai'
        return (
          <Tag
            icon={isAI ? <RobotOutlined /> : <UserOutlined />}
            color={isAI ? 'blue' : 'green'}
          >
            {isAI ? 'AI' : 'Human'}
          </Tag>
        )
      },
    },
    {
      title: '提交时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 140,
      render: (val: string) => formatRelativeTime(val),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: ReviewTask) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setReviewTarget(record)}
        >
          审查
        </Button>
      ),
    },
  ]

  return (
    <Card
      title={
        <Space>
          <span>待审查任务</span>
          <Badge count={total} overflowCount={99} size="small" />
        </Space>
      }
    >
      {loading && items.length === 0 ? (
        <Spin style={{ display: 'block', margin: '20px auto' }} />
      ) : items.length === 0 ? (
        <Empty description="暂无待审查任务" />
      ) : (
        <Table
          rowKey="id"
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
        title={`审查任务${reviewTarget ? `: ${reviewTarget.title || `#${reviewTarget.id}`}` : ''}`}
        open={!!reviewTarget}
        onCancel={() => setReviewTarget(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {reviewTarget && (
          <TaskReviewPanel
            taskId={reviewTarget.id}
            feedbackContent={reviewTarget.feedback_content}
            creatorType={reviewTarget.creator_type}
            creatorIdentifier={reviewTarget.creator_identifier}
            onReviewed={handleReviewed}
          />
        )}
      </Modal>
    </Card>
  )
}

export default ReviewQueue
