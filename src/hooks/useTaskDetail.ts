import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { App } from 'antd'
import dayjs from 'dayjs'
import { useTaskStore, useProjectStore } from '../stores'
import type { Task } from '../api/tasks'
import { contextRulesApi, type BuildContextResponse } from '../api/contextRules'
import { customPromptsService } from '../services/customPromptsService'
import { analytics } from '../utils/analytics'

interface TaskDetailFilters {
  status: string
  priority: string
  search: string
  sort_by: string
  sort_order: 'desc' | 'asc'
}

const loadTaskFiltersFromStorage = (): TaskDetailFilters => {
  try {
    const saved = localStorage.getItem('project-task-filters')
    if (saved) return { ...JSON.parse(saved) }
  } catch (error) {
    console.warn('Failed to load task filters from localStorage:', error)
  }
  return {
    status: 'todo,in_progress,review',
    priority: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  }
}

export const useTaskDetail = (tp: (key: string) => string) => {
  const { message } = App.useApp()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectTasks, setProjectTasks] = useState<Task[]>([])
  const [projectContext, setProjectContext] = useState<BuildContextResponse | null>(null)
  const [contextLoading, setContextLoading] = useState(false)
  const [customButtons, setCustomButtons] = useState<any[]>([])

  const { getTask, deleteTask, fetchTasksByParams } = useTaskStore()
  const { projects, fetchProjects } = useProjectStore()

  const loadTask = async (taskId: number) => {
    try {
      setLoading(true)
      const result = await getTask(taskId)
      if (result) {
        setTask(result)
        const taskFilters = loadTaskFiltersFromStorage()
        const projectTasksResult = await fetchTasksByParams({
          project_id: result.project_id,
          status: taskFilters.status,
          priority: taskFilters.priority,
          search: taskFilters.search,
          sort_by: taskFilters.sort_by,
          sort_order: taskFilters.sort_order
        })
        setProjectTasks(projectTasksResult)
        if (result.project_id) {
          loadProjectContext(result.project_id)
        }
      } else {
        const errorMsg = tp('messages.taskNotFound')
        message.error(errorMsg)
        navigate('/todo-for-ai/pages/tasks')
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('加载任务失败:', error)
      if (error instanceof Error && error.message === tp('messages.taskNotFound')) {
        throw error
      }
      let errorMessage = tp('messages.loadTaskFailed')
      if (error instanceof Error) {
        errorMessage = `${tp('messages.loadTaskFailed')}: ${error.message}`
      }
      message.error(errorMessage)
      navigate('/todo-for-ai/pages/tasks')
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectContext = async (projectId: number) => {
    try {
      setContextLoading(true)
      const result = await contextRulesApi.buildProjectContext(projectId, true, false)
      setProjectContext(result)
    } catch (error) {
      console.error('加载项目上下文失败:', error)
    } finally {
      setContextLoading(false)
    }
  }

  const handleEdit = () => {
    if (task) {
      navigate(`/todo-for-ai/pages/tasks/${task.id}/edit`)
    }
  }

  const handleDelete = async () => {
    if (!task) return
    try {
      await deleteTask(task.id)
      message.success(tp('messages.deleteSuccess'))
      navigate(`/todo-for-ai/pages/projects/${task.project_id}?tab=tasks`)
    } catch (error) {
      console.error('删除任务失败:', error)
      message.error(tp('messages.deleteFailed'))
    }
  }

  const handlePreviousTask = () => {
    const currentIndex = projectTasks.findIndex(t => t.id === task?.id)
    if (currentIndex > 0) {
      const previousTask = projectTasks[currentIndex - 1]
      navigate(`/todo-for-ai/pages/tasks/${previousTask.id}`)
    }
  }

  const handleNextTask = () => {
    const currentIndex = projectTasks.findIndex(t => t.id === task?.id)
    if (currentIndex >= 0 && currentIndex < projectTasks.length - 1) {
      const nextTask = projectTasks[currentIndex + 1]
      navigate(`/todo-for-ai/pages/tasks/${nextTask.id}`)
    }
  }

  useEffect(() => {
    if (id) {
      loadTask(parseInt(id, 10))
      analytics.task.view(id)
    }
  }, [id])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    const buttons = customPromptsService.getTaskPromptButtons()
    setCustomButtons(buttons)
  }, [])

  return {
    task,
    loading,
    projectTasks,
    projectContext,
    contextLoading,
    customButtons,
    projects,
    handleEdit,
    handleDelete,
    handlePreviousTask,
    handleNextTask,
  }
}
