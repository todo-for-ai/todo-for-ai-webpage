import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Result, Space, Spin, Tag, Typography, message } from 'antd'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { agentsApi, type Agent } from '../../api/agents'
import { organizationsApi, type Organization } from '../../api/organizations'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { AgentDetailTabs, isAgentDetailTabKey, type AgentDetailTabKey } from './components/AgentDetailTabs'

const { Title, Text } = Typography
const DEFAULT_TAB: AgentDetailTabKey = 'overview'

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined
  }
  return parsed
}

export default function AgentDetailPage() {
  const { tp } = usePageTranslation('agents')
  const navigate = useNavigate()
  const params = useParams<{ agentId?: string; tabKey?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const agentId = parsePositiveInt(params.agentId || null)
  const activeTab: AgentDetailTabKey = isAgentDetailTabKey(params.tabKey) ? params.tabKey : DEFAULT_TAB
  const preferredWorkspaceId = parsePositiveInt(searchParams.get('workspace_id'))
  const currentQueryText = searchParams.toString()
  const loadAgentsFailedMessage = tp('messages.loadAgentsFailed', { defaultValue: 'Failed to load agents' })

  const [workspaces, setWorkspaces] = useState<Organization[]>([])
  const [workspaceId, setWorkspaceId] = useState<number | null>(preferredWorkspaceId || null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [resolving, setResolving] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const workspaceMap = useMemo(() => {
    const result = new Map<number, Organization>()
    for (const item of workspaces) {
      result.set(item.id, item)
    }
    return result
  }, [workspaces])

  const syncWorkspaceQuery = useCallback(
    (resolvedWorkspaceId: number) => {
      const next = new URLSearchParams(currentQueryText)
      const current = parsePositiveInt(next.get('workspace_id'))
      if (current === resolvedWorkspaceId) {
        return
      }
      next.set('workspace_id', String(resolvedWorkspaceId))
      setSearchParams(next, { replace: true })
    },
    [currentQueryText, setSearchParams]
  )

  const loadWorkspaces = useCallback(async () => {
    const data = await organizationsApi.getOrganizations({ page: 1, per_page: 200 })
    setWorkspaces(data.items || [])
  }, [])

  const resolveAgent = useCallback(async () => {
    if (!agentId) {
      setResolving(false)
      setNotFound(true)
      setAgent(null)
      setWorkspaceId(null)
      return
    }

    if (workspaces.length === 0 && !preferredWorkspaceId) {
      setResolving(false)
      setNotFound(true)
      setAgent(null)
      setWorkspaceId(null)
      return
    }

    setResolving(true)
    setNotFound(false)

    const workspaceIds = workspaces.map((item) => item.id)
    const candidates: number[] = []

    if (preferredWorkspaceId) {
      candidates.push(preferredWorkspaceId)
    }

    for (const id of workspaceIds) {
      if (!candidates.includes(id)) {
        candidates.push(id)
      }
    }

    let lastError: any = null

    for (const candidateWorkspaceId of candidates) {
      try {
        const detail = await agentsApi.getAgent(candidateWorkspaceId, agentId)
        setAgent(detail)
        setWorkspaceId(candidateWorkspaceId)
        syncWorkspaceQuery(candidateWorkspaceId)
        setNotFound(false)
        setResolving(false)
        return
      } catch (error: any) {
        if (error?.status === 404 || error?.status === 403) {
          continue
        }
        lastError = error
      }
    }

    setAgent(null)
    setWorkspaceId(null)
    setNotFound(true)
    setResolving(false)

    if (lastError) {
      message.error(lastError?.message || loadAgentsFailedMessage)
    }
  }, [agentId, preferredWorkspaceId, syncWorkspaceQuery, loadAgentsFailedMessage, workspaces])

  useEffect(() => {
    loadWorkspaces().catch((error: any) => {
      message.error(error?.message || loadAgentsFailedMessage)
      setResolving(false)
    })
  }, [loadWorkspaces, loadAgentsFailedMessage])

  useEffect(() => {
    if (workspaces.length > 0 || agentId === undefined) {
      void resolveAgent()
    }
  }, [workspaces, resolveAgent, agentId])

  useEffect(() => {
    if (!agentId) {
      return
    }
    if (isAgentDetailTabKey(params.tabKey)) {
      return
    }

    navigate(
      {
        pathname: `/todo-for-ai/pages/agents/${agentId}/${DEFAULT_TAB}`,
        search: currentQueryText ? `?${currentQueryText}` : '',
      },
      { replace: true }
    )
  }, [agentId, navigate, params.tabKey, currentQueryText])

  const reloadAgent = useCallback(async () => {
    if (!workspaceId || !agentId) {
      return
    }
    const detail = await agentsApi.getAgent(workspaceId, agentId)
    setAgent(detail)
  }, [workspaceId, agentId])

  const backToList = () => {
    navigate(`/todo-for-ai/pages/agents${workspaceId ? `?workspace_id=${workspaceId}` : ''}`)
  }

  const goToEdit = () => {
    if (!agentId) {
      return
    }
    navigate(`/todo-for-ai/pages/agents/${agentId}/edit${workspaceId ? `?workspace_id=${workspaceId}` : ''}`)
  }

  const handleTabChange = useCallback(
    (nextTab: AgentDetailTabKey) => {
      if (!agentId || nextTab === activeTab) {
        return
      }

      const query = new URLSearchParams(currentQueryText)
      const effectiveWorkspaceId = workspaceId || preferredWorkspaceId
      if (effectiveWorkspaceId) {
        query.set('workspace_id', String(effectiveWorkspaceId))
      }

      const queryText = query.toString()
      navigate({
        pathname: `/todo-for-ai/pages/agents/${agentId}/${nextTab}`,
        search: queryText ? `?${queryText}` : '',
      })
    },
    [activeTab, agentId, navigate, preferredWorkspaceId, currentQueryText, workspaceId]
  )

  if (resolving) {
    return (
      <div className="page-container">
        <Card>
          <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin />
          </div>
        </Card>
      </div>
    )
  }

  if (!agent || !workspaceId || notFound) {
    return (
      <div className="page-container">
        <Result
          status="404"
          title={tp('messages.agentNotFound', { defaultValue: 'Agent not found' })}
          subTitle={tp('messages.agentNotFoundDesc', {
            defaultValue: 'The agent does not exist in your accessible workspaces.',
          })}
          extra={<Button onClick={backToList}>{tp('messages.backToAgents', { defaultValue: 'Back to Agents' })}</Button>}
        />
      </div>
    )
  }

  const workspaceName = workspaceMap.get(workspaceId)?.name || `#${workspaceId}`

  return (
    <div className="page-container">
      <div style={{ marginBottom: 16 }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Space align="center">
              <Button icon={<ArrowLeftOutlined />} onClick={backToList}>
                {tp('messages.backToAgents', { defaultValue: 'Back to Agents' })}
              </Button>
              <Tag>{tp('detailPage.workspace', { defaultValue: 'Workspace' })}: {workspaceName}</Tag>
            </Space>
            <Title level={2} style={{ marginTop: 12, marginBottom: 0 }}>
              {agent.display_name || agent.name}
            </Title>
            <Text type="secondary">
              #{agent.id} · {tp('detail.title', { defaultValue: 'Agent Detail' })}
            </Text>
          </div>

          <Space>
            <Button icon={<EditOutlined />} onClick={goToEdit}>
              {tp('table.edit', { defaultValue: 'Edit' })}
            </Button>
          </Space>
        </Space>
      </div>

      <AgentDetailTabs
        workspaceId={workspaceId}
        agent={agent}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAfterRollback={reloadAgent}
      />
    </div>
  )
}
