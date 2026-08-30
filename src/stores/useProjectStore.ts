import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { projectsApi } from '../api/projects'
import type { Project, ProjectQueryParams, CreateProjectData, UpdateProjectData } from '../api/projects'

type ExtendedProjectQueryParams = ProjectQueryParams & {
  archived?: string
  has_pending_tasks?: string
  time_range?: string
}

interface ProjectPagination {
  page: number
  per_page: number
  total: number
  pages: number
  has_prev: boolean
  has_next: boolean
}

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  error: string | null
  pagination: ProjectPagination | null
  queryParams: ExtendedProjectQueryParams

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setQueryParams: (params: Partial<ExtendedProjectQueryParams>) => void

  fetchProjects: (params?: Partial<ExtendedProjectQueryParams>) => Promise<void>
  fetchProject: (id: number) => Promise<void>
  createProject: (data: CreateProjectData) => Promise<Project | null>
  updateProject: (id: number, data: UpdateProjectData) => Promise<Project | null>
  deleteProject: (id: number) => Promise<boolean>
  archiveProject: (id: number) => Promise<boolean>
  restoreProject: (id: number) => Promise<boolean>

  clearError: () => void
  reset: () => void
}

const initialState: Pick<ProjectState, 'projects' | 'currentProject' | 'loading' | 'error' | 'pagination' | 'queryParams'> = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  pagination: null,
  queryParams: {
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  },
}

const extractProject = (payload: any): Project | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  if ('id' in payload) {
    return payload as Project
  }
  if (payload.project && typeof payload.project === 'object') {
    return payload.project as Project
  }
  if (payload.item && typeof payload.item === 'object') {
    return payload.item as Project
  }
  if (payload.data && typeof payload.data === 'object' && 'id' in payload.data) {
    return payload.data as Project
  }
  return null
}

const extractListPayload = (payload: any): { projects: Project[]; pagination: ProjectPagination | null } => {
  if (Array.isArray(payload)) {
    return { projects: payload as Project[], pagination: null }
  }

  if (!payload || typeof payload !== 'object') {
    return { projects: [], pagination: null }
  }

  if (Array.isArray(payload.items)) {
    return {
      projects: payload.items as Project[],
      pagination: payload.pagination || null
    }
  }

  if (Array.isArray(payload.data)) {
    return {
      projects: payload.data as Project[],
      pagination: payload.pagination || null
    }
  }

  if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.items)) {
    return {
      projects: payload.data.items as Project[],
      pagination: payload.data.pagination || payload.pagination || null
    }
  }

  return {
    projects: [],
    pagination: payload.pagination || null
  }
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setQueryParams: (params) => set((state) => ({ queryParams: { ...state.queryParams, ...params } })),

      fetchProjects: async (params) => {
        const currentQuery = get().queryParams
        const mergedQuery = { ...currentQuery, ...(params || {}) }
        set({ queryParams: mergedQuery, loading: true, error: null })

        try {
          const response = await projectsApi.getProjects(mergedQuery)
          const parsed = extractListPayload(response)

          set({
            projects: parsed.projects,
            pagination: parsed.pagination,
            loading: false,
          })
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to load projects',
            loading: false,
          })
          throw error
        }
      },

      fetchProject: async (id) => {
        set({ loading: true, error: null })

        try {
          const response = await projectsApi.getProject(id)
          const project = extractProject(response)

          set({
            currentProject: project,
            loading: false,
          })
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to load project detail',
            loading: false,
          })
          throw error
        }
      },

      createProject: async (data) => {
        set({ loading: true, error: null })

        try {
          const response = await projectsApi.createProject(data)
          const newProject = extractProject(response)

          if (newProject) {
            set((state) => ({
              projects: [newProject, ...state.projects],
              loading: false,
            }))
            return newProject
          }

          set({ loading: false })
          return null
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to create project',
            loading: false,
          })
          throw error
        }
      },

      updateProject: async (id, data) => {
        set({ loading: true, error: null })

        try {
          const response = await projectsApi.updateProject(id, data)
          const updatedProject = extractProject(response)

          if (updatedProject) {
            set((state) => ({
              projects: state.projects.map((project) => (project.id === id ? updatedProject : project)),
              currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
              loading: false,
            }))
            return updatedProject
          }

          set({ loading: false })
          return null
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to update project',
            loading: false,
          })
          throw error
        }
      },

      deleteProject: async (id) => {
        set({ loading: true, error: null })

        try {
          await projectsApi.deleteProject(id)
          set((state) => ({
            projects: state.projects.filter((project) => project.id !== id),
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
            loading: false,
          }))
          return true
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to delete project',
            loading: false,
          })
          return false
        }
      },

      archiveProject: async (id) => {
        set({ loading: true, error: null })

        try {
          const response = await projectsApi.archiveProject(id)
          const archivedProject = extractProject(response)

          if (archivedProject) {
            set((state) => ({
              projects: state.projects.map((project) => (project.id === id ? archivedProject : project)),
              currentProject: state.currentProject?.id === id ? archivedProject : state.currentProject,
              loading: false,
            }))
            return true
          }

          set({ loading: false })
          return false
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to archive project',
            loading: false,
          })
          return false
        }
      },

      restoreProject: async (id) => {
        set({ loading: true, error: null })

        try {
          const response = await projectsApi.restoreProject(id)
          const restoredProject = extractProject(response)

          if (restoredProject) {
            set((state) => ({
              projects: state.projects.map((project) => (project.id === id ? restoredProject : project)),
              currentProject: state.currentProject?.id === id ? restoredProject : state.currentProject,
              loading: false,
            }))
            return true
          }

          set({ loading: false })
          return false
        } catch (error: any) {
          set({
            error: error?.message || 'Failed to restore project',
            loading: false,
          })
          return false
        }
      },

      clearError: () => set({ error: null }),
      reset: () => set({ ...initialState, queryParams: { ...initialState.queryParams } }),
    }),
    { name: 'project-store' }
  )
)
