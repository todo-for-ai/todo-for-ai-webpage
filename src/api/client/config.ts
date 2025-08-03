/**
 * API客户端配置管理
 */

import { getApiBaseUrl } from '../../utils/apiConfig'
import type { ApiClientConfig, RetryConfig } from './types'

// 默认重试配置
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryDelayMultiplier: 2,
  retryableStatuses: [500, 502, 503, 504, 408, 429]
}

// 默认客户端配置
export const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  withCredentials: true,
  retryConfig: DEFAULT_RETRY_CONFIG,
  enableTokenRefresh: true,
  enableLogging: import.meta.env.DEV,
  userAgent: 'todo-for-ai-webapp/1.0.0'
}

/**
 * 合并配置
 */
export function mergeConfig(userConfig: ApiClientConfig = {}): Required<ApiClientConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    retryConfig: {
      ...DEFAULT_CONFIG.retryConfig,
      ...userConfig.retryConfig
    }
  }
}
