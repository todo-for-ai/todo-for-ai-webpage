import { Button, Divider, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { AgentSecret, AgentSecretShare } from '../../../../api/agents'
import type { ShareSecretFormState } from './shared'
import { shareSelectorOptions } from './shared'
import './ShareSecretModal.css'

const { Text } = Typography

interface ShareSecretModalProps {
  target: AgentSecret | null
  loading: boolean
  form: ShareSecretFormState
  workspaceAgentOptions: Array<{ label: string; value: number }>
  shareRows: AgentSecretShare[]
  onFormChange: (next: ShareSecretFormState) => void
  onCancel: () => void
  onGrant: () => void
  onRevokeShare: (shareId: number) => void
}

export function ShareSecretModal({
  target,
  loading,
  form,
  workspaceAgentOptions,
  shareRows,
  onFormChange,
  onCancel,
  onGrant,
  onRevokeShare,
}: ShareSecretModalProps) {
  return (
    <Modal
      title={target ? `Share ${target.name}` : 'Share Secret'}
      open={!!target}
      onCancel={onCancel}
      onOk={onGrant}
      confirmLoading={loading}
      okText='Grant Access'
      width={880}
      className='flat-modal'
    >
      <Space direction='vertical' className='agent-secrets-share-modal__form' size={14}>
        <Select
          value={form.targetSelector}
          options={shareSelectorOptions}
          onChange={(value) => onFormChange({ ...form, targetSelector: value })}
        />
        {form.targetSelector === 'manual' ? (
          <Select
            mode='multiple'
            allowClear
            showSearch
            value={form.agentIds}
            options={workspaceAgentOptions}
            optionFilterProp='label'
            placeholder='Select target agents'
            onChange={(value) => onFormChange({ ...form, agentIds: value })}
          />
        ) : null}
        {form.targetSelector === 'project_agents' ? (
          <InputNumber
            className='agent-secrets-share-modal__full-width'
            min={1}
            value={form.selectorProjectId ?? target?.project_id ?? undefined}
            placeholder='Project ID (optional if secret already bound to project)'
            onChange={(value) => onFormChange({ ...form, selectorProjectId: typeof value === 'number' ? value : null })}
          />
        ) : null}
        <Input
          placeholder='Granted reason (optional)'
          value={form.reason}
          onChange={(event) => onFormChange({ ...form, reason: event.target.value })}
        />
        <Input
          type='datetime-local'
          value={form.expiresAt}
          placeholder='Expire at (optional)'
          onChange={(event) => onFormChange({ ...form, expiresAt: event.target.value })}
        />

        <Divider className='agent-secrets-share-modal__divider' />
        <Text strong>Current Shares</Text>
        <Table<AgentSecretShare>
          rowKey='id'
          size='small'
          loading={loading}
          dataSource={shareRows}
          pagination={false}
          columns={[
            {
              title: 'Target Agent',
              key: 'target',
              render: (_, row) => row.target_agent_name || `#${row.target_agent_id}`,
            },
            {
              title: 'Access',
              dataIndex: 'access_mode',
              key: 'access_mode',
              width: 100,
              render: (value) => <Tag>{value}</Tag>,
            },
            {
              title: 'Expires',
              key: 'expires',
              width: 220,
              render: (_, row) => (row.expires_at ? new Date(row.expires_at).toLocaleString() : '-'),
            },
            {
              title: 'Status',
              key: 'status',
              width: 120,
              render: (_, row) => {
                if (!row.is_active) return <Tag>revoked</Tag>
                if (row.is_expired) return <Tag color='orange'>expired</Tag>
                return <Tag color='green'>active</Tag>
              },
            },
            {
              title: 'Actions',
              key: 'actions',
              width: 120,
              render: (_, row) => (
                <Popconfirm
                  title='Revoke this share?'
                  okText='Revoke'
                  cancelText='Cancel'
                  onConfirm={() => onRevokeShare(row.id)}
                  disabled={!row.is_active}
                >
                  <Button
                    size='small'
                    type="text"
                    danger
                    disabled={!row.is_active}
                    className="flat-btn flat-btn--danger"
                  >
                    Revoke
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
        />
      </Space>
    </Modal>
  )
}
