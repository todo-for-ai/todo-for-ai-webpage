import { Button, Divider, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import { EyeOutlined, ReloadOutlined, ShareAltOutlined, StopOutlined } from '@ant-design/icons'
import type { AgentSecret } from '../../../../api/agents'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('agents')

  return (
    <>
      <Table<AgentSecret>
        rowKey={(row) => `${row.source || 'owned'}-${row.id}-${row.share_id || 0}`}
        loading={loading}
        dataSource={secrets}
        pagination={false}
        scroll={{ x: 1200 }}
        columns={[
          {
            title: t('detail.secrets.columns.name'),
            dataIndex: 'name',
            key: 'name',
            width: 200,
            ellipsis: true,
            render: (value, row) => (
              <Space direction='vertical' size={2} style={{ maxWidth: 180 }}>
                <Text strong ellipsis style={{ maxWidth: 180 }}>{value}</Text>
                <Text type='secondary'>#{row.id}</Text>
              </Space>
            ),
          },
          {
            title: t('detail.secrets.columns.owner'),
            key: 'owner',
            width: 180,
            render: (_, row) => {
              if (row.source === 'shared') {
                return <Text ellipsis>{row.owner_agent_name || `#${row.owner_agent_id}`}</Text>
              }
              return <Tag color='blue'>{t('detail.secrets.owner.currentAgent')}</Tag>
            },
          },
          {
            title: t('detail.secrets.columns.type'),
            dataIndex: 'secret_type',
            key: 'secret_type',
            width: 120,
            render: (value) => <Tag>{value || 'api_key'}</Tag>,
          },
          {
            title: t('detail.secrets.columns.scope'),
            key: 'scope',
            width: 150,
            render: (_, row) => {
              const scope = row.scope_type || 'agent_private'
              const scopeKey = scope as keyof typeof scopeColorMap
              return (
                <Space direction='vertical' size={2} className='agent-secrets-table-section__scope'>
                  <Tag color={scopeColorMap[scopeKey] || 'default'}>
                    {t(`detail.secrets.scope.${scope}`)}
                  </Tag>
                  {row.project_id ? <Text type='secondary'>Project #{row.project_id}</Text> : null}
                </Space>
              )
            },
          },
          {
            title: t('detail.secrets.columns.status'),
            key: 'status',
            width: 100,
            render: (_, row) => (
              row.is_active
                ? <Tag color='green'>{t('detail.secrets.status.active')}</Tag>
                : <Tag>{t('detail.secrets.status.revoked')}</Tag>
            ),
          },
          {
            title: t('detail.secrets.columns.sharedTo'),
            key: 'shared_to_agent_count',
            width: 100,
            align: 'center',
            render: (_, row) => (row.source === 'shared' ? '-' : String(row.shared_to_agent_count ?? 0)),
          },
          {
            title: t('detail.secrets.columns.usage'),
            dataIndex: 'usage_count',
            key: 'usage_count',
            width: 80,
            align: 'center',
          },
          {
            title: t('detail.secrets.columns.actions'),
            key: 'actions',
            width: 280,
            fixed: 'right',
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
                    {t('detail.secrets.actions.reveal')}
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
                      {t('detail.secrets.actions.share')}
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
                      {t('detail.secrets.actions.rotate')}
                    </Button>
                  ) : null}
                  {!isShared ? (
                    <Popconfirm
                      title={t('detail.secrets.confirm.revokeTitle')}
                      okText={t('detail.secrets.confirm.revokeOk')}
                      cancelText={t('detail.secrets.confirm.revokeCancel')}
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
                        {t('detail.secrets.actions.revoke')}
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
          {t('detail.secrets.empty')}
        </Paragraph>
      ) : null}

      {sharedSecrets.length > 0 ? (
        <>
          <Divider className='agent-secrets-table-section__shared-divider' />
          <Paragraph type='secondary' className='agent-secrets-table-section__shared-text'>
            {t('detail.secrets.sharedNotice', { count: sharedSecrets.length })}
          </Paragraph>
        </>
      ) : null}
    </>
  )
}
