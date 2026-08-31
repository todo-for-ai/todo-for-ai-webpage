/**
 * 任务提交通用 Hook
 */

import { useState, useCallback } from 'react'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { tasksApi } from '../../api/tasks'
import type { CreateTaskData } from '../../api/tasks'
import { parseParticipants } from './utils'

export interface TaskFormData {
  project_id: number
  title: string
  content: string
  status: string
  priority: string
  due_date: dayjs.Dayjs | null
  tags: string[]
  is_ai_task: boolean
  assignees: unknown[]
  mentions: unknown[]
  revision?: number
}

interface UseTaskSubmitReturn {
  loading: boolean
  setLoading: (loading: boolean) => void
  buildTaskData: (values: Record<string, unknown>, editorContent: string) => TaskFormData
  uploadAttachments: (taskId: number, attachments: File[]) => Promise<void>
  handleSubmit: (params: {
    form: FormInstance
    editorContent: string
    isEditMode: boolean
    taskId: string | undefined
    attachments: File[]
    onSuccess: () => void
  }) => Promise<void>
}

export const useTaskSubmit = (
  createTask: (data: CreateTaskData) => Promise<{ id: number } | null>,
  updateTask: (id: number, data: unknown) => Promise<unknown>,
  clearDraft: (projectId: number) => void,
  clearEditDraft: (taskId: number) => void,
  setLastSavedTime: (time: string | undefined) => void,
  setOriginalTaskContent: (content: string) => void
): UseTaskSubmitReturn => {
  const [loading, setLoading] = useState(false)

  const buildTaskData = useCallback((values: Record<string, unknown>, editorContent: string): TaskFormData => ({
    project_id: values.project_id as number,
    title: (values.title as string)?.trim() || undefined,
    content: editorContent?.trim() || undefined,
    status: (values.status as string) || 'todo',
    priority: (values.priority as string) || 'medium',
    due_date: values.due_date ? (values.due_date as dayjs.Dayjs) : null,
    tags: (values.tags as string[]) || [],
    is_ai_task: (values.is_ai_task as boolean) || false,
    assignees: parseParticipants(values.assignees),
    mentions: parseParticipants(values.mentions),
    revision: values.revision as number | undefined,
  }), [])

  const uploadAttachments = useCallback(async (taskId: number, attachments: File[] = []) => {
    if (!taskId || !attachments.length) return
    const uploadJobs = attachments.map((file) => tasksApi.uploadTaskAttachment(taskId, file))
    await Promise.all(uploadJobs)
  }, [])

  const handleSubmit = useCallback(async ({
    form,
    editorContent,
    isEditMode,
    taskId,
    attachments,
    onSuccess,
  }: {
    form: FormInstance
    editorContent: string
    isEditMode: boolean
    taskId: string | undefined
    attachments: File[]
    onSuccess: () => void
  }) => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      const taskData = buildTaskData(values, editorContent)

      let result
      if (isEditMode && taskId) {
        result = await updateTask(parseInt(taskId, 10), {
          ...taskData,
          due_date: taskData.due_date ? taskData.due_date.format('YYYY-MM-DD') : undefined,
        })
        if (result) {
          await uploadAttachments(parseInt(taskId, 10), attachments)
          clearEditDraft(parseInt(taskId, 10))
          setLastSavedTime(new Date().toISOString())
          setOriginalTaskContent(editorContent)
          onSuccess()
        }
      } else {
        result = await createTask({
          ...taskData,
          due_date: taskData.due_date ? taskData.due_date.format('YYYY-MM-DD') : undefined,
        } as CreateTaskData)
        if (result) {
          await uploadAttachments(result.id, attachments)
          if (taskData.project_id) {
            clearDraft(taskData.project_id)
          }
          onSuccess()
        }
      }
    } catch (error) {
      console.error(isEditMode ? '更新任务失败:' : '创建任务失败:', error)
    } finally {
      setLoading(false)
    }
  }, [buildTaskData, uploadAttachments, createTask, updateTask, clearDraft, clearEditDraft, setLastSavedTime, setOriginalTaskContent])

  return {
    loading,
    setLoading,
    buildTaskData,
    uploadAttachments,
    handleSubmit,
  }
}
