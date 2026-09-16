/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client/index.js'

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export type ConnectorProvider = 'lark' | 'wecom' | 'generic' | 'linear' | 'gitlab' | 'jira'

export interface ConnectorConfig {
  id: number
  workspace_id: number
  provider: ConnectorProvider
  enabled: boolean
  default_project_id: number | null
  config_json: Record<string, any> | null
  has_secret: boolean
  last_synced_at: string | null
}

export interface WebhookSubscription {
  id: number
  workspace_id: number
  url: string
  events: string[]
  active: boolean
  description: string | null
  has_secret: boolean
  created_at: string
  updated_at: string
}

export interface WebhookDelivery {
  id: number
  subscription_id: number
  event_type: string
  ok: boolean
  status_code: number | null
  attempts: number
  error: string | null
  duration_ms: number | null
  created_at: string
}

// ---------------------------------------------------------------------------
// 连接器（入站集成）
// ---------------------------------------------------------------------------

export const integrationsApi = {
  listConnectors: async (workspaceId: number): Promise<ConnectorConfig[]> => {
    const data = await apiClient.get<{ items: ConnectorConfig[] }>(`/workspaces/${workspaceId}/connectors`)
    return data?.items ?? []
  },

  configureConnector: async (
    workspaceId: number,
    provider: ConnectorProvider,
    payload: { enabled?: boolean; secret?: string; default_project_id?: number | null; config_json?: Record<string, any> },
  ): Promise<ConnectorConfig> => {
    const data = await apiClient.put<{ connector: ConnectorConfig }>(`/workspaces/${workspaceId}/connectors/${provider}`, payload)
    return data?.connector
  },

  // -------------------------------------------------------------------------

  listWebhooks: async (workspaceId: number): Promise<WebhookSubscription[]> => {
    const data = await apiClient.get<{ items: WebhookSubscription[] }>(`/workspaces/${workspaceId}/webhooks`)
    return data?.items ?? []
  },

  createWebhook: async (
    workspaceId: number,
    payload: { url: string; events: string[]; secret?: string; description?: string },
  ): Promise<{ subscription: WebhookSubscription; secret: string }> => {
    const data = await apiClient.post<{ subscription: WebhookSubscription; secret: string }>(`/workspaces/${workspaceId}/webhooks`, payload)
    return data
  },

  updateWebhook: async (
    workspaceId: number,
    subscriptionId: number,
    payload: { url?: string; events?: string[]; active?: boolean; description?: string; secret?: string },
  ): Promise<WebhookSubscription> => {
    const data = await apiClient.put<{ subscription: WebhookSubscription }>(`/workspaces/${workspaceId}/webhooks/${subscriptionId}`, payload)
    return data?.subscription
  },

  deleteWebhook: async (workspaceId: number, subscriptionId: number): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/webhooks/${subscriptionId}`)
  },

  listWebhookDeliveries: async (workspaceId: number, subscriptionId: number): Promise<WebhookDelivery[]> => {
    const data = await apiClient.get<{ items: WebhookDelivery[] }>(`/workspaces/${workspaceId}/webhooks/${subscriptionId}/deliveries`)
    return data?.items ?? []
  },

  pingWebhook: async (workspaceId: number, subscriptionId: number): Promise<WebhookDelivery> => {
    const data = await apiClient.post<{ delivery: WebhookDelivery }>(`/workspaces/${workspaceId}/webhooks/${subscriptionId}/ping`)
    return data?.delivery
  },
}

// 平台当前发布的 webhook 事件类型（与 api-server WEBHOOK_EVENT_TYPES 对应）
export const WEBHOOK_EVENT_OPTIONS = [
  { value: '*', label: '全部事件 (*)' },
  { value: 'task.created', label: '任务创建' },
  { value: 'task.status_changed', label: '任务状态变更' },
  { value: 'task.completed', label: '任务完成' },
  { value: 'task.failed', label: '任务失败' },
]
