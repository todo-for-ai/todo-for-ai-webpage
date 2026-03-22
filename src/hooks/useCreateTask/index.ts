/**
 * useCreateTask 主入口
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Form } from 'antd'
import { useTaskStore } from '../../stores'

import { useTaskDraft, type DraftData } from './useTaskDraft'
import { useTaskAutoSave } from './useTaskAutoSave'
import { useTaskSubmit } from './useTaskSubmit'
import { useTaskLoader } from './useTaskLoader'

import { parseParticipants, formatParticipantsForForm } from './utils'

interface CreateTaskHook {
  form: ReturnType<typeof Form.useForm>[0]
  loading: boolean
  isEditMode: boolean
  editorContent: string
  setEditorContent: (content: string) => void
  taskLoaded: boolean
  originalTaskContent: string
  isAutoSaving: boolean
  lastSavedTime: string | undefined
  defaultProjectId: string | null
  handleSubmit: (attachments?: File[]) => Promise<void>
  handleSubmitAndEdit: (attachments?: File[]) => Promise<void>
  handleCancel: () => void
  handleCreateAndContinue: (attachments?: File[]) => Promise<void>
  debouncedSaveDraft: (content: string) => void
  debouncedSaveEditDraft: (content: string) => void
  debouncedAutoSave: () => void
  performAutoSave: () => Promise<void>
  clearDraft: (projectId: number) => void
  clearEditDraft: (taskId: number) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useCreateTask = (_tp: (key: string) => string): CreateTaskHook => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm()

  const [loading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editorContent, setEditorContent] = useState('')

  const defaultProjectId = searchParams.get('project_id')

  const { createTask, updateTask } = useTaskStore()

  // 草稿管理
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    saveDraft: _saveDraft,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loadDraft: _loadDraft,
    clearDraft,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    saveEditDraft: _saveEditDraft,
    loadEditDraft,
    clearEditDraft,
    debouncedSaveDraft: debouncedSaveDraftBase,
    debouncedSaveEditDraft: debouncedSaveEditDraftBase,
  } = useTaskDraft()

  // 任务加载
  const {
    taskLoaded,
    setTaskLoaded,
    originalTaskContent,
    setOriginalTaskContent,
    loadTask,
    loadCopyTaskData,
  } = useTaskLoader()

  // 自动保存
  const {
    isAutoSaving,
    lastSavedTime,
    setLastSavedTime,
    performAutoSave,
    debouncedAutoSave,
  } = useTaskAutoSave({
    isEditMode,
    taskId: id,
    form,
    editorContent,
    updateTask,
  })

  // 任务提交
  const {
    loading: submitLoading,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setLoading: _setSubmitLoading,
    handleSubmit: handleSubmitBase,
  } = useTaskSubmit(
    createTask,
    updateTask,
    clearDraft,
    clearEditDraft,
    setLastSavedTime,
    setOriginalTaskContent
  )

  // 包装提交方法
  const handleSubmit = useCallback(async (attachments: File[] = []) => {
    await handleSubmitBase({
      form,
      editorContent,
      isEditMode,
      taskId: id,
      attachments,
      onSuccess: () => {
        if (isEditMode && id) {
          navigate(`/todo-for-ai/pages/tasks/${id}`)
        }
      },
    })
  }, [form, editorContent, isEditMode, id, handleSubmitBase, navigate])

  const handleSubmitAndEdit = useCallback(async (attachments: File[] = []) => {
    await handleSubmitBase({
      form,
      editorContent,
      isEditMode,
      taskId: id,
      attachments,
      onSuccess: () => {
        if (isEditMode && id) {
          // 留在编辑模式
        } else {
          // 导航到编辑页面
          const values = form.getFieldsValue()
          if (values.project_id) {
            navigate(`/todo-for-ai/pages/tasks/${values.project_id}/edit`)
          }
        }
      },
    })
  }, [form, editorContent, isEditMode, id, handleSubmitBase, navigate])

  const handleCreateAndContinue = useCallback(async (attachments: File[] = []) => {
    await handleSubmitBase({
      form,
      editorContent,
      isEditMode: false,
      taskId: undefined,
      attachments,
      onSuccess: () => {
        const values = form.getFieldsValue()
        if (values.project_id) {
          navigate(`/todo-for-ai/pages/tasks/create?project_id=${values.project_id}&continue=true`)
        } else {
          navigate('/todo-for-ai/pages/tasks/create?continue=true')
        }
      },
    })
  }, [form, editorContent, handleSubmitBase, navigate])

  const handleCancel = useCallback(() => {
    navigate(-1)
  }, [navigate])

  // 包装草稿方法
  const debouncedSaveDraft = useCallback((content: string) => {
    debouncedSaveDraftBase(content, form)
  }, [debouncedSaveDraftBase, form])

  const debouncedSaveEditDraft = useCallback((content: string) => {
    debouncedSaveEditDraftBase(content, form, isEditMode, id)
  }, [debouncedSaveEditDraftBase, form, isEditMode, id])

  // 初始化加载
  useEffect(() => {
    if (id) {
      setIsEditMode(true)
      setTaskLoaded(false)
      void loadTask(parseInt(id, 10), form, setEditorContent, loadEditDraft)
    } else {
      // 检查是否是复制任务模式
      const isCopyMode = searchParams.get('copy') === 'true'
      if (isCopyMode) {
        loadCopyTaskData(form, setEditorContent)
      }
    }
  }, [id, searchParams, form, loadTask, loadEditDraft, loadCopyTaskData, setTaskLoaded])

  return {
    form,
    loading: loading || submitLoading,
    isEditMode,
    editorContent,
    setEditorContent,
    taskLoaded,
    originalTaskContent,
    isAutoSaving,
    lastSavedTime,
    defaultProjectId,
    handleSubmit,
    handleSubmitAndEdit,
    handleCancel,
    handleCreateAndContinue,
    debouncedSaveDraft,
    debouncedSaveEditDraft,
    debouncedAutoSave,
    performAutoSave,
    clearDraft,
    clearEditDraft,
  }
}

export { parseParticipants, formatParticipantsForForm }
