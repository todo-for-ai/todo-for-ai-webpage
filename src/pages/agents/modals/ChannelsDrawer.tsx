import React from 'react'
import {
  Button,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  DeleteOutlined,
  PlusOutlined,
  SendOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { Agent } from '../../../api/agents'

const { Text } = Typography

export interface Channel {
  id: number
  name: string
  description?: string
  task_id?: number
  project_id?: number
  members?: any[]
}

export interface ChannelFormData {
  name: string
  description: string
  agent_ids: number[]
}

export interface ChannelActivityData {
  channel_id: number
  daily_counts: number[]
  active_members: number
}

export interface ChannelActivityTrend {
  channels: ChannelActivityData[]
}

export interface ChatMessage {
  id: number
  sender_type: string
  sender_name: string
  content: string
  created_at?: string
}

export interface ChannelsDrawerProps {
  open: boolean
  channels: Channel[]
  agents: Agent[]
  activityTrend: ChannelActivityTrend | null
  createOpen: boolean
  createForm: ChannelFormData
  chatOpen: boolean
  chatChannel: Channel | null
  chatMessages: ChatMessage[]
  chatInput: string
  chatSending: boolean
  onClose: () => void
  onCreateOpenChange: (open: boolean) => void
  onCreateFormChange: (form: ChannelFormData) => void
  onCreate: () => void
  onOpenChat: (channel: Channel) => void
  onDeleteChannel: (channelId: number) => void
  onChatInputChange: (input: string) => void
  onSendChatMessage: () => void
  onCloseChat: () => void
}

const ChannelsDrawer: React.FC<ChannelsDrawerProps> = ({
  open,
  channels,
  agents,
  activityTrend,
  createOpen,
  createForm,
  chatOpen,
  chatChannel,
  chatMessages,
  chatInput,
  chatSending,
  onClose,
  onCreateOpenChange,
  onCreateFormChange,
  onCreate,
  onOpenChat,
  onDeleteChannel,
  onChatInputChange,
  onSendChatMessage,
  onCloseChat,
}) => {
  return (
    <>
      {/* Channels Modal */}
      <Modal
        title="协作频道"
        open={open}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onCreateOpenChange(true)}>创建频道</Button>
        </div>
        <List
          size="small"
          dataSource={channels}
          renderItem={(ch: any) => (
            <List.Item
              actions={[
                <Button key="chat" size="small" type="primary" onClick={() => onOpenChat(ch)}>进入</Button>,
                <Popconfirm key="del" title="确定删除此频道？" onConfirm={() => onDeleteChannel(ch.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Space><TeamOutlined />{ch.name}<Tag>{(ch.members || []).length} 成员</Tag></Space>}
                description={
                  <div>
                    <span>{ch.description || (ch.task_id ? `任务 #${ch.task_id}` : ch.project_id ? `项目 #${ch.project_id}` : '全局频道')}</span>
                    {activityTrend && (() => {
                      const chActivity = activityTrend.channels.find((ca: any) => ca.channel_id === ch.id)
                      if (!chActivity || chActivity.daily_counts.length < 2) return null
                      const maxV = Math.max(1, ...chActivity.daily_counts)
                      const sparkW = 120
                      const sparkH = 20
                      const pts = chActivity.daily_counts.map((v: number, i: number) => `${(i / (chActivity.daily_counts.length - 1)) * sparkW},${sparkH - (v / maxV) * (sparkH - 2)}`).join(' ')
                      return (
                        <div style={{ marginTop: 4 }}>
                          <svg width={sparkW} height={sparkH} style={{ display: 'block' }}>
                            <polyline points={pts} fill="none" stroke="#1890ff" strokeWidth={1.5} />
                          </svg>
                          <Text type="secondary" style={{ fontSize: 9, marginLeft: 4 }}>活跃成员 {chActivity.active_members}</Text>
                        </div>
                      )
                    })()}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Create Channel Modal */}
      <Modal
        title="创建协作频道"
        open={createOpen}
        onCancel={() => onCreateOpenChange(false)}
        onOk={onCreate}
      >
        <Form layout="vertical">
          <Form.Item label="频道名称" required>
            <Input value={createForm.name} onChange={e => onCreateFormChange({ ...createForm, name: e.target.value })} placeholder="例如：代码审查讨论" />
          </Form.Item>
          <Form.Item label="描述">
            <Input.TextArea value={createForm.description} onChange={e => onCreateFormChange({ ...createForm, description: e.target.value })} placeholder="频道用途说明" rows={2} />
          </Form.Item>
          <Form.Item label="初始成员（Agent）">
            <Select
              mode="multiple"
              value={createForm.agent_ids}
              onChange={v => onCreateFormChange({ ...createForm, agent_ids: v as number[] })}
              style={{ width: '100%' }}
              options={agents.map(a => ({ value: a.id, label: `${a.name} (${a.kind})` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Chat Modal */}
      <Modal
        title={`频道: ${chatChannel?.name || ''}`}
        open={chatOpen}
        onCancel={onCloseChat}
        footer={null}
        width={700}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 8 }}>
          {chatMessages.length === 0 ? (
            <Empty description="暂无消息" />
          ) : (
            chatMessages.map((msg: any) => (
              <div key={msg.id} style={{ marginBottom: 8, padding: '6px 10px', background: msg.sender_type === 'human' ? '#e6f7ff' : '#fff', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text strong style={{ fontSize: 12 }}>{msg.sender_name || '未知'}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</Text>
                </div>
                <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            value={chatInput}
            onChange={e => onChatInputChange(e.target.value)}
            onPressEnter={onSendChatMessage}
            placeholder="输入消息..."
            disabled={chatSending}
          />
          <Button type="primary" onClick={onSendChatMessage} loading={chatSending} icon={<SendOutlined />}>发送</Button>
        </div>
      </Modal>
    </>
  )
}

export default ChannelsDrawer