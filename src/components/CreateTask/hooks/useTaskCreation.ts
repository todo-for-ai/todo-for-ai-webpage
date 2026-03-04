import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { useTaskStore } from '../../../stores/useTaskStore'
import { useProjectStore } from '../../../stores/useProjectStore'
import { analytics } from '../../../utils/analytics'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

export interface TaskFormData {
  title: string
  content: string
  priority: string
  due_date: string
  estimated_hours: number
  assignee: string
  tags: string[]
}

export const useTaskCreation = () => {
  const navigate = useNavigate()
  const { tp } = usePageTranslation('createTask')
  const [loading, setLoading] = useState(false)
  const { createTask } = useTaskStore()
  const { currentProject } = useProjectStore()

  const handleSubmit = useCallback(async (formData: TaskFormData, projectId: number) => {
    if (!formData.title.trim()) {
      message.error(tp('messages.titleRequired'))
      return false
    }

    setLoading(true)
    try {
      const taskData = {
        project_id: projectId,
        title: formData.title.trim(),
        content: formData.content || '',
        priority: formData.priority || 'medium',
        due_date: formData.due_date || null,
        estimated_hours: formData.estimated_hours || null,
        assignee: formData.assignee || null,
        tags: formData.tags || [],
        status: 'todo'
      }

      await createTask(taskData)
      message.success(tp('messages.createSuccess'))

      // 追踪创建任务事件
      analytics.task.create(projectId.toString())

      navigate(`/projects/${projectId}/tasks`)
      return true
    } catch (error) {
      console.error('Failed to create task:', error)
      message.error(tp('messages.createFailed'))
      return false
    } finally {
      setLoading(false)
    }
  }, [navigate, createTask, tp])

  return {
    loading,
    handleSubmit
  }
}
