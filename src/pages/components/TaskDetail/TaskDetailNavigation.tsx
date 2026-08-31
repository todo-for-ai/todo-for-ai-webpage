/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Card, Button, Space } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

interface TaskDetailNavigationProps {
  projectTasks: any[]
  task: any
  onPrevious: () => void
  onNext: () => void
  tp: (key: string) => string
}

export const TaskDetailNavigation: React.FC<TaskDetailNavigationProps> = ({
  projectTasks,
  task,
  onPrevious,
  onNext,
  tp
}) => {
  const tasks = projectTasks || []
  const currentIndex = tasks.findIndex(t => t.id === task?.id)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < tasks.length - 1

  if (tasks.length === 0) return null

  return (
    <Card title={tp('navigation.title')} style={{ marginBottom: '16px' }}>
      <Space>
        <Button
          icon={<LeftOutlined />}
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          {tp('navigation.previous')}
        </Button>
        <span>
          {currentIndex + 1} / {tasks.length}
        </span>
        <Button
          icon={<RightOutlined />}
          onClick={onNext}
          disabled={!hasNext}
        >
          {tp('navigation.next')}
        </Button>
      </Space>
    </Card>
  )
}
