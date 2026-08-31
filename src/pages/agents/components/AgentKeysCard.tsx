import { useState } from 'react'
import {
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { CopyOutlined, EyeOutlined, KeyOutlined, LinkOutlined, StopOutlined } from '@ant-design/icons'
import type { AgentKey } from '../../../api/agents'
import { useAgentKeys } from '../hooks/useAgentKeys'
import './AgentKeysCard.css'

const { Paragraph, Text } = Typography

interface AgentKeysCardProps {
  workspaceId: number | null
  agentId: number | null
  agentName?: string
}

export function AgentKeysCard({ workspaceId, agentId, agentName }: AgentKeysCardProps) {
  const { keys, loading, createKey, revealKey, revokeKey, createConnectLink } = useAgentKeys(workspaceId, agentId)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [revealedToken, setRevealedToken] = useState<string | null>(null)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [ttlSeconds, setTtlSeconds] = useState(600)
  const [connectLink, setConnectLink] = useState<string | null>(null)
  const [connectExpiresAt, setConnectExpiresAt] = useState<string | null>(null)

  const copyText = async (text: string, successMessage = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(successMessage)
    } catch {
      message.error('Copy failed')
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      message.warning('Please input key name')
      return
    }

    const created = await createKey(newKeyName.trim())
    if (!created) return

    setCreatedToken(created.token)
    setCreateModalOpen(false)
    setNewKeyName('')
  }

  const handleReveal = async (keyId: number) => {
    const response = await revealKey(keyId)
    if (!response) return
    setRevealedToken(response.token)
  }

  const handleGenerateConnectLink = async () => {
    const result = await createConnectLink(ttlSeconds)
    if (!result) return

    setConnectLink(result.url)
    setConnectExpiresAt(result.expires_at)
    message.success('Connect link generated')
  }

  return (
    <Card
      title={
        <Space>
          <KeyOutlined /> Agent Keys
        </Space>
      }
      extra={
        <Space>
          <Button
            type="text"
            icon={<LinkOutlined />}
            onClick={() => setConnectModalOpen(true)}
            disabled={!agentId}
            className="flat-btn flat-btn--primary"
          >
            Generate Link
          </Button>
          <Button
            type="text"
            icon={<KeyOutlined />}
            onClick={() => setCreateModalOpen(true)}
            disabled={!agentId}
            className="flat-btn flat-btn--primary"
          >
            Create Key
          </Button>
        </Space>
      }
    >
      <Table<AgentKey>
        rowKey='id'
        loading={loading}
        dataSource={keys}
        pagination={false}
        columns={[
          { title: 'Name', dataIndex: 'name', key: 'name' },
          { title: 'Prefix', dataIndex: 'prefix', key: 'prefix' },
          {
            title: 'Status',
            key: 'status',
            render: (_, row) => (row.is_active ? <Tag color='green'>active</Tag> : <Tag>revoked</Tag>),
          },
          { title: 'Usage', dataIndex: 'usage_count', key: 'usage_count', width: 100 },
          { title: 'Actions', key: 'actions', width: 220, render: (_, row) => (
              <Space>
                <Button
                  size='small'
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => handleReveal(row.id)}
                  className="flat-btn flat-btn--secondary"
                >
                  Reveal
                </Button>
                <Popconfirm
                  title='Revoke this key?'
                  description='This action cannot be undone.'
                  okText='Revoke'
                  cancelText='Cancel'
                  onConfirm={() => revokeKey(row.id)}
                >
                  <Button
                    size='small'
                    type="text"
                    danger
                    icon={<StopOutlined />}
                    disabled={!row.is_active}
                    className="flat-btn flat-btn--danger"
                  >
                    Revoke
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      {keys.length === 0 ? (
        <Paragraph type='secondary' className='agent-keys-card__empty'>
          No keys yet. Create one to allow your agent to connect.
        </Paragraph>
      ) : null}

      <Modal
        title={`Create Key for ${agentName || 'Agent'}`}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreateKey}
        confirmLoading={loading}
        className='flat-modal'
      >
        <Input
          value={newKeyName}
          onChange={(event) => setNewKeyName(event.target.value)}
          placeholder='prod-key-1'
          maxLength={128}
        />
      </Modal>

      <Modal
        title='New Key Token'
        open={!!createdToken}
        onCancel={() => setCreatedToken(null)}
        onOk={() => setCreatedToken(null)}
        okText='Close'
        cancelButtonProps={{ className: 'agent-keys-card__hide-cancel' }}
        className='flat-modal'
      >
        <Paragraph>Save this token now. It may not be shown again.</Paragraph>
        <Input.TextArea value={createdToken || ''} rows={3} readOnly />
        <Button
          icon={<CopyOutlined />}
          onClick={() => (createdToken ? void copyText(createdToken, 'Token copied') : null)}
          className="flat-btn flat-btn--primary"
        >
          Copy Token
        </Button>
      </Modal>

      <Modal
        title='Revealed Token'
        open={!!revealedToken}
        onCancel={() => setRevealedToken(null)}
        onOk={() => setRevealedToken(null)}
        okText='Close'
        cancelButtonProps={{ className: 'agent-keys-card__hide-cancel' }}
        className='flat-modal'
      >
        <Input.TextArea value={revealedToken || ''} rows={3} readOnly />
        <Button
          icon={<CopyOutlined />}
          onClick={() => (revealedToken ? void copyText(revealedToken, 'Token copied') : null)}
          className="flat-btn flat-btn--primary"
        >
          Copy Token
        </Button>
      </Modal>

      <Modal
        title='Generate Connect Link'
        open={connectModalOpen}
        onCancel={() => setConnectModalOpen(false)}
        onOk={handleGenerateConnectLink}
        confirmLoading={loading}
        className='flat-modal'
      >
        <Space direction='vertical' className='agent-keys-card__connect-body'>
          <Text>TTL (seconds)</Text>
          <InputNumber
            min={60}
            max={3600}
            value={ttlSeconds}
            onChange={(value) => setTtlSeconds(Number(value || 600))}
            className='agent-keys-card__full-width'
          />

          {connectLink ? (
            <>
              <Text strong>Connect Link</Text>
              <Input.TextArea rows={4} value={connectLink} readOnly />
              <Button
                icon={<CopyOutlined />}
                onClick={() => void copyText(connectLink, 'Connect link copied')}
                className="flat-btn flat-btn--primary"
              >
                Copy Link
              </Button>
              {connectExpiresAt ? <Text type='secondary'>Expires at: {connectExpiresAt}</Text> : null}
            </>
          ) : null}
        </Space>
      </Modal>
    </Card>
  )
}
