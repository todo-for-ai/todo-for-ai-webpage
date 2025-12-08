import React from 'react'
import { Card, Typography, Tag, Space } from 'antd'
import type { Task } from '../../api/tasks'

const { Title, Paragraph } = Typography

interface TaskInfoSectionProps {
  task: Task
  onUpdate: (updates: any) => void
}

const TaskInfoSection: React.FC<TaskInfoSectionProps> = ({ task, onUpdate }) => {
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={3}>{task.title}</Title>

        <div>
          <strong>状态: </strong>
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
          <strong>优先级: </strong>
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
            <strong>描述: </strong>
            <Paragraph>{task.content}</Paragraph>
          </div>
        )}

        {task.due_date && (
          <div>
            <strong>截止日期: </strong>
            <span>{task.due_date}</span>
          </div>
        )}

        {task.estimated_hours && (
          <div>
            <strong>预计工时: </strong>
            <span>{task.estimated_hours} 小时</span>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div>
            <strong>标签: </strong>
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
