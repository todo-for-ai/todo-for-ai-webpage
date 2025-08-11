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

  /**
   * 获取GitHub仓库信息
   * @param owner 仓库所有者
   * @param repo 仓库名称
   * @returns Promise<GitHubRepoInfo>
   */
  async getRepoInfo(owner: string, repo: string): Promise<GitHubRepoInfo> {
    const cacheKey = `${owner}/${repo}`
    
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`[GitHubService] 使用缓存数据: ${cacheKey}`)
      return cached.data
    }

    try {
      console.log(`[GitHubService] 从GitHub API获取数据: ${cacheKey}`)
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Todo-for-AI-App'
        }
      })

      if (!response.ok) {
        throw new Error(`GitHub API请求失败: ${response.status} ${response.statusText}`)
      }

      const data: GitHubRepoInfo = await response.json()
      
      // 缓存数据
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      console.log(`[GitHubService] 成功获取仓库信息: ${data.stargazers_count} stars`)
      return data
    } catch (error) {
      console.error(`[GitHubService] 获取仓库信息失败:`, error)
      
      // 如果有过期的缓存数据，返回缓存数据
      if (cached) {
        console.log(`[GitHubService] 使用过期缓存数据: ${cacheKey}`)
        return cached.data
      }
      
      // 返回默认数据
      return {
        name: repo,
        full_name: `${owner}/${repo}`,
        description: 'AI任务管理系统',
        html_url: `https://github.com/${owner}/${repo}`,
        stargazers_count: 0,
        forks_count: 0,
        language: 'TypeScript',
        updated_at: new Date().toISOString()
      }
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
    console.log('[GitHubService] 缓存已清除')
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
