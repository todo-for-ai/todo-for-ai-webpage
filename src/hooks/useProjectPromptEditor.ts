import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { customPromptsService } from '../services/customPromptsService'
import { contextRulesApi } from '../api/contextRules'
import { apiClient } from '../api'
import type { Project, Task, ContextRuleData } from '../api'

export const useProjectPromptEditor = (tp: (key: string) => string) => {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectTasks, setProjectTasks] = useState<Task[]>([])
  const [globalContextRules, setGlobalContextRules] = useState<ContextRuleData[]>([])
  const [projectContextRules, setProjectContextRules] = useState<ContextRuleData[]>([])
  const defaultTemplate = tp('projectPrompts.defaultTemplate')

  const loadGlobalContextRules = useCallback(async () => {
    try {
      const response = await contextRulesApi.getGlobalContextRules()
      if (response && Array.isArray(response)) {
        setGlobalContextRules(response.map(rule => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          content: rule.content,
          priority: rule.priority,
          is_active: rule.is_active,
          is_global: rule.is_global,
          project_id: rule.project_id
        })))
      }
    } catch (error) {
      console.error('Failed to load global context rules:', error)
      setGlobalContextRules([])
    }
  }, [])

  const loadProjectContextRules = useCallback(async (projectId: number) => {
    try {
      const response = await contextRulesApi.getContextRules({ project_id: projectId })
      if (response && response.data && Array.isArray(response.data)) {
        setProjectContextRules(response.data.map(rule => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          content: rule.content,
          priority: rule.priority,
          is_active: rule.is_active,
          is_global: rule.is_global,
          project_id: rule.project_id
        })))
      }
    } catch (error) {
      console.error('Failed to load project context rules:', error)
      setProjectContextRules([])
    }
  }, [])

  const loadProjectData = useCallback(async (projectId: number) => {
    setIsLoading(true)
    try {
      const [projectResponse, tasksResponse] = await Promise.all([
        apiClient.get(`/projects/${projectId}`),
        apiClient.get(`/projects/${projectId}/tasks`)
      ])
      
      setSelectedProject(projectResponse.data)
      setProjectTasks(tasksResponse.data || [])
    } catch (error) {
      console.error('Failed to load project data:', error)
      message.error('加载项目数据失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleProjectChange = useCallback((projectId: number | null) => {
    setSelectedProjectId(projectId)
    if (projectId) {
      loadProjectData(projectId)
      loadProjectContextRules(projectId)
    } else {
      setSelectedProject(null)
      setProjectTasks([])
      setProjectContextRules([])
    }
  }, [loadProjectData, loadProjectContextRules])

  const savePrompt = useCallback(async () => {
    try {
      await customPromptsService.saveProjectPromptTemplate(content)
      message.success('保存成功')
    } catch (error) {
      console.error('Failed to save prompt:', error)
      message.error('保存失败')
    }
  }, [content])

  const resetPrompt = useCallback(() => {
    setContent(defaultTemplate)
  }, [defaultTemplate])

  useEffect(() => {
    const template = customPromptsService.getProjectPromptTemplate()
    setContent(template)
    loadGlobalContextRules()
  }, [loadGlobalContextRules])

  return {
    content,
    setContent,
    isLoading,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    projectTasks,
    globalContextRules,
    projectContextRules,
    handleProjectChange,
    savePrompt,
    resetPrompt,
  }
}
