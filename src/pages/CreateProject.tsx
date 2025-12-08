import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, Input, message, Button, Space } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { useProjectStore } from '../stores'
import MilkdownEditor from '../components/MilkdownEditor'

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
      <Card title={id ? '编辑项目' : '创建项目'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          
          <Form.Item label="项目描述" name="description">
            <Input.TextArea rows={4} placeholder="请输入项目描述" />
          </Form.Item>
          
          <Form.Item label="颜色" name="color">
            <Input type="color" />
          </Form.Item>
          
          <Form.Item label="GitHub 仓库" name="github_repo_url">
            <Input placeholder="https://github.com/..." />
          </Form.Item>
          
          <Form.Item label="网站地址" name="website_url">
            <Input placeholder="https://..." />
          </Form.Item>
          
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
