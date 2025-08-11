import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { projectsApi } from '../api/projects'
import type { Project, ProjectQueryParams, CreateProjectData, UpdateProjectData } from '../api/projects'

interface ProjectState {
  // 状态
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
    has_prev: boolean
    has_next: boolean
  } | null

  // 查询参数
  queryParams: ProjectQueryParams

  // 操作方法
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setQueryParams: (params: Partial<ProjectQueryParams>) => void
  
  // API操作
  fetchProjects: () => Promise<void>
  fetchProject: (id: number) => Promise<void>
  createProject: (data: CreateProjectData) => Promise<Project | null>
  updateProject: (id: number, data: UpdateProjectData) => Promise<Project | null>
  deleteProject: (id: number) => Promise<boolean>
  archiveProject: (id: number) => Promise<boolean>
  restoreProject: (id: number) => Promise<boolean>
  
  // 工具方法
  clearError: () => void
  reset: () => void
}

const initialState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  pagination: null,
  queryParams: {
    page: 1,
    per_page: 1000,
    status: 'active',
  },
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
      ...initialState,

      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setQueryParams: (params) => 
        set((state) => ({
          queryParams: { ...state.queryParams, ...params }
        })),

      fetchProjects: async () => {
        const { queryParams } = get()
        console.log('[useProjectStore] fetchProjects called with queryParams:', queryParams)
        set({ loading: true, error: null })

        try {
          const response = await projectsApi.getProjects(queryParams)
          console.log('[useProjectStore] API response received:', response)
          console.log('[useProjectStore] Response type:', typeof response)
          console.log('[useProjectStore] Response keys:', response ? Object.keys(response) : 'null')

          // 统一的API响应结构: { success, message, data: {items: [...], pagination: {...}}, timestamp, path }
          // 处理不同的API响应格式，与ProjectSelector保持一致
          let projects: any[] = []
          let pagination: any = null

          if (response && Array.isArray((response as any)?.items)) {
            // 新的API格式：{items: Array, pagination: Object}
            projects = (response as any).items
            pagination = (response as any).pagination
          } else if (response && Array.isArray((response as any)?.data)) {
            // 标准API格式：{data: Array}
            projects = (response as any).data
          } else if (response && Array.isArray(response)) {
            // 直接数组格式
            projects = response as any[]
          } else {
            // 如果都不匹配，尝试从response中提取
            projects = []
            console.warn('[useProjectStore] Unexpected response format:', response)
          }

          console.log('[useProjectStore] Extracted projects:', projects)
          console.log('[useProjectStore] Extracted pagination:', pagination)

          set({
            projects,
            pagination,
            loading: false,
          })

          console.log('[useProjectStore] State updated, projects length:', projects.length)
        } catch (error: any) {
          console.error('[useProjectStore] fetchProjects error:', error)
          console.error('[useProjectStore] Error details:', {
            message: error.message,
            response: error.response,
            status: error.response?.status,
            data: error.response?.data
          })
          set({
            error: error.response?.data?.error?.message || '获取项目列表失败',
            loading: false,
          })
        }
      },

      fetchProject: async (id) => {
        set({ loading: true, error: null })
        
        try {
          const response = await projectsApi.getProject(id)
          set({
            currentProject: response || null,
            loading: false,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || '获取项目详情失败',
            loading: false,
          })
        }
      },

      createProject: async (data) => {
        set({ loading: true, error: null })
        
        try {
          const response = await projectsApi.createProject(data)
          const newProject = response
          
          if (newProject) {
            set((state) => ({
              projects: [newProject, ...state.projects],
              loading: false,
            }))
            return newProject
          }
          return null
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || '创建项目失败',
            loading: false,
          })
          return null
        }
      },

      updateProject: async (id, data) => {
        set({ loading: true, error: null })
        
        try {
          const response = await projectsApi.updateProject(id, data)
          const updatedProject = response
          
          if (updatedProject) {
            set((state) => ({
              projects: state.projects.map((p) => 
                p.id === id ? updatedProject : p
              ),
              currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
              loading: false,
            }))
            return updatedProject
          }
          return null
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || '更新项目失败',
            loading: false,
          })
          return null
        }
      },

      deleteProject: async (id) => {
        set({ loading: true, error: null })
        
        try {
          await projectsApi.deleteProject(id)
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
            loading: false,
          }))
          return true
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || '删除项目失败',
            loading: false,
          })
          return false
        }
      },

      archiveProject: async (id) => {
        set({ loading: true, error: null })
        
        try {
          const response = await projectsApi.archiveProject(id)
          const archivedProject = response
          
          if (archivedProject) {
            set((state) => ({
              projects: state.projects.map((p) => 
                p.id === id ? archivedProject : p
              ),
              currentProject: state.currentProject?.id === id ? archivedProject : state.currentProject,
              loading: false,
            }))
            return true
          }
          return false
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || '归档项目失败',
            loading: false,
          })
          return false
        }
      },

      restoreProject: async (id) => {
        set({ loading: true, error: null })
        
        try {
          const response = await projectsApi.restoreProject(id)
          const restoredProject = response
          
          if (restoredProject) {
            set((state) => ({
              projects: state.projects.map((p) => 
                p.id === id ? restoredProject : p
              ),
              currentProject: state.currentProject?.id === id ? restoredProject : state.currentProject,
              loading: false,
            }))
            return true
          }
          return false
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || '恢复项目失败',
            loading: false,
          })
          return false
        }
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'project-store',
      partialize: (state) => ({
        queryParams: state.queryParams,
        // 不持久化projects数据，因为需要实时从服务器获取
        // 只持久化用户的查询参数
      }),
    }),
    {
      name: 'project-store',
    }
  )
)
