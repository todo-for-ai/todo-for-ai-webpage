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
    // TODO: Implement actual API request
    throw new Error('Not implemented')
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
