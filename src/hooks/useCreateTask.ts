import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams, useParams, Form } from 'antd'
import dayjs from 'dayjs'
import { useTaskStore } from '../stores'
import type { CreateTaskData } from '../api/tasks'
import { generateMcpConfig } from '../utils/mcpConfig'

interface CreateTaskHook {
form: any
loading: boolean
isEditMode: boolean
editorContent: string
setEditorContent: (content: string) => void
taskLoaded: boolean
originalTaskContent: string
isAutoSaving: boolean
lastSavedTime: string | undefined
defaultProjectId: string | null
handleSubmit: () => Promise<void>
handleSubmitAndEdit: () => Promise<void>
handleCancel: () => void
handleCreateAndContinue: () => Promise<void>
debouncedSaveDraft: (content: string) => void
debouncedSaveEditDraft: (content: string) => void
debouncedAutoSave: () => void
performAutoSave: () => Promise<void>
clearDraft: (projectId: number) => void
clearEditDraft: (taskId: number) => void
}

export const useCreateTask = (tp: (key: string) => string): CreateTaskHook => {
const navigate = useNavigate()
const [searchParams] = useSearchParams()
const { id } = useParams<{ id: string }>()
const [form] = Form.useForm()

const [loading, setLoading] = useState(false)
const [isEditMode, setIsEditMode] = useState(false)
const [editorContent, setEditorContent] = useState('')
const [taskLoaded, setTaskLoaded] = useState(false)
const [originalTaskContent, setOriginalTaskContent] = useState('')
const [isAutoSaving, setIsAutoSaving] = useState(false)
const [lastSavedTime, setLastSavedTime] = useState<string>()

const saveDraftTimeoutRef = useRef<number | undefined>(undefined)
const saveEditDraftTimeoutRef = useRef<number | undefined>(undefined)
const autoSaveTimeoutRef = useRef<number | undefined>(undefined)

const { createTask, updateTask, getTask } = useTaskStore()
const defaultProjectId = searchParams.get('project_id')

const getDraftKey = (projectId: number, isEdit: boolean, taskId?: string) => {
if (isEdit && taskId) return `task-edit-${taskId}`
const sessionId = sessionStorage.getItem('newTaskSessionId') || Date.now().toString()
if (!sessionStorage.getItem('newTaskSessionId')) {
sessionStorage.setItem('newTaskSessionId', sessionId)
}
return `task-draft-${projectId}-${sessionId}`
}

const getEditDraftKey = (taskId: number) => `task-edit-draft-${taskId}`

const saveDraft = (projectId: number, formData: any, isEdit: boolean, taskId?: string) => {
try {
const draftKey = getDraftKey(projectId, isEdit, taskId)
localStorage.setItem(draftKey, JSON.stringify({ ...formData, savedAt: new Date().toISOString() }))
} catch (error) {
console.warn('Failed to save draft:', error)
}
}

const loadDraft = (projectId: number, isEdit: boolean, taskId?: string) => {
try {
const draftKey = getDraftKey(projectId, isEdit, taskId)
const saved = localStorage.getItem(draftKey)
if (saved) {
const draft = JSON.parse(saved)
const { savedAt, ...formData } = draft
return formData
}
} catch (error) {
console.warn('Failed to load draft:', error)
}
return null
}

const clearDraft = (projectId: number) => {
try {
const draftKey = getDraftKey(projectId, false)
localStorage.removeItem(draftKey)
} catch (error) {
console.warn('Failed to clear draft:', error)
}
}

const saveEditDraft = (taskId: number, formData: any) => {
try {
const draftKey = getEditDraftKey(taskId)
localStorage.setItem(draftKey, JSON.stringify({ ...formData, savedAt: new Date().toISOString() }))
} catch (error) {
console.warn('Failed to save edit draft:', error)
}
}

const loadEditDraft = (taskId: number) => {
try {
const draftKey = getEditDraftKey(taskId)
const saved = localStorage.getItem(draftKey)
return saved ? JSON.parse(saved) : null
} catch (error) {
console.warn('Failed to load edit draft:', error)
}
return null
}

const clearEditDraft = (taskId: number) => {
try {
const draftKey = getEditDraftKey(taskId)
localStorage.removeItem(draftKey)
} catch (error) {
console.warn('Failed to clear edit draft:', error)
}
}

const debouncedSaveDraft = useCallback((content: string) => {
if (saveDraftTimeoutRef.current) {
clearTimeout(saveDraftTimeoutRef.current)
}
saveDraftTimeoutRef.current = window.setTimeout(() => {
const currentValues = form.getFieldsValue()
if (currentValues.project_id) {
const projectId = parseInt(currentValues.project_id, 10)
const draftData = {
title: currentValues.title,
content: content,
status: currentValues.status,
priority: currentValues.priority,
due_date: currentValues.due_date,
tags: currentValues.tags,
is_ai_task: currentValues.is_ai_task
}
saveDraft(projectId, draftData, false)
}
}, 500)
}, [form])

const debouncedSaveEditDraft = useCallback((content: string) => {
if (!isEditMode || !id) return
if (saveEditDraftTimeoutRef.current) {
clearTimeout(saveEditDraftTimeoutRef.current)
}
saveEditDraftTimeoutRef.current = window.setTimeout(() => {
const currentValues = form.getFieldsValue()
const taskId = parseInt(id, 10)
const draftData = {
title: currentValues.title,
content: content,
status: currentValues.status,
priority: currentValues.priority,
due_date: currentValues.due_date,
tags: currentValues.tags,
is_ai_task: currentValues.is_ai_task,
}
saveEditDraft(taskId, draftData)
}, 500)
}, [isEditMode, id, form])

const performAutoSave = useCallback(async () => {
if (!isEditMode || !id || isAutoSaving) return
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
is_ai_task: formValues.is_ai_task
}
await updateTask(parseInt(id), taskData)
setLastSavedTime(new Date().toISOString())
setOriginalTaskContent(editorContent)
} catch (error) {
console.error('自动保存失败:', error)
} finally {
setIsAutoSaving(false)
}
}, [isEditMode, id, isAutoSaving, form, editorContent, updateTask])

