/**
 * API客户端核心实现
 */

import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { ApiResponse, ApiClientConfig, PerformanceStats } from './types'
import { mergeConfig } from './config'
import { Logger } from './logger'
import { createRequestInterceptor, createResponseInterceptor, createResponseErrorInterceptor } from './interceptors'

/**
 * API客户端
 */
export class ApiClient {
  private client: AxiosInstance
  private config: Required<ApiClientConfig>
  private logger: Logger
  private stats: PerformanceStats

  constructor(config: ApiClientConfig = {}) {
    // 合并配置
    this.config = mergeConfig(config)
    
    // 初始化日志器
    this.logger = new Logger(this.config.enableLogging)
    
    // 初始化性能统计
    this.stats = this.initializeStats()
    
    // 创建axios实例
    this.client = this.createAxiosInstance()
    
    // 设置拦截器
    this.setupInterceptors()
  }

  /**
   * 创建axios实例
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      withCredentials: this.config.withCredentials,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      createRequestInterceptor(this.config, this.logger),
      (error: any) => {
        this.logger.logWarn('Request interceptor error', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      createResponseInterceptor(this.config, this.logger),
      createResponseErrorInterceptor(this.config, this.logger)
    )
  }

  /**
   * 初始化性能统计
   */
  private initializeStats(): PerformanceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      successRate: 0,
      retryRate: 0,
      errorsByStatus: {},
      requestsByEndpoint: {}
    }
  }

  /**
   * 更新性能统计
   */
  private updateStats(endpoint: string, duration: number, success: boolean, status?: number): void {
    this.stats.totalRequests++
    
    if (success) {
      this.stats.successfulRequests++
    } else {
      this.stats.failedRequests++
      if (status) {
        this.stats.errorsByStatus[status] = (this.stats.errorsByStatus[status] || 0) + 1
      }
    }

    // 更新平均响应时间
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + duration) / this.stats.totalRequests

    // 更新成功率
    this.stats.successRate = this.stats.successfulRequests / this.stats.totalRequests

    // 更新端点统计
    this.stats.requestsByEndpoint[endpoint] = (this.stats.requestsByEndpoint[endpoint] || 0) + 1
  }

  // HTTP方法

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config)
      this.updateStats(url, Date.now() - startTime, true, response.status)
      return response.data
    } catch (error) {
      this.updateStats(url, Date.now() - startTime, false, (error as any)?.response?.status)
      throw error
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config)
      this.updateStats(url, Date.now() - startTime, true, response.status)
      return response.data
    } catch (error) {
      this.updateStats(url, Date.now() - startTime, false, (error as any)?.response?.status)
      throw error
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config)
      this.updateStats(url, Date.now() - startTime, true, response.status)
      return response.data
    } catch (error) {
      this.updateStats(url, Date.now() - startTime, false, (error as any)?.response?.status)
      throw error
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config)
      this.updateStats(url, Date.now() - startTime, true, response.status)
      return response.data
    } catch (error) {
      this.updateStats(url, Date.now() - startTime, false, (error as any)?.response?.status)
      throw error
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const startTime = Date.now()
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config)
      this.updateStats(url, Date.now() - startTime, true, response.status)
      return response.data
    } catch (error) {
      this.updateStats(url, Date.now() - startTime, false, (error as any)?.response?.status)
      throw error
    }
  }

  // 工具方法

  /**
   * 获取原始axios实例
   */
  get axios(): AxiosInstance {
    return this.client
  }

  /**
   * 获取性能统计
   */
  getStats(): PerformanceStats {
    return { ...this.stats }
  }

  /**
   * 重置性能统计
   */
  resetStats(): void {
    this.stats = this.initializeStats()
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = mergeConfig({ ...this.config, ...newConfig })
    
    // 更新axios实例配置
    if (newConfig.baseURL) {
      this.client.defaults.baseURL = this.config.baseURL
    }
    if (newConfig.timeout) {
      this.client.defaults.timeout = this.config.timeout
    }
  }
}

/**
 * 统一API客户端 - 直接返回数据
 *
 * 后端API统一返回格式：
 * {
 *   success: boolean,
 *   message: string,
 *   data: T,
 *   timestamp: string,
 *   path: string,
 *   pagination?: {...}  // 仅分页接口返回
 * }
 */
export class UnifiedApiClient {
  private client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await this.client.get<T>(endpoint)
    return response.data!
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(endpoint, data)
    return response.data!
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(endpoint, data)
    return response.data!
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete<T>(endpoint)
    return response.data!
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(endpoint, data)
    return response.data!
  }

  async upload<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await this.client.post<T>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return response.data!
  }
}

// 创建默认实例
const baseApiClient = new ApiClient()
export const apiClient = new UnifiedApiClient(baseApiClient)

// 导出类型
export type { ApiResponse, ApiClientConfig, PerformanceStats } from './types'
