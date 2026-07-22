import React from 'react'
import { Input, Modal, Typography } from 'antd'
import type { Agent } from '../../../api/agents'

const { Text } = Typography

export interface BroadcastModalProps {
  open: boolean
  agent: Agent | null
  content: string
  sending: boolean
  onClose: () => void
  onContentChange: (content: string) => void
  onSend: () => void
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({
  open,
  agent,
  content,
  sending,
  onClose,
  onContentChange,
  onSend,
}) => {
  return (
    <Modal
      title={`广播消息 — ${agent?.name || ''}`}
      open={open}
      onCancel={onClose}
      onOk={onSend}
      confirmLoading={sending}
      okText="发送广播"
      cancelText="取消"
    >
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">
          消息将发送给所有在线（ACTIVE）的 Agent，通过 Notification 系统推送给它们。
        </Text>
      </div>
      <Input.TextArea
        rows={4}
        placeholder="请输入要广播的内容..."
        value={content}
        onChange={e => onContentChange(e.target.value)}
        maxLength={500}
        showCount
      />
    </Modal>
  )
}

export default BroadcastModal
