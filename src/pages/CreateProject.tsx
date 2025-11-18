import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, Input, message } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores'
import { MarkdownEditor } from '../components/MilkdownEditor'
import { CreateProjectForm } from '../components/CreateProjectForm'
import { CreateProjectHeader } from '../components/CreateProjectHeader'

const CreateProject: React.FC = () => {
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
        message.success('更新成功')
        navigate(`/todo-for-ai/pages/projects/${id}`)
      } else {
        const result = await createProject(projectData)
        if (result) {
          message.success('创建成功')
          navigate(`/todo-for-ai/pages/projects/${result.id}`)
        }
      }
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败')
    }
  }

  const handleCancel = () => {
    navigate(-1)
  }

  return (
    <div style={{ padding: '24px' }}>
      <CreateProjectHeader
        navigate={navigate}
        form={form}
        onCancel={handleCancel}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <CreateProjectForm form={form} />
          
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Form.Item>
              <Space>
                <Button onClick={handleCancel}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  保存
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