const debouncedAutoSave = useCallback(() => {
if (autoSaveTimeoutRef.current) {
clearTimeout(autoSaveTimeoutRef.current)
}
autoSaveTimeoutRef.current = window.setTimeout(() => {
performAutoSave()
}, 2000)
}, [performAutoSave])

const loadTask = async (taskId: number) => {
try {
setLoading(true)
const task = await getTask(taskId)
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
id: task.id
}
form.setFieldsValue(formData)
setOriginalTaskContent(task.content || '')
setLastSavedTime(task.updated_at || task.created_at)
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
} finally {
setLoading(false)
}
}

const handleSubmit = async () => {
try {
setLoading(true)
const values = await form.validateFields()
const taskData = {
project_id: values.project_id,
title: values.title?.trim() || undefined,
content: values.content?.trim() || undefined,
status: values.status || 'todo',
priority: values.priority || 'medium',
due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : undefined,
tags: values.tags || [],
is_ai_task: values.is_ai_task || false,
}
let result
if (isEditMode && id) {
result = await updateTask(parseInt(id, 10), taskData)
if (result) {
clearEditDraft(parseInt(id, 10))
setLastSavedTime(new Date().toISOString())
setOriginalTaskContent(editorContent)
navigate(`/todo-for-ai/pages/tasks/${id}`)
}
} else {
result = await createTask(taskData as CreateTaskData)
if (result) {
if (taskData.project_id) {
clearDraft(taskData.project_id)
}
navigate(`/todo-for-ai/pages/tasks/${result.id}`)
}
}
} catch (error) {
console.error(isEditMode ? '更新任务失败:' : '创建任务失败:', error)
} finally {
setLoading(false)
}
}

const handleSubmitAndEdit = async () => {
try {
setLoading(true)
const values = await form.validateFields()
const taskData = {
project_id: values.project_id,
title: values.title?.trim() || undefined,
content: values.content?.trim() || undefined,
status: values.status || 'todo',
priority: values.priority || 'medium',
due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : undefined,
tags: values.tags || [],
is_ai_task: values.is_ai_task || false,
}
let result
if (isEditMode && id) {
result = await updateTask(parseInt(id, 10), taskData)
if (result) {
clearEditDraft(parseInt(id, 10))
setOriginalTaskContent(taskData.content || '')
}
} else {
result = await createTask(taskData as CreateTaskData)
if (result) {
if (taskData.project_id) {
clearDraft(taskData.project_id)
}
navigate(`/todo-for-ai/pages/tasks/${result.id}/edit`)
}
}
} catch (error) {
console.error(isEditMode ? '保存任务失败:' : '创建任务失败:', error)
} finally {
setLoading(false)
}
}

const handleCancel = () => {
navigate(-1)
}

const handleCreateAndContinue = async () => {
try {
setLoading(true)
const values = await form.validateFields()
const taskData = {
project_id: values.project_id,
title: values.title?.trim() || undefined,
content: values.content?.trim() || undefined,
status: values.status || 'todo',
priority: values.priority || 'medium',
due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : undefined,
tags: values.tags || [],
is_ai_task: values.is_ai_task || false,
}
const result = await createTask(taskData as CreateTaskData)
if (result) {
if (taskData.project_id) {
clearDraft(taskData.project_id)
}
if (taskData.project_id) {
navigate(`/todo-for-ai/pages/tasks/create?project_id=${taskData.project_id}&continue=true`)
} else {
navigate('/todo-for-ai/pages/tasks/create?continue=true')
}
}
} catch (error) {
console.error('创建任务失败:', error)
} finally {
setLoading(false)
}
}

useEffect(() => {
if (id) {
setIsEditMode(true)
setTaskLoaded(false)
loadTask(parseInt(id, 10))
}
}, [id])

return {
form,
loading,
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
