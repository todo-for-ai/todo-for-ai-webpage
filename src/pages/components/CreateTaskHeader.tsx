import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography, Breadcrumb, Card } from 'antd'
import {
  ArrowLeftOutlined,
  HomeOutlined,
  PlusOutlined
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface CreateTaskHeaderProps {
  isEditMode: boolean
  tp: (key: string) => string
  form: any
  defaultProjectId: string | null
}

export const CreateTaskHeader: React.FC<CreateTaskHeaderProps> = ({
  isEditMode,
  tp,
  form,
  defaultProjectId
}) => {
  const navigate = useNavigate()

  return (
    <>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item>
          <HomeOutlined />
          <span
            onClick={() => navigate('/todo-for-ai/pages')}
            style={{ cursor: 'pointer', marginLeft: '8px' }}
          >
            {tp('navigation.home')}
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span
            onClick={() => {
              const projectId = form.getFieldValue('project_id') || defaultProjectId
              if (projectId) {
                navigate(`/todo-for-ai/pages/projects/${projectId}?tab=tasks`)
              } else {
                navigate('/todo-for-ai/pages/projects')
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            {tp('navigation.projectTaskList')}
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{isEditMode ? tp('title.edit') : tp('title.create')}</Breadcrumb.Item>
      </Breadcrumb>

      {/* 页面标题区域 */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* 返回按钮 */}
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              const projectId = form.getFieldValue('project_id') || defaultProjectId
              if (projectId) {
                navigate(`/todo-for-ai/pages/projects/${projectId}`)
              } else {
                navigate('/todo-for-ai/pages/tasks')
              }
            }}
            style={{
              fontSize: '16px',
              height: '40px',
              padding: '0 12px'
            }}
          >
            {tp('navigation.returnToProjectTaskList')}
          </Button>

          {/* 页面标题 */}
          <div style={{ flex: 1 }}>
            <Title level={2} style={{ margin: 0 }}>
              <PlusOutlined style={{ marginRight: '12px' }} />
              {isEditMode ? tp('title.edit') : tp('title.create')}
            </Title>
            <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
              {isEditMode ? tp('description.edit') : tp('description.create')}
              <span style={{ color: '#1890ff', marginLeft: '8px' }}>
                💡 {tp('shortcuts.save')} {isEditMode ? tp('shortcuts.saveAndStay') : tp('shortcuts.createAndEdit')}
              </span>
            </Paragraph>
          </div>
        </div>
      </Card>
    </>
  )
}
