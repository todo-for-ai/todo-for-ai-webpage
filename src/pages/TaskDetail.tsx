import React, { useEffect } from 'react'
import { App } from 'antd'
import { useTaskDetail } from '../../hooks/useTaskDetail'
import { TaskDetailHeader } from './components/TaskDetail/TaskDetailHeader'
import { TaskDetailContent } from './components/TaskDetail/TaskDetailContent'
import { TaskDetailNavigation } from './components/TaskDetail/TaskDetailNavigation'

const TaskDetail: React.FC = () => {
  const { message } = App.useApp()
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
