import { useCallback, useEffect, useState } from 'react'
import { agentAutomationApi } from '../../../api/agents'
import type { NotificationChannel, CreateNotificationChannelRequest, UpdateNotificationChannelRequest } from '../../../api/agents/automationTypes'

type ScopeType = 'user' | 'project' | 'organization'

export const useNotificationChannels = (scopeType: ScopeType, scopeId: number) => {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationChannel[]>([])

  const reload = useCallback(async () => {
    if (!scopeId) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const response = scopeType === 'user'
        ? await agentAutomationApi.listUserChannels(scopeId)
        : scopeType === 'project'
          ? await agentAutomationApi.listProjectChannels(scopeId)
          : await agentAutomationApi.listOrganizationChannels(scopeId)
      setItems((response as any).items || [])
    } finally {
      setLoading(false)
    }
  }, [scopeId, scopeType])

  useEffect(() => {
    void reload().catch((error) => {
      console.error('Failed to load notification channels:', error)
    })
  }, [reload])

  const createChannel = useCallback(async (payload: CreateNotificationChannelRequest) => {
    if (scopeType === 'user') {
      return agentAutomationApi.createUserChannel(scopeId, payload)
    }
    if (scopeType === 'project') {
      return agentAutomationApi.createProjectChannel(scopeId, payload)
    }
    return agentAutomationApi.createOrganizationChannel(scopeId, payload)
  }, [scopeId, scopeType])

  const updateChannel = useCallback(async (channelId: number, payload: UpdateNotificationChannelRequest) => {
    return agentAutomationApi.updateChannel(channelId, payload)
  }, [])

  const deleteChannel = useCallback(async (channelId: number) => {
    return agentAutomationApi.deleteChannel(channelId)
  }, [])

  return {
    loading,
    items,
    reload,
    createChannel,
    updateChannel,
    deleteChannel,
  }
}
