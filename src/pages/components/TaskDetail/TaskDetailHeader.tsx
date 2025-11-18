import React from 'react'
import { Breadcrumb, Card, Button, Space, Typography, Tag } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'

const { Title } = Typography

interface TaskDetailHeaderProps {
  task: any
  projects: any[]
  navigate: any
  onEdit: () => void
  onDelete: () => void
  onRefresh: () => void
  tp: (key: string) => string
}

export const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({
  task,
  projects,
  navigate,
  onEdit,
  onDelete,
  onRefresh,
  tp
}) => {
  const project = projects.find(p => p.id === task?.project_id)

  return (
    <>
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item>
          <HomeOutlined />
          <span onClick={() => navigate('/todo-for-ai/pages')} style={{ cursor: 'pointer', marginLeft: '8px' }}>
            {tp('navigation.home')}
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span
            onClick={() => navigate(`/todo-for-ai/pages/projects/${task?.project_id}?tab=tasks`)}
            style={{ cursor: 'pointer' }}
          >
            {project?.name || tp('taskInfo.unknownProject')}
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{task?.title || tp('taskInfo.loading')}</Breadcrumb.Item>
      </Breadcrumb>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              type="default"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/todo-for-ai/pages/projects/${task?.project_id}`)}
            >
              {tp('navigation.backToProject')}
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {task?.title || tp('taskInfo.loading')}
            </Title>
            {task?.status && (
              <Tag color={task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'blue' : 'default'}>
                {tp(`status.${task.status}`)}
              </Tag>
            )}
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              {tp('actions.refresh')}
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              {tp('actions.edit')}
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
              {tp('actions.delete')}
            </Button>
          </Space>
        </div>
      </Card>
    </>
  )
}
