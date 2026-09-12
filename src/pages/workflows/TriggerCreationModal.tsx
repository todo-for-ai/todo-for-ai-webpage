/**
 * Workflows「TriggerCreationModal」面板（从 Workflows.tsx 原样抽出）。
 */

import { useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, DatePicker } from 'antd'
const { Option } = Select
import { ThunderboltOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

interface Props {
  triggerModalOpen: any
  setTriggerModalOpen: any
  triggerTargetWfId: any
  handleCreateTrigger: any
  triggerForm: any
  workflows: any
}

export default function TriggerCreationModal(props: Props) {
  const { triggerModalOpen,
    setTriggerModalOpen,
    triggerTargetWfId,
    handleCreateTrigger,
    triggerForm,
    workflows } = props
  const { Option } = Select

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
