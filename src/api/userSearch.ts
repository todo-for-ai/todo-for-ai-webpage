import { apiClient } from './client/index.js'

export interface UserSearchResult {
  id: number
  username: string
  nickname: string
  avatar_url: string | null
}

class UserSearchApi {
  async search(query: string, projectId?: number): Promise<UserSearchResult[]> {
    const params = new URLSearchParams({ q: query, limit: '10' })
    if (projectId) params.set('project_id', String(projectId))
    return await apiClient.get<UserSearchResult[]>(
      `/users/search?${params.toString()}`
    )
  }
}

export const userSearchApi = new UserSearchApi()
