// Import types and utilities from submodules
import { type ApiClientConfig, type PerformanceStats } from './types'
import { getApiBaseUrl } from '../../utils/apiConfig'

/**
 * API Client class
 * Main entry point for all API requests
 */
export class ApiClient {
  private baseURL: string
  private timeout: number

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout
  }

  async request<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    // 从localStorage获取token并添加到请求头
    // 优先使用当前存储键 auth_token，兼容历史键 access_token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>,
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
        let errMsg = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData?.message) {
            errMsg = errorData.message
          }
        } catch {
          // Keep fallback message when response body is not JSON
        }
        throw new Error(errMsg)
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
