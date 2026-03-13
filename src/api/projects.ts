import { apiClient } from './client/index.js'

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pages: number
    per_page: number
    total: number
    has_next: boolean
    has_prev: boolean
    next_num?: number
    prev_num?: number
  }
  message: string
  success: boolean
  timestamp: string
}

// 项目相关类型定义
export interface Project {
  id: number
  name: string
  description: string
  color: string
  status: 'active' | 'archived' | 'deleted'
  organization_id?: number | null
  current_user_role?: 'owner' | 'maintainer' | 'member' | 'viewer' | null
  created_at: string
  updated_at: string
  created_by: string
  github_url?: string
  local_url?: string
  production_url?: string
  project_context?: string
  last_activity_at?: string
  // 统计信息字段
  total_tasks?: number
  completed_tasks?: number
  pending_tasks?: number
  stats?: {
    total_tasks: number
    todo_tasks: number
    in_progress_tasks: number
    done_tasks: number
    context_rules_count: number
  }
}

export interface CreateProjectData {
  name: string
  description?: string
  color?: string
  organization_id?: number | null
  github_url?: string
  local_url?: string
  production_url?: string
  project_context?: string
  status?: 'active' | 'archived' | 'deleted'
}

export interface UpdateProjectData {
  name?: string
  description?: string
  color?: string
  organization_id?: number | null
  status?: 'active' | 'archived' | 'deleted'
  github_url?: string
  local_url?: string
  production_url?: string
  project_context?: string
}

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: 'owner' | 'maintainer' | 'member' | 'viewer'
  status: 'active' | 'invited' | 'removed'
  invited_by?: number | null
  joined_at?: string
  created_at: string
  updated_at: string
  user?: {
    id: number
    username?: string
    nickname?: string
    full_name?: string
    avatar_url?: string
    bio?: string
    created_at?: string
  }
}

export interface ProjectQueryParams {
  page?: number
  per_page?: number
  search?: string
  status?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  include_stats?: boolean
  organization_id?: number
}

// 项目API服务
export class ProjectsApi {
  // 获取项目列表
  async getProjects(params?: ProjectQueryParams) {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }

    const url = `/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<PaginatedResponse<Project>>(url)
  }

  // 获取单个项目
  async getProject(id: number) {
    return apiClient.get<Project>(`/projects/${id}`)
  }

  // 创建项目
  async createProject(data: CreateProjectData) {
    return apiClient.post<Project>('/projects', data)
  }

  // 更新项目
  async updateProject(id: number, data: UpdateProjectData) {
    return apiClient.put<Project>(`/projects/${id}`, data)
  }

  // 删除项目
  async deleteProject(id: number) {
    return apiClient.delete(`/projects/${id}`)
  }

  // 归档项目
  async archiveProject(id: number) {
    return apiClient.post<Project>(`/projects/${id}/archive`)
  }

  // 恢复项目
  async restoreProject(id: number) {
    return apiClient.post<Project>(`/projects/${id}/restore`)
  }

  // 获取项目任务
  async getProjectTasks(id: number, params?: {
    page?: number
    per_page?: number
    search?: string
    status?: string
    priority?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }

    const url = `/projects/${id}/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get(url)
  }

  // 获取项目上下文规则
  async getProjectContextRules(id: number) {
    return apiClient.get(`/projects/${id}/context-rules`)
  }

  // 获取项目成员
  async getProjectMembers(id: number) {
    return apiClient.get<{ items: ProjectMember[]; project_id: number }>(`/projects/${id}/members`)
  }

  // 邀请项目成员
  async inviteProjectMember(
    id: number,
    data: {
      email: string
      role?: 'maintainer' | 'member' | 'viewer'
    }
  ) {
    return apiClient.post<ProjectMember>(`/projects/${id}/members/invite`, data)
  }

  // 更新项目成员
  async updateProjectMember(
    id: number,
    userId: number,
    data: {
      role?: 'maintainer' | 'member' | 'viewer'
      status?: 'active' | 'invited' | 'removed'
    }
  ) {
    return apiClient.put<ProjectMember>(`/projects/${id}/members/${userId}`, data)
  }

  // 移除项目成员
  async removeProjectMember(id: number, userId: number) {
    return apiClient.delete(`/projects/${id}/members/${userId}`)
  }
}

// 导出单例实例
export const projectsApi = new ProjectsApi()
