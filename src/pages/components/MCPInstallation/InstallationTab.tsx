import React from 'react'
import { Alert, Card, Typography } from 'antd'

const { Title, Paragraph, Text } = Typography
import { DownloadOutlined, KeyOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { generateMcpConfig } from '../../../utils/mcpConfig'
import CodeBlock from '../common/CodeBlock'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

export const InstallationTab: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')

  return (
    <Card>
      <Title level={3}>
        <DownloadOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
        {tp('installation.title')}
      </Title>
      <Alert
        message={tp('installation.alert.message')}
        description={tp('installation.alert.description')}
        type="success"
        style={{ marginBottom: '24px' }}
        showIcon
      />
      
      <Title level={4}>
        <KeyOutlined style={{ marginRight: '8px' }} />
        {tp('installation.steps.first.title')}
      </Title>
      <Paragraph>
        {tp('installation.steps.first.description.prefix')}
        {' '}
        <a href="/todo-for-ai/pages/profile?tab=tokens" target="_blank" rel="noreferrer">
          {tp('installation.steps.first.description.linkText')}
        </a>
        {' '}
        {tp('installation.steps.first.description.suffix')}
      </Paragraph>
      
      <Title level={4}>
        <SettingOutlined style={{ marginRight: '8px' }} />
        {tp('installation.steps.second.title')}
      </Title>
      <Paragraph>{tp('installation.steps.second.description')}</Paragraph>
      
      <Title level={5}>{tp('installation.steps.second.claude')}</Title>
      <CodeBlock language="json">
{generateMcpConfig()}
      </CodeBlock>
      
      <Title level={5}>{tp('installation.steps.second.cursor')}</Title>
      <CodeBlock language="json">
{generateMcpConfig()}
      </CodeBlock>
      
      <Title level={4}>
        <CheckCircleOutlined style={{ marginRight: '8px' }} />
        {tp('installation.steps.third.title')}
      </Title>
      <Paragraph>{tp('installation.steps.third.description')}</Paragraph>
      <ol>
        <li>{tp('installation.steps.third.items.restart')}</li>
        <li>{tp('installation.steps.third.items.command')}</li>
        <li>{tp('installation.steps.third.items.verify')}</li>
      </ol>
    </Card>
  )
}
