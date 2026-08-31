/**
 * 任务自动保存 Hook
 */

import { useState, useRef, useCallback } from 'react'
import type { FormInstance } from 'antd'
import { parseParticipants } from './utils'

interface UseTaskAutoSaveReturn {
  isAutoSaving: boolean
  lastSavedTime: string | undefined
  setLastSavedTime: (time: string | undefined) => void
  performAutoSave: () => Promise<void>
  debouncedAutoSave: () => void
}

interface UseTaskAutoSaveParams {
  isEditMode: boolean
  taskId: string | undefined
  form: FormInstance
  editorContent: string
  updateTask: (id: number, data: unknown) => Promise<unknown>
}

export const useTaskAutoSave = ({
  isEditMode,
  taskId,
  form,
  editorContent,
  updateTask,
}: UseTaskAutoSaveParams): UseTaskAutoSaveReturn => {
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<string | undefined>(undefined)
  const autoSaveTimeoutRef = useRef<number | undefined>(undefined)

  const performAutoSave = useCallback(async () => {
    if (!isEditMode || !taskId || isAutoSaving) return
    const autoSaveEnabled = localStorage.getItem('taskEdit_autoSave') === 'true'
    if (!autoSaveEnabled) return

    try {
      setIsAutoSaving(true)
      const formValues = form.getFieldsValue()
      const taskData = {
        title: formValues.title,
        content: editorContent,
        status: formValues.status,
        priority: formValues.priority,
        due_date: formValues.due_date,
        tags: formValues.tags || [],
        is_ai_task: formValues.is_ai_task,
        assignees: parseParticipants(formValues.assignees),
        mentions: parseParticipants(formValues.mentions),
        expected_revision: formValues.revision
      }
      await updateTask(parseInt(taskId, 10), taskData)
      setLastSavedTime(new Date().toISOString())
    } catch (error) {
      console.error('自动保存失败:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }, [isEditMode, taskId, isAutoSaving, form, editorContent, updateTask])

  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      void performAutoSave()
    }, 2000)
  }, [performAutoSave])

  return {
    isAutoSaving,
    lastSavedTime,
    setLastSavedTime,
    performAutoSave,
    debouncedAutoSave,
  }
}
