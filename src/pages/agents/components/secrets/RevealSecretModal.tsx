import { Button, Input, Modal, Space } from 'antd'
import type { RevealedSecretState } from './shared'
import './RevealSecretModal.css'

interface RevealSecretModalProps {
  secret: RevealedSecretState | null
  onClose: () => void
  onCopy: (value: string) => void
}

export function RevealSecretModal({ secret, onClose, onCopy }: RevealSecretModalProps) {
  return (
    <Modal
      title={secret ? `Secret: ${secret.name}` : 'Revealed Secret'}
      open={!!secret}
      onCancel={onClose}
      onOk={onClose}
      okText='Close'
      cancelButtonProps={{ className: 'agent-secrets-reveal-modal__hide-cancel' }}
      className='flat-modal'
    >
      <Space direction='vertical' className='agent-secrets-reveal-modal__body'>
        <Input.TextArea rows={4} value={secret?.value || ''} readOnly />
        <Button
          type="text"
          onClick={() => (secret ? onCopy(secret.value) : null)}
          className="flat-btn flat-btn--primary"
        >
          Copy Secret
        </Button>
      </Space>
    </Modal>
  )
}
