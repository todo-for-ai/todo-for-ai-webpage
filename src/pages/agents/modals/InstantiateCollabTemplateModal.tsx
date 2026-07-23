import React from 'react'
import { Form, InputNumber, Modal } from 'antd'

export interface InstantiateCollabTemplateModalProps {
  open: boolean
  templateName: string
  projectId: number | undefined
  instantiating: boolean
  onCancel: () => void
  onOk: () => void
  onProjectIdChange: (id: number | undefined) => void
}

const InstantiateCollabTemplateModal: React.FC<InstantiateCollabTemplateModalProps> = ({
  open,
  templateName,
  projectId,
  instantiating,
  onCancel,
  onOk,
  onProjectIdChange,
}) => {
  return (
    <Modal
      title={`实例化模板: ${templateName}`}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      confirmLoading={instantiating}
      okText="实例化"
    >
      <Form layout="vertical">
        <Form.Item label="项目 ID（可选）">
          <InputNumber
            value={projectId}
            onChange={v => onProjectIdChange(v ?? undefined)}
            placeholder="输入项目 ID"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default InstantiateCollabTemplateModal
