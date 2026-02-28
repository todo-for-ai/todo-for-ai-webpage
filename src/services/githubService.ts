/**
 * GitHub API 服务
 * 用于获取GitHub仓库信息，包括star数等
 */

export interface GitHubRepoInfo {
  name: string
  full_name: string
  description: string
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string
  updated_at: string
}

interface CacheItem {
  data: GitHubRepoInfo
  timestamp: number
}

class GitHubService {
  private cache = new Map<string, CacheItem>()
  private inFlightRequests = new Map<string, Promise<GitHubRepoInfo>>()
  private lastRefreshAttempt = new Map<string, number>()
  private rateLimitBlockedUntil = new Map<string, number>()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30分钟缓存
  private readonly PERSISTENT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7天持久化缓存
  private readonly STALE_REFRESH_THROTTLE = 5 * 60 * 1000 // 过期数据刷新节流: 5分钟
  private readonly RATE_LIMIT_COOLDOWN = 10 * 60 * 1000 // 限流后冷却时间: 10分钟
  private readonly STORAGE_KEY_PREFIX = 'github_repo_'

  constructor() {
    // 初始化时从 localStorage 加载缓存
    this.loadFromLocalStorage()
  }

  /**
   * 从 localStorage 加载缓存
   */
  private loadFromLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
          const cacheKey = key.replace(this.STORAGE_KEY_PREFIX, '')
          const cached = localStorage.getItem(key)
          if (cached) {
            const cacheItem: CacheItem = JSON.parse(cached)
            // 只加载未过期的持久化缓存
            if (Date.now() - cacheItem.timestamp < this.PERSISTENT_CACHE_DURATION) {
              this.cache.set(cacheKey, cacheItem)
              console.log(`[GitHubService] 从 localStorage 加载缓存: ${cacheKey}`)
            } else {
              // 清除过期的持久化缓存
              localStorage.removeItem(key)
            }
          }
        }
      }
    } catch (error) {
      console.warn('[GitHubService] 从 localStorage 加载缓存失败:', error)
    }
  }

  /**
   * 保存到 localStorage
   */
  private saveToLocalStorage(cacheKey: string, cacheItem: CacheItem): void {
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${cacheKey}`
      localStorage.setItem(storageKey, JSON.stringify(cacheItem))
      console.log(`[GitHubService] 保存到 localStorage: ${cacheKey}`)
    } catch (error) {
      console.warn('[GitHubService] 保存到 localStorage 失败:', error)
    }
  }

  /**
   * 读取缓存数据
   */
  getCachedRepoInfo(owner: string, repo: string, includeExpired: boolean = true): GitHubRepoInfo | null {
    const cacheKey = `${owner}/${repo}`
    const cached = this.cache.get(cacheKey)
    if (!cached) return null

    if (includeExpired || Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private shouldThrottleRefresh(cacheKey: string): boolean {
    const lastAttempt = this.lastRefreshAttempt.get(cacheKey) || 0
    return Date.now() - lastAttempt < this.STALE_REFRESH_THROTTLE
  }

  private isRateLimitBlocked(cacheKey: string): boolean {
    const blockedUntil = this.rateLimitBlockedUntil.get(cacheKey) || 0
    return Date.now() < blockedUntil
  }

  private async fetchAndCacheRepoInfo(owner: string, repo: string, retries: number): Promise<GitHubRepoInfo> {
    const cacheKey = `${owner}/${repo}`
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[GitHubService] 重试获取数据 (${attempt}/${retries}): ${cacheKey}`)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        } else {
          console.log(`[GitHubService] 从GitHub API获取数据: ${cacheKey}`)
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Todo-for-AI-App'
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.status === 403 || response.status === 429) {
          const errorData = await response.json().catch(() => ({}))
          const msg = typeof errorData?.message === 'string' ? errorData.message.toLowerCase() : ''
          if (msg.includes('rate limit')) {
            this.rateLimitBlockedUntil.set(cacheKey, Date.now() + this.RATE_LIMIT_COOLDOWN)
            throw new Error('GitHub API 速率限制')
          }
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText)
          throw new Error(`GitHub API请求失败: ${response.status} ${errorText}`)
        }

        const data: GitHubRepoInfo = await response.json()
        const cacheItem: CacheItem = { data, timestamp: Date.now() }
        this.cache.set(cacheKey, cacheItem)
        this.saveToLocalStorage(cacheKey, cacheItem)
        this.rateLimitBlockedUntil.delete(cacheKey)

        console.log(`[GitHubService] 成功获取仓库信息: ${data.stargazers_count} stars`)
        return data
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        const isRateLimit = lastError.message.includes('速率限制')
        console.error(`[GitHubService] 获取仓库信息失败 (尝试 ${attempt + 1}/${retries + 1}):`, lastError.message)
        if (isRateLimit) break
      }
    }

    throw lastError || new Error('获取仓库信息失败')
  }

  /**
   * 获取GitHub仓库信息
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param retries 重试次数
   * @returns Promise<GitHubRepoInfo>
   */
  async getRepoInfo(owner: string, repo: string, retries: number = 2): Promise<GitHubRepoInfo> {
    const cacheKey = `${owner}/${repo}`
    const cached = this.cache.get(cacheKey)

    // 新鲜缓存，直接返回
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`[GitHubService] 使用内存缓存数据: ${cacheKey}`)
      return cached.data
    }

    // 过期缓存优先返回，降低首屏抖动；后台节流刷新
    if (cached) {
      if (!this.shouldThrottleRefresh(cacheKey) && !this.inFlightRequests.has(cacheKey) && !this.isRateLimitBlocked(cacheKey)) {
        this.lastRefreshAttempt.set(cacheKey, Date.now())
        const refreshPromise = this.fetchAndCacheRepoInfo(owner, repo, retries)
          .catch((err) => {
            console.warn(`[GitHubService] 后台刷新失败，继续使用缓存: ${cacheKey}`, err)
            return cached.data
          })
          .finally(() => {
            this.inFlightRequests.delete(cacheKey)
          })
        this.inFlightRequests.set(cacheKey, refreshPromise)
      }
      console.log(`[GitHubService] 使用过期缓存并后台刷新: ${cacheKey}`)
      return cached.data
    }

    // 限流冷却期间不触发外部请求，直接尝试读取持久化缓存
    if (this.isRateLimitBlocked(cacheKey)) {
      const stale = this.getCachedRepoInfo(owner, repo, true)
      if (stale) {
        console.log(`[GitHubService] 处于限流冷却期，使用缓存数据: ${cacheKey}`)
        return stale
      }
    }

    // 并发请求去重
    const inFlight = this.inFlightRequests.get(cacheKey)
    if (inFlight) {
      return inFlight
    }

    this.lastRefreshAttempt.set(cacheKey, Date.now())
    const fetchPromise = this.fetchAndCacheRepoInfo(owner, repo, retries)
      .catch((error) => {
        // 请求失败时，回退到任何可用缓存（包括过期缓存）
        const stale = this.getCachedRepoInfo(owner, repo, true)
        if (stale) {
          console.log(`[GitHubService] API 请求失败，回退缓存数据: ${cacheKey}`)
          return stale
        }
        throw error
      })
      .finally(() => {
        this.inFlightRequests.delete(cacheKey)
      })

    this.inFlightRequests.set(cacheKey, fetchPromise)
    return fetchPromise
  }

  /**
   * 清除缓存（包括 localStorage）
   */
  clearCache(): void {
    // 清除内存缓存
    this.cache.clear()
    
    // 清除 localStorage 缓存
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('[GitHubService] 清除 localStorage 缓存失败:', error)
    }
    
    console.log('[GitHubService] 所有缓存已清除')
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus(): { size: number; items: string[] } {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.keys())
    }
  }

  /**
   * 预加载仓库信息
   * @param owner 仓库所有者
   * @param repo 仓库名称
   */
  async preloadRepoInfo(owner: string, repo: string): Promise<void> {
    try {
      await this.getRepoInfo(owner, repo)
    } catch (error) {
      console.warn(`[GitHubService] 预加载失败: ${owner}/${repo}`, error)
    }
  }
}

// 导出单例实例
export const githubService = new GitHubService()

// 默认仓库配置
export const DEFAULT_REPO = {
  owner: 'todo-for-ai',
  repo: 'todo-for-ai'
}
