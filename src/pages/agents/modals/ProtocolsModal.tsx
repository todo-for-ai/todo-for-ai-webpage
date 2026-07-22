import React from 'react'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import {
  MessageOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { Agent } from '../../../api/agents'

const { Text } = Typography
const { Option } = Select

export interface Protocol {
  id: number
  title: string
  description?: string
  protocol_type: string
  status: string
  initiator_agent_id: number
  created_at?: string
  messages?: ProtocolMessage[]
  result?: Record<string, any>
}

export interface ProtocolMessage {
  id: number
  agent_id: number
  message_type: string
  content?: string
  payload?: Record<string, any>
}

export interface ProtocolFormData {
  protocol_type: string
  title: string
  description: string
  initiator_agent_id: number | undefined
  config: Record<string, any>
}

export interface ProtocolRespondFormData {
  protocol_id: number
  agent_id: number | undefined
  message_type: string
  content: string
}

export interface DeliberationFormData {
  protocol_id: number
  agent_id: number | undefined
  message_type: string
  content: string
}

export interface ProtocolsModalProps {
  open: boolean
  loading: boolean
  protocols: Protocol[]
  agents: Agent[]
  createOpen: boolean
  createForm: ProtocolFormData
  detailOpen: boolean
  detail: Protocol | null
  respondOpen: boolean
  respondForm: ProtocolRespondFormData
  deliberationOpen: boolean
  deliberationForm: DeliberationFormData
  onClose: () => void
  onCreateOpenChange: (open: boolean) => void
  onCreateFormChange: (form: ProtocolFormData) => void
  onCreate: () => void
  onOpenDetail: (id: number) => void
  onDetailOpenChange: (open: boolean) => void
  onDetailChange: (detail: Protocol | null) => void
  onRespondOpenChange: (open: boolean) => void
  onRespondFormChange: (form: ProtocolRespondFormData) => void
  onRespond: () => void
  onResolve: (protocolId: number, resolution: string) => void
  onDeliberationOpenChange: (open: boolean) => void
  onDeliberationFormChange: (form: DeliberationFormData) => void
  onDeliberationSubmit: () => void
}

const ProtocolsModal: React.FC<ProtocolsModalProps> = ({
  open,
  loading,
  protocols,
  agents,
  createOpen,
  createForm,
  detailOpen,
  detail,
  respondOpen,
  respondForm,
  deliberationOpen,
  deliberationForm,
  onClose,
  onCreateOpenChange,
  onCreateFormChange,
  onCreate,
  onOpenDetail,
  onDetailOpenChange,
  onDetailChange,
  onRespondOpenChange,
  onRespondFormChange,
  onRespond,
  onResolve,
  onDeliberationOpenChange,
  onDeliberationFormChange,
  onDeliberationSubmit,
}) => {
  return (
    <>
      {/* Protocols Modal */}
      <Modal
        title="协作协议"
        open={open}
        onCancel={onClose}
        footer={<Button type="primary" icon={<PlusOutlined />} onClick={() => onCreateOpenChange(true)}>创建协议</Button>}
        width={800}
      >
        <Spin spinning={loading}>
          {protocols.length === 0 && !loading ? (
            <Empty description="暂无协议" />
          ) : (
            <List
              dataSource={protocols}
              renderItem={(p: Protocol) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  actions={[
                    p.status === 'open' || p.status === 'voting' ? (
                      <Button key="respond" size="small" type="primary" onClick={(e) => { e.stopPropagation(); onRespondFormChange({ ...respondForm, protocol_id: p.id }); onRespondOpenChange(true) }}>响应</Button>
                    ) : null,
                    p.status === 'open' || p.status === 'voting' ? (
                      <Popconfirm key="reject" title="确定拒绝此协议？" onConfirm={(e: any) => { e?.stopPropagation?.(); onResolve(p.id, 'rejected') }}>
                        <Button size="small" danger onClick={(e) => e.stopPropagation()}>拒绝</Button>
                      </Popconfirm>
                    ) : null,
                  ].filter(Boolean)}
                  onClick={() => onOpenDetail(p.id)}
                >
                  <List.Item.Meta
                    title={<Space>
                      {p.title}
                      <Tag color={p.status === 'accepted' ? 'green' : p.status === 'rejected' ? 'red' : p.status === 'open' ? 'blue' : 'default'}>{p.status}</Tag>
                      <Tag>{p.protocol_type}</Tag>
                    </Space>}
                    description={<Text type="secondary">发起者: Agent #{p.initiator_agent_id} | {p.created_at ? new Date(p.created_at).toLocaleString() : ''}</Text>}
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Modal>

      {/* Create Protocol Modal */}
      <Modal
        title="创建协作协议"
        open={createOpen}
        onCancel={() => onCreateOpenChange(false)}
        onOk={onCreate}
        okText="创建"
      >
        <Form layout="vertical">
          <Form.Item label="协议类型" required>
            <Select value={createForm.protocol_type} onChange={v => onCreateFormChange({ ...createForm, protocol_type: v })}>
              <Select.Option value="proposal">提案</Select.Option>
              <Select.Option value="vote">投票</Select.Option>
              <Select.Option value="consensus">共识</Select.Option>
              <Select.Option value="auction">竞标</Select.Option>
              <Select.Option value="handoff">交接</Select.Option>
              <Select.Option value="deliberation">审议</Select.Option>
              <Select.Option value="ranked_vote">排名投票</Select.Option>
              <Select.Option value="weighted_vote">加权投票</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="标题" required>
            <Input value={createForm.title} onChange={e => onCreateFormChange({ ...createForm, title: e.target.value })} placeholder="协议标题" />
          </Form.Item>
          <Form.Item label="描述">
            <Input.TextArea value={createForm.description} onChange={e => onCreateFormChange({ ...createForm, description: e.target.value })} placeholder="详细描述" rows={3} />
          </Form.Item>
          <Form.Item label="发起 Agent" required>
            <Select value={createForm.initiator_agent_id} onChange={v => onCreateFormChange({ ...createForm, initiator_agent_id: v })} placeholder="选择发起 Agent" style={{ width: '100%' }}>
              {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name} ({a.kind})</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Protocol Detail Modal */}
      <Modal
        title={detail?.title || '协议详情'}
        open={detailOpen}
        onCancel={() => { onDetailOpenChange(false); onDetailChange(null) }}
        footer={null}
        width={700}
      >
        {detail && (
          <div>
            <Space style={{ marginBottom: 12 }} wrap>
              <Tag color={detail.status === 'accepted' ? 'green' : detail.status === 'rejected' ? 'red' : 'blue'}>{detail.status}</Tag>
              <Tag>{detail.protocol_type}</Tag>
              {detail.description && <Text type="secondary">{detail.description}</Text>}
            </Space>
            {/* Show protocol result for resolved protocols */}
            {detail.result && Object.keys(detail.result).length > 0 && (
              <Card size="small" title="决议结果" style={{ marginBottom: 12 }}>
                <Descriptions column={1} size="small">
                  {detail.protocol_type === 'weighted_vote' && (
                    <>
                      <Descriptions.Item label="加权赞成">{detail.result.weighted_for}</Descriptions.Item>
                      <Descriptions.Item label="加权反对">{detail.result.weighted_against}</Descriptions.Item>
                      <Descriptions.Item label="总票数">{detail.result.total_votes}</Descriptions.Item>
                    </>
                  )}
                  {detail.protocol_type === 'ranked_vote' && (
                    <>
                      <Descriptions.Item label="胜出选项"><Tag color="green">{detail.result.winner}</Tag></Descriptions.Item>
                      <Descriptions.Item label="投票轮次">{detail.result.rounds?.length || 0}</Descriptions.Item>
                      <Descriptions.Item label="总票数">{detail.result.total_votes}</Descriptions.Item>
                    </>
                  )}
                  {detail.protocol_type === 'deliberation' && (
                    <>
                      <Descriptions.Item label="讨论消息数">{detail.result.discussion_count}</Descriptions.Item>
                      <Descriptions.Item label="赞成票">{detail.result.votes_for}</Descriptions.Item>
                      <Descriptions.Item label="反对票">{detail.result.votes_against}</Descriptions.Item>
                    </>
                  )}
                  {detail.result.votes_for !== undefined && detail.protocol_type === 'vote' && (
                    <>
                      <Descriptions.Item label="赞成">{detail.result.votes_for}</Descriptions.Item>
                      <Descriptions.Item label="反对">{detail.result.votes_against}</Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              </Card>
            )}
            {(detail.messages || []).length > 0 ? (
              <List
                size="small"
                dataSource={detail.messages}
                renderItem={(m: ProtocolMessage) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Space><Tag color={m.message_type === 'argument' ? 'orange' : m.message_type === 'evidence' ? 'blue' : 'default'}>{m.message_type}</Tag> Agent #{m.agent_id}</Space>}
                      description={<div><div>{m.content || '无内容'}</div>{m.payload && Object.keys(m.payload).length > 0 && <Text type="secondary" style={{ fontSize: 11 }}>{JSON.stringify(m.payload)}</Text>}</div>}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无响应" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
            {(detail.status === 'open' || detail.status === 'voting') && (
              <Space style={{ marginTop: 12 }}>
                <Button type="primary" onClick={() => { onRespondFormChange({ ...respondForm, protocol_id: detail.id }); onRespondOpenChange(true) }}>响应</Button>
                {detail.protocol_type === 'deliberation' && (
                  <Button icon={<MessageOutlined />} onClick={() => { onDeliberationFormChange({ protocol_id: detail.id, agent_id: undefined, message_type: 'comment', content: '' }); onDeliberationOpenChange(true) }}>审议发言</Button>
                )}
                <Popconfirm title="接受此协议？" onConfirm={() => onResolve(detail.id, 'accepted')}>
                  <Button>接受</Button>
                </Popconfirm>
                <Popconfirm title="拒绝此协议？" onConfirm={() => onResolve(detail.id, 'rejected')}>
                  <Button danger>拒绝</Button>
                </Popconfirm>
              </Space>
            )}
          </div>
        )}
      </Modal>

      {/* Deliberation Message Modal */}
      <Modal
        title="审议发言"
        open={deliberationOpen}
        onCancel={() => onDeliberationOpenChange(false)}
        onOk={onDeliberationSubmit}
        okText="提交"
      >
        <Form layout="vertical">
          <Form.Item label="Agent" required>
            <Select value={deliberationForm.agent_id} onChange={v => onDeliberationFormChange({ ...deliberationForm, agent_id: v })} placeholder="选择发言 Agent" style={{ width: '100%' }}>
              {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="消息类型" required>
            <Select value={deliberationForm.message_type} onChange={v => onDeliberationFormChange({ ...deliberationForm, message_type: v })}>
              <Select.Option value="comment">评论</Select.Option>
              <Select.Option value="argument">论点</Select.Option>
              <Select.Option value="evidence">证据</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="内容" required>
            <Input.TextArea value={deliberationForm.content} onChange={e => onDeliberationFormChange({ ...deliberationForm, content: e.target.value })} placeholder="发言内容..." rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Protocol Respond Modal */}
      <Modal
        title="响应协议"
        open={respondOpen}
        onCancel={() => onRespondOpenChange(false)}
        onOk={onRespond}
        okText="提交"
      >
        <Form layout="vertical">
          <Form.Item label="Agent" required>
            <Select value={respondForm.agent_id} onChange={v => onRespondFormChange({ ...respondForm, agent_id: v })} placeholder="选择响应 Agent" style={{ width: '100%' }}>
              {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="响应类型" required>
            <Select value={respondForm.message_type} onChange={v => onRespondFormChange({ ...respondForm, message_type: v })}>
              <Select.Option value="accept">接受</Select.Option>
              <Select.Option value="reject">拒绝</Select.Option>
              <Select.Option value="vote">投票</Select.Option>
              <Select.Option value="ranked_vote">排名投票</Select.Option>
              <Select.Option value="bid">竞标</Select.Option>
              <Select.Option value="comment">评论</Select.Option>
              <Select.Option value="counter_proposal">反提案</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="内容">
            <Input.TextArea value={respondForm.content} onChange={e => onRespondFormChange({ ...respondForm, content: e.target.value })} placeholder="响应内容" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ProtocolsModal