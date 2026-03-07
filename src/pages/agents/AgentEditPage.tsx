import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, message } from 'antd'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { agentsApi, type Agent } from '../../api/agents'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { AgentEditorForm } from './components/AgentEditorForm'
import { useAgentWorkspaceOptions } from './hooks/useAgentWorkspaceOptions'
import type { AgentFormPayload } from './components/agentFormTypes'

export default function AgentEditPage() {
  const { tp } = usePageTranslation('agents')
  const navigate = useNavigate()
  const { agentId: agentIdRaw } = useParams<{ agentId: string }>()
  const [searchParams] = useSearchParams()

  const agentId = useMemo(() => {
    const parsed = Number(agentIdRaw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [agentIdRaw])

  const queryWorkspaceId = useMemo(() => {
    const raw = searchParams.get('workspace_id')
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [searchParams])

  const {
    loading: workspacesLoading,
    workspaces,
    workspaceId,
    setWorkspaceId,
    workspaceOptions,
  } = useAgentWorkspaceOptions(queryWorkspaceId)

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loadingAgent, setLoadingAgent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!agentId) {
      setNotFound(true)
      return
    }
    if (workspacesLoading || workspaces.length === 0) {
      return
    }

    let cancelled = false
    const resolveAgent = async () => {
      try {
        setLoadingAgent(true)
        setNotFound(false)

        const candidates: number[] = []
        if (queryWorkspaceId && workspaces.some((item) => item.id === queryWorkspaceId)) {
          candidates.push(queryWorkspaceId)
        }
        for (const workspace of workspaces) {
          if (!candidates.includes(workspace.id)) {
            candidates.push(workspace.id)
          }
        }

        for (const candidateWorkspaceId of candidates) {
          try {
            const found = await agentsApi.getAgent(candidateWorkspaceId, agentId)
            if (cancelled) return
            setAgent(found)
            setWorkspaceId(candidateWorkspaceId)
            return
          } catch {
            // try next workspace
          }
        }

        if (!cancelled) {
          setAgent(null)
          setNotFound(true)
        }
      } finally {
        if (!cancelled) {
          setLoadingAgent(false)
        }
      }
    }

    resolveAgent()
    return () => {
      cancelled = true
    }
  }, [agentId, queryWorkspaceId, setWorkspaceId, workspaces, workspacesLoading])

  const handleSubmit = async (payload: AgentFormPayload) => {
    if (!workspaceId || !agentId) {
      return
    }

    try {
      setSubmitting(true)
      await agentsApi.updateAgent(workspaceId, agentId, payload)
      message.success(tp('messages.updateSuccess'))
      navigate(`/todo-for-ai/pages/agents/${agentId}/overview?workspace_id=${workspaceId}`, { replace: true })
    } catch (error: any) {
      message.error(error?.message || tp('messages.updateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!agentId || notFound) {
    return (
      <div className="page-container">
        <Card>
          <Alert
            type="error"
            message={tp('messages.agentNotFound')}
            description={tp('messages.agentNotFoundDesc')}
            action={<Button onClick={() => navigate(`/todo-for-ai/pages/agents${workspaceId ? `?workspace_id=${workspaceId}` : ''}`)}>{tp('messages.backToAgents')}</Button>}
          />
        </Card>
      </div>
    )
  }

  return (
    <AgentEditorForm
      mode="edit"
      title={tp('editTitle')}
      submitText={tp('form.save')}
      loading={workspacesLoading || loadingAgent}
      submitting={submitting}
      workspaces={workspaceOptions}
      workspaceId={workspaceId}
      lockWorkspace
      agent={agent}
      onWorkspaceChange={setWorkspaceId}
      onCancel={() =>
        navigate(
          agentId
            ? `/todo-for-ai/pages/agents/${agentId}/overview${workspaceId ? `?workspace_id=${workspaceId}` : ''}`
            : `/todo-for-ai/pages/agents${workspaceId ? `?workspace_id=${workspaceId}` : ''}`
        )
      }
      onSubmit={handleSubmit}
    />
  )
}
