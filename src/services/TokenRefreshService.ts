/**
 * Token刷新服务
 * 负责自动检测token过期并进行续约
 */

import {
  isTokenExpired,
  shouldRefreshToken,
  getTokenRemainingTime,
  willTokenExpireIn
} from '../utils/jwtUtils'
import { useAuthStore } from '../stores/useAuthStore'
import { handleTokenExpired } from '../utils/authRedirect'

export interface TokenRefreshConfig {
  /** 检查间隔（毫秒），默认60秒 */
  checkInterval: number
  /** 刷新阈值（分钟），默认5分钟 */
  refreshThreshold: number
  /** 是否启用自动刷新，默认true */
  autoRefresh: boolean
  /** 是否在页面可见时才刷新，默认true */
  refreshOnlyWhenVisible: boolean
  /** 最大重试次数，默认3次 */
  maxRetries: number
  /** 重试间隔（毫秒），默认5秒 */
  retryInterval: number
}

class TokenRefreshService {
  private config: TokenRefreshConfig
  private intervalId: number | null = null
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null
  private retryCount = 0

  constructor(config: Partial<TokenRefreshConfig> = {}) {
    this.config = {
      checkInterval: 60 * 1000, // 1分钟
      refreshThreshold: 5, // 5分钟
      autoRefresh: true,
      refreshOnlyWhenVisible: true,
      maxRetries: 3,
      retryInterval: 5 * 1000, // 5秒
      ...config
    }
  }

  /**
   * 启动token刷新服务
   */
  start(): void {
    if (this.intervalId) {
      this.stop()
    }

    console.log('[TokenRefreshService] 启动token刷新服务')
    
    // 立即检查一次
    this.checkAndRefreshToken()

    // 设置定期检查
    this.intervalId = window.setInterval(() => {
      this.checkAndRefreshToken()
    }, this.config.checkInterval)

    // 监听页面可见性变化
    if (this.config.refreshOnlyWhenVisible) {
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }

    // 监听用户活动
    this.addActivityListeners()
  }

  /**
   * 停止token刷新服务
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    this.removeActivityListeners()

    console.log('[TokenRefreshService] 停止token刷新服务')
  }

  /**
   * 检查并刷新token
   */
  private async checkAndRefreshToken(): Promise<void> {
    const { token, isAuthenticated } = useAuthStore.getState()

    if (!isAuthenticated || !token) {
      return
    }

    // 如果设置了只在页面可见时刷新，检查页面可见性
    if (this.config.refreshOnlyWhenVisible && document.hidden) {
      return
    }

    try {
      // 检查token是否过期
      if (isTokenExpired(token)) {
        console.log('[TokenRefreshService] Token已过期，清除认证状态')
        this.handleTokenExpired()
        return
      }

      // 检查是否需要刷新
      if (shouldRefreshToken(token, this.config.refreshThreshold)) {
        console.log('[TokenRefreshService] Token即将过期，开始刷新')
        await this.refreshToken()
      }
    } catch (error) {
      console.error('[TokenRefreshService] 检查token失败:', error)
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(): Promise<boolean> {
    // 如果正在刷新，返回现有的Promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this.performRefresh()

    try {
      const result = await this.refreshPromise
      this.retryCount = 0 // 重置重试计数
      return result
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  /**
   * 执行token刷新
   */
  private async performRefresh(): Promise<boolean> {
    try {
      console.log('[TokenRefreshService] 开始刷新token')

      // 直接调用useAuthStore的refreshToken方法
      const success = await useAuthStore.getState().refreshToken()

      if (success) {
        console.log('[TokenRefreshService] Token刷新成功')
        return true
      } else {
        throw new Error('Token刷新失败')
      }
    } catch (error) {
      console.error('[TokenRefreshService] Token刷新失败:', error)
      
      // 如果是401错误，说明refresh token也过期了
      if ((error as any)?.response?.status === 401) {
        this.handleTokenExpired()
        return false
      }

      // 其他错误，尝试重试
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++
        console.log(`[TokenRefreshService] 准备重试刷新token (${this.retryCount}/${this.config.maxRetries})`)
        
        await new Promise(resolve => setTimeout(resolve, this.config.retryInterval))
        return this.performRefresh()
      } else {
        console.error('[TokenRefreshService] Token刷新重试次数已达上限')
        this.handleTokenExpired()
        return false
      }
    }
  }

  /**
   * 处理token过期
   */
  private handleTokenExpired(): void {
    console.log('[TokenRefreshService] 处理token过期')
    handleTokenExpired()
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange = (): void => {
    if (!document.hidden) {
      // 页面变为可见时，立即检查token
      console.log('[TokenRefreshService] 页面变为可见，检查token状态')
      this.checkAndRefreshToken()
    }
  }

  /**
   * 添加用户活动监听器
   */
  private addActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, { passive: true })
    })
  }

  /**
   * 移除用户活动监听器
   */
  private removeActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity)
    })
  }

  /**
   * 处理用户活动
   */
  private handleUserActivity = (): void => {
    const { token } = useAuthStore.getState()
    
    if (token && willTokenExpireIn(token, 1)) { // 1分钟内过期
      console.log('[TokenRefreshService] 检测到用户活动且token即将过期，立即检查')
      this.checkAndRefreshToken()
    }
  }

  /**
   * 获取token状态信息
   */
  getTokenStatus(): {
    isValid: boolean
    isExpired: boolean
    shouldRefresh: boolean
    remainingTime: number
  } {
    const { token } = useAuthStore.getState()
    
    if (!token) {
      return {
        isValid: false,
        isExpired: true,
        shouldRefresh: false,
        remainingTime: 0
      }
    }

    return {
      isValid: !isTokenExpired(token),
      isExpired: isTokenExpired(token),
      shouldRefresh: shouldRefreshToken(token, this.config.refreshThreshold),
      remainingTime: getTokenRemainingTime(token)
    }
  }
}

// 创建全局实例
export const tokenRefreshService = new TokenRefreshService()

export default TokenRefreshService
