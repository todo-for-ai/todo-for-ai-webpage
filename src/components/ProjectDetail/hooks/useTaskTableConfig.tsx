import { useCallback } from 'react'
import { Select, Tag } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import type { Task } from '../../../api/tasks'
import TaskIdBadge from '../../../components/TaskIdBadge'
import { LinkButton } from '../../../components/SmartLink'
import { TaskContentSummary } from '../../../components/TaskContentPreview'
import { useTaskOperations } from './useTaskOperations'

const { Option } = Select

export const useTaskTableConfig = () => {
  const { tp } = usePageTranslation('projectDetail')
  const { handleStatusChange, handleDelete } = useTaskOperations()

  const getTaskColumns = useCallback(() => {
    const columns = [
      {
        title: tp('tasks.table.columns.title'),
        dataIndex: 'title',
        key: 'title',
        width: 200,
        render: (text: string, record: Task) => (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <TaskIdBadge taskId={record.id} size="medium" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <LinkButton
                to={`/todo-for-ai/pages/tasks/${record.id}`}
                type="link"
                style={{ padding: 0, fontWeight: 500, height: 'auto', color: 'inherit' }}
              >
                {text}
              </LinkButton>
              {record.description && (
                <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                  {record.description.length > 50
                    ? record.description.substring(0, 50) + '...'
                    : record.description}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: tp('tasks.table.columns.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: string, record: Task) => (
          <Select
            value={status}
            size="small"
            style={{ width: 100 }}
            onChange={(newStatus) => handleStatusChange(record, newStatus as Task['status'])}
          >
            <Option value="todo">{tp('tasks.table.status.todo')}</Option>
            <Option value="in_progress">{tp('tasks.table.status.inProgress')}</Option>
            <Option value="review">{tp('tasks.table.status.review')}</Option>
            <Option value="done">{tp('tasks.table.status.done')}</Option>
            <Option value="cancelled">{tp('tasks.table.status.cancelled')}</Option>
          </Select>
        ),
      },
    ]
    return columns
  }, [tp, handleStatusChange])

  return {
    getTaskColumns
  }
}
