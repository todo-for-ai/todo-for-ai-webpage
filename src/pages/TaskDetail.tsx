import React, { useEffect, useCallback, useState } from 'react'
import { App, Button, Card, List, Popconfirm, Space, Upload } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTaskDetail } from '../hooks/useTaskDetail'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { tasksApi, type TaskAttachment } from '../api/tasks'
import { TaskDetailHeader } from './components/TaskDetail/TaskDetailHeader'
import { TaskDetailContent } from './components/TaskDetail/TaskDetailContent'
import { TaskDetailNavigation } from './components/TaskDetail/TaskDetailNavigation'

const TaskDetail: React.FC = () => {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { t, tp, tc } = usePageTranslation('taskDetail')
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [attachmentLoading, setAttachmentLoading] = useState(false)
  
  const {
    task,
    loading,
    projectTasks,
    projectContext,
    contextLoading,
    customButtons,
    projects,
    handleEdit,
    handleDelete,
    handlePreviousTask,
    handleNextTask,
  } = useTaskDetail(tp)

  const handleCreateTask = useCallback(() => {
    if (task?.project_id) {
      navigate(`/todo-for-ai/pages/tasks/create?project_id=${task.project_id}`)
    } else {
      navigate('/todo-for-ai/pages/tasks/create')
    }
  }, [task, navigate])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ctrl+N or Cmd+N - 新建任务
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault()
      handleCreateTask()
    }
  }, [handleCreateTask])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const loadAttachments = useCallback(async (taskId: number) => {
    try {
      setAttachmentLoading(true)
      const items = await tasksApi.getTaskAttachments(taskId)
      setAttachments(items || [])
    } catch (error: any) {
      message.error(error?.message || 'Failed to load attachments')
      setAttachments([])
    } finally {
      setAttachmentLoading(false)
    }
  }, [message])

  useEffect(() => {
    if (task?.id) {
      loadAttachments(task.id)
    }
  }, [task?.id, loadAttachments])

  const removeAttachment = async (attachment: TaskAttachment) => {
    if (!task?.id) return
    try {
      await tasksApi.deleteTaskAttachment(task.id, attachment.id)
      message.success('Attachment removed')
      await loadAttachments(task.id)
    } catch (error: any) {
      message.error(error?.message || 'Failed to remove attachment')
    }
  }

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>{tc('status.loading')}</div>
  }

  if (!task) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>{tp('messages.taskNotFound')}</div>
  }

  return (
    <div style={{ padding: '24px', width: '80%', margin: '0 auto', minWidth: '800px', maxWidth: '1600px' }}>
      <TaskDetailHeader
        task={task}
        projects={projects}
        navigate={navigate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={() => {}}
        tp={tp}
      />

      <TaskDetailNavigation
        projectTasks={projectTasks}
        task={task}
        onPrevious={handlePreviousTask}
        onNext={handleNextTask}
        tp={tp}
      />

      <div style={{ marginBottom: 12 }}>
        <Button onClick={() => navigate(`/todo-for-ai/pages/tasks/${task.id}/logs`)}>
          {tp('actions.viewLogs') || 'View Logs'}
        </Button>
      </div>

      <TaskDetailContent
        task={task}
        customButtons={customButtons}
        handleCreateFromTask={() => {}}
        handleCreateTask={() => {}}
        handleCopyTask={() => {}}
        tp={tp}
      />

      <Card title="Attachments" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload
            multiple
            showUploadList={false}
            beforeUpload={async (file) => {
              if (!task?.id) return false
              try {
                await tasksApi.uploadTaskAttachment(task.id, file)
                message.success(`Uploaded: ${file.name}`)
                await loadAttachments(task.id)
              } catch (error: any) {
                message.error(error?.message || 'Upload failed')
              }
              return false
            }}
          >
            <Button icon={<UploadOutlined />}>Upload Attachment</Button>
          </Upload>

          <List
            loading={attachmentLoading}
            dataSource={attachments}
            locale={{ emptyText: 'No attachments' }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <a key="download" href={tasksApi.getTaskAttachmentDownloadUrl(task.id, item.id)} target="_blank" rel="noreferrer">
                    Download
                  </a>,
                  <Popconfirm
                    key="remove"
                    title="Remove this attachment?"
                    onConfirm={() => removeAttachment(item)}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />}>Remove</Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={item.original_filename}
                  description={`${item.file_size_human || item.file_size || '-'}${item.uploaded_by ? ` • ${item.uploaded_by}` : ''}`}
                />
              </List.Item>
            )}
          />
        </Space>
      </Card>
    </div>
  )
}

export default TaskDetail
