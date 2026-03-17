import { apiClient } from './client/index.js'
import type { User } from '../stores/useAuthStore'
import { getApiBaseUrl } from '../utils/apiConfig'

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LogoutResponse {
  logout_url: string
  params: {
    client_id: string
    returnTo: string
  }
  message: string
}

export interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
    has_prev: boolean
    has_next: boolean
  }
}

export interface UserListParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  role?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'suspended'
}

export interface SharedOrganizationSummary {
  id: number
  name: string
  slug: string
  status: 'active' | 'archived' | string
  target_roles: string[]
  viewer_roles: string[]
}

export interface UserProfilePayload {
  id: number
  username?: string
  nickname?: string
  full_name?: string
  name?: string
  avatar_url?: string
  bio?: string
  email?: string
  role?: 'admin' | 'user' | 'viewer'
  status?: 'active' | 'inactive' | 'suspended'
  timezone?: string
  locale?: string
  created_at?: string
  updated_at?: string
  last_active_at?: string
  is_self: boolean
  view_mode: 'self' | 'admin' | 'public'
  shared_organization_count: number
  shared_organizations: SharedOrganizationSummary[]
}

export class AuthAPI {
  /**
   * 启动登录流程（默认GitHub）
   */
  static login(redirectUri?: string): void {
    AuthAPI.loginWithGitHub(redirectUri)
  }

  /**
   * 启动GitHub登录流程
   */
  static loginWithGitHub(redirectUri?: string): void {
    const baseUrl = getApiBaseUrl()
    const returnTo = redirectUri || window.location.href

    window.location.href = `${baseUrl}/auth/login/github?return_to=${encodeURIComponent(returnTo)}`
  }

  /**
   * 启动Google登录流程
   */
  static loginWithGoogle(redirectUri?: string): void {
    const baseUrl = getApiBaseUrl()
    const returnTo = redirectUri || window.location.href

    window.location.href = `${baseUrl}/auth/login/google?return_to=${encodeURIComponent(returnTo)}`
  }

  /**
   * 登出
   */
  static async logout(returnTo?: string): Promise<LogoutResponse> {
    return await apiClient.post<LogoutResponse>('/auth/logout', {
      return_to: returnTo || window.location.origin + '/todo-for-ai/pages'
    })
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>('/auth/me')
  }

  /**
   * 更新当前用户信息
   */
  static async updateCurrentUser(userData: Partial<User>): Promise<User> {
    return await apiClient.put<User>('/auth/me', userData)
  }

  /**
   * 验证token
   */
  static async verifyToken(token: string): Promise<{ valid: boolean; message: string }> {
    return await apiClient.post<{ valid: boolean; message: string }>('/auth/verify', {
      token
    })
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(): Promise<{ access_token: string; token_type: string }> {
    return await apiClient.post<{ access_token: string; token_type: string }>('/auth/refresh')
  }

  /**
   * 获取用户列表（管理员功能）
   */
  static async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })
    const url = `/auth/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return await apiClient.get<UserListResponse>(url)
  }

  /**
   * 获取指定用户信息
   */
  static async getUser(userId: number): Promise<User> {
    return await apiClient.get<User>(`/auth/users/${userId}`)
  }

  /**
   * 获取用户资料（自己/管理员为完整视图，其他人为公开视图）
   */
  static async getUserProfile(userId: number): Promise<UserProfilePayload> {
    return await apiClient.get<UserProfilePayload>(`/auth/users/${userId}`)
  }

  /**
   * 更新用户状态（管理员功能）
   */
  static async updateUserStatus(userId: number, status: UpdateUserStatusRequest['status']): Promise<User> {
    return await apiClient.put<User>(`/auth/users/${userId}/status`, { status })
  }
}

export default AuthAPI
