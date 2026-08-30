// Import types and utilities from submodules
import { type ApiClientConfig, type PerformanceStats } from './types'
import { getApiBaseUrl } from '../../utils/apiConfig'

class ApiHttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiHttpError'
    this.status = status
  }
}

interface RequestContext {
  retryUnauthorized?: boolean
}

/**
 * API Client class
 * Main entry point for all API requests
 */
export class ApiClient {
  private baseURL: string
  private timeout: number
  private refreshInFlight: Promise<boolean> | null = null

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout
  }

  private isLoginEndpoint(endpoint: string): boolean {
    return endpoint.includes('/auth/login')
  }

  private isAuthStateEndpoint(endpoint: string): boolean {
    return endpoint.includes('/auth/me') || endpoint.includes('/auth/refresh')
  }

  private shouldTrySilentRefresh(endpoint: string, context: RequestContext): boolean {
    if (context.retryUnauthorized === false) {
      return false
    }
    if (endpoint.includes('/auth/refresh')) {
      return false
    }
    return !this.isLoginEndpoint(endpoint)
  }

  private async trySilentRefresh(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false
    }

    const hasRefreshToken = !!localStorage.getItem('refresh_token')
    if (!hasRefreshToken) {
      return false
    }

    if (this.refreshInFlight) {
      return this.refreshInFlight
    }

    const refreshPromise = (async () => {
      try {
        const authStoreModule = await import('../../stores/useAuthStore')
        const refreshed = await authStoreModule.useAuthStore.getState().refreshTokens()
        return refreshed
      } catch (error) {
        console.error('[ApiClient] Silent refresh failed:', error)
        return false
      }
    })()

    this.refreshInFlight = refreshPromise
    try {
      return await refreshPromise
    } finally {
      this.refreshInFlight = null
    }
  }

  private async handleUnauthorizedRedirect(): Promise<void> {
    try {
      const mod = await import('../../utils/authRedirect')
      mod.handleUnauthorized()
    } catch (redirectError) {
      console.error('[ApiClient] Failed to handle unauthorized redirect:', redirectError)
    }
  }

  async request<T = any>(
    endpoint: string,
    options?: RequestInit,
    context: RequestContext = { retryUnauthorized: true }
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    // 从localStorage获取token并添加到请求头
    // 优先使用当前存储键 auth_token，兼容历史键 access_token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token')
    const headers: Record<string, string> = {
      ...options?.headers as Record<string, string>,
    }
    if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const status = response.status
        let errMsg = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData?.message) {
            errMsg = errorData.message
          }
        } catch {
          // Keep fallback message when response body is not JSON
        }

        if (status === 401) {
          const refreshed = this.shouldTrySilentRefresh(endpoint, context)
            ? await this.trySilentRefresh()
            : false

          if (refreshed) {
            return this.request<T>(endpoint, options, { retryUnauthorized: false })
          }

          if (this.isAuthStateEndpoint(endpoint)) {
            await this.handleUnauthorizedRedirect()
          }
        }

        throw new ApiHttpError(status, errMsg)
      }

      const data = await response.json()

      // 处理后端标准响应结构 { code, data, message, ... }
      if (data && typeof data === 'object' && 'data' in data) {
        return data.data as T
      }

      return data as T
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }

  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async upload<T = any>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData
    })
  }
}

// Export types
export type { ApiClientConfig, PerformanceStats }

// Create and export default instance
const apiClient = new ApiClient({
  baseURL: getApiBaseUrl(),
  timeout: 10000
})

export { apiClient }
