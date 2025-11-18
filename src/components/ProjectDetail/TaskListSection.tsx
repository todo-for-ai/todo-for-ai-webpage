import React from 'react'
import { Card, Table } from 'antd'
import { useProjectTasks } from '../../hooks/useProjectTasks'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { TaskFilters } from './TaskFilters'

interface TaskListSectionProps {
  projectId: string
  onTableChange: (params: any) => void
  onRefresh: () => Promise<void>
}

export const TaskListSection: React.FC<TaskListSectionProps> = ({
  projectId,
  onTableChange,
  onRefresh
}) => {
  const { tp } = usePageTranslation('projectDetail')
  const { tasks, tasksLoading, handleTaskSelection, getTaskColumns } = useProjectTasks(projectId)

  const taskColumns = getTaskColumns()

  return (
    <Card>
      <TaskFilters onRefresh={onRefresh} loading={tasksLoading} />
      <Table
        columns={taskColumns}
        dataSource={tasks}
        rowKey="id"
        loading={tasksLoading}
        size="small"
        rowSelection={handleTaskSelection}
        pagination={{ current: 1, pageSize: 20, showSizeChanger: true }}
        onChange={onTableChange}
      />
    </Card>
  )
}
