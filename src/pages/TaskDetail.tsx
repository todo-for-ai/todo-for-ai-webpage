import React, { useEffect, useCallback } from 'react'
import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTaskDetail } from '../hooks/useTaskDetail'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { TaskDetailHeader } from './components/TaskDetail/TaskDetailHeader'
import { TaskDetailContent } from './components/TaskDetail/TaskDetailContent'
import { TaskDetailNavigation } from './components/TaskDetail/TaskDetailNavigation'

const TaskDetail: React.FC = () => {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { t, tp } = usePageTranslation('taskDetail')
  
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

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>{tp('loading')}</div>
  }

  if (!task) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>{tp('notFound')}</div>
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

      <TaskDetailContent
        task={task}
        customButtons={customButtons}
        handleCreateFromTask={() => {}}
        handleCreateTask={() => {}}
        handleCopyTask={() => {}}
        tp={tp}
      />
    </div>
  )
}

export default TaskDetail
