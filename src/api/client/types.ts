/**
 * API客户端类型定义
 */

import type { AxiosRequestConfig } from 'axios'

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  timestamp: string
  path: string
}

// 重试配置
export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  retryDelayMultiplier: number
  retryableStatuses: number[]
}

// 客户端配置
export interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  withCredentials?: boolean
  retryConfig?: Partial<RetryConfig>
  enableTokenRefresh?: boolean
  enableLogging?: boolean
  userAgent?: string
}

// 请求元数据
export interface RequestMetadata {
  requestId: string
  startTime: number
  attempt: number
}

// 扩展Axios配置以包含元数据
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: RequestMetadata
  }
}

// 性能统计接口
export interface PerformanceStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  successRate: number
  retryRate: number
  errorsByStatus: Record<number, number>
  requestsByEndpoint: Record<string, number>
}

// 日志级别
export const LogLevel = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
} as const

export type LogLevel = typeof LogLevel[keyof typeof LogLevel]
