/**
 * 任务草稿管理 Hook
 */

import { useRef, useCallback } from 'react'
import type { FormInstance } from 'antd'
import type { Dayjs } from 'dayjs'
import { parseParticipants } from './utils'

interface DraftData {
  project_id: number
  title: string
  content: string
  status: string
  priority: string
  due_date: Dayjs | null
  tags: string[]
  is_ai_task: boolean
  assignees: ReturnType<typeof parseParticipants>
  mentions: ReturnType<typeof parseParticipants>
}

export type { DraftData }

interface UseTaskDraftReturn {
  saveDraft: (projectId: number, formData: DraftData, isEdit: boolean, taskId?: string) => void
  loadDraft: (projectId: number, isEdit: boolean, taskId?: string) => DraftData | null
  clearDraft: (projectId: number) => void
  saveEditDraft: (taskId: number, formData: DraftData) => void
  loadEditDraft: (taskId: number) => DraftData | null
  clearEditDraft: (taskId: number) => void
  debouncedSaveDraft: (content: string, form: FormInstance) => void
  debouncedSaveEditDraft: (content: string, form: FormInstance, isEditMode: boolean, taskId?: string) => void
}

const getDraftKey = (projectId: number, isEdit: boolean, taskId?: string) => {
  if (isEdit && taskId) return `task-edit-${taskId}`
  const sessionId = sessionStorage.getItem('newTaskSessionId') || Date.now().toString()
  if (!sessionStorage.getItem('newTaskSessionId')) {
    sessionStorage.setItem('newTaskSessionId', sessionId)
  }
  return `task-draft-${projectId}-${sessionId}`
}

const getEditDraftKey = (taskId: number) => `task-edit-draft-${taskId}`

export const useTaskDraft = (): UseTaskDraftReturn => {
  const saveDraftTimeoutRef = useRef<number | undefined>(undefined)
  const saveEditDraftTimeoutRef = useRef<number | undefined>(undefined)

  const saveDraft = useCallback((projectId: number, formData: DraftData, isEdit: boolean, taskId?: string) => {
    try {
      const draftKey = getDraftKey(projectId, isEdit, taskId)
      localStorage.setItem(draftKey, JSON.stringify({ ...formData, savedAt: new Date().toISOString() }))
    } catch (error) {
      console.warn('Failed to save draft:', error)
    }
  }, [])

  const loadDraft = useCallback((projectId: number, isEdit: boolean, taskId?: string): DraftData | null => {
    try {
      const draftKey = getDraftKey(projectId, isEdit, taskId)
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        const draft = JSON.parse(saved)
        const { savedAt:
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
         _savedAt, ...formData } = draft
        return formData as DraftData
      }
    } catch (error) {
      console.warn('Failed to load draft:', error)
    }
    return null
  }, [])

  const clearDraft = useCallback((projectId: number) => {
    try {
      const draftKey = getDraftKey(projectId, false)
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.warn('Failed to clear draft:', error)
    }
  }, [])

  const saveEditDraft = useCallback((taskId: number, formData: DraftData) => {
    try {
      const draftKey = getEditDraftKey(taskId)
      localStorage.setItem(draftKey, JSON.stringify({ ...formData, savedAt: new Date().toISOString() }))
    } catch (error) {
      console.warn('Failed to save edit draft:', error)
    }
  }, [])

  const loadEditDraft = useCallback((taskId: number): DraftData | null => {
    try {
      const draftKey = getEditDraftKey(taskId)
      const saved = localStorage.getItem(draftKey)
      return saved ? (JSON.parse(saved) as DraftData) : null
    } catch (error) {
      console.warn('Failed to load edit draft:', error)
    }
    return null
  }, [])

  const clearEditDraft = useCallback((taskId: number) => {
    try {
      const draftKey = getEditDraftKey(taskId)
      localStorage.removeItem(draftKey)
    } catch (error) {
      console.warn('Failed to clear edit draft:', error)
    }
  }, [])

  const debouncedSaveDraft = useCallback((content: string, form: FormInstance) => {
    if (saveDraftTimeoutRef.current) {
      clearTimeout(saveDraftTimeoutRef.current)
    }
    saveDraftTimeoutRef.current = window.setTimeout(() => {
      const currentValues = form.getFieldsValue()
      if (currentValues.project_id) {
        const projectId = parseInt(currentValues.project_id, 10)
        const draftData: DraftData = {
          project_id: projectId,
          title: currentValues.title,
          content: content,
          status: currentValues.status,
          priority: currentValues.priority,
          due_date: currentValues.due_date,
          tags: currentValues.tags,
          is_ai_task: currentValues.is_ai_task,
          assignees: parseParticipants(currentValues.assignees),
          mentions: parseParticipants(currentValues.mentions)
        }
        saveDraft(projectId, draftData, false)
      }
    }, 500)
  }, [saveDraft])

  const debouncedSaveEditDraft = useCallback((content: string, form: FormInstance, isEditMode: boolean, taskId?: string) => {
    if (!isEditMode || !taskId) return
    if (saveEditDraftTimeoutRef.current) {
      clearTimeout(saveEditDraftTimeoutRef.current)
    }
    saveEditDraftTimeoutRef.current = window.setTimeout(() => {
      const currentValues = form.getFieldsValue()
      const taskIdNum = parseInt(taskId, 10)
      const draftData: DraftData = {
        project_id: currentValues.project_id,
        title: currentValues.title,
        content: content,
        status: currentValues.status,
        priority: currentValues.priority,
        due_date: currentValues.due_date,
        tags: currentValues.tags,
        is_ai_task: currentValues.is_ai_task,
        assignees: parseParticipants(currentValues.assignees),
        mentions: parseParticipants(currentValues.mentions),
      }
      saveEditDraft(taskIdNum, draftData)
    }, 500)
  }, [saveEditDraft])

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    saveEditDraft,
    loadEditDraft,
    clearEditDraft,
    debouncedSaveDraft,
    debouncedSaveEditDraft,
  }
}
