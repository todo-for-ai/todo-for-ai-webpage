import { useMemo, useState } from 'react'
import { Form, Input, Modal, Select, Typography } from 'antd'

const { Option } = Select
const { Text } = Typography
interface Props {
  handleCreateTrigger: any
  triggerModalOpen: any
  triggerTargetWfId: any
  workflows: any
  setTriggerModalOpen: any
  triggerForm: any
}

export default function TriggerCreationModal(props: Props) {
  const { handleCreateTrigger, setTriggerModalOpen, triggerForm, triggerModalOpen, triggerTargetWfId, workflows } = props

  return (
    <>
      <Modal
        title="创建定时触发器"
        open={triggerModalOpen}
        onCancel={() => setTriggerModalOpen(false)}
        onOk={handleCreateTrigger}
        okText="创建"
      >
        <Form form={triggerForm} layout="vertical">
          <Form.Item name="name" label="触发器名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：每日构建" />
          </Form.Item>
          <Form.Item name="workflow_id" label="目标工作流" initialValue={triggerTargetWfId} rules={[{ required: true }]}>
            <Select>
              {workflows.map(wf => (
                <Option key={wf.id} value={wf.id}>{wf.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="cron_expr" label="Cron 表达式（可选）" extra="5 字段格式：分 时 日 月 星期，例如 0 9 * * 1-5 = 工作日 9:00">
            <Input placeholder="0 9 * * 1-5" />
          </Form.Item>
          <Form.Item name="one_shot_at" label="一次性触发时间（可选）" extra="ISO 格式，例如 2026-07-01T09:00:00。触发后自动停用。">
            <Input placeholder="2026-07-01T09:00:00" />
          </Form.Item>
          <Form.Item name="project_id" label="项目 ID（可选）">
            <Input type="number" placeholder="运行时创建在此项目中" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
