import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, Input, message, Button, Space, Select } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { organizationsApi, type Organization } from '../api/organizations'
import { projectsApi } from '../api/projects'

const CreateProject: React.FC = () => {
  const { tp } = usePageTranslation('createProject')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const { createProject, updateProject } = useProjectStore()

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const orgData = await organizationsApi.getOrganizations({ page: 1, per_page: 200 })
        setOrganizations(orgData.items || [])
      } catch (error) {
        console.warn('Failed to load organizations:', error)
      }

      if (!id) {
        return
      }
      try {
        setLoading(true)
        const project = await projectsApi.getProject(parseInt(id, 10))
        form.setFieldsValue({
          name: project.name,
          description: project.description,
          color: project.color,
          github_url: project.github_url,
          local_url: project.local_url,
          production_url: project.production_url,
          project_context: project.project_context,
          organization_id: project.organization_id ?? undefined,
        })
      } catch (error) {
        message.error(tp('messages.loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [id, form, tp])

  const handleSubmit = async (values: any) => {
    try {
      const projectData = {
        name: values.name,
        description: values.description,
        color: values.color || '#1890ff',
        github_url: values.github_url,
        local_url: values.local_url,
        production_url: values.production_url,
        project_context: values.project_context,
        organization_id: values.organization_id || null,
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
          disabled={loading}
        >
          <Form.Item label={tp('form.name.label')} name="name" rules={[{ required: true, message: tp('form.name.required') }]}>
            <Input placeholder={tp('form.name.placeholder')} />
          </Form.Item>
          
          <Form.Item label={tp('form.organization.label')} name="organization_id">
            <Select
              allowClear
              placeholder={tp('form.organization.placeholder')}
              options={organizations.map((item) => ({
                label: item.name,
                value: item.id
              }))}
            />
          </Form.Item>

          <Form.Item label={tp('form.description.label')} name="description">
            <Input.TextArea rows={4} placeholder={tp('form.description.placeholder')} />
          </Form.Item>
          
          <Form.Item label={tp('form.color.label')} name="color">
            <Input type="color" />
          </Form.Item>
          
          <Form.Item label={tp('form.githubUrl.label')} name="github_url">
            <Input placeholder={tp('form.githubUrl.placeholder')} />
          </Form.Item>

          <Form.Item label={tp('form.localUrl.label')} name="local_url">
            <Input placeholder={tp('form.localUrl.placeholder')} />
          </Form.Item>

          <Form.Item label={tp('form.productionUrl.label')} name="production_url">
            <Input placeholder={tp('form.productionUrl.placeholder')} />
          </Form.Item>

          <Form.Item label={tp('form.projectContext.label')} name="project_context">
            <Input.TextArea rows={6} placeholder={tp('form.projectContext.placeholder')} />
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
