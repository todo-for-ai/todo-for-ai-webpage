import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import {
  agentSecretsApi,
  type AgentSecretCollaborationResponse,
  type AgentSecret,
  type AgentSecretShare,
  type AgentSecretTargetSelector,
  type CreateAgentSecretRequest,
  type RevealAgentSecretResponse,
} from '../../../api/agents'

export function useAgentSecrets(workspaceId: number | null, agentId: number | null) {
  const [secrets, setSecrets] = useState<AgentSecret[]>([])
  const [loading, setLoading] = useState(false)

  const loadSecrets = useCallback(async () => {
    if (!workspaceId || !agentId) {
      setSecrets([])
      return
    }

    try {
      setLoading(true)
      const data = await agentSecretsApi.getAgentSecrets(workspaceId, agentId, { include_shared: true })
      setSecrets(data.items || [])
    } catch (error: any) {
      message.error(error?.message || 'Failed to load secrets')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId])

  const createSecret = useCallback(
    async (payload: CreateAgentSecretRequest): Promise<AgentSecret | null> => {
      if (!workspaceId || !agentId) {
        return null
      }

      try {
        setLoading(true)
        const created = await agentSecretsApi.createAgentSecret(workspaceId, agentId, payload)
        message.success('Secret created successfully')
        await loadSecrets()
        return created
      } catch (error: any) {
        message.error(error?.message || 'Failed to create secret')
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId, loadSecrets]
  )

  const revealSecret = useCallback(
    async (secret: AgentSecret): Promise<RevealAgentSecretResponse | null> => {
      if (!workspaceId || !agentId) {
        return null
      }

      try {
        setLoading(true)
        if (secret.source === 'shared') {
          const revealed = await agentSecretsApi.revealSharedAgentSecret(workspaceId, agentId, secret.id)
          return {
            id: revealed.id,
            name: revealed.name,
            secret_value: revealed.secret_value,
          }
        }
        return await agentSecretsApi.revealAgentSecret(workspaceId, agentId, secret.id)
      } catch (error: any) {
        message.error(error?.message || 'Failed to reveal secret')
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId]
  )

  const rotateSecret = useCallback(
    async (secretId: number, secretValue: string): Promise<boolean> => {
      if (!workspaceId || !agentId) {
        return false
      }

      try {
        setLoading(true)
        await agentSecretsApi.rotateAgentSecret(workspaceId, agentId, secretId, {
          secret_value: secretValue,
        })
        message.success('Secret rotated successfully')
        await loadSecrets()
        return true
      } catch (error: any) {
        message.error(error?.message || 'Failed to rotate secret')
        return false
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId, loadSecrets]
  )

  const revokeSecret = useCallback(
    async (secretId: number): Promise<boolean> => {
      if (!workspaceId || !agentId) {
        return false
      }

      try {
        setLoading(true)
        await agentSecretsApi.revokeAgentSecret(workspaceId, agentId, secretId)
        message.success('Secret revoked successfully')
        await loadSecrets()
        return true
      } catch (error: any) {
        message.error(error?.message || 'Failed to revoke secret')
        return false
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId, loadSecrets]
  )

  const listSecretShares = useCallback(
    async (secretId: number, includeInactive = false): Promise<AgentSecretShare[]> => {
      if (!workspaceId || !agentId) {
        return []
      }

      try {
        setLoading(true)
        const data = await agentSecretsApi.listAgentSecretShares(workspaceId, agentId, secretId, { include_inactive: includeInactive })
        return data.items || []
      } catch (error: any) {
        message.error(error?.message || 'Failed to load secret shares')
        return []
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId]
  )

  const listSecretCollaboration = useCallback(
    async (params?: { include_inactive?: boolean; project_id?: number }): Promise<AgentSecretCollaborationResponse | null> => {
      if (!workspaceId || !agentId) {
        return null
      }

      try {
        return await agentSecretsApi.getAgentSecretCollaboration(workspaceId, agentId, params)
      } catch (error: any) {
        message.error(error?.message || 'Failed to load secret collaboration')
        return null
      }
    },
    [workspaceId, agentId]
  )

  const createSecretShares = useCallback(
    async (
      secretId: number,
      targetAgentIds: number[],
      options?: {
        target_selector?: AgentSecretTargetSelector
        selector_project_id?: number
        access_mode?: string
        expires_at?: string
        granted_reason?: string
      }
    ) => {
      if (!workspaceId || !agentId) {
        return false
      }

      try {
        setLoading(true)
        await agentSecretsApi.createAgentSecretShares(workspaceId, agentId, secretId, {
          target_agent_ids: targetAgentIds,
          target_selector: options?.target_selector,
          selector_project_id: options?.selector_project_id,
          access_mode: options?.access_mode,
          expires_at: options?.expires_at,
          granted_reason: options?.granted_reason,
        })
        message.success('Secret shared successfully')
        await loadSecrets()
        return true
      } catch (error: any) {
        message.error(error?.message || 'Failed to share secret')
        return false
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId, loadSecrets]
  )

  const revokeSecretShare = useCallback(
    async (secretId: number, shareId: number): Promise<boolean> => {
      if (!workspaceId || !agentId) {
        return false
      }

      try {
        setLoading(true)
        await agentSecretsApi.revokeAgentSecretShare(workspaceId, agentId, secretId, shareId)
        message.success('Secret share revoked successfully')
        await loadSecrets()
        return true
      } catch (error: any) {
        message.error(error?.message || 'Failed to revoke secret share')
        return false
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, agentId, loadSecrets]
  )

  useEffect(() => {
    loadSecrets()
  }, [loadSecrets])

  return {
    secrets,
    loading,
    reloadSecrets: loadSecrets,
    createSecret,
    revealSecret,
    rotateSecret,
    revokeSecret,
    listSecretShares,
    listSecretCollaboration,
    createSecretShares,
    revokeSecretShare,
  }
}
