import { useState, useCallback } from 'react'
import { projectsApi, type ProjectQueryParams } from '../api/projects'

export const useProjectStore = () => {
  const [state, setState] = useState<any>({
    projects: [],
    currentProject: null,
    loading: false,
    error: null
  })

  const update = useCallback(() => {
    // TODO: Implement
  }, [])

  const setProjects = useCallback((projects: any[]) => {
    setState(prev => ({ ...prev, projects }))
  }, [])

  const setCurrentProject = useCallback((project: any) => {
    setState(prev => ({ ...prev, currentProject: project }))
  }, [])

  const fetchProject = useCallback(async (projectId: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const project = await projectsApi.getProject(projectId)
      setState(prev => ({ ...prev, currentProject: project, loading: false }))
      return project
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message || '获取项目失败', loading: false }))
      throw error
    }
  }, [])

  const fetchProjects = useCallback(async (params?: ProjectQueryParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await projectsApi.getProjects(params)
      const projects = response.data || []
      setState(prev => ({ ...prev, projects, loading: false }))
      return projects
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message || '获取项目列表失败', loading: false }))
      throw error
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    update,
    setProjects,
    setCurrentProject,
    fetchProject,
    fetchProjects,
    clearError
  }
}
