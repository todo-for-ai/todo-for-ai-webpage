import { useEffect, useCallback } from 'react'
import { useTaskStore } from '../../../stores/useTaskStore'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

export const useTaskDetail = (taskId: string | undefined, projectId: string | undefined) => {
  const navigate = useNavigate()
  const { tp } = usePageTranslation('taskDetail')
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
      message.success(tp('messages.statusUpdateSuccess'))
      await loadTask()
    } catch (error) {
      console.error('Failed to update task:', error)
      message.error(tp('messages.statusUpdateFailed'))
    }
  }, [taskId, updateTask, loadTask, tp])

  // 删除任务
  const handleDeleteTask = useCallback(async () => {
    if (!taskId || !projectId) return
    try {
      await deleteTask(parseInt(taskId))
      message.success(tp('messages.deleteSuccess'))
      navigate(`/projects/${projectId}/tasks`)
    } catch (error) {
      console.error('Failed to delete task:', error)
      message.error(tp('messages.deleteFailed'))
    }
  }, [taskId, projectId, deleteTask, navigate, tp])

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
