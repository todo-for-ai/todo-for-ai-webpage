import type { Project } from '../../api/projects'

export interface ProjectFilters {
  archived: string
  has_pending_tasks: string
  time_range: string
  sort_by: string
  sort_order: 'desc' | 'asc'
  search: string
}

export type ProjectsViewMode = 'list' | 'card'

export interface ProjectPagination {
  page: number
  per_page: number
  total: number
  pages: number
  has_prev: boolean
  has_next: boolean
}

export type ProjectTranslate = (key: string, options?: Record<string, unknown>) => string

export interface ProjectActionHandlers {
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onArchive: (project: Project) => void
}

export const defaultFilters: ProjectFilters = {
  archived: 'false',
  has_pending_tasks: '',
  time_range: '',
  sort_by: 'last_activity_at',
  sort_order: 'desc',
  search: ''
}
