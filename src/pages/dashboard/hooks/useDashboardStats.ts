import { useState } from 'react'
import { message } from 'antd'
import { dashboardApi, type DashboardStats } from '../../../api/dashboard'

/**
 * 仪表盘核心统计：总览数字 + Agent 协作分配的派生口径（待审/过期租约等）。
 * 从 useDashboardData 原样拆出（行为保持不变）。
 */
export function useDashboardStats(tc: (k: string) => string) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
      message.error(tc('messages.error.general'))
    } finally {
      setLoading(false)
    }
  }

  const agentCollaboration = stats?.agent_collaboration
  const reviewOrExpiredAssignments =
    (agentCollaboration?.assignments.review || 0) + (agentCollaboration?.assignments.expired_leases || 0)
  const hasExpiredLeases = (agentCollaboration?.assignments.expired_leases || 0) > 0

  const owned = stats?.scopes?.owned || {
    projects: stats?.projects || { total: 0, active: 0 },
    tasks: stats?.tasks || { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, ai_executing: 0 },
  }
  const participated = stats?.scopes?.participated || owned
  const orgSummary = stats?.organizations?.summary || { total: 0, total_agents: 0, active_agents_7d: 0 }
  const topOrganizations = stats?.organizations?.top_organizations || []

  return {
    stats,
    setStats,
    loading,
    setLoading,
    loadDashboardStats,
    agentCollaboration,
    reviewOrExpiredAssignments,
    hasExpiredLeases,
    owned,
    participated,
    orgSummary,
    topOrganizations,
  }
}
