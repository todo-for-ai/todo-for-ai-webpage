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
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30分钟缓存
  private readonly PERSISTENT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7天持久化缓存
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
   * 获取GitHub仓库信息
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @param retries 重试次数
   * @returns Promise<GitHubRepoInfo>
   */
  async getRepoInfo(owner: string, repo: string, retries: number = 2): Promise<GitHubRepoInfo> {
    const cacheKey = `${owner}/${repo}`
    
    // 检查内存缓存
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`[GitHubService] 使用内存缓存数据: ${cacheKey}`)
      return cached.data
    }

    let lastError: Error | null = null
    let isRateLimitError = false
    
    // 重试机制
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[GitHubService] 重试获取数据 (${attempt}/${retries}): ${cacheKey}`)
          // 重试前等待一段时间
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        } else {
          console.log(`[GitHubService] 从GitHub API获取数据: ${cacheKey}`)
        }
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Todo-for-AI-App'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)

        // 检查是否是速率限制错误
        if (response.status === 403 || response.status === 429) {
          const errorData = await response.json().catch(() => ({}))
          if (errorData.message && errorData.message.includes('rate limit')) {
            isRateLimitError = true
            console.warn(`[GitHubService] GitHub API 速率限制: ${errorData.message}`)
            throw new Error(`GitHub API 速率限制`)
          }
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText)
          throw new Error(`GitHub API请求失败: ${response.status} ${errorText}`)
        }

        const data: GitHubRepoInfo = await response.json()
        
        // 缓存数据到内存和 localStorage
        const cacheItem: CacheItem = {
          data,
          timestamp: Date.now()
        }
        this.cache.set(cacheKey, cacheItem)
        this.saveToLocalStorage(cacheKey, cacheItem)

        console.log(`[GitHubService] 成功获取仓库信息: ${data.stargazers_count} stars`)
        return data
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`[GitHubService] 获取仓库信息失败 (尝试 ${attempt + 1}/${retries + 1}):`, lastError.message)
        
        // 如果是速率限制错误，不再重试
        if (isRateLimitError) {
          break
        }
        
        // 如果不是最后一次尝试，继续重试
        if (attempt < retries) {
          continue
        }
      }
    }
    
    // 所有重试都失败后，检查是否有缓存数据（包括过期的）
    if (cached) {
      console.log(`[GitHubService] API 请求失败，使用过期的内存缓存数据: ${cacheKey}`)
      return cached.data
    }
    
    // 如果内存中没有，尝试从 localStorage 读取
    try {
      const storageKey = `${this.STORAGE_KEY_PREFIX}${cacheKey}`
      const storedCache = localStorage.getItem(storageKey)
      if (storedCache) {
        const cacheItem: CacheItem = JSON.parse(storedCache)
        console.log(`[GitHubService] API 请求失败，使用 localStorage 缓存数据: ${cacheKey}`)
        // 更新内存缓存
        this.cache.set(cacheKey, cacheItem)
        return cacheItem.data
      }
    } catch (error) {
      console.warn('[GitHubService] 从 localStorage 读取缓存失败:', error)
    }
    
    // 抛出最后一次的错误
    throw lastError || new Error('获取仓库信息失败')
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
