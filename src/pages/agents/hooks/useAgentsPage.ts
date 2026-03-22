import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { organizationsApi, type Organization } from '../../../api/organizations'
import {
  agentsApi,
  type Agent,
  type AgentListResponse,
  type AgentStatus,
  type CreateAgentRequest,
  type UpdateAgentRequest,
} from '../../../api/agents'
import i18n from '../../../i18n'

const emptyPagination: AgentListResponse['pagination'] = {
  page: 1,
  per_page: 20,
  total: 0,
  has_prev: false,
  has_next: false,
}

export function useAgentsPage() {
  const [workspaces, setWorkspaces] = useState<Organization[]>([])
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsPagination, setAgentsPagination] = useState<AgentListResponse['pagination']>(emptyPagination)
  const [agentSearch, setAgentSearch] = useState('')
  const [agentSearchInput, setAgentSearchInput] = useState('')
  const [agentStatusFilter, setAgentStatusFilter] = useState<AgentStatus | ''>('')
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'mine' | 'collaborating'>('all')
  const [loading, setLoading] = useState(false)

  const loadWorkspaces = useCallback(async () => {
    const data = await organizationsApi.getOrganizations({ page: 1, per_page: 200 })
    const items = data.items || []
    setWorkspaces(items)
    if (!workspaceId && items.length > 0) {
      setWorkspaceId(items[0].id)
    }
  }, [workspaceId])

  const loadAgents = useCallback(async () => {
    if (!workspaceId) {
      setAgents([])
      setAgentsPagination(emptyPagination)
      return
    }

    try {
      setLoading(true)
      const data = await agentsApi.getAgents(workspaceId, {
        page: agentsPagination.page,
        per_page: agentsPagination.per_page,
        search: agentSearch || undefined,
        status: agentStatusFilter || undefined,
        ownership: ownershipFilter,
      })
      setAgents(data.items || [])
      setAgentsPagination(data.pagination || emptyPagination)
    } catch (error: any) {
      message.error(error?.message || i18n.t('agents:messages.loadAgentsFailed'))
    } finally {
      setLoading(false)
    }
  }, [
    workspaceId,
    agentsPagination.page,
    agentsPagination.per_page,
    agentSearch,
    agentStatusFilter,
    ownershipFilter,
  ])

  const createAgent = useCallback(
    async (payload: CreateAgentRequest) => {
      if (!workspaceId) {
        message.warning(i18n.t('agents:form.validation.workspaceRequired'))
        return null
      }

      try {
        setLoading(true)
        const created = await agentsApi.createAgent(workspaceId, payload)
        message.success(i18n.t('agents:messages.createSuccess'))
        await loadAgents()
        return created
      } catch (error: any) {
        message.error(error?.message || i18n.t('agents:messages.createFailed'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, loadAgents]
  )

  const updateAgent = useCallback(
    async (agentId: number, payload: UpdateAgentRequest) => {
      if (!workspaceId) {
        return null
      }

      try {
        setLoading(true)
        const updated = await agentsApi.updateAgent(workspaceId, agentId, payload)
        message.success(i18n.t('agents:messages.updateSuccess'))
        await loadAgents()
        return updated
      } catch (error: any) {
        message.error(error?.message || i18n.t('agents:messages.updateFailed'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, loadAgents]
  )

  const revokeAgent = useCallback(
    async (agentId: number) => {
      if (!workspaceId) {
        return false
      }

      try {
        setLoading(true)
        await agentsApi.deleteAgent(workspaceId, agentId)
        message.success(i18n.t('agents:messages.revokeSuccess'))
        await loadAgents()
        return true
      } catch (error: any) {
        message.error(error?.message || i18n.t('agents:messages.revokeFailed'))
        return false
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, loadAgents]
  )

  const applyAgentSearch = useCallback((value: string) => {
    setAgentSearch(value.trim())
    setAgentsPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const updateAgentSearchInput = useCallback((value: string) => {
    setAgentSearchInput(value)
  }, [])

  const updateAgentStatusFilter = useCallback((value: AgentStatus | '') => {
    setAgentStatusFilter(value)
    setAgentsPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const updateOwnershipFilter = useCallback((value: 'all' | 'mine' | 'collaborating') => {
    setOwnershipFilter(value)
    setAgentsPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const updateAgentPage = useCallback((page: number, perPage?: number) => {
    setAgentsPagination((prev) => ({
      ...prev,
      page,
      per_page: perPage || prev.per_page,
    }))
  }, [])

  useEffect(() => {
    loadWorkspaces().catch((error: any) => {
      message.error(error?.message || 'Failed to load workspaces')
    })
  }, [loadWorkspaces])

  useEffect(() => {
    setAgentsPagination((prev) => ({ ...prev, page: 1 }))
  }, [workspaceId])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  return {
    workspaces,
    workspaceId,
    setWorkspaceId,
    agents,
    agentsPagination,
    agentSearchInput,
    updateAgentSearchInput,
    applyAgentSearch,
    agentStatusFilter,
    updateAgentStatusFilter,
    ownershipFilter,
    updateOwnershipFilter,
    updateAgentPage,
    loading,
    createAgent,
    updateAgent,
    revokeAgent,
    reloadAgents: loadAgents,
  }
}
