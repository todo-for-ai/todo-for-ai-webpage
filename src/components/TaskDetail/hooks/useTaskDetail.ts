import { useEffect, useCallback } from 'react'
import { useTaskStore } from '../../../stores/useTaskStore'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'

export const useTaskDetail = (taskId: string | undefined, projectId: string | undefined) => {
  const navigate = useNavigate()
  const {
    currentTask,
    loading: taskLoading,
    error: taskError,
    fetchTask,
    updateTask,
    deleteTask,
    clearError
  } = useTaskStore()

  // 加载任务详情
  const loadTask = useCallback(async () => {
    if (taskId) {
      await fetchTask(parseInt(taskId))
    }
  }, [taskId, fetchTask])

  // 更新任务
  const handleUpdateTask = useCallback(async (updates: any) => {
    if (!taskId) return
    try {
      await updateTask(parseInt(taskId), updates)
      message.success('任务更新成功')
      await loadTask()
    } catch (error) {
      console.error('Failed to update task:', error)
      message.error('任务更新失败')
    }
  }, [taskId, updateTask, loadTask])

  // 删除任务
  const handleDeleteTask = useCallback(async () => {
    if (!taskId || !projectId) return
    try {
      await deleteTask(parseInt(taskId))
      message.success('任务删除成功')
      navigate(`/projects/${projectId}/tasks`)
    } catch (error) {
      console.error('Failed to delete task:', error)
      message.error('任务删除失败')
    }
  }, [taskId, projectId, deleteTask, navigate])

  useEffect(() => {
    loadTask()
  }, [loadTask])

  return {
    currentTask,
    taskLoading,
    taskError,
    loadTask,
    handleUpdateTask,
    handleDeleteTask,
    clearError
  }
}
