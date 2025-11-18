import React, { useEffect } from 'react'
import { Card, Typography } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import { CodeBlock } from '../components/common/CodeBlock'

const { Title, Paragraph } = Typography

const APIDocumentation: React.FC = () => {
  useEffect(() => {
    document.title = 'API文档 - Todo for AI'
    return () => { document.title = 'Todo for AI' }
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ApiOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        API 文档
      </Title>

      <Card title="概述" style={{ marginBottom: '16px' }}>
        <Paragraph>
          Todo for AI 提供完整的 RESTful API，支持任务管理、项目管理等核心功能。
        </Paragraph>
      </Card>

      <Card title="认证" style={{ marginBottom: '16px' }}>
        <Paragraph>使用 API Token 进行认证：</Paragraph>
        <CodeBlock language="bash">
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://todo4ai.org/todo-for-ai/api/v1/tasks
        </CodeBlock>
      </Card>

      <Card title="获取任务列表" style={{ marginBottom: '16px' }}>
        <Paragraph>获取项目的任务列表：</Paragraph>
        <CodeBlock language="bash">
GET /api/v1/projects/{projectId}/tasks
        </CodeBlock>
      </Card>

      <Card title="创建任务" style={{ marginBottom: '16px' }}>
        <Paragraph>创建新任务：</Paragraph>
        <CodeBlock language="bash">{`POST /api/v1/tasks
{
  "title": "任务标题",
  "content": "任务内容",
  "priority": "medium"
}`}</CodeBlock>
      </Card>
    </div>
  )
}

export default APIDocumentation
