import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Divider,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  EyeOutlined,
  LockOutlined,
  ReloadOutlined as RefreshOutlined,
  ReloadOutlined,
  ShareAltOutlined,
  StopOutlined,
} from '@ant-design/icons'
import {
  agentsApi,
  type AgentSecret,
  type AgentSecretCollaborationResponse,
  type AgentSecretShare,
  type AgentSecretScopeType,
  type AgentSecretTargetSelector,
  type AgentSecretType,
} from '../../../api/agents'
import { useAgentSecrets } from '../hooks/useAgentSecrets'

const { Text, Paragraph } = Typography

const secretTypeOptions: Array<{ label: string; value: AgentSecretType }> = [
  { label: 'API Key', value: 'api_key' },
  { label: 'OAuth Token', value: 'oauth_token' },
  { label: 'Session Cookie', value: 'session_cookie' },
  { label: 'Webhook Secret', value: 'webhook_secret' },
  { label: 'Custom', value: 'custom' },
]

const scopeTypeOptions: Array<{ label: string; value: AgentSecretScopeType }> = [
  { label: 'Agent Private', value: 'agent_private' },
  { label: 'Project Shared', value: 'project_shared' },
  { label: 'Workspace Shared', value: 'workspace_shared' },
]

const scopeColorMap: Record<string, string> = {
  agent_private: 'blue',
  project_shared: 'orange',
  workspace_shared: 'purple',
}

const shareSelectorOptions: Array<{ label: string; value: AgentSecretTargetSelector }> = [
  { label: 'Manual Agent Select', value: 'manual' },
  { label: 'All Active Agents In Project', value: 'project_agents' },
  { label: 'All Active Agents In Workspace', value: 'workspace_active' },
]

interface AgentSecretsCardProps {
  workspaceId: number | null
  agentId: number | null
}

