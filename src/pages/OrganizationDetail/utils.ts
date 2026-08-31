/**
 * Organization Detail 工具函数
 */

import type { Project } from '../../api/projects'

/**
 * 从 payload 中提取项目列表
 */
export const extractProjectItems = (payload: unknown): Project[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const p = payload as Record<string, unknown>
  if (Array.isArray(p.items)) {
    return p.items as Project[]
  }
  if (Array.isArray(p.data)) {
    return p.data as Project[]
  }
  if (p.data && typeof p.data === 'object' && Array.isArray((p.data as Record<string, unknown>).items)) {
    return (p.data as Record<string, unknown>).items as Project[]
  }
  return []
}

/**
 * 获取项目任务数
 */
export const getProjectTaskCount = (project: Project): number => (
  project.total_tasks ??
  project.stats?.total_tasks ??
  0
)

/**
 * 格式化日期时间
 */
export const formatDateTime = (value: string | undefined, language: string): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString(language, { hour12: false })
}

/**
 * 格式化数字
 */
export const formatNumber = (value: number | undefined, language: string): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '-'
  return value.toLocaleString(language)
}

/**
 * 获取时间戳
 */
export const getTimestamp = (value: string | undefined): number => {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}
