/**
 * 任务加载 Hook
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { formatParticipantsForForm } from './utils'
import type { TaskFormData } from './useTaskSubmit'
import { tasksApi } from '../../api/tasks'
import type { Task } from '../../api/tasks'

interface UseTaskLoaderReturn {
  taskLoaded: boolean
  setTaskLoaded: (loaded: boolean) => void
  originalTaskContent: string
  setOriginalTaskContent: (content: string) => void
  loadTask: (taskId: number, form: FormInstance, setEditorContent: (content: string) => void, loadEditDraft: (id: number) => TaskFormData | null) => Promise<void>
  loadCopyTaskData: (form: FormInstance, setEditorContent: (content: string) => void) => void
}

export const useTaskLoader = (): UseTaskLoaderReturn => {
  const [taskLoaded, setTaskLoaded] = useState(false)
  const [originalTaskContent, setOriginalTaskContent] = useState('')
  const navigate = useNavigate()

  const loadTask = useCallback(async (
    taskId: number,
    form: FormInstance,
    setEditorContent: (content: string) => void,
    loadEditDraft: (id: number) => TaskFormData | null
  ) => {
    try {
      const task: Task | null = await tasksApi.getTask(taskId)

      if (task) {
        const formData = {
          project_id: task.project_id,
          title: task.title,
          content: task.content,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date ? dayjs(task.due_date) : null,
          tags: task.tags,
          is_ai_task: task.is_ai_task,
          assignees: formatParticipantsForForm(task.assignees),
          mentions: formatParticipantsForForm(task.mentions),
          revision: task.revision || 1,
          id: task.id
        }
        form.setFieldsValue(formData)
        setOriginalTaskContent(task.content || '')

        const editDraft = loadEditDraft(taskId)
        if (editDraft) {
          const draftFormData = {
            project_id: editDraft.project_id || task.project_id,
            title: editDraft.title || task.title,
            content: editDraft.content || task.content,
            status: editDraft.status || task.status,
            priority: editDraft.priority || task.priority,
            due_date: editDraft.due_date ? dayjs(editDraft.due_date) : (task.due_date ? dayjs(task.due_date) : null),
            tags: editDraft.tags || task.tags,
            is_ai_task: editDraft.is_ai_task !== undefined ? editDraft.is_ai_task : task.is_ai_task,
            assignees: formatParticipantsForForm(editDraft.assignees || task.assignees || []),
            mentions: formatParticipantsForForm(editDraft.mentions || task.mentions || []),
            revision: task.revision || 1,
            id: task.id
          }
          form.setFieldsValue(draftFormData)
          setEditorContent(editDraft.content || '')
        } else {
          setEditorContent(task.content || '')
        }
        setTaskLoaded(true)
      } else {
        navigate('/todo-for-ai/pages/tasks')
      }
    } catch (error) {
      console.error('加载任务失败:', error)
      navigate('/todo-for-ai/pages/tasks')
    }
  }, [navigate])

  const loadCopyTaskData = useCallback((form: FormInstance, setEditorContent: (content: string) => void) => {
    try {
      const copyDataStr = sessionStorage.getItem('copyTaskData')
      if (copyDataStr) {
        const copyData = JSON.parse(copyDataStr)
        form.setFieldsValue({
          project_id: copyData.project_id,
          title: copyData.title,
          content: copyData.content,
          priority: copyData.priority || 'medium',
          due_date: copyData.due_date ? dayjs(copyData.due_date) : null,
          tags: copyData.tags || [],
          is_ai_task: copyData.is_ai_task !== undefined ? copyData.is_ai_task : true,
          assignees: formatParticipantsForForm(copyData.assignees || []),
          mentions: formatParticipantsForForm(copyData.mentions || [])
        })
        setEditorContent(copyData.content || '')
        sessionStorage.removeItem('copyTaskData')
      }
    } catch (error) {
      console.warn('Failed to load copy task data:', error)
    }
  }, [])

  return {
    taskLoaded,
    setTaskLoaded,
    originalTaskContent,
    setOriginalTaskContent,
    loadTask,
    loadCopyTaskData,
  }
}
