import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, Input, message, Button, Space } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores'
import MilkdownEditor from '../components/MilkdownEditor'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const CreateProject: React.FC = () => {
  const { tp } = usePageTranslation('createProject')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm()
  const { createProject, updateProject } = useProjectStore()

  const handleSubmit = async (values: any) => {
    try {
      const projectData = {
        name: values.name,
        description: values.description,
        color: values.color || '#1890ff',
        github_repo_url: values.github_repo_url,
        website_url: values.website_url,
      }

      if (id) {
        await updateProject(parseInt(id), projectData)
        message.success(tp('messages.updateSuccess'))
        navigate(`/todo-for-ai/pages/projects/${id}`)
      } else {
        const result = await createProject(projectData)
        if (result) {
          message.success(tp('messages.createSuccess'))
          navigate(`/todo-for-ai/pages/projects/${result.id}`)
        }
      }
    } catch (error) {
      console.error('提交失败:', error)
      message.error(tp('messages.loadFailed'))
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card title={id ? tp('title.edit') : tp('title.create')}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item label={tp('form.name.label')} name="name" rules={[{ required: true, message: tp('form.name.required') }]}>
            <Input placeholder={tp('form.name.placeholder')} />
          </Form.Item>
          
          <Form.Item label={tp('form.description.label')} name="description">
            <Input.TextArea rows={4} placeholder={tp('form.description.placeholder')} />
          </Form.Item>
          
          <Form.Item label={tp('form.color.label')} name="color">
            <Input type="color" />
          </Form.Item>
          
          <Form.Item label={tp('form.githubUrl.label')} name="github_repo_url">
            <Input placeholder={tp('form.githubUrl.placeholder')} />
          </Form.Item>
          
          <Form.Item label={tp('form.productionUrl.label')} name="website_url">
            <Input placeholder={tp('form.productionUrl.placeholder')} />
          </Form.Item>
          
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Form.Item>
              <Space>
                <Button onClick={handleCancel}>
                  {tp('buttons.back')}
                </Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  {id ? tp('buttons.update') : tp('buttons.create')}
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default CreateProject
