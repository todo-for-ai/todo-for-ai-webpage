import { Input, InputNumber, Modal, Select, Space } from 'antd'
import type { CreateSecretFormState } from './shared'
import { scopeTypeOptions, secretTypeOptions } from './shared'
import './CreateSecretModal.css'

interface CreateSecretModalProps {
  open: boolean
  loading: boolean
  form: CreateSecretFormState
  onFormChange: (next: CreateSecretFormState) => void
  onCancel: () => void
  onConfirm: () => void
}

export function CreateSecretModal({ open, loading, form, onFormChange, onCancel, onConfirm }: CreateSecretModalProps) {
  return (
    <Modal
      title='Add Secret'
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={loading}
      className='flat-modal'
    >
      <Space direction='vertical' className='agent-secrets-create-modal__form'>
        <Input
          placeholder='OPENAI_API_KEY'
          value={form.name}
          onChange={(event) => onFormChange({ ...form, name: event.target.value })}
          maxLength={128}
        />
        <Input.Password
          placeholder='Secret value'
          value={form.value}
          onChange={(event) => onFormChange({ ...form, value: event.target.value })}
        />
        <Select
          value={form.type}
          options={secretTypeOptions}
          onChange={(value) => onFormChange({ ...form, type: value })}
          placeholder='Secret type'
        />
        <Select
          value={form.scopeType}
          options={scopeTypeOptions}
          onChange={(value) =>
            onFormChange({
              ...form,
              scopeType: value,
              projectId: value === 'project_shared' ? form.projectId : null,
            })
          }
          placeholder='Scope'
        />
        {form.scopeType === 'project_shared' ? (
          <InputNumber
            className='agent-secrets-create-modal__full-width'
            min={1}
            value={form.projectId ?? undefined}
            placeholder='Project ID'
            onChange={(value) => onFormChange({ ...form, projectId: typeof value === 'number' ? value : null })}
          />
        ) : null}
        <Input.TextArea
          rows={3}
          placeholder='Description (optional)'
          value={form.description}
          onChange={(event) => onFormChange({ ...form, description: event.target.value })}
        />
      </Space>
    </Modal>
  )
}
