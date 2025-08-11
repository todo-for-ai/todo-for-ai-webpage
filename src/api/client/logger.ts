/**
 * API客户端日志管理器
 */

import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import type { RequestMetadata, LogLevel } from './types'

/**
 * 简单的日志管理器
 */
export class Logger {
  private enabled: boolean

  constructor(enabled: boolean = true) {
    this.enabled = enabled
  }

  /**
   * 记录请求日志
   */
  logRequest(config: AxiosRequestConfig, metadata?: RequestMetadata): void {
    if (!this.enabled) return

    const requestId = metadata?.requestId || 'unknown'
    const method = config.method?.toUpperCase() || 'GET'
    const url = config.url || 'unknown'

    console.log(`[API Request] ${requestId} ${method} ${url}`, {
      data: config.data,
      params: config.params
    })
  }

  /**
   * 记录响应日志
   */
  logResponse(response: AxiosResponse, metadata?: RequestMetadata, duration?: number): void {
    if (!this.enabled) return

    const requestId = metadata?.requestId || 'unknown'
    const method = response.config.method?.toUpperCase() || 'GET'
    const url = response.config.url || 'unknown'
    const status = response.status

    console.log(`[API Response] ${requestId} ${status} ${method} ${url} (${duration}ms)`, response.data)
  }

  /**
   * 记录错误日志
   */
  logError(error: AxiosError, metadata?: RequestMetadata, duration?: number): void {
    if (!this.enabled) return

    const requestId = metadata?.requestId || 'unknown'
    const method = error.config?.method?.toUpperCase() || 'GET'
    const url = error.config?.url || 'unknown'
    const status = error.response?.status || 'NETWORK'

    console.error(`[API Error] ${requestId} ${status} ${method} ${url} (${duration}ms)`, {
      message: error.message,
      data: error.response?.data
    })
  }

  /**
   * 记录重试日志
   */
  logRetry(requestId: string, attempt: number, maxRetries: number, delay: number): void {
    if (!this.enabled) return

    console.warn(`[API Retry] ${requestId} 重试中 (${attempt}/${maxRetries}) 延迟 ${delay}ms`)
  }

  /**
   * 记录信息日志
   */
  logInfo(message: string, data?: any): void {
    if (!this.enabled) return
    console.log(`[API Info] ${message}`, data)
  }

  /**
   * 记录警告日志
   */
  logWarn(message: string, data?: any): void {
    if (!this.enabled) return
    console.warn(`[API Warn] ${message}`, data)
  }
}
