/**
 * API客户端拦截器
 */

import type { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { isTokenExpired, shouldRefreshToken } from '../../utils/jwtUtils'
import { handleTokenExpired, handleUnauthorized } from '../../utils/authRedirect'
import type { RequestMetadata, ApiClientConfig } from './types'
import { Logger } from './logger'

/**
 * 请求拦截器
 */
export function createRequestInterceptor(config: Required<ApiClientConfig>, logger: Logger) {
  return async (axiosConfig: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    // 生成请求元数据
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const metadata: RequestMetadata = {
      requestId,
      startTime: Date.now(),
      attempt: 1
    }

    // 存储元数据
    axiosConfig.metadata = metadata

    // Token刷新检查
    if (config.enableTokenRefresh && !axiosConfig.url?.includes('/auth/refresh')) {
      await checkAndRefreshToken(logger)
    }

    // 添加认证token
    const token = localStorage.getItem('auth_token')
    if (token) {
      if (!axiosConfig.headers) {
        axiosConfig.headers = {} as any
      }
      (axiosConfig.headers as any).Authorization = `Bearer ${token}`
    }

    // 添加请求ID
    if (!axiosConfig.headers) {
      axiosConfig.headers = {} as any
    }
    (axiosConfig.headers as any)['X-Request-ID'] = requestId

    // 添加用户代理
    if (config.userAgent) {
      axiosConfig.headers['User-Agent'] = config.userAgent
    }

    // 日志记录
    logger.logRequest(axiosConfig, metadata)

    return axiosConfig
  }
}

/**
 * 响应拦截器
 */
export function createResponseInterceptor(config: Required<ApiClientConfig>, logger: Logger) {
  return (response: AxiosResponse): AxiosResponse => {
    const metadata = response.config.metadata
    const duration = metadata ? Date.now() - metadata.startTime : 0

    logger.logResponse(response, metadata, duration)
    return response
  }
}

/**
 * 响应错误拦截器
 */
export function createResponseErrorInterceptor(config: Required<ApiClientConfig>, logger: Logger) {
  return async (error: AxiosError): Promise<any> => {
    const metadata = error.config?.metadata
    const duration = metadata ? Date.now() - metadata.startTime : 0

    logger.logError(error, metadata, duration)

    // 处理特定错误状态
    if (error.response) {
      await handleHttpError(error, logger)
    }

    // 重试逻辑
    if (shouldRetry(error, metadata?.attempt || 1, config)) {
      return retryRequest(error, config, logger)
    }

    return Promise.reject(transformError(error, config.baseURL))
  }
}

/**
 * 检查并刷新token
 */
async function checkAndRefreshToken(logger: Logger): Promise<void> {
  const token = localStorage.getItem('auth_token')
  if (!token) return

  if (isTokenExpired(token)) {
    logger.logInfo('Token已过期，处理过期流程')
    handleTokenExpired()
    return
  }

  if (shouldRefreshToken(token)) {
    logger.logInfo('Token即将过期，尝试刷新')
    try {
      await refreshToken(logger)
    } catch (error) {
      logger.logWarn('Token刷新失败', error)
      handleTokenExpired()
    }
  }
}

/**
 * 刷新token
 */
async function refreshToken(logger: Logger): Promise<boolean> {
  try {
    const { useAuthStore } = await import('../../stores/useAuthStore')
    return await useAuthStore.getState().refreshTokens()
  } catch (error) {
    logger.logWarn('Token刷新失败', error)
    if ((error as any)?.response?.status === 401) {
      handleUnauthorized()
    }
    return false
  }
}

/**
 * 处理HTTP错误
 */
async function handleHttpError(error: AxiosError, logger: Logger): Promise<void> {
  const status = error.response?.status
  const data = error.response?.data as any

  switch (status) {
    case 401:
      logger.logWarn('收到401错误，可能需要token刷新')
      break
    case 403:
      logger.logError(error, { requestId: 'error-403', startTime: Date.now(), attempt: 1 })
      break
    case 404:
      logger.logError(error, { requestId: 'error-404', startTime: Date.now(), attempt: 1 })
      break
    case 422:
      logger.logError(error, { requestId: 'error-422', startTime: Date.now(), attempt: 1 })
      break
    case 429:
      logger.logWarn('Rate limit exceeded', data?.message)
      break
    case 500:
    case 502:
    case 503:
    case 504:
      logger.logError(error, { requestId: 'error-5xx', startTime: Date.now(), attempt: 1 })
      break
  }
}

/**
 * 判断是否应该重试
 */
function shouldRetry(error: AxiosError, attempt: number, config: Required<ApiClientConfig>): boolean {
  const retryConfig = config.retryConfig

  if (attempt >= retryConfig.maxRetries) {
    return false
  }

  // 不重试认证错误
  if (error.response?.status === 401 || error.response?.status === 403) {
    return false
  }

  // 网络错误或可重试的状态码
  if (!error.response) {
    return true // 网络错误
  }

  return retryConfig.retryableStatuses.includes(error.response.status)
}

/**
 * 重试请求
 */
async function retryRequest(error: AxiosError, config: Required<ApiClientConfig>, logger: Logger): Promise<any> {
  const axiosConfig = error.config!
  const metadata = axiosConfig.metadata!
  const retryConfig = config.retryConfig
  
  metadata.attempt++
  
  const delay = retryConfig.retryDelay * 
    Math.pow(retryConfig.retryDelayMultiplier, metadata.attempt - 2)

  logger.logRetry(metadata.requestId, metadata.attempt, retryConfig.maxRetries, delay)

  await sleep(delay)
  
  // 重新发起请求
  const axios = await import('axios')
  return axios.default.request(axiosConfig)
}

/**
 * 延迟函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 转换错误
 */
function transformError(error: AxiosError, baseURL: string): Error {
  if (error.response) {
    const data = error.response.data as any
    if (data?.message) {
      return new Error(data.message)
    }
    return new Error(`HTTP ${error.response.status}: ${error.response.statusText}`)
  } else if (error.request) {
    return new Error(`Network Error: Unable to connect to ${baseURL}`)
  } else {
    return new Error(`Request Error: ${error.message}`)
  }
}
