import { apiClient } from './client'

// API Token 相关接口
export interface ApiToken {
  id: number
  name: string
  token?: string
  status?: 'active' | 'disabled'
  is_active?: boolean
  prefix?: string
  usage_count?: number
  created_at: string
  expires_at?: string
}

export interface CreateApiTokenParams {
  name: string
  expires_days?: number
}

interface ApiTokenListResponse {
  items?: ApiToken[]
  pagination?: {
    page: number
    per_page: number
    total: number
    has_prev: boolean
    has_next: boolean
  }
}

interface RevealTokenResponse {
  token: string
  name: string
  prefix: string
}

const normalizeToken = (token: ApiToken): ApiToken => ({
  ...token,
  status: token.status ?? (token.is_active === false ? 'disabled' : 'active'),
})

export const apiTokensApi = {
  list: async (): Promise<ApiToken[]> => {
    const response = await apiClient.get<ApiToken[] | ApiTokenListResponse>('/api-tokens/')
    const items = Array.isArray(response)
      ? response
      : Array.isArray(response?.items)
        ? response.items
        : []
    return items.map(normalizeToken)
  },
  
  create: async (params: CreateApiTokenParams): Promise<ApiToken> => {
    const response = await apiClient.post<ApiToken>('/api-tokens/', params)
    return normalizeToken(response)
  },

  reveal: async (id: number): Promise<string> => {
    const response = await apiClient.get<RevealTokenResponse>(`/api-tokens/${id}/reveal`)
    return response.token
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api-tokens/${id}`)
  }
}