export function AgentSecretsCard({ workspaceId, agentId }: AgentSecretsCardProps) {
  const {
    secrets,
    loading,
    createSecret,
    revealSecret,
    rotateSecret,
    revokeSecret,
    listSecretShares,
    listSecretCollaboration,
    createSecretShares,
    revokeSecretShare,
  } = useAgentSecrets(workspaceId, agentId)

  const [workspaceAgentOptions, setWorkspaceAgentOptions] = useState<Array<{ label: string; value: number }>>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [newSecretName, setNewSecretName] = useState('')
  const [newSecretValue, setNewSecretValue] = useState('')
  const [newSecretType, setNewSecretType] = useState<AgentSecretType>('api_key')
  const [newScopeType, setNewScopeType] = useState<AgentSecretScopeType>('agent_private')
  const [newProjectId, setNewProjectId] = useState<number | null>(null)
  const [newDescription, setNewDescription] = useState('')

  const [revealedSecret, setRevealedSecret] = useState<{ name: string; value: string } | null>(null)
  const [rotateTarget, setRotateTarget] = useState<AgentSecret | null>(null)
  const [rotateValue, setRotateValue] = useState('')

  const [shareTarget, setShareTarget] = useState<AgentSecret | null>(null)
  const [shareTargetSelector, setShareTargetSelector] = useState<AgentSecretTargetSelector>('manual')
  const [shareSelectorProjectId, setShareSelectorProjectId] = useState<number | null>(null)
  const [shareAgentIds, setShareAgentIds] = useState<number[]>([])
  const [shareReason, setShareReason] = useState('')
  const [shareExpiresAt, setShareExpiresAt] = useState('')
  const [shareRows, setShareRows] = useState<AgentSecretShare[]>([])
  const [collaboration, setCollaboration] = useState<AgentSecretCollaborationResponse | null>(null)
  const [collaborationLoading, setCollaborationLoading] = useState(false)
  const [collaborationProjectId, setCollaborationProjectId] = useState<number | null>(null)

  const sharedSecrets = useMemo(() => secrets.filter((item) => item.source === 'shared'), [secrets])

  useEffect(() => {
    if (!workspaceId) {
      setWorkspaceAgentOptions([])
      return
    }

    let cancelled = false
    const loadAgents = async () => {
      try {
        const data = await agentsApi.getAgents(workspaceId, { page: 1, per_page: 200 })
        if (cancelled) {
          return
        }
        const options = (data.items || [])
          .filter((item) => item.id !== agentId && item.status === 'active')
          .map((item) => ({
            value: item.id,
            label: `${item.display_name || item.name} (#${item.id})`,
          }))
        setWorkspaceAgentOptions(options)
      } catch (error: any) {
        if (!cancelled) {
          message.error(error?.message || 'Failed to load workspace agents')
        }
      }
    }

    void loadAgents()
    return () => {
      cancelled = true
    }
  }, [workspaceId, agentId])

  const loadCollaboration = async (projectId: number | null = collaborationProjectId) => {
    if (!workspaceId || !agentId) {
      setCollaboration(null)
      return
    }

    try {
      setCollaborationLoading(true)
      const data = await listSecretCollaboration({
        project_id: typeof projectId === 'number' && Number.isFinite(projectId) ? projectId : undefined,
      })
      setCollaboration(data)
    } finally {
      setCollaborationLoading(false)
    }
  }

  useEffect(() => {
    void loadCollaboration(collaborationProjectId)
    // 依赖 secrets 可在创建/撤销后自动刷新协作拓扑
  }, [workspaceId, agentId, collaborationProjectId, secrets, listSecretCollaboration])

  const copyText = async (text: string, successMessage = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(successMessage)
    } catch {
      message.error('Copy failed')
    }
  }

  const handleCreate = async () => {
    if (!newSecretName.trim() || !newSecretValue.trim()) {
      message.warning('Please input secret name and value')
      return
    }

    if (newScopeType === 'project_shared' && !newProjectId) {
      message.warning('Project ID is required when scope is project_shared')
      return
    }

    const created = await createSecret({
      name: newSecretName.trim(),
      secret_value: newSecretValue,
      secret_type: newSecretType,
      scope_type: newScopeType,
      project_id: newScopeType === 'project_shared' && newProjectId ? newProjectId : undefined,
      description: newDescription.trim() || undefined,
    })
    if (!created) {
      return
    }

    setCreateOpen(false)
    setNewSecretName('')
    setNewSecretValue('')
    setNewSecretType('api_key')
    setNewScopeType('agent_private')
    setNewProjectId(null)
    setNewDescription('')
    await loadCollaboration(collaborationProjectId)
  }

  const openShareModal = async (secret: AgentSecret) => {
    setShareTarget(secret)
    const defaultSelector: AgentSecretTargetSelector = secret.scope_type === 'project_shared' ? 'project_agents' : 'manual'
    setShareTargetSelector(defaultSelector)
    setShareSelectorProjectId(secret.project_id || null)
    setShareAgentIds([])
    setShareReason('')
    setShareExpiresAt('')
    const rows = await listSecretShares(secret.id, true)
    setShareRows(rows)
  }

  const handleGrantShare = async () => {
    if (!shareTarget) {
      return
    }
    if (shareTargetSelector === 'manual' && shareAgentIds.length === 0) {
      message.warning('Please select target agents')
      return
    }
    if (shareTargetSelector === 'project_agents' && !shareSelectorProjectId && !shareTarget.project_id) {
      message.warning('Project ID is required for project-based sharing')
      return
    }

    const ok = await createSecretShares(shareTarget.id, shareAgentIds, {
      target_selector: shareTargetSelector,
      selector_project_id:
        shareTargetSelector === 'project_agents'
          ? (shareSelectorProjectId || shareTarget.project_id || undefined)
          : undefined,
      access_mode: 'read',
      granted_reason: shareReason.trim() || undefined,
      expires_at: shareExpiresAt ? new Date(shareExpiresAt).toISOString() : undefined,
    })
    if (!ok) {
      return
    }

    setShareAgentIds([])
    setShareReason('')
    setShareExpiresAt('')
    const rows = await listSecretShares(shareTarget.id, true)
    setShareRows(rows)
    await loadCollaboration(collaborationProjectId)
  }

  const handleRevokeShare = async (shareId: number) => {
    if (!shareTarget) {
      return
    }
    const ok = await revokeSecretShare(shareTarget.id, shareId)
    if (!ok) {
      return
    }
    const rows = await listSecretShares(shareTarget.id, true)
    setShareRows(rows)
    await loadCollaboration(collaborationProjectId)
  }

  return (
    <Card
      title={<Space><LockOutlined /> Agent Secrets & Collaboration</Space>}
      extra={
        <Button type="primary" onClick={() => setCreateOpen(true)} disabled={!agentId}>
          Add Secret
        </Button>
      }
    >
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
              <Space direction="vertical" size={2}>
                <Text strong>{value}</Text>
                <Text type="secondary">#{row.id}</Text>
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
              return <Tag color="blue">Current Agent</Tag>
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
                <Space direction="vertical" size={2}>
                  <Tag color={scopeColorMap[scope] || 'default'}>{scope}</Tag>
                  {row.project_id ? <Text type="secondary">Project #{row.project_id}</Text> : null}
                </Space>
              )
            },
          },
          {
            title: 'Status',
            key: 'status',
            width: 130,
            render: (_, row) => (row.is_active ? <Tag color="green">active</Tag> : <Tag>revoked</Tag>),
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
                    size="small"
                    icon={<EyeOutlined />}
                    disabled={!row.is_active}
                    onClick={async () => {
                      const revealed = await revealSecret(row)
                      if (!revealed) return
                      setRevealedSecret({ name: revealed.name, value: revealed.secret_value })
                    }}
                  >
                    Reveal
                  </Button>

                  {!isShared && (
                    <Button
                      size="small"
                      icon={<ShareAltOutlined />}
                      disabled={!row.is_active}
                      onClick={() => void openShareModal(row)}
                    >
                      Share
                    </Button>
                  )}

                  {!isShared && (
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      disabled={!row.is_active}
                      onClick={() => {
                        setRotateTarget(row)
                        setRotateValue('')
                      }}
                    >
                      Rotate
                    </Button>
                  )}

                  {!isShared && (
                    <Popconfirm
                      title="Revoke this secret?"
                      okText="Revoke"
                      cancelText="Cancel"
                      onConfirm={async () => {
                        const ok = await revokeSecret(row.id)
                        if (ok) {
                          await loadCollaboration(collaborationProjectId)
                        }
                      }}
                    >
                      <Button size="small" danger icon={<StopOutlined />} disabled={!row.is_active}>
                        Revoke
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              )
            },
          },
        ]}
      />

      {secrets.length === 0 && (
        <Paragraph type="secondary" style={{ marginTop: 12 }}>
          No secrets yet.
        </Paragraph>
      )}

      {sharedSecrets.length > 0 && (
        <>
          <Divider style={{ marginTop: 20, marginBottom: 12 }} />
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            This agent currently has access to {sharedSecrets.length} shared secret(s) from other agents.
          </Paragraph>
        </>
      )}

      <Divider style={{ marginTop: 20, marginBottom: 12 }} />
      <Space wrap align="center" style={{ marginBottom: 12 }}>
        <Text strong>Secret Collaboration Topology</Text>
        <InputNumber
          min={1}
          value={collaborationProjectId ?? undefined}
          placeholder="Filter by Project ID"
          onChange={(value) => setCollaborationProjectId(typeof value === 'number' ? value : null)}
        />
        <Button icon={<RefreshOutlined />} onClick={() => void loadCollaboration(collaborationProjectId)}>
          Refresh
        </Button>
      </Space>

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Card size="small" style={{ minWidth: 180 }}>
          <Statistic
            title="Outgoing Shares"
            value={collaboration?.stats?.outgoing_share_count || 0}
            loading={collaborationLoading}
          />
        </Card>
        <Card size="small" style={{ minWidth: 180 }}>
          <Statistic
            title="Incoming Shares"
            value={collaboration?.stats?.incoming_share_count || 0}
            loading={collaborationLoading}
          />
        </Card>
        <Card size="small" style={{ minWidth: 180 }}>
          <Statistic
            title="Outgoing Agents"
            value={collaboration?.stats?.outgoing_agent_count || 0}
            loading={collaborationLoading}
          />
        </Card>
        <Card size="small" style={{ minWidth: 180 }}>
          <Statistic
            title="Incoming Agents"
            value={collaboration?.stats?.incoming_agent_count || 0}
            loading={collaborationLoading}
          />
        </Card>
        <Card size="small" style={{ minWidth: 180 }}>
          <Statistic
            title="Active Edges"
            value={collaboration?.stats?.active_edge_count || 0}
            loading={collaborationLoading}
          />
        </Card>
      </Row>

      <Text strong>Outgoing Collaborators</Text>
      <Table
        rowKey="agent_id"
        size="small"
        loading={collaborationLoading}
        dataSource={collaboration?.outgoing_collaborators || []}
        pagination={false}
        style={{ marginTop: 8, marginBottom: 14 }}
        columns={[
          {
            title: 'Agent',
            key: 'agent',
            render: (_, row: any) => row.agent_name || `#${row.agent_id}`,
          },
          { title: 'Shares', dataIndex: 'share_count', key: 'share_count', width: 100 },
          { title: 'Active', dataIndex: 'active_share_count', key: 'active_share_count', width: 100 },
          { title: 'Secrets', dataIndex: 'secret_count', key: 'secret_count', width: 100 },
          {
            title: 'Last Update',
            dataIndex: 'last_updated_at',
            key: 'last_updated_at',
            width: 200,
            render: (value: string | null) => (value ? new Date(value).toLocaleString() : '-'),
          },
        ]}
      />

      <Text strong>Incoming Collaborators</Text>
      <Table
        rowKey="agent_id"
        size="small"
        loading={collaborationLoading}
        dataSource={collaboration?.incoming_collaborators || []}
        pagination={false}
        style={{ marginTop: 8, marginBottom: 14 }}
        columns={[
          {
            title: 'Agent',
            key: 'agent',
            render: (_, row: any) => row.agent_name || `#${row.agent_id}`,
          },
          { title: 'Shares', dataIndex: 'share_count', key: 'share_count', width: 100 },
          { title: 'Active', dataIndex: 'active_share_count', key: 'active_share_count', width: 100 },
          { title: 'Secrets', dataIndex: 'secret_count', key: 'secret_count', width: 100 },
          {
            title: 'Last Update',
            dataIndex: 'last_updated_at',
            key: 'last_updated_at',
            width: 200,
            render: (value: string | null) => (value ? new Date(value).toLocaleString() : '-'),
          },
        ]}
      />

      <Modal
        title="Add Secret"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="OPENAI_API_KEY"
            value={newSecretName}
            onChange={(event) => setNewSecretName(event.target.value)}
            maxLength={128}
          />
          <Input.Password
            placeholder="Secret value"
            value={newSecretValue}
            onChange={(event) => setNewSecretValue(event.target.value)}
          />
          <Select
            value={newSecretType}
            options={secretTypeOptions}
            onChange={(value) => setNewSecretType(value)}
            placeholder="Secret type"
          />
          <Select
            value={newScopeType}
            options={scopeTypeOptions}
            onChange={(value) => {
              setNewScopeType(value)
              if (value !== 'project_shared') {
                setNewProjectId(null)
              }
            }}
            placeholder="Scope"
          />
          {newScopeType === 'project_shared' ? (
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              value={newProjectId ?? undefined}
              placeholder="Project ID"
              onChange={(value) => setNewProjectId(typeof value === 'number' ? value : null)}
            />
          ) : null}
          <Input.TextArea
            rows={3}
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
          />
        </Space>
      </Modal>

      <Modal
        title={revealedSecret ? `Secret: ${revealedSecret.name}` : 'Revealed Secret'}
        open={!!revealedSecret}
        onCancel={() => setRevealedSecret(null)}
        onOk={() => setRevealedSecret(null)}
        okText="Close"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.TextArea rows={4} value={revealedSecret?.value || ''} readOnly />
          <Button onClick={() => revealedSecret && copyText(revealedSecret.value, 'Secret copied')}>
            Copy Secret
          </Button>
        </Space>
      </Modal>

      <Modal
        title={rotateTarget ? `Rotate ${rotateTarget.name}` : 'Rotate Secret'}
        open={!!rotateTarget}
        onCancel={() => setRotateTarget(null)}
        onOk={async () => {
          if (!rotateTarget || !rotateValue.trim()) {
            message.warning('Please input new secret value')
            return
          }

          const ok = await rotateSecret(rotateTarget.id, rotateValue)
          if (ok) {
            setRotateTarget(null)
          }
        }}
        confirmLoading={loading}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>New secret value</Text>
          <Input.Password value={rotateValue} onChange={(event) => setRotateValue(event.target.value)} />
        </Space>
      </Modal>

      <Modal
        title={shareTarget ? `Share ${shareTarget.name}` : 'Share Secret'}
        open={!!shareTarget}
        onCancel={() => {
          setShareTarget(null)
          setShareRows([])
          setShareTargetSelector('manual')
          setShareSelectorProjectId(null)
        }}
        onOk={() => void handleGrantShare()}
        confirmLoading={loading}
        okText="Grant Access"
        width={880}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={14}>
          <Select
            value={shareTargetSelector}
            options={shareSelectorOptions}
            onChange={(value) => setShareTargetSelector(value)}
          />
          {shareTargetSelector === 'manual' ? (
            <Select
              mode="multiple"
              allowClear
              showSearch
              value={shareAgentIds}
              options={workspaceAgentOptions}
              optionFilterProp="label"
              placeholder="Select target agents"
              onChange={(value) => setShareAgentIds(value)}
            />
          ) : null}
          {shareTargetSelector === 'project_agents' ? (
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              value={shareSelectorProjectId ?? shareTarget?.project_id ?? undefined}
              placeholder="Project ID (optional if secret already bound to project)"
              onChange={(value) => setShareSelectorProjectId(typeof value === 'number' ? value : null)}
            />
          ) : null}
          <Input
            placeholder="Granted reason (optional)"
            value={shareReason}
            onChange={(event) => setShareReason(event.target.value)}
          />
          <Input
            type="datetime-local"
            value={shareExpiresAt}
            placeholder="Expire at (optional)"
            onChange={(event) => setShareExpiresAt(event.target.value)}
          />

          <Divider style={{ marginTop: 4, marginBottom: 4 }} />
          <Text strong>Current Shares</Text>
          <Table<AgentSecretShare>
            rowKey="id"
            size="small"
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
                render: (_, row) => row.expires_at ? new Date(row.expires_at).toLocaleString() : '-',
              },
              {
                title: 'Status',
                key: 'status',
                width: 120,
                render: (_, row) => {
                  if (!row.is_active) return <Tag>revoked</Tag>
                  if (row.is_expired) return <Tag color="orange">expired</Tag>
                  return <Tag color="green">active</Tag>
                },
              },
              {
                title: 'Actions',
                key: 'actions',
                width: 120,
                render: (_, row) => (
                  <Popconfirm
                    title="Revoke this share?"
                    okText="Revoke"
                    cancelText="Cancel"
                    onConfirm={() => void handleRevokeShare(row.id)}
                    disabled={!row.is_active}
                  >
                    <Button size="small" danger disabled={!row.is_active}>
                      Revoke
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
          />
        </Space>
      </Modal>
    </Card>
  )
}
