// API Token 相关接口
export interface ApiToken {
  id: number
  name: string
  token?: string
  created_at: string
  expires_at?: string
}

export interface CreateApiTokenParams {
  name: string
  expires_days?: number
}

export const apiTokensApi = {
  list: async (): Promise<ApiToken[]> => {
    return []
  },
  create: async (params: CreateApiTokenParams): Promise<ApiToken> => {
    return {} as ApiToken
  },
  delete: async (id: number): Promise<void> => {
    return
  }
}
