import React from 'react'
import { Alert, Card, Typography, Steps } from 'antd'

const { Title, Paragraph, Text } = Typography
import { DownloadOutlined, KeyOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { generateMcpConfig, generateMcpConfigWithArgs } from '../../../utils/mcpConfig'
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

      <Steps direction="vertical" size="small" current={-1}>
        <Steps.Step
          title={tp('installation.steps.first.title')}
          icon={<KeyOutlined />}
          description={
            <Paragraph>
              {tp('installation.steps.first.description.prefix')}{' '}
              <a href="/todo-for-ai/pages/profile?tab=tokens" target="_blank" rel="noreferrer">
                {tp('installation.steps.first.description.linkText')}
              </a>{' '}
              {tp('installation.steps.first.description.suffix')}
            </Paragraph>
          }
        />

        <Steps.Step
          title={tp('installation.steps.second.title')}
          icon={<SettingOutlined />}
          description={
            <>
              <Paragraph>{tp('installation.steps.second.description')}</Paragraph>

              <Title level={5}>{tp('installation.steps.second.claude')}</Title>
              <Paragraph type="secondary">使用环境变量方式：</Paragraph>
              <CodeBlock language="json">{generateMcpConfig()}</CodeBlock>

              <Title level={5}>{tp('installation.steps.second.cursor')}</Title>
              <Paragraph type="secondary">使用命令行参数方式：</Paragraph>
              <CodeBlock language="json">{generateMcpConfigWithArgs()}</CodeBlock>
            </>
          }
        />

        <Steps.Step
          title={tp('installation.steps.third.title')}
          icon={<CheckCircleOutlined />}
          description={
            <>
              <Paragraph>{tp('installation.steps.third.description')}</Paragraph>
              <ol>
                <li>{tp('installation.steps.third.items.restart')}</li>
                <li>{tp('installation.steps.third.items.testCommand')}</li>
                <li>{tp('installation.steps.third.items.verify')}</li>
              </ol>
            </>
          }
        />
      </Steps>
    </Card>
  )
}
