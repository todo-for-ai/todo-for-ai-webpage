import React from 'react'
import { Form, InputNumber, Modal, Select, Typography } from 'antd'

const { Option } = Select
const { Text } = Typography

export interface CrossProjectAuthorizeModalProps {
  open: boolean
  agentName: string
  form: any
  onCancel: () => void
  onOk: () => void
  onFormChange: (form: any) => void
}

const CrossProjectAuthorizeModal: React.FC<CrossProjectAuthorizeModalProps> = ({
  open,
  agentName,
  form: authorizeForm,
  onCancel,
  onOk,
  onFormChange: setAuthorizeForm,
}) => {
  return (
    <Modal
      title={`跨项目授权 — ${agentName}`}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText="授权"
      cancelText="取消"
    >
      <Form layout="vertical">
        <Form.Item label="目标项目" required>
          <Select
            value={authorizeForm.project_id || undefined}
            onChange={v => setAuthorizeForm({ ...authorizeForm, project_id: v })}
            placeholder="选择要授权的项目"
            style={{ width: '100%' }}
          >
            {/* Projects will be loaded dynamically */}
            <Option value="">请选择项目</Option>
          </Select>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
            输入项目 ID 或从列表中选择（需要是项目的 ADMIN 或 OWNER）
          </Text>
          <InputNumber
            value={authorizeForm.project_id || undefined}
            onChange={v => setAuthorizeForm({ ...authorizeForm, project_id: v })}
            placeholder="项目 ID"
            style={{ width: '100%', marginTop: 4 }}
            min={1}
          />
        </Form.Item>
        <Form.Item label="项目角色">
          <Select value={authorizeForm.role_in_project} onChange={v => setAuthorizeForm({ ...authorizeForm, role_in_project: v })}>
            <Option value="contributor">贡献者 (contributor)</Option>
            <Option value="reviewer">审查者 (reviewer)</Option>
            <Option value="observer">观察者 (observer)</Option>
          </Select>
        </Form.Item>
        <Form.Item label="最大并发任务数">
          <InputNumber value={authorizeForm.max_concurrent_tasks} onChange={v => setAuthorizeForm({ ...authorizeForm, max_concurrent_tasks: v ?? 3 })} min={1} max={20} style={{ width: 120 }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default CrossProjectAuthorizeModal
