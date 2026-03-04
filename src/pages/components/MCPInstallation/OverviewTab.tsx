import React from 'react'
import { Card, Divider, List, Space, Tag, Typography } from 'antd'
import { CheckCircleOutlined, QuestionCircleOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography

export const OverviewTab: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')

  const tools = [
    { name: 'get_project_tasks_by_name', color: 'blue', key: 'getProjectTasks' },
    { name: 'get_task_by_id', color: 'purple', key: 'getTaskById' },
    { name: 'create_task', color: 'green', key: 'createTask' },
    { name: 'submit_task_feedback', color: 'orange', key: 'submitFeedback' },
    { name: 'get_project_info', color: 'cyan', key: 'getProjectInfo' },
    { name: 'list_user_projects', color: 'magenta', key: 'listUserProjects' },
  ]

  return (
    <Card>
      <Title level={3}>{tp('overview.title')}</Title>
      <Paragraph>{tp('overview.description')}</Paragraph>

      <Divider />

      <Title level={4}>
        <QuestionCircleOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
        {tp('overview.whatIsMcp.title')}
      </Title>
      <Paragraph>{tp('overview.whatIsMcp.description')}</Paragraph>
      <ul>
        {(tp('overview.whatIsMcp.features') as unknown as string[]).map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>

      <Divider />

      <Title level={4}>
        <ToolOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
        {tp('overview.supportedTools.title')}
      </Title>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {tools.map((tool) => (
          <div key={tool.name}>
            <Tag color={tool.color}>{tool.name}</Tag>
            <Text>{tp(`overview.supportedTools.${tool.key}`)}</Text>
          </div>
        ))}
      </Space>

      <Divider />

      <Title level={4}>
        <SettingOutlined style={{ color: '#fa8c16', marginRight: '8px' }} />
        {tp('overview.requirements.title')}
      </Title>
      <ul>
        <li>{tp('overview.requirements.node')}</li>
        <li>{tp('overview.requirements.backend')}</li>
        <li>{tp('overview.requirements.ide')}</li>
        <li>{tp('overview.requirements.token')}</li>
      </ul>
    </Card>
  )
}
