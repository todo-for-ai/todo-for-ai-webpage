import { useMemo, useState } from 'react'
import { message } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { agentsApi } from '../../api/agents'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { AgentEditorForm } from './components/AgentEditorForm'
import { useAgentWorkspaceOptions } from './hooks/useAgentWorkspaceOptions'
import type { AgentFormPayload } from './components/agentFormTypes'

export default function AgentCreatePage() {
  const { tp } = usePageTranslation('agents')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryWorkspaceId = useMemo(() => {
    const raw = searchParams.get('workspace_id')
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [searchParams])

  const {
    loading,
    workspaceId,
    setWorkspaceId,
    workspaceOptions,
  } = useAgentWorkspaceOptions(queryWorkspaceId)

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (payload: AgentFormPayload) => {
    if (!workspaceId) {
      message.warning(tp('form.validation.workspaceRequired'))
      return
    }

    try {
      setSubmitting(true)
      const created = await agentsApi.createAgent(workspaceId, payload)
      message.success(tp('messages.createSuccess'))
      navigate(`/todo-for-ai/pages/agents/${created.id}/overview?workspace_id=${workspaceId}`, { replace: true })
    } catch (error: any) {
      message.error(error?.message || tp('messages.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AgentEditorForm
      mode="create"
      title={tp('createTitle')}
      submitText={tp('form.create')}
      loading={loading}
      submitting={submitting}
      workspaces={workspaceOptions}
      workspaceId={workspaceId}
      onWorkspaceChange={setWorkspaceId}
      onCancel={() => navigate(`/todo-for-ai/pages/agents${workspaceId ? `?workspace_id=${workspaceId}` : ''}`)}
      onSubmit={handleSubmit}
    />
  )
}
