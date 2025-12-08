// Import types and utilities from submodules
import { type ApiClientConfig, type PerformanceStats } from './types'

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
    const token = localStorage.getItem('access_token')
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // 处理标准的ApiResponse格式
      if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        if (!data.success) {
          throw new Error(data.message || 'API request failed')
        }
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
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

export { apiClient }
