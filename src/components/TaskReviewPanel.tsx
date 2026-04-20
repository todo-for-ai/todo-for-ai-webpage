import { useState } from 'react'
import { Button, Card, Input, Modal, Space, Spin, Typography, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, RobotOutlined } from '@ant-design/icons'
import { taskReviewApi } from '../api/taskReview.js'
import { getErrorMessage } from '../utils/errorUtils.js'

interface TaskReviewPanelProps {
  taskId: number
  feedbackContent?: string
  creatorType?: string
  creatorIdentifier?: string
  onReviewed?: (approved: boolean) => void
}

const TaskReviewPanel: React.FC<TaskReviewPanelProps> = ({
  taskId,
  feedbackContent,
  creatorType,
  creatorIdentifier,
  onReviewed,
}) => {
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectComment, setRejectComment] = useState('')

  const isAI = creatorType === 'ai'

  const handleApprove = async () => {
    try {
      setActionLoading('approve')
      await taskReviewApi.submitReview(taskId, 'approve')
      message.success('已通过')
      onReviewed?.(true)
    } catch (error) {
      message.error(getErrorMessage(error, '审核操作失败'))
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectModal = () => {
    setRejectComment('')
    setRejectModalOpen(true)
  }

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      message.warning('请填写驳回理由')
      return
    }

    try {
      setActionLoading('reject')
      await taskReviewApi.submitReview(taskId, 'reject', rejectComment.trim())
      message.success('已驳回')
      setRejectModalOpen(false)
      onReviewed?.(false)
    } catch (error) {
      message.error(getErrorMessage(error, '审核操作失败'))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <>
      <Card
        title={
          <Space>
            <span>任务 #{taskId}</span>
            {isAI && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1677ff', fontSize: 13 }}>
                <RobotOutlined />
                {creatorIdentifier || 'AI'}
              </span>
            )}
          </Space>
        }
        styles={{ body: { padding: '16px 24px' } }}
      >
        <div style={{ marginBottom: 16 }}>
          {feedbackContent ? (
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {feedbackContent}
            </Typography.Paragraph>
          ) : (
            <Typography.Text type="secondary">Agent 未提交反馈内容</Typography.Text>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            loading={actionLoading === 'approve'}
            disabled={actionLoading !== null}
            onClick={handleApprove}
          >
            通过
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            loading={actionLoading === 'reject'}
            disabled={actionLoading !== null}
            onClick={openRejectModal}
          >
            驳回
          </Button>
        </div>
      </Card>

      <Modal
        title="驳回任务"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={actionLoading === 'reject'}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        cancelButtonProps={{ disabled: actionLoading === 'reject' }}
      >
        <div style={{ marginBottom: 12 }}>
          <Typography.Text>请填写驳回理由：</Typography.Text>
        </div>
        <Input.TextArea
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          placeholder="请输入驳回理由..."
          rows={4}
          required
        />
      </Modal>
    </>
  )
}

export default TaskReviewPanel
