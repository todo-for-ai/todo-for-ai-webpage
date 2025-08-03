import { getApiBaseUrl } from '../utils/apiConfig'
import { isTokenExpired, shouldRefreshToken } from '../utils/jwtUtils'
import { handleTokenExpired, handleUnauthorized } from '../utils/authRedirect'

// 创建fetch客户端
class FetchApiClient {
  private baseURL: string

  constructor() {
    // 在构造函数中动态获取API地址，确保在运行时正确检测环境
    this.baseURL = getApiBaseUrl()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // 检查并刷新token（如果需要）
    await this.checkAndRefreshToken(endpoint)

    const url = `${this.baseURL}${endpoint}`

    // 获取认证token
    const token = localStorage.getItem('auth_token')

    // 设置最简单的headers
    const headers: HeadersInit = {}

    // 添加认证token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // 只在POST/PUT请求时添加Content-Type
    if (options.method === 'POST' || options.method === 'PUT') {
      headers['Content-Type'] = 'application/json'
    }

    console.log(`[API Request] ${options.method || 'GET'} ${endpoint}`, options.body)

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body,
      })

      if (!response.ok) {
        // 处理401错误
        if (response.status === 401) {
          await this.handle401Error()
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[API Response] ${options.method || 'GET'} ${endpoint}`, data)
      return data
    } catch (error) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}`, error)
      throw error
    }
  }

  /**
   * 检查并刷新token（如果需要）
   */
  private async checkAndRefreshToken(endpoint: string): Promise<void> {
    // 跳过刷新接口本身
    if (endpoint === '/auth/refresh') {
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      return
    }

    // 检查token是否过期
    if (isTokenExpired(token)) {
      console.log('[FetchClient] Token已过期，处理过期流程')
      handleTokenExpired()
      return
    }

    // 检查是否需要刷新token
    if (shouldRefreshToken(token)) {
      console.log('[FetchClient] Token即将过期，尝试刷新')
      try {
        await this.refreshToken()
      } catch (error) {
        console.error('[FetchClient] Token刷新失败:', error)
        handleTokenExpired()
      }
    }
  }

  /**
   * 刷新token
   */
  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`)
      }

      const data = await response.json()
      const { access_token, refresh_token } = data

      if (access_token && refresh_token) {
        localStorage.setItem('auth_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        console.log('[FetchClient] Token刷新成功')

        // 通知auth store更新token
        const { useAuthStore } = await import('../stores/useAuthStore')
        useAuthStore.getState().setTokens(access_token, refresh_token)
      } else {
        throw new Error('刷新响应中没有新token')
      }
    } catch (error) {
      console.error('[FetchClient] Token刷新失败:', error)
      throw error
    }
  }

  /**
   * 处理401错误
   */
  private async handle401Error(): Promise<void> {
    console.log('[FetchClient] 收到401错误，处理未授权访问')
    handleUnauthorized()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const fetchApiClient = new FetchApiClient()
