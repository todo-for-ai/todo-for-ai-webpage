import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Space, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import {
  agentsApi,
  type AgentSecret,
  type AgentSecretCollaborationResponse,
  type AgentSecretShare,
} from '../../../api/agents'
import { useAgentSecrets } from '../hooks/useAgentSecrets'
import { useTranslation } from 'react-i18next'
import { CreateSecretModal } from './secrets/CreateSecretModal'
import { RevealSecretModal } from './secrets/RevealSecretModal'
import { RotateSecretModal } from './secrets/RotateSecretModal'
import { SecretsCollaborationSection } from './secrets/SecretsCollaborationSection'
import { SecretsTableSection } from './secrets/SecretsTableSection'
import { ShareSecretModal } from './secrets/ShareSecretModal'
import {
  defaultCreateSecretFormState,
  defaultShareSecretFormState,
  type CreateSecretFormState,
  type RevealedSecretState,
  type ShareSecretFormState,
} from './secrets/shared'
import './AgentSecretsCard.css'

interface AgentSecretsCardProps {
  workspaceId: number | null
  agentId: number | null
}

export function AgentSecretsCard({ workspaceId, agentId }: AgentSecretsCardProps) {
  const { t } = useTranslation('agents')
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
  const [createForm, setCreateForm] = useState<CreateSecretFormState>(defaultCreateSecretFormState)
  const [revealedSecret, setRevealedSecret] = useState<RevealedSecretState | null>(null)
  const [rotateTarget, setRotateTarget] = useState<AgentSecret | null>(null)
  const [rotateValue, setRotateValue] = useState('')
  const [shareTarget, setShareTarget] = useState<AgentSecret | null>(null)
  const [shareForm, setShareForm] = useState<ShareSecretFormState>(defaultShareSecretFormState)
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
          message.error(error?.message || t('common:messages.error.loadFailed'))
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
  }, [workspaceId, agentId, collaborationProjectId, secrets, listSecretCollaboration])

  const copyText = async (text: string, successMessage = t('common:actions.copy')) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(successMessage)
    } catch {
      message.error(t('common:messages.error.copyFailed'))
    }
  }

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.value.trim()) {
      message.warning(t('common:validation.required'))
      return
    }

    if (createForm.scopeType === 'project_shared' && !createForm.projectId) {
      message.warning(t('common:validation.projectRequired'))
      return
    }

    const created = await createSecret({
      name: createForm.name.trim(),
      secret_value: createForm.value,
      secret_type: createForm.type,
      scope_type: createForm.scopeType,
      project_id:
        createForm.scopeType === 'project_shared' && createForm.projectId ? createForm.projectId : undefined,
      description: createForm.description.trim() || undefined,
    })
    if (!created) {
      return
    }

    setCreateOpen(false)
    setCreateForm({ ...defaultCreateSecretFormState })
    await loadCollaboration(collaborationProjectId)
  }

  const openShareModal = async (secret: AgentSecret) => {
    setShareTarget(secret)
    const defaultSelector = secret.scope_type === 'project_shared' ? 'project_agents' : 'manual'
    setShareForm({
      ...defaultShareSecretFormState,
      targetSelector: defaultSelector,
      selectorProjectId: secret.project_id || null,
    })
    const rows = await listSecretShares(secret.id, true)
    setShareRows(rows)
  }

  const handleGrantShare = async () => {
    if (!shareTarget) {
      return
    }
    if (shareForm.targetSelector === 'manual' && shareForm.agentIds.length === 0) {
      message.warning(t('common:validation.agentsRequired'))
      return
    }
    if (shareForm.targetSelector === 'project_agents' && !shareForm.selectorProjectId && !shareTarget.project_id) {
      message.warning(t('common:validation.projectRequired'))
      return
    }

    const ok = await createSecretShares(shareTarget.id, shareForm.agentIds, {
      target_selector: shareForm.targetSelector,
      selector_project_id:
        shareForm.targetSelector === 'project_agents'
          ? (shareForm.selectorProjectId || shareTarget.project_id || undefined)
          : undefined,
      access_mode: 'read',
      granted_reason: shareForm.reason.trim() || undefined,
      expires_at: shareForm.expiresAt ? new Date(shareForm.expiresAt).toISOString() : undefined,
    })
    if (!ok) {
      return
    }

    setShareForm((prev) => ({ ...prev, agentIds: [], reason: '', expiresAt: '' }))
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

  const handleRotate = async () => {
    if (!rotateTarget || !rotateValue.trim()) {
      message.warning(t('common:validation.valueRequired'))
      return
    }

    const ok = await rotateSecret(rotateTarget.id, rotateValue)
    if (!ok) {
      return
    }
    setRotateTarget(null)
  }

  const handleReveal = async (secret: AgentSecret) => {
    const revealed = await revealSecret(secret)
    if (!revealed) {
      return
    }
    setRevealedSecret({ name: revealed.name, value: revealed.secret_value })
  }

  const handleRevoke = async (secret: AgentSecret) => {
    const ok = await revokeSecret(secret.id)
    if (!ok) {
      return
    }
    await loadCollaboration(collaborationProjectId)
  }

  const closeShareModal = () => {
    setShareTarget(null)
    setShareRows([])
    setShareForm({ ...defaultShareSecretFormState })
  }

  return (
    <Card
      title={
        <Space className='agent-secrets-card__title'>
          <LockOutlined />
          {t('detail.secrets.title')}
        </Space>
      }
      extra={
        <Button
          type='text'
          onClick={() => setCreateOpen(true)}
          disabled={!agentId}
          className="flat-btn flat-btn--primary"
        >
          {t('detail.secrets.addSecret')}
        </Button>
      }
    >
      <SecretsTableSection
        loading={loading}
        secrets={secrets}
        sharedSecrets={sharedSecrets}
        onReveal={(secret) => void handleReveal(secret)}
        onShare={(secret) => void openShareModal(secret)}
        onRotate={(secret) => {
          setRotateTarget(secret)
          setRotateValue('')
        }}
        onRevoke={(secret) => void handleRevoke(secret)}
      />

      <SecretsCollaborationSection
        collaboration={collaboration}
        collaborationLoading={collaborationLoading}
        collaborationProjectId={collaborationProjectId}
        onProjectIdChange={setCollaborationProjectId}
        onRefresh={() => void loadCollaboration(collaborationProjectId)}
      />

      <CreateSecretModal
        open={createOpen}
        loading={loading}
        form={createForm}
        onFormChange={setCreateForm}
        onCancel={() => setCreateOpen(false)}
        onConfirm={() => void handleCreate()}
      />

      <RevealSecretModal
        secret={revealedSecret}
        onClose={() => setRevealedSecret(null)}
        onCopy={(value) => void copyText(value, 'Secret copied')}
      />

      <RotateSecretModal
        target={rotateTarget}
        loading={loading}
        value={rotateValue}
        onValueChange={setRotateValue}
        onCancel={() => setRotateTarget(null)}
        onConfirm={() => void handleRotate()}
      />

      <ShareSecretModal
        target={shareTarget}
        loading={loading}
        form={shareForm}
        workspaceAgentOptions={workspaceAgentOptions}
        shareRows={shareRows}
        onFormChange={setShareForm}
        onCancel={closeShareModal}
        onGrant={() => void handleGrantShare()}
        onRevokeShare={(shareId) => void handleRevokeShare(shareId)}
      />
    </Card>
  )
}
