import { useAuthStore } from '../stores/useAuthStore'
import { handleTokenExpired } from '../utils/authRedirect'

export class TokenRefreshService {
  private isRunning = false
  private startTime: number | null = null
  private checkTimer: ReturnType<typeof setInterval> | null = null
  private isRefreshing = false
  private readonly CHECK_INTERVAL_MS = 60 * 1000
  private visibilityHandler: (() => void) | null = null

  private async checkAndRefreshToken() {
    if (typeof window === 'undefined') return

    const authState = useAuthStore.getState()
    const token = authState.token
    if (!token) return

    if (authState.isTokenExpired()) {
      console.warn('[TokenRefreshService] Access token expired')
      authState.clearAuth()
      handleTokenExpired()
      return
    }

    if (!authState.shouldRefreshToken()) {
      return
    }

    if (this.isRefreshing) {
      return
    }

    try {
      this.isRefreshing = true
      const refreshed = await authState.refreshTokens()
      if (!refreshed) {
        console.warn('[TokenRefreshService] Token refresh failed, redirect to login')
        handleTokenExpired()
      }
    } catch (error) {
      console.error('[TokenRefreshService] Unexpected refresh error:', error)
      handleTokenExpired()
    } finally {
      this.isRefreshing = false
    }
  }

  private attachVisibilityListener() {
    if (typeof document === 'undefined') return
    if (this.visibilityHandler) return

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && this.isRunning) {
        this.checkAndRefreshToken()
      }
    }
    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  private detachVisibilityListener() {
    if (typeof document === 'undefined') return
    if (!this.visibilityHandler) return
    document.removeEventListener('visibilitychange', this.visibilityHandler)
    this.visibilityHandler = null
  }

  async start() {
    if (this.isRunning) {
      console.log('[TokenRefreshService] Service already running')
      return
    }

    this.isRunning = true
    this.startTime = Date.now()
    this.checkTimer = setInterval(() => {
      this.checkAndRefreshToken()
    }, this.CHECK_INTERVAL_MS)

    this.attachVisibilityListener()
    await this.checkAndRefreshToken()
    console.log('[TokenRefreshService] Service started')
  }

  async stop() {
    if (!this.isRunning) {
      console.log('[TokenRefreshService] Service already stopped')
      return
    }

    this.isRunning = false
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
    this.detachVisibilityListener()

    const duration = this.startTime ? Date.now() - this.startTime : 0
    console.log(`[TokenRefreshService] Service stopped (ran for ${duration}ms)`)
    this.startTime = null
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    }
  }
}

export const tokenRefreshService = new TokenRefreshService()
export default tokenRefreshService
