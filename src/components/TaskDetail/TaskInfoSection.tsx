import React from 'react'
import { Card, Typography, Tag, Space } from 'antd'
import type { Task } from '../../api/tasks'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Title, Paragraph } = Typography

interface TaskInfoSectionProps {
  task: Task
  onUpdate: (updates: any) => void
}

const TaskInfoSection: React.FC<TaskInfoSectionProps> = ({ task, onUpdate }) => {
  const { tp } = usePageTranslation('taskDetail')

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={3}>{task.title}</Title>

        <div>
          <strong>{tp('taskInfo.status')}: </strong>
          <Tag color={
            task.status === 'done' ? 'green' :
            task.status === 'in_progress' ? 'blue' :
            task.status === 'review' ? 'orange' :
            'default'
          }>
            {task.status}
          </Tag>
        </div>

        <div>
          <strong>{tp('taskInfo.priority')}: </strong>
          <Tag color={
            task.priority === 'urgent' ? 'red' :
            task.priority === 'high' ? 'orange' :
            task.priority === 'medium' ? 'blue' :
            'default'
          }>
            {task.priority}
          </Tag>
        </div>

        {task.content && (
          <div>
            <strong>{tp('taskContent.title')}: </strong>
            <Paragraph>{task.content}</Paragraph>
          </div>
        )}

        {task.due_date && (
          <div>
            <strong>{tp('taskInfo.dueDate')}: </strong>
            <span>{task.due_date}</span>
          </div>
        )}

        {task.estimated_hours && (
          <div>
            <strong>{tp('taskInfo.estimatedHours')}: </strong>
            <span>{tp('taskInfo.estimatedHoursValue', { hours: task.estimated_hours })}</span>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div>
            <strong>{tp('taskInfo.tags')}: </strong>
            <Space wrap>
              {task.tags.map((tag: string) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </div>
        )}
      </Space>
    </Card>
  )
}

export default TaskInfoSection
