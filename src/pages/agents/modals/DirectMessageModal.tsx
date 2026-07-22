import React from 'react'
import { Input, Modal, Select, Typography } from 'antd'
import type { Agent } from '../../../api/agents'

const { Text } = Typography

export interface DirectMessageModalProps {
  open: boolean
  from: Agent | null
  to: Agent | null
  content: string
  sending: boolean
  agents: Agent[]
  onCancel: () => void
  onOk: () => void
  onToChange: (agent: Agent | null) => void
  onContentChange: (content: string) => void
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  open,
  from,
  to,
  content,
  sending,
  agents,
  onCancel,
  onOk,
  onToChange,
  onContentChange,
}) => {
  return (
    <Modal
      title={`发送消息 — ${from?.name || ''}`}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={sending}
      okText="发送"
      cancelText="取消"
    >
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary">
          从 <Text strong>{from?.name}</Text> 向指定 Agent 发送直接消息。
        </Text>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Text style={{ display: 'block', marginBottom: 4 }}>接收方 Agent</Text>
        <Select
          style={{ width: '100%' }}
          placeholder="选择接收方 Agent"
          value={to?.id}
          onChange={id => onToChange(agents.find(a => a.id === id) || null)}
          options={agents.filter(a => a.id !== from?.id).map(a => ({
            value: a.id,
            label: `${a.name} (${a.kind})`,
          }))}
        />
      </div>
      <Input.TextArea
        rows={4}
        placeholder="请输入消息内容..."
        value={content}
        onChange={e => onContentChange(e.target.value)}
        maxLength={1000}
        showCount
      />
    </Modal>
  )
}

export default DirectMessageModal
