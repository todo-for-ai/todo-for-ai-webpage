import React from 'react'
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from 'antd'
import type { Agent } from '../../../api/agents'
import { kindOptions, statusOptions, AGENT_TEMPLATES } from '../utils'

const { Text } = Typography
const { TextArea } = Input

export interface AgentFormModalProps {
  open: boolean
  editingAgent: Agent | null
  form: ReturnType<typeof Form.useForm>[0]
  onOk: () => void
  onCancel: () => void
}

const AgentFormModal: React.FC<AgentFormModalProps> = ({
  open,
  editingAgent,
  form,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={editingAgent ? '编辑 Agent' : '注册 Agent'}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      width={720}
    >
      {!editingAgent && (
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>从模板快速创建：</Text>
          <Space wrap>
            {Object.entries(AGENT_TEMPLATES).map(([key, tpl]) => (
              <Button
                key={key}
                size="small"
                onClick={() => {
                  form.setFieldsValue({
                    name: tpl.name,
                    description: tpl.description,
                    kind: tpl.kind,
                    provider: tpl.provider,
                    model: tpl.model,
                    capabilitiesText: tpl.capabilities.join('\n'),
                  })
                }}
              >
                {tpl.label}
              </Button>
            ))}
          </Space>
          <Divider style={{ margin: '12px 0' }} />
        </div>
      )}
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="例如 Claude Code Worker" />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <TextArea rows={2} />
        </Form.Item>
        <Space style={{ width: '100%' }} size="middle">
          <Form.Item name="kind" label="类型" style={{ width: 180 }}>
            <Select options={kindOptions} />
          </Form.Item>
          <Form.Item name="status" label="状态" style={{ width: 180 }}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="collaboration_role" label="协作角色" style={{ width: 180 }}>
            <Select
              placeholder="选择协作角色"
              allowClear
              options={[
                { value: 'standalone', label: '独立' },
                { value: 'leader', label: '领导者（协调分配）' },
                { value: 'follower', label: '跟随者（执行任务）' },
              ]}
            />
          </Form.Item>
        </Space>
        <Space style={{ width: '100%' }} size="middle">
          <Form.Item name="provider" label="提供方" style={{ width: 140 }}>
            <Input placeholder="openai" />
          </Form.Item>
          <Form.Item name="model" label="模型/运行时" style={{ width: 180 }}>
            <Input placeholder="gpt-5-codex" />
          </Form.Item>
        </Space>
        <Form.Item name="capabilitiesText" label="能力标签">
          <TextArea rows={3} placeholder={'每行一个能力，例如：\ncode_review\nfrontend\npython'} />
        </Form.Item>
        <Form.Item name="configText" label="运行配置 JSON">
          <TextArea rows={5} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AgentFormModal
