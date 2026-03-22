import { Button, Divider, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import { EyeOutlined, ReloadOutlined, ShareAltOutlined, StopOutlined } from '@ant-design/icons'
import type { AgentSecret } from '../../../../api/agents'
import { scopeColorMap } from './shared'
import './SecretsTableSection.css'

const { Text, Paragraph } = Typography

interface SecretsTableSectionProps {
  loading: boolean
  secrets: AgentSecret[]
  sharedSecrets: AgentSecret[]
  onReveal: (secret: AgentSecret) => void
  onShare: (secret: AgentSecret) => void
  onRotate: (secret: AgentSecret) => void
  onRevoke: (secret: AgentSecret) => void
}

export function SecretsTableSection({
  loading,
  secrets,
  sharedSecrets,
  onReveal,
  onShare,
  onRotate,
  onRevoke,
}: SecretsTableSectionProps) {
  return (
    <>
      <Table<AgentSecret>
        rowKey={(row) => `${row.source || 'owned'}-${row.id}-${row.share_id || 0}`}
        loading={loading}
        dataSource={secrets}
        pagination={false}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (value, row) => (
              <Space direction='vertical' size={2}>
                <Text strong>{value}</Text>
                <Text type='secondary'>#{row.id}</Text>
              </Space>
            ),
          },
          {
            title: 'Owner',
            key: 'owner',
            width: 220,
            render: (_, row) => {
              if (row.source === 'shared') {
                return <Text>{row.owner_agent_name || `#${row.owner_agent_id}`}</Text>
              }
              return <Tag color='blue'>Current Agent</Tag>
            },
          },
          {
            title: 'Type',
            dataIndex: 'secret_type',
            key: 'secret_type',
            width: 140,
            render: (value) => <Tag>{value || 'api_key'}</Tag>,
          },
          {
            title: 'Scope',
            key: 'scope',
            width: 180,
            render: (_, row) => {
              const scope = row.scope_type || 'agent_private'
              return (
                <Space direction='vertical' size={2} className='agent-secrets-table-section__scope'>
                  <Tag color={scopeColorMap[scope] || 'default'}>{scope}</Tag>
                  {row.project_id ? <Text type='secondary'>Project #{row.project_id}</Text> : null}
                </Space>
              )
            },
          },
          {
            title: 'Status',
            key: 'status',
            width: 130,
            render: (_, row) => (row.is_active ? <Tag color='green'>active</Tag> : <Tag>revoked</Tag>),
          },
          {
            title: 'Shared To',
            key: 'shared_to_agent_count',
            width: 110,
            render: (_, row) => (row.source === 'shared' ? '-' : String(row.shared_to_agent_count ?? 0)),
          },
          { title: 'Usage', dataIndex: 'usage_count', key: 'usage_count', width: 100 },
          {
            title: 'Actions',
            key: 'actions',
            width: 340,
            render: (_, row) => {
              const isShared = row.source === 'shared'
              return (
                <Space>
                  <Button
                    size='small'
                    type="text"
                    icon={<EyeOutlined />}
                    disabled={!row.is_active}
                    onClick={() => onReveal(row)}
                    className="flat-btn flat-btn--secondary"
                  >
                    Reveal
                  </Button>
                  {!isShared ? (
                    <Button
                      size='small'
                      type="text"
                      icon={<ShareAltOutlined />}
                      disabled={!row.is_active}
                      onClick={() => onShare(row)}
                      className="flat-btn flat-btn--primary"
                    >
                      Share
                    </Button>
                  ) : null}
                  {!isShared ? (
                    <Button
                      size='small'
                      type="text"
                      icon={<ReloadOutlined />}
                      disabled={!row.is_active}
                      onClick={() => onRotate(row)}
                      className="flat-btn flat-btn--secondary"
                    >
                      Rotate
                    </Button>
                  ) : null}
                  {!isShared ? (
                    <Popconfirm
                      title='Revoke this secret?'
                      okText='Revoke'
                      cancelText='Cancel'
                      onConfirm={() => onRevoke(row)}
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
                  ) : null}
                </Space>
              )
            },
          },
        ]}
      />

      {secrets.length === 0 ? (
        <Paragraph type='secondary' className='agent-secrets-table-section__empty'>
          No secrets yet.
        </Paragraph>
      ) : null}

      {sharedSecrets.length > 0 ? (
        <>
          <Divider className='agent-secrets-table-section__shared-divider' />
          <Paragraph type='secondary' className='agent-secrets-table-section__shared-text'>
            This agent currently has access to {sharedSecrets.length} shared secret(s) from other agents.
          </Paragraph>
        </>
      ) : null}
    </>
  )
}
