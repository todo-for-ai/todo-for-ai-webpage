/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react'
import { tasksApi, type Task } from '../../api/tasks'

export interface TaskQueryParams {
  page?: number
  per_page?: number
  project_id?: number
  status?: string
  priority?: string
  sort_by?: string
  sort_order?: string
  search?: string
}

export const useTaskStore = () => {
  const [state, setState] = useState<{
    tasks: Task[]
    currentTask: Task | null
    loading: boolean
    error: string | null
    pagination: {
      page: number
      pages: number
      per_page: number
      total: number
      has_next: boolean
      has_prev: boolean
    } | null
    queryParams: TaskQueryParams
  }>({
    tasks: [],
    currentTask: null,
    loading: false,
    error: null,
    pagination: null,
    queryParams: {},
  })

  const update = useCallback(() => {
    // TODO: Implement
  }, [])

  const fetchTasks = useCallback(async (params?: TaskQueryParams) => {
    const queryParams = params || state.queryParams
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await tasksApi.getTasks(queryParams as any)
      const data = response as any
      const items = data.items || data.data || []
      setState(prev => ({
        ...prev,
        tasks: items,
        pagination: data.pagination || null,
        loading: false,
      }))
      return items
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error?.message || 'Failed to fetch tasks',
      }))
      return []
    }
  }, [state.queryParams])

  const fetchTasksByParams = useCallback(async (params: TaskQueryParams) => {
    return fetchTasks(params)
  }, [fetchTasks])

  const fetchTask = useCallback(async (taskId: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const task = await tasksApi.getTask(taskId)
      setState(prev => ({
        ...prev,
        currentTask: task as any,
        loading: false,
      }))
      return task
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error?.message || 'Failed to fetch task',
      }))
    }
  }, [])

  const getTask = useCallback(async (taskId: number) => {
    return fetchTask(taskId)
  }, [fetchTask])

  const updateTask = useCallback(async (taskId: number, updates: any) => {
    try {
      const result = await tasksApi.updateTask(taskId, updates)
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? (result as any) || { ...t, ...updates } : t),
        currentTask: prev.currentTask?.id === taskId ? (result as any) || { ...prev.currentTask, ...updates } : prev.currentTask,
      }))
      return result
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error?.message }))
      throw error
    }
  }, [])

  const updateTaskStatus = useCallback(async (taskId: number, status: Task['status']) => {
    return updateTask(taskId, { status })
  }, [updateTask])

  const deleteTask = useCallback(async (taskId: number) => {
    await tasksApi.deleteTask(taskId)
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }))
  }, [])

  const batchDeleteTasks = useCallback(async (taskIds: number[]) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      await tasksApi.batchDeleteTasks(taskIds)
      setState(prev => ({
        ...prev,
        loading: false,
        tasks: prev.tasks.filter(t => !taskIds.includes(t.id)),
      }))
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as any }))
      throw error
    }
  }, [])

  const batchUpdateTaskStatus = useCallback(async (taskIds: number[], status: Task['status']) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      await tasksApi.batchUpdateTaskStatus(taskIds, status)
      setState(prev => ({
        ...prev,
        loading: false,
        tasks: prev.tasks.map(t => taskIds.includes(t.id) ? { ...t, status } : t),
      }))
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as any }))
      throw error
    }
  }, [])

  const setQueryParams = useCallback((params: TaskQueryParams) => {
    setState(prev => ({ ...prev, queryParams: params }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    update,
    fetchTasks,
    fetchTasksByParams,
    fetchTask,
    getTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    batchDeleteTasks,
    batchUpdateTaskStatus,
    setQueryParams,
    clearError
  }
}
