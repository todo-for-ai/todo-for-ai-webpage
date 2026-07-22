import React from 'react'
import { Form, Input, Modal, Space, Typography } from 'antd'
import type { ReviewQueueItem } from '../../../api/agents'

const { Text } = Typography
const { TextArea } = Input

export interface FeedbackModalProps {
  open: boolean
  submitting: boolean
  reviewItem: ReviewQueueItem | null
  form: ReturnType<typeof Form.useForm>[0]
  onOk: () => void
  onCancel: () => void
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  submitting,
  reviewItem,
  form,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title="提交人工反馈"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={submitting}
      okText="提交并继续"
      cancelText="取消"
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {reviewItem && (
          <Space direction="vertical" size={2}>
            <Text strong>
              #{reviewItem.assignment.task_id} {reviewItem.task?.title || reviewItem.assignment.task?.title || '未加载任务标题'}
            </Text>
            <Text type="secondary">
              {reviewItem.agent?.name || reviewItem.assignment.agent?.name || `Agent #${reviewItem.assignment.agent_id}`}
            </Text>
          </Space>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="feedback_content"
            label="反馈内容"
            rules={[{ required: true, message: '请输入要交给 Agent 的反馈或补充信息' }]}
          >
            <TextArea rows={5} placeholder="说明需要调整的方向、补充约束或继续执行所需的信息" />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  )
}

export default FeedbackModal
