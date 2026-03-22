/**
 * Projects 数据 Hook
 */

import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { projectsApi, type Project } from '../../../api/projects'
import { extractProjectItems, getProjectTaskCount, getTimestamp } from '../utils'
import type { ProjectStats, ActivityStats } from '../types'

interface UseProjectsReturn {
  projects: Project[]
  loading: boolean
  projectStats: ProjectStats
  activityStats: ActivityStats
  recentProjects: Project[]
  loadProjects: () => Promise<void>
}

export const useProjects = (
  organizationId: number,
  organizationUpdatedAt: string | undefined,
  tp: (key: string, options?: { defaultValue?: string }) => string
): UseProjectsReturn => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  const loadProjects = useCallback(async () => {
    if (!organizationId) return
    try {
      setLoading(true)
      const response = await projectsApi.getProjects({
        page: 1,
        per_page: 200,
        include_stats: true,
        organization_id: organizationId,
      })
      setProjects(extractProjectItems(response))
    } catch (error: any) {
      message.error(error?.message || tp('detail.projects.loadFailed', { defaultValue: '加载项目失败' }))
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [organizationId, tp])

  // 项目统计
  const projectStats: ProjectStats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    archived: projects.filter((p) => p.status === 'archived').length,
    deleted: projects.filter((p) => p.status === 'deleted').length,
  }

  // 活动统计
  const activityStats: ActivityStats = (() => {
    const now = Date.now()
    const windowMs = 7 * 24 * 60 * 60 * 1000
    let activeProjects7d = 0
    let latestActivityAt: string | undefined
    let latestActivityTs = 0

    const considerTime = (value?: string) => {
      if (!value) return
      const ts = new Date(value).getTime()
      if (Number.isNaN(ts)) return
      if (ts > latestActivityTs) {
        latestActivityTs = ts
        latestActivityAt = value
      }
    }

    projects.forEach((project) => {
      const activityAt = project.last_activity_at || project.updated_at
      considerTime(activityAt)
      if (activityAt) {
        const ts = new Date(activityAt).getTime()
        if (!Number.isNaN(ts) && now - ts <= windowMs) {
          activeProjects7d += 1
        }
      }
    })

    considerTime(organizationUpdatedAt)

    return {
      activeProjects7d,
      latestActivityAt: latestActivityAt || organizationUpdatedAt,
    }
  })()

  // 最近项目（按活动时间排序）
  const recentProjects = [...projects]
    .sort((left, right) => {
      const rightTs = getTimestamp(right.last_activity_at || right.updated_at || right.created_at)
      const leftTs = getTimestamp(left.last_activity_at || left.updated_at || left.created_at)
      return rightTs - leftTs
    })
    .slice(0, 4)

  useEffect(() => {
    if (!organizationId) return
    void loadProjects()
  }, [organizationId, loadProjects])

  return {
    projects,
    loading,
    projectStats,
    activityStats,
    recentProjects,
    loadProjects,
  }
}
