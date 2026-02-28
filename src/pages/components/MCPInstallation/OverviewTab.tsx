import React from 'react'
import { Card, Divider, Space, Tag, Typography } from 'antd'
import { CheckCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography

export const OverviewTab: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')

  return (
    <Card>
      <Title level={3}>{tp('overview.title')}</Title>
      <Paragraph>
        {tp('overview.description')}
      </Paragraph>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4}>
          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
          {tp('overview.supportedTools.title')}
        </Title>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Tag color="blue">get_project_tasks_by_name</Tag>
            <Text>{tp('overview.supportedTools.getProjectTasks')}</Text>
          </div>
          <div>
            <Tag color="green">submit_task_feedback</Tag>
            <Text>{tp('overview.supportedTools.submitFeedback')}</Text>
          </div>
          <div>
            <Tag color="purple">get_task_by_id</Tag>
            <Text>{tp('overview.supportedTools.getTaskById')}</Text>
          </div>
        </Space>
      </div>
      <Divider />
      <Title level={4}>
        <SettingOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
        {tp('overview.requirements.title')}
      </Title>
      <ul>
        <li>{tp('overview.requirements.node')}</li>
        <li>{tp('overview.requirements.backend')}</li>
        <li>{tp('overview.requirements.ide')}</li>
        <li>{tp('overview.requirements.network')}</li>
      </ul>
    </Card>
  )
}
