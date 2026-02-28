import React, { useEffect } from 'react'
import { Card, Typography } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import { CodeBlock } from '../components/common/CodeBlock'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const { Title, Paragraph } = Typography

const APIDocumentation: React.FC = () => {
  const { tp } = usePageTranslation('apiDocumentation')

  useEffect(() => {
    document.title = tp('pageTitle')
    return () => { document.title = 'Todo for AI' }
  }, [tp])

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ApiOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        {tp('title')}
      </Title>

      <Card title={tp('sections.overview.title')} style={{ marginBottom: '16px' }}>
        <Paragraph>
          {tp('sections.overview.description')}
        </Paragraph>
      </Card>

      <Card title={tp('sections.auth.title')} style={{ marginBottom: '16px' }}>
        <Paragraph>{tp('sections.auth.description')}</Paragraph>
        <CodeBlock language="bash">
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://todo4ai.org/todo-for-ai/api/v1/tasks
        </CodeBlock>
      </Card>

      <Card title={tp('sections.listTasks.title')} style={{ marginBottom: '16px' }}>
        <Paragraph>{tp('sections.listTasks.description')}</Paragraph>
        <CodeBlock language="bash">{`GET /api/v1/projects/{projectId}/tasks`}</CodeBlock>
      </Card>

      <Card title={tp('sections.createTask.title')} style={{ marginBottom: '16px' }}>
        <Paragraph>{tp('sections.createTask.description')}</Paragraph>
        <CodeBlock language="bash">{`POST /api/v1/tasks
{
  "title": "${tp('sections.createTask.example.title')}",
  "content": "${tp('sections.createTask.example.content')}",
  "priority": "medium"
}`}</CodeBlock>
      </Card>
    </div>
  )
}

export default APIDocumentation
