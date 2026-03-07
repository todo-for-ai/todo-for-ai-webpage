import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import {
  agentKeysApi,
  type AgentKey,
  type CreateAgentKeyResponse,
  type RevealAgentKeyResponse,
  type ConnectLinkResponse,
} from '../../../api/agents'

export function useAgentKeys(workspaceId: number | null, agentId: number | null) {
  const [keys, setKeys] = useState<AgentKey[]>([])
  const [loading, setLoading] = useState(false)

  const loadKeys = useCallback(async () => {
    if (!workspaceId || !agentId) {
      setKeys([])
      return
    }

    try {
      setLoading(true)
      const data = await agentKeysApi.getAgentKeys(workspaceId, agentId)
      setKeys(data.items || [])
    } catch (error: any) {
      message.error(error?.message || 'Failed to load agent keys')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId])

  const createKey = useCallback(
    async (name: string): Promise<CreateAgentKeyResponse | null> => {
      if (!workspaceId || !agentId) {
        return null
      }

      try {
        setLoading(true)
        const created = await agentKeysApi.createAgentKey(workspaceId, agentId, { name })
        await loadKeys()
        return created
      } catch (error: any) {
        message.error(error?.message || 'Failed to create key')
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId, loadKeys]
  )

  const revealKey = useCallback(
    async (keyId: number): Promise<RevealAgentKeyResponse | null> => {
      if (!workspaceId || !agentId) {
        return null
      }

      try {
        setLoading(true)
        return await agentKeysApi.revealAgentKey(workspaceId, agentId, keyId)
      } catch (error: any) {
        message.error(error?.message || 'Failed to reveal key')
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId]
  )

  const revokeKey = useCallback(
    async (keyId: number) => {
      if (!workspaceId || !agentId) {
        return false
      }

      try {
        setLoading(true)
        await agentKeysApi.revokeAgentKey(workspaceId, agentId, keyId)
        message.success('Key revoked successfully')
        await loadKeys()
        return true
      } catch (error: any) {
        message.error(error?.message || 'Failed to revoke key')
        return false
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId, loadKeys]
  )

  const createConnectLink = useCallback(
    async (ttlSeconds: number): Promise<ConnectLinkResponse | null> => {
      if (!workspaceId || !agentId) {
        return null
      }

      try {
        setLoading(true)
        return await agentKeysApi.createConnectLink(workspaceId, agentId, ttlSeconds)
      } catch (error: any) {
        message.error(error?.message || 'Failed to generate connect link')
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId]
  )

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  return {
    keys,
    loading,
    reloadKeys: loadKeys,
    createKey,
    revealKey,
    revokeKey,
    createConnectLink,
  }
}
