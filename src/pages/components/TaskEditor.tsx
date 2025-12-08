import React from 'react'
import { Form, Card, Space, Button } from 'antd'
import {
EyeOutlined,
FileAddOutlined,
CopyOutlined,
SaveOutlined,
PlusOutlined
} from '@ant-design/icons'
import MilkdownEditor from '../../components/MilkdownEditor'
import { useNavigate } from 'react-router-dom'
import type { CreateTaskData } from '../../api/tasks'

interface TaskEditorProps {
isEditMode: boolean
loading: boolean
taskLoaded: boolean
editorContent: string
setEditorContent: (content: string) => void
form: any
tp: (key: string) => string
debouncedSaveDraft: (content: string) => void
debouncedSaveEditDraft: (content: string) => void
debouncedAutoSave: () => void
performAutoSave: () => void
createTask: (data: CreateTaskData) => Promise<any>
updateTask: (id: number, data: any) => Promise<any>
loadTask: (id: number) => Promise<void>
clearDraft: (projectId: number) => void
clearEditDraft: (taskId: number) => void
defaultProjectId: string | null
}

export const TaskEditor: React.FC<TaskEditorProps> = ({
isEditMode,
loading,
taskLoaded,
editorContent,
setEditorContent,
form,
tp,
debouncedSaveDraft,
debouncedSaveEditDraft,
debouncedAutoSave,
performAutoSave,
createTask,
updateTask,
loadTask,
clearDraft,
clearEditDraft,
defaultProjectId
}) => {
const navigate = useNavigate()

const handleViewTaskDetail = () => {
const taskId = form.getFieldValue('id')
if (taskId) {
navigate(`/todo-for-ai/pages/tasks/${taskId}`)
}
}

const handleCreateNewTask = () => {
const currentProjectId = form.getFieldValue('project_id')
form.resetFields()
setEditorContent('')

form.setFieldsValue({
status: 'todo',
priority: 'medium',
is_ai_task: true,
project_id: currentProjectId || undefined
})

if (currentProjectId) {
navigate(`/todo-for-ai/pages/tasks/create?project_id=${currentProjectId}`)
} else {
navigate('/todo-for-ai/pages/tasks/create')
}
}

const handleCopyTask = () => {
const currentValues = form.getFieldsValue()
const currentProjectId = currentValues.project_id

const copyData = {
project_id: currentProjectId,
title: `${currentValues.title || ''} - 副本`,
content: editorContent || currentValues.content || '',
priority: currentValues.priority || 'medium',
due_date: currentValues.due_date,
tags: currentValues.tags || [],
is_ai_task: currentValues.is_ai_task !== undefined ? currentValues.is_ai_task : true
}

sessionStorage.setItem('copyTaskData', JSON.stringify(copyData))
navigate(`/todo-for-ai/pages/tasks/create?project_id=${currentProjectId}&copy=true`)
}

const handleSubmit = async () => {
try {
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

if (isEditMode && values.id) {
await updateTask(values.id, taskData)
clearEditDraft(values.id)
navigate(`/todo-for-ai/pages/tasks/${values.id}`)
} else {
const result = await createTask(taskData as CreateTaskData)
if (result) {
clearDraft(taskData.project_id)
navigate(`/todo-for-ai/pages/tasks/${result.id}`)
}
}
} catch (error) {
console.error('提交失败:', error)
}
}

const handleSubmitAndEdit = async () => {
try {
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

if (isEditMode && values.id) {
await updateTask(values.id, taskData)
clearEditDraft(values.id)
} else {
const result = await createTask(taskData as CreateTaskData)
if (result) {
clearDraft(taskData.project_id)
navigate(`/todo-for-ai/pages/tasks/${result.id}/edit`)
}
}
} catch (error) {
console.error('提交失败:', error)
}
}

return (
<Card
title={
<div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
📝 {tp('form.content.title')}
</div>
}
style={{ marginBottom: '16px' }}
>
{}
<div style={{
marginBottom: '16px',
padding: '12px 16px',
backgroundColor: '#fafafa',
borderRadius: '6px',
border: '1px solid #f0f0f0'
}}>
<Space wrap>
{isEditMode && (
<>
<Button
icon={<EyeOutlined />}
onClick={handleViewTaskDetail}
type="default"
style={{
backgroundColor: '#e6f7ff',
borderColor: '#91d5ff',
color: '#1890ff'
}}
>
{tp('actions.editMode.taskDetail')}
</Button>
<Button
icon={<FileAddOutlined />}
onClick={handleCreateNewTask}
type="default"
style={{
backgroundColor: '#f6ffed',
borderColor: '#b7eb8f',
color: '#52c41a'
}}
>
{tp('actions.editMode.newTask')}
</Button>
<Button
icon={<CopyOutlined />}
onClick={handleCopyTask}
type="default"
style={{
backgroundColor: '#fff7e6',
borderColor: '#ffd591',
color: '#fa8c16'
}}
>
{tp('actions.editMode.copyTask')}
</Button>
</>
)}

{!isEditMode && (
<>
<Button
type="primary"
icon={<SaveOutlined />}
loading={loading}
onClick={handleSubmit}
style={{
backgroundColor: '#52c41a',
borderColor: '#52c41a',
fontWeight: 'bold'
}}
>
{tp('actions.createMode.create')}
</Button>

<Button
type="primary"
icon={<SaveOutlined />}
loading={loading}
onClick={handleSubmitAndEdit}
style={{
backgroundColor: '#1890ff',
borderColor: '#1890ff',
fontWeight: 'bold'
}}
>
{tp('actions.createMode.createAndEdit')}
</Button>

<Button
type="primary"
icon={<PlusOutlined />}
loading={loading}
onClick={async () => {
try {
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
clearDraft(taskData.project_id)
if (taskData.project_id) {
navigate(`/todo-for-ai/pages/tasks/create?project_id=${taskData.project_id}&continue=true`)
} else {
navigate('/todo-for-ai/pages/tasks/create?continue=true')
}
}
} catch (error) {
console.error('创建任务失败:', error)
}
}}
style={{
backgroundColor: '#fa8c16',
borderColor: '#fa8c16',
fontWeight: 'bold'
}}
>
{tp('actions.createMode.createAndContinue')}
</Button>

<Button
type="primary"
icon={<PlusOutlined />}
onClick={() => {
const projectId = form.getFieldValue('project_id') || defaultProjectId
if (projectId) {
clearDraft(parseInt(projectId, 10))
}
sessionStorage.removeItem('newTaskSessionId')
form.resetFields()
setEditorContent('')
form.setFieldsValue({
status: 'todo',
priority: 'medium',
is_ai_task: true,
project_id: defaultProjectId ? parseInt(defaultProjectId, 10) : undefined
})
}}
style={{
backgroundColor: '#ff4d4f',
borderColor: '#ff4d4f',
fontWeight: 'bold'
}}
>
{tp('actions.createMode.restart')}
</Button>
</>
)}

{isEditMode && (
<Button
type="primary"
icon={<SaveOutlined />}
loading={loading}
onClick={handleSubmitAndEdit}
style={{
backgroundColor: '#1890ff',
borderColor: '#1890ff',
fontWeight: 'bold'
}}
>
{tp('actions.editMode.save')}
</Button>
)}
</Space>
</div>

<Form.Item
name="content"
tooltip={tp('form.content.tooltip')}
rules={[{ required: true, message: tp('form.content.required') }]}
>
{(!isEditMode || taskLoaded) ? (
<MilkdownEditor
value={editorContent}
onChange={(value) => {
const newValue = value || ''
const normalizedNewValue = newValue.replace(/\r\n/g, '\n').trim()
const normalizedCurrentValue = (editorContent || '').replace(/\r\n/g, '\n').trim()

if (normalizedNewValue !== normalizedCurrentValue) {
React.startTransition(() => {
setEditorContent(newValue)
form.setFieldValue('content', newValue)
})

if (!isEditMode) {
debouncedSaveDraft(newValue)
} else {
debouncedSaveEditDraft(newValue)
debouncedAutoSave()
}
}
}}
onSave={handleSubmitAndEdit}
autoHeight={true}
minHeight={300}
hideToolbar={false}
/>
) : (
<div style={{
minHeight: 300,
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
background: '#fafafa',
border: '1px solid #d9d9d9',
borderRadius: '6px'
}}>
{tp('form.content.loading')}
</div>
)}
</Form.Item>
</Card>
)
}
