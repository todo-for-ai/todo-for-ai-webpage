import { useCallback, useEffect, useRef, useState } from 'react'
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

// 简单的内存缓存
const agentsCache = new Map<string, { data: AgentListResponse; timestamp: number }>()
const CACHE_TTL = 60000 // 1分钟缓存

function getCacheKey(workspaceId: number | null, params: Record<string, unknown>): string {
  return `${workspaceId}_${JSON.stringify(params)}`
}

function getCachedData(key: string): AgentListResponse | null {
  const cached = agentsCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  agentsCache.delete(key)
  return null
}

function setCachedData(key: string, data: AgentListResponse): void {
  agentsCache.set(key, { data, timestamp: Date.now() })
  // 限制缓存大小
  if (agentsCache.size > 50) {
    const firstKey = agentsCache.keys().next().value
    if (firstKey) {
      agentsCache.delete(firstKey)
    }
  }
}

export function useAgentsPageOptimized() {
  const [workspaces, setWorkspaces] = useState<Organization[]>([])
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsPagination, setAgentsPagination] = useState<AgentListResponse['pagination']>(emptyPagination)
  const [agentSearch, setAgentSearch] = useState('')
  const [agentSearchInput, setAgentSearchInput] = useState('')
  const [agentStatusFilter, setAgentStatusFilter] = useState<AgentStatus | ''>('')
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'mine' | 'collaborating'>('all')
  const [loading, setLoading] = useState(false)

  // 防抖搜索
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateAgentSearchInput = useCallback((value: string) => {
    setAgentSearchInput(value)
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    // 设置新的防抖定时器
    searchTimeoutRef.current = setTimeout(() => {
      setAgentSearch(value)
      // 重置到第一页
      setAgentsPagination(prev => ({ ...prev, page: 1 }))
    }, 300) // 300ms 防抖
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

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

    const params = {
      page: agentsPagination.page,
      per_page: agentsPagination.per_page,
      search: agentSearch || undefined,
      status: agentStatusFilter || undefined,
      ownership: ownershipFilter,
    }

    const cacheKey = getCacheKey(workspaceId, params)
    const cached = getCachedData(cacheKey)

    // 如果有缓存，先显示缓存数据
    if (cached) {
      setAgents(cached.items || [])
      setAgentsPagination(cached.pagination || emptyPagination)
      // 如果缓存新鲜，不显示 loading
      if (Date.now() - (agentsCache.get(cacheKey)?.timestamp || 0) < CACHE_TTL / 2) {
        return
      }
    }

    try {
      setLoading(true)
      const data = await agentsApi.getAgents(workspaceId, params)
      setAgents(data.items || [])
      setAgentsPagination(data.pagination || emptyPagination)
      // 更新缓存
      setCachedData(cacheKey, data)
    } catch (error: any) {
      message.error(error?.message || i18n.t('agents:messages.loadAgentsFailed'))
      // 如果有缓存但请求失败，保持缓存数据显示
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
        // 清除缓存，强制刷新
        agentsCache.clear()
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
        // 清除缓存
        agentsCache.clear()
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
        await agentsApi.revokeAgent(workspaceId, agentId)
        message.success(i18n.t('agents:messages.revokeSuccess'))
        // 清除缓存
        agentsCache.clear()
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

  const applyAgentSearch = useCallback(() => {
    setAgentSearch(agentSearchInput)
    setAgentsPagination(prev => ({ ...prev, page: 1 }))
    // 清除搜索框的防抖定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }, [agentSearchInput])

  const updateAgentPage = useCallback((page: number, perPage?: number) => {
    setAgentsPagination(prev => ({
      ...prev,
      page,
      per_page: perPage || prev.per_page,
    }))
  }, [])

  const updateAgentStatusFilter = useCallback((value: AgentStatus | '') => {
    setAgentStatusFilter(value)
    setAgentsPagination(prev => ({ ...prev, page: 1 }))
    // 清除缓存
    agentsCache.clear()
  }, [])

  const updateOwnershipFilter = useCallback((value: 'all' | 'mine' | 'collaborating') => {
    setOwnershipFilter(value)
    setAgentsPagination(prev => ({ ...prev, page: 1 }))
    // 清除缓存
    agentsCache.clear()
  }, [])

  useEffect(() => {
    void loadWorkspaces()
  }, [])

  useEffect(() => {
    void loadAgents()
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
  }
}
