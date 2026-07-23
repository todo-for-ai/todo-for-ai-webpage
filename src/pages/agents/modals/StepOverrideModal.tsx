import React from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
} from 'antd'
import { SearchOutlined, SettingOutlined } from '@ant-design/icons'
import type { Agent } from '../../../api/agents'

export interface StepOverrideModalProps {
  open: boolean
  form: any
  effective: any
  agents: Agent[]
  onCancel: () => void
  onSubmit: () => void
  onClear: () => void
  onFormChange: (form: any) => void
  onLoadEffective: (runId: number, stepKey: string) => void
}

const StepOverrideModal: React.FC<StepOverrideModalProps> = ({
  open,
  form: stepOverrideForm,
  effective: stepEffective,
  agents,
  onCancel,
  onSubmit,
  onClear,
  onFormChange: setStepOverrideForm,
  onLoadEffective,
}) => {
  return (
    <Modal
      title={<Space><SettingOutlined /> 工作流步骤动态重配置</Space>}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="clear" danger onClick={onClear} disabled={!stepOverrideForm.run_id || !stepOverrideForm.step_key}>清除覆盖</Button>,
        <Button key="cancel" onClick={onCancel}>取消</Button>,
        <Button key="submit" type="primary" onClick={onSubmit}>应用覆盖</Button>,
      ]}
      width={680}
    >
      <Alert
        message="运行时动态重配置"
        description="为运行中工作流的某个步骤设置运行时覆盖，无需修改工作流定义。未启动步骤可改全部参数；运行中步骤仅可改超时/重试。"
        type="info"
        style={{ marginBottom: 16 }}
        showIcon
      />
      <Form layout="vertical">
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="运行 ID" required>
              <InputNumber value={stepOverrideForm.run_id} onChange={v => setStepOverrideForm({ ...stepOverrideForm, run_id: v || undefined })} placeholder="WorkflowRun ID" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item label="步骤 key" required>
              <Input value={stepOverrideForm.step_key} onChange={e => setStepOverrideForm({ ...stepOverrideForm, step_key: e.target.value })} placeholder="如 review, build, deploy" />
            </Form.Item>
          </Col>
        </Row>
        <Button size="small" icon={<SearchOutlined />} onClick={() => stepOverrideForm.run_id && stepOverrideForm.step_key && onLoadEffective(Number(stepOverrideForm.run_id), String(stepOverrideForm.step_key))} disabled={!stepOverrideForm.run_id || !stepOverrideForm.step_key} style={{ marginBottom: 16 }}>加载当前有效参数</Button>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="指定 Agent">
              <Select value={stepOverrideForm.agent_id} onChange={v => setStepOverrideForm({ ...stepOverrideForm, agent_id: v })} allowClear placeholder="覆盖能力匹配" style={{ width: '100%' }}>
                {agents.map(a => <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="所需能力 (逗号分隔)">
              <Input value={stepOverrideForm.required_capabilities} onChange={e => setStepOverrideForm({ ...stepOverrideForm, required_capabilities: e.target.value })} placeholder="code_review, python" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={8}><Form.Item label="超时(秒)"><InputNumber value={stepOverrideForm.timeout_seconds} onChange={v => setStepOverrideForm({ ...stepOverrideForm, timeout_seconds: v || undefined })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={8}><Form.Item label="重试次数"><InputNumber value={stepOverrideForm.retry_count} onChange={v => setStepOverrideForm({ ...stepOverrideForm, retry_count: v || undefined })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={8}>
            <Form.Item label="失败策略">
              <Select value={stepOverrideForm.on_failure} onChange={v => setStepOverrideForm({ ...stepOverrideForm, on_failure: v })} allowClear placeholder="abort">
                <Select.Option value="abort">中止</Select.Option>
                <Select.Option value="skip">跳过</Select.Option>
                <Select.Option value="continue">继续</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}><Form.Item label="任务模板 ID"><InputNumber value={stepOverrideForm.task_template_id} onChange={v => setStepOverrideForm({ ...stepOverrideForm, task_template_id: v || undefined })} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={12}><Form.Item label="子工作流 ID"><InputNumber value={stepOverrideForm.sub_workflow_id} onChange={v => setStepOverrideForm({ ...stepOverrideForm, sub_workflow_id: v || undefined })} style={{ width: '100%' }} /></Form.Item></Col>
        </Row>
        <Form.Item label="条件 (JSON)">
          <Input.TextArea value={stepOverrideForm.condition} onChange={e => setStepOverrideForm({ ...stepOverrideForm, condition: e.target.value })} placeholder='{"step_key":"review","operator":"succeeded","value":true}' rows={2} />
        </Form.Item>
      </Form>
      {stepEffective && (
        <Card size="small" title="当前有效参数" style={{ marginTop: 8 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Agent">{String(stepEffective.effective_params?.agent_id ?? '-')}</Descriptions.Item>
            <Descriptions.Item label="超时">{stepEffective.effective_params?.timeout_seconds ?? '-'}s</Descriptions.Item>
            <Descriptions.Item label="重试">{stepEffective.effective_params?.retry_count ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="失败策略">{stepEffective.effective_params?.on_failure ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="能力" span={2}>{(stepEffective.effective_params?.required_capabilities || []).join(', ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="运行状态">{stepEffective.step_run?.status || '-'}</Descriptions.Item>
            <Descriptions.Item label="覆盖数">{Object.keys(stepEffective.overrides || {}).length}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Modal>
  )
}

export default StepOverrideModal
