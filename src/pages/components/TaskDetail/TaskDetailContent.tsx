import React from 'react'
import { Card, Descriptions, Tag, Typography } from 'antd'
import TaskIdBadge from '../../../components/TaskIdBadge'
import { MarkdownEditor } from '../../../components/MarkdownEditor'
import dayjs from 'dayjs'

const { Paragraph } = Typography

interface TaskDetailContentProps {
  task: any
  customButtons: any[]
  handleCreateFromTask: () => void
  handleCreateTask: () => void
  handleCopyTask: () => void
  tp: (key: string) => string
}

export const TaskDetailContent: React.FC<TaskDetailContentProps> = ({
  task,
  customButtons,
  handleCreateFromTask,
  handleCreateTask,
  handleCopyTask,
  tp
}) => {
  if (!task) return null

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ flex: 3 }}>
        <Card title={tp('content.title')} style={{ marginBottom: '16px' }}>
          <div className="markdown-content">
            {task.content ? (
              <div dangerouslySetInnerHTML={{ __html: task.content }} />
            ) : (
              <Paragraph type="secondary">{tp('content.empty')}</Paragraph>
            )}
          </div>
        </Card>
      </div>
      
      <div style={{ flex: 2 }}>
        <Card title={tp('info.title')}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={tp('info.taskId')}>
              <span>#{task.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.project')}>
              {task.project_id}
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.status')}>
              <Tag color={task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'blue' : 'default'}>
                {tp(`status.${task.status}`)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.priority')}>
              <Tag color={task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : 'blue'}>
                {tp(`priority.${task.priority}`)}
              </Tag>
            </Descriptions.Item>
            {task.due_date && (
              <Descriptions.Item label={tp('info.dueDate')}>
                {dayjs(task.due_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={tp('info.createdAt')}>
              {dayjs(task.created_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.updatedAt')}>
              {dayjs(task.updated_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  )
}
