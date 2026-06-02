import { useCallback } from 'react'
import { Select, Space, Button, Popconfirm } from 'antd'
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import type { Task } from '../../../api/tasks'
import TaskIdBadge from '../../../components/TaskIdBadge'
import { LinkButton } from '../../../components/SmartLink'
import { TaskContentSummary } from '../../../components/TaskContentPreview'
import { useTaskOperations } from './useTaskOperations'
import CreatorBadge from '../../CreatorBadge'

const { Option } = Select

const getTaskTitleColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    todo: '#000000',
    in_progress: '#1890ff',
    review: '#faad14',
    done: '#52c41a',
    cancelled: '#ff4d4f',
  }
  return statusColors[status] || '#000000'
}

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
            <div style={{ flex: 1, minWidth: 0, color: getTaskTitleColor(record.status) }}>
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
        title: '创建者',
        dataIndex: 'creator_type',
        key: 'creator',
        width: 100,
        render: (creatorType: string, record: Task) => (
          <CreatorBadge
            creatorType={creatorType}
            creatorName={record.creator?.nickname || record.creator_agent?.name}
            isAiTask={record.is_ai_task}
          />
        ),
      },
      {
        title: tp('tasks.table.columns.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        sorter: true,
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
      {
        title: tp('tasks.table.columns.lastModified'),
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 160,
        sorter: true,
        render: (date: string) => {
          if (!date) return null
          const dateObj = new Date(date)
          return (
            <div style={{ fontSize: '12px' }}>
              <div>{dateObj.toLocaleDateString('zh-CN')}</div>
              <div style={{ color: '#999' }}>{dateObj.toLocaleTimeString('zh-CN', { hour12: false })}</div>
            </div>
          )
        },
      },
      {
        title: tp('tasks.table.columns.content'),
        dataIndex: 'content',
        key: 'content',
        width: 400,
        render: (content: string) => (
          <TaskContentSummary
            content={content}
            maxLength={120}
            showPreview={true}
          />
        ),
      },
      {
        title: tp('tasks.table.columns.actions'),
        key: 'action',
        width: 180,
        render: (_: unknown, record: Task) => (
          <Space size="small">
            <LinkButton
              to={`/todo-for-ai/pages/tasks/${record.id}`}
              type="text"
              icon={<EyeOutlined />}
              size="small"
            >
              {tp('tasks.table.actions.view')}
            </LinkButton>
            <LinkButton
              to={`/todo-for-ai/pages/tasks/${record.id}/edit`}
              type="text"
              icon={<EditOutlined />}
              size="small"
            >
              {tp('tasks.table.actions.edit')}
            </LinkButton>
            <Popconfirm
              title={tp('tasks.confirm.delete.title')}
              description={tp('tasks.confirm.delete.description')}
              onConfirm={() => handleDelete(record)}
              okText={tp('tasks.confirm.delete.ok')}
              cancelText={tp('tasks.confirm.delete.cancel')}
            >
              <Button type="text" icon={<DeleteOutlined />} size="small" danger>
                {tp('tasks.table.actions.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ]
    return columns
  }, [tp, handleStatusChange, handleDelete])

  return {
    getTaskColumns
  }
}
