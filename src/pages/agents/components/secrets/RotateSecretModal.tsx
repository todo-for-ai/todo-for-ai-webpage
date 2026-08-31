import { Input, Modal, Space, Typography } from 'antd'
import type { AgentSecret } from '../../../../api/agents'
import './RotateSecretModal.css'

const { Text } = Typography

interface RotateSecretModalProps {
  target: AgentSecret | null
  loading: boolean
  value: string
  onValueChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export function RotateSecretModal({
  target,
  loading,
  value,
  onValueChange,
  onCancel,
  onConfirm,
}: RotateSecretModalProps) {
  return (
    <Modal
      title={target ? `Rotate ${target.name}` : 'Rotate Secret'}
      open={!!target}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={loading}
      className='flat-modal'
    >
      <Space direction='vertical' className='agent-secrets-rotate-modal__body'>
        <Text>New secret value</Text>
        <Input.Password value={value} onChange={(event) => onValueChange(event.target.value)} />
      </Space>
    </Modal>
  )
}
