/**
 * Workflows「LaunchWorkflowModal」面板（从 Workflows.tsx 原样抽出）。
 */

import { useState } from 'react'
import { Modal, Form, Input, Select } from 'antd'

import { usePageTranslation } from '../../i18n/hooks/useTranslation'

interface Props {
  launchOpen: any
  setLaunchOpen: any
  launching: any
  launchForm: any
  handleLaunch: any
}

export default function LaunchWorkflowModal(props: Props) {
  const { launchOpen,
    setLaunchOpen,
    launching,
    launchForm,
    handleLaunch } = props
  const { tp } = usePageTranslation('dashboard')

  return (
    <>
      <Modal
        title="启动工作流"
        open={launchOpen}
        onCancel={() => setLaunchOpen(false)}
        onOk={handleLaunch}
        confirmLoading={launching}
        okText="启动"
      >
        <Form form={launchForm} layout="vertical">
          <Form.Item name="project_id" label="项目 ID" rules={[{ required: true, message: '请输入项目 ID' }]}>
            <Input type="number" placeholder="任务将创建在此项目中" />
          </Form.Item>
          <Form.Item name="root_task_id" label="根任务 ID（可选）">
            <Input type="number" placeholder="工作流任务将作为此任务的子任务" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
