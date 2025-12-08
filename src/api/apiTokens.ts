import { apiClient } from './client'

// API Token 相关接口
export interface ApiToken {
  id: number
  name: string
  token?: string
  status?: string
  created_at: string
  expires_at?: string
}

export interface CreateApiTokenParams {
  name: string
  expires_days?: number
}

export const apiTokensApi = {
  list: async (): Promise<ApiToken[]> => {
    const response = await apiClient.get<ApiToken[]>('/api-tokens/')
    return response
  },
  
  create: async (params: CreateApiTokenParams): Promise<ApiToken> => {
    const response = await apiClient.post<ApiToken>('/api-tokens/', params)
    return response
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api-tokens/${id}`)
  }
}
