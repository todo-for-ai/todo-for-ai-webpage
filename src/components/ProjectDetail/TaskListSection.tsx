import React, { useState } from 'react'
import { Card, Table, Space, Button, Select, Modal, message } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useProjectTasks } from '../../hooks/useProjectTasks'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { TaskFilters } from './TaskFilters'
import { useTaskStore } from '../../stores'

const { Option } = Select

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
  const { tasks, tasksLoading, selectedTaskIds, handleTaskSelection, handleClearSelection, getTaskColumns } = useProjectTasks(projectId)
  const { batchUpdateTaskStatus, batchDeleteTasks } = useTaskStore()
  const [batchStatusValue, setBatchStatusValue] = useState<string | undefined>(undefined)

  const taskColumns = getTaskColumns()

  const handleBatchDelete = () => {
    if (selectedTaskIds.length === 0) {
      message.warning(tp('tasks.table.bulkActions.noSelectionForDelete'))
      return
    }

    Modal.confirm({
      title: tp('tasks.table.bulkActions.deleteConfirmTitle'),
      content: tp('tasks.table.bulkActions.deleteConfirmDescription', { count: selectedTaskIds.length }),
      okText: tp('tasks.table.bulkActions.confirmDelete'),
      okType: 'danger',
      cancelText: tp('tasks.confirm.delete.cancel'),
      onOk: async () => {
        try {
          await batchDeleteTasks(selectedTaskIds)
          message.success(tp('tasks.table.bulkActions.deleteSuccess', { count: selectedTaskIds.length }))
          handleClearSelection()
          await onRefresh()
        } catch (error) {
          message.error(tp('tasks.table.bulkActions.deleteError'))
        }
      }
    })
  }

  const handleBatchStatusChange = (status: string) => {
    if (selectedTaskIds.length === 0) {
      message.warning(tp('tasks.table.bulkActions.noSelectionForStatus'))
      return
    }

    Modal.confirm({
      title: tp('tasks.table.bulkActions.statusChangeConfirmTitle'),
      content: tp('tasks.table.bulkActions.statusChangeConfirmDescription', { count: selectedTaskIds.length, status: getStatusLabel(status) }),
      okText: tp('tasks.table.bulkActions.confirmStatusChange'),
      cancelText: tp('tasks.confirm.delete.cancel'),
      onOk: async () => {
        try {
          await batchUpdateTaskStatus(selectedTaskIds, status)
          message.success(tp('tasks.table.bulkActions.statusChangeSuccess', { count: selectedTaskIds.length, status: getStatusLabel(status) }))
          setBatchStatusValue(undefined)
          handleClearSelection()
          await onRefresh()
        } catch (error) {
          message.error(tp('tasks.table.bulkActions.statusChangeError'))
        }
      },
      onCancel: () => {
        setBatchStatusValue(undefined)
      }
    })
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      todo: tp('tasks.filters.status.todo'),
      in_progress: tp('tasks.filters.status.inProgress'),
      review: tp('tasks.filters.status.review'),
      done: tp('tasks.filters.status.done'),
      cancelled: tp('tasks.filters.status.cancelled')
    }
    return labels[status] || status
  }

  return (
    <Card>
      <TaskFilters onRefresh={onRefresh} loading={tasksLoading} />
      
      {selectedTaskIds.length > 0 && (
        <div style={{ marginBottom: 16, padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
          <Space>
            <span>{tp('tasks.table.bulkActions.selectedCount', { count: selectedTaskIds.length })}</span>
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
              onClick={handleBatchDelete}
            >
              {tp('tasks.table.bulkActions.delete')}
            </Button>
            <Select
              size="small"
              placeholder={tp('tasks.table.bulkActions.changeStatus')}
              style={{ width: 150 }}
              value={batchStatusValue}
              onChange={handleBatchStatusChange}
              suffixIcon={<EditOutlined />}
            >
              <Option value="todo">{tp('tasks.filters.status.todo')}</Option>
              <Option value="in_progress">{tp('tasks.filters.status.inProgress')}</Option>
              <Option value="review">{tp('tasks.filters.status.review')}</Option>
              <Option value="done">{tp('tasks.filters.status.done')}</Option>
              <Option value="cancelled">{tp('tasks.filters.status.cancelled')}</Option>
            </Select>
            <Button size="small" onClick={handleClearSelection}>
              {tp('tasks.table.bulkActions.clearSelection')}
            </Button>
          </Space>
        </div>
      )}

      <Table
        columns={taskColumns}
        dataSource={tasks}
        rowKey="id"
        loading={tasksLoading}
        size="small"
        rowSelection={handleTaskSelection()}
        pagination={{ current: 1, pageSize: 20, showSizeChanger: true }}
        onChange={onTableChange}
      />
    </Card>
  )
}
