export class TokenRefreshService {
  private isRunning = false
  private startTime: number | null = null

  async start() {
    // 防止重复启动
    if (this.isRunning) {
      console.log('[TokenRefreshService] Service already running')
      return
    }

    this.isRunning = true
    this.startTime = Date.now()
    console.log('[TokenRefreshService] Service started')
  }

  async stop() {
    if (!this.isRunning) {
      console.log('[TokenRefreshService] Service already stopped')
      return
    }

    this.isRunning = false
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

  async method1() {
    throw new Error('Not implemented')
  }

  async method2() {
    throw new Error('Not implemented')
  }
}

export const tokenRefreshService = new TokenRefreshService()
export default tokenRefreshService
