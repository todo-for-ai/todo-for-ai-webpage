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
const AGENT_RESOLVE_MAX_CONCURRENCY = 6

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

function buildUniqueWorkspaceCandidates(values: Array<number | null | undefined>): number[] {
  const result: number[] = []
  const seen = new Set<number>()
  for (const value of values) {
    if (!value || value <= 0 || seen.has(value)) {
      continue
    }
    seen.add(value)
    result.push(value)
  }
  return result
}

async function probeAgentAcrossWorkspaces(agentId: number, workspaceCandidates: number[]) {
  const candidates = buildUniqueWorkspaceCandidates(workspaceCandidates)
  if (candidates.length === 0) {
    return { match: null as { agent: Agent; workspaceId: number } | null, lastError: null as any }
  }

  let cursor = 0
  let match: { agent: Agent; workspaceId: number } | null = null
  let lastError: any = null

  const workerCount = Math.min(AGENT_RESOLVE_MAX_CONCURRENCY, candidates.length)
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      if (match) {
        return
      }

      const index = cursor
      cursor += 1
      if (index >= candidates.length) {
        return
      }

      const workspaceId = candidates[index]
      try {
        const detail = await agentsApi.getAgent(workspaceId, agentId)
        if (!match) {
          match = { agent: detail, workspaceId }
        }
        return
      } catch (error: any) {
        if (error?.status !== 404 && error?.status !== 403) {
          lastError = error
        }
      }
    }
  })

  await Promise.all(workers)
  return { match, lastError }
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

  const fetchWorkspaces = useCallback(async () => {
    const data = await organizationsApi.getOrganizations({ page: 1, per_page: 200 })
    return data.items || []
  }, [])

  useEffect(() => {
    let cancelled = false

    const applyResolvedAgent = (resolvedAgent: Agent, resolvedWorkspaceId: number) => {
      if (cancelled) {
        return
      }
      setAgent(resolvedAgent)
      setWorkspaceId(resolvedWorkspaceId)
      syncWorkspaceQuery(resolvedWorkspaceId)
      setNotFound(false)
      setResolving(false)
    }

    const resolveAgent = async () => {
      if (!agentId) {
        setResolving(false)
        setNotFound(true)
        setAgent(null)
        setWorkspaceId(null)
        return
      }

      if (agent && workspaceId && agent.id === agentId && (!preferredWorkspaceId || preferredWorkspaceId === workspaceId)) {
        setResolving(false)
        setNotFound(false)
        return
      }

      setResolving(true)
      setNotFound(false)

      const preferredCandidates = buildUniqueWorkspaceCandidates([preferredWorkspaceId])
      const preferredProbe = await probeAgentAcrossWorkspaces(agentId, preferredCandidates)

      if (cancelled) {
        return
      }

      if (preferredProbe.match) {
        applyResolvedAgent(preferredProbe.match.agent, preferredProbe.match.workspaceId)
        if (workspaces.length === 0) {
          void fetchWorkspaces()
            .then((items) => {
              if (!cancelled) {
                setWorkspaces(items)
              }
            })
            .catch(() => {
              // Ignore workspace-name hydration failures; detail data is already resolved.
            })
        }
        return
      }

      let workspaceItems = workspaces
      let workspaceFetchError: any = null

      if (workspaceItems.length === 0) {
        try {
          workspaceItems = await fetchWorkspaces()
          if (cancelled) {
            return
          }
          setWorkspaces(workspaceItems)
        } catch (error: any) {
          workspaceFetchError = error
          workspaceItems = []
        }
      }

      const fallbackCandidates = buildUniqueWorkspaceCandidates(
        workspaceItems.map((item) => item.id).filter((id) => !preferredCandidates.includes(id))
      )
      const fallbackProbe = await probeAgentAcrossWorkspaces(agentId, fallbackCandidates)

      if (cancelled) {
        return
      }

      if (fallbackProbe.match) {
        applyResolvedAgent(fallbackProbe.match.agent, fallbackProbe.match.workspaceId)
        return
      }

      setAgent(null)
      setWorkspaceId(null)
      setNotFound(true)
      setResolving(false)

      const finalError = preferredProbe.lastError || fallbackProbe.lastError || workspaceFetchError
      if (finalError) {
        message.error(finalError?.message || loadAgentsFailedMessage)
      }
    }

    void resolveAgent()

    return () => {
      cancelled = true
    }
  }, [agent, agentId, loadAgentsFailedMessage, fetchWorkspaces, preferredWorkspaceId, syncWorkspaceQuery, workspaceId])

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
