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
  const currentIndex = projectTasks.findIndex(t => t.id === task?.id)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < projectTasks.length - 1

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
          {currentIndex + 1} / {projectTasks.length}
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
