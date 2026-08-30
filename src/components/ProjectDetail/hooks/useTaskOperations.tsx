import { useCallback } from 'react'
import { message } from 'antd'
import { useTaskStore } from '../../../stores'
import type { Task } from '../../../api/tasks'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

export const useTaskOperations = () => {
  const { tp } = usePageTranslation('projectDetail')
  const { updateTaskStatus, deleteTask, fetchTasks } = useTaskStore()

  const handleStatusChange = useCallback(async (task: Task, status: Task['status']) => {
    const success = await updateTaskStatus(task.id, status)
    if (success) {
      message.success(tp('tasks.messages.statusUpdateSuccess'))
    }
  }, [updateTaskStatus, tp])

  const handleDelete = useCallback(async (task: Task) => {
    const success = await deleteTask(task.id)
    if (success) {
      message.success(tp('tasks.messages.deleteSuccess'))
      await fetchTasks()
    }
  }, [deleteTask, fetchTasks, tp])

  return {
    handleStatusChange,
    handleDelete
  }
}
