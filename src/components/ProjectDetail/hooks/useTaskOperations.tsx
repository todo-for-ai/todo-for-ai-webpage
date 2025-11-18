import { useCallback } from 'react'
import { message } from 'antd'
import { useTaskStore } from '../../../stores'
import type { Task } from '../../../api/tasks'

export const useTaskOperations = () => {
  const { updateTaskStatus, deleteTask, fetchTasks } = useTaskStore()

  const handleStatusChange = useCallback(async (task: Task, status: Task['status']) => {
    const success = await updateTaskStatus(task.id, status)
    if (success) {
      message.success('任务状态更新成功')
    }
  }, [updateTaskStatus])

  const handleDelete = useCallback(async (task: Task) => {
    const success = await deleteTask(task.id)
    if (success) {
      message.success('任务删除成功')
      await fetchTasks()
    }
  }, [deleteTask, fetchTasks])

  return {
    handleStatusChange,
    handleDelete
  }
}
