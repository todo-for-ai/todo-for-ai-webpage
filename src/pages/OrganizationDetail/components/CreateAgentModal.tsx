/**
 * 创建 Agent 弹窗组件
 */

import { Form, Input, Modal } from 'antd'

interface CreateAgentModalProps {
  visible: boolean
  loading: boolean
  tp: (key: string, options?: { defaultValue?: string }) => string
  onOk: () => void
  onCancel: () => void
  form: ReturnType<typeof Form.useForm>[0]
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  visible,
  loading,
  tp,
  onOk,
  onCancel,
  form,
}) => {
  return (
    <Modal
      title={tp('createAgentModal.title')}
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={tp('createAgentModal.confirm')}
      cancelText={tp('createAgentModal.cancel')}
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="name"
          label={tp('createAgentModal.name')}
          rules={[{ required: true, message: tp('createAgentModal.nameRequired') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label={tp('createAgentModal.description')}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
