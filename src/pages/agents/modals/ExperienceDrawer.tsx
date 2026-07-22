import React from 'react'
import {
  Button,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  BulbOutlined,
} from '@ant-design/icons'
import type { Agent } from '../../../api/agents'

const { Text } = Typography
const { Option } = Select

export interface Experience {
  id: number
  experience_type: string
  domain?: string
  task_type?: string
  capabilities_used?: string[]
  strategy?: string
  outcome_pattern?: string
  key_learnings?: string
  confidence: number
  applicability_score?: number
  times_reused?: number
  is_shared: boolean
  agent_id?: number
}

export interface ExperienceFormData {
  experience_type: string
  domain: string
  task_type: string
  capabilities_used: string[]
  strategy: string
  outcome_pattern: string
  key_learnings: string
  confidence: number
  is_shared: boolean
}

export interface ExperienceDrawerProps {
  createOpen: boolean
  createForm: ExperienceFormData
  detailOpen: boolean
  detail: Experience | null
  sharedOpen: boolean
  sharedExperiences: Experience[]
  selectedAgent: Agent | null
  onCreateOpenChange: (open: boolean) => void
  onCreateFormChange: (form: ExperienceFormData) => void
  onCreate: () => void
  onDetailOpenChange: (open: boolean) => void
  onOpenDetail: (exp: Experience) => void
  onSharedOpenChange: (open: boolean) => void
  onLearnFromExperience: (expId: number) => void
}

const ExperienceDrawer: React.FC<ExperienceDrawerProps> = ({
  createOpen,
  createForm,
  detailOpen,
  detail,
  sharedOpen,
  sharedExperiences,
  selectedAgent,
  onCreateOpenChange,
  onCreateFormChange,
  onCreate,
  onDetailOpenChange,
  onOpenDetail,
  onSharedOpenChange,
  onLearnFromExperience,
}) => {
  return (
    <>
      {/* Experience Create Modal */}
      <Modal
        title="添加经验"
        open={createOpen}
        onCancel={() => onCreateOpenChange(false)}
        onOk={onCreate}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="经验类型" required>
            <Select value={createForm.experience_type} onChange={v => onCreateFormChange({ ...createForm, experience_type: v })}>
              <Option value="success_pattern">成功模式</Option>
              <Option value="failure_pattern">失败模式</Option>
              <Option value="strategy">策略</Option>
              <Option value="optimization">优化</Option>
              <Option value="anti_pattern">反模式</Option>
            </Select>
          </Form.Item>
          <Form.Item label="领域">
            <Input value={createForm.domain} onChange={e => onCreateFormChange({ ...createForm, domain: e.target.value })} placeholder="e.g. python, frontend, devops" />
          </Form.Item>
          <Form.Item label="任务类型">
            <Input value={createForm.task_type} onChange={e => onCreateFormChange({ ...createForm, task_type: e.target.value })} placeholder="e.g. code_review, bug_fix" />
          </Form.Item>
          <Form.Item label="策略描述" required>
            <Input.TextArea value={createForm.strategy} onChange={e => onCreateFormChange({ ...createForm, strategy: e.target.value })} placeholder="使用了什么策略/方法" rows={3} />
          </Form.Item>
          <Form.Item label="结果模式">
            <Input.TextArea value={createForm.outcome_pattern} onChange={e => onCreateFormChange({ ...createForm, outcome_pattern: e.target.value })} placeholder="发生了什么 — 成功因素或失败原因" rows={2} />
          </Form.Item>
          <Form.Item label="关键学习">
            <Input.TextArea value={createForm.key_learnings} onChange={e => onCreateFormChange({ ...createForm, key_learnings: e.target.value })} placeholder="对未来类似任务的精简建议" rows={2} />
          </Form.Item>
          <Form.Item label="置信度">
            <InputNumber value={createForm.confidence} onChange={v => onCreateFormChange({ ...createForm, confidence: v ?? 0.7 })} min={0} max={1} step={0.1} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item label="分享给其他 Agent">
            <Select value={createForm.is_shared ? 'true' : 'false'} onChange={v => onCreateFormChange({ ...createForm, is_shared: v === 'true' })}>
              <Option value="false">否</Option>
              <Option value="true">是</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Experience Detail Modal */}
      <Modal
        title={`经验详情 #${detail?.id || ''}`}
        open={detailOpen}
        onCancel={() => onDetailOpenChange(false)}
        footer={null}
        width={600}
      >
        {detail && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="类型">
              <Tag color={detail.experience_type === 'success_pattern' ? 'green' : detail.experience_type === 'failure_pattern' ? 'red' : 'blue'}>
                {detail.experience_type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="领域">{detail.domain || '-'}</Descriptions.Item>
            <Descriptions.Item label="任务类型">{detail.task_type || '-'}</Descriptions.Item>
            <Descriptions.Item label="能力">{(detail.capabilities_used || []).map((c: string, i: number) => <Tag key={i} style={{ fontSize: 10 }}>{c}</Tag>)}</Descriptions.Item>
            <Descriptions.Item label="策略">{detail.strategy || '-'}</Descriptions.Item>
            <Descriptions.Item label="结果模式">{detail.outcome_pattern || '-'}</Descriptions.Item>
            <Descriptions.Item label="关键学习">{detail.key_learnings || '-'}</Descriptions.Item>
            <Descriptions.Item label="置信度">{detail.confidence}</Descriptions.Item>
            <Descriptions.Item label="适用性">{detail.applicability_score}</Descriptions.Item>
            <Descriptions.Item label="复用次数">{detail.times_reused || 0}</Descriptions.Item>
            <Descriptions.Item label="已分享">{detail.is_shared ? '是' : '否'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Shared Experiences (Collective Learning) Modal */}
      <Modal
        title="群体学习 — 从其他 Agent 的共享经验中学习"
        open={sharedOpen}
        onCancel={() => onSharedOpenChange(false)}
        footer={null}
        width={700}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          以下是其他 Agent 分享的经验，{selectedAgent?.name} 可以选择学习并内化为自己的经验。
        </Text>
        {sharedExperiences.length === 0 ? (
          <Empty description="暂无可学习的共享经验" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={sharedExperiences}
            style={{ maxHeight: 500, overflowY: 'auto' }}
            renderItem={(exp: any) => (
              <List.Item
                actions={[
                  <Button key="learn" size="small" type="primary" icon={<BulbOutlined />} onClick={() => onLearnFromExperience(exp.id)}>
                    学习
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={exp.experience_type === 'success_pattern' ? 'green' : exp.experience_type === 'failure_pattern' ? 'red' : 'blue'}>
                        {exp.experience_type === 'success_pattern' ? '成功' : exp.experience_type === 'failure_pattern' ? '失败' : '策略'}
                      </Tag>
                      {exp.domain && <Tag color="purple">{exp.domain}</Tag>}
                      <Text type="secondary" style={{ fontSize: 11 }}>来自 Agent #{exp.agent_id}</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <div><Text style={{ fontSize: 12 }}>{exp.key_learnings || exp.strategy?.substring(0, 100)}</Text></div>
                      <Space size={4} style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>置信度: {exp.confidence}</Text>
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  )
}

export default ExperienceDrawer