import React from 'react'
import { Card, Typography, Alert, Table, List, Tag } from 'antd'
import {
  SettingOutlined,
  SafetyOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography

export const ConfigurationTab: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')

  const columns = [
    {
      title: '参数',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '默认值',
      dataIndex: 'default',
      key: 'default',
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: '必需',
      dataIndex: 'required',
      key: 'required',
      render: (required: boolean) =>
        required ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>,
    },
  ]

  const data = [
    {
      key: '1',
      name: '--api-base-url',
      description: tp('configuration.params.apiBaseUrl.description'),
      default: 'https://api.todo-for-ai.com',
      required: false,
    },
    {
      key: '2',
      name: '--api-token',
      description: tp('configuration.params.apiToken.description'),
      default: '',
      required: true,
    },
    {
      key: '3',
      name: '--log-level',
      description: tp('configuration.params.logLevel.description'),
      default: 'info',
      required: false,
    },
  ]

  return (
    <Card>
      <Title level={3}>
        <SettingOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
        {tp('configuration.title')}
      </Title>
      <Paragraph>{tp('configuration.description')}</Paragraph>

      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        style={{ marginBottom: '24px' }}
      />

      <Title level={4}>
        <EnvironmentOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
        {tp('configuration.envVars.title')}
      </Title>
      <Paragraph>{tp('configuration.envVars.description')}</Paragraph>
      <Alert
        message="环境变量配置示例"
        description={
          <pre style={{ marginBottom: 0 }}>
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "npx",
      "args": ["-y", "@todo-for-ai/mcp@latest"],
      "env": {
        "TODO_API_BASE_URL": "https://api.todo-for-ai.com",
        "TODO_API_TOKEN": "your-api-token-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}`}
          </pre>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Title level={4}>
        <SafetyOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
        {tp('configuration.security.title')}
      </Title>
      <Alert
        message={tp('configuration.security.title')}
        description={
          <ul style={{ marginBottom: 0 }}>
            {(tp('configuration.security.tips') as unknown as string[]).map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        }
        type="warning"
        showIcon
        icon={<SafetyOutlined />}
      />
    </Card>
  )
}
