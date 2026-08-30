import React from 'react'
import { Card, Typography, Alert, Steps } from 'antd'
import {
  DesktopOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { generateMcpConfig } from '../../../utils/mcpConfig'
import CodeBlock from '../common/CodeBlock'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography

export const ClaudeTab: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')

  return (
    <Card>
      <Title level={3}>
        <DesktopOutlined style={{ color: '#d97757', marginRight: '8px' }} />
        {tp('claude.title')}
      </Title>
      <Paragraph>{tp('claude.description')}</Paragraph>

      <Alert
        message="Claude Desktop"
        description="Claude Desktop 是 Anthropic 官方推出的桌面应用，支持 Windows 和 macOS。"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Steps direction="vertical" size="small" current={-1}>
        <Steps.Step
          title={tp('claude.steps.configLocation.title')}
          icon={<FileTextOutlined />}
          description={
            <>
              <Paragraph>{tp('claude.steps.configLocation.macos')}</Paragraph>
              <Paragraph>{tp('claude.steps.configLocation.windows')}</Paragraph>
              <Alert
                message="提示"
                description="如果目录或文件不存在，请手动创建。"
                type="warning"
                showIcon
              />
            </>
          }
        />

        <Steps.Step
          title={tp('claude.steps.editConfig.title')}
          icon={<FileTextOutlined />}
          description={
            <>
              <Paragraph>{tp('claude.steps.editConfig.description')}</Paragraph>
              <CodeBlock language="json">{generateMcpConfig()}</CodeBlock>
              <Alert
                message="重要提示"
                description={
                  <>
                    请将 <Text code>your-api-token-here</Text>{' '}
                    替换为您从个人中心获取的真实 API Token。
                  </>
                }
                type="warning"
                showIcon
                style={{ marginTop: '16px' }}
              />
            </>
          }
        />

        <Steps.Step
          title={tp('claude.steps.restart.title')}
          icon={<ReloadOutlined />}
          description={
            <>
              <Paragraph>{tp('claude.steps.restart.description')}</Paragraph>
              <Alert
                message="首次启动注意事项"
                description="首次启动时，Claude Desktop 会自动下载并安装 MCP 服务器依赖（约需 30-60 秒），请耐心等待。"
                type="info"
                showIcon
              />
            </>
          }
        />

        <Steps.Step
          title={tp('claude.steps.verify.title')}
          icon={<CheckCircleOutlined />}
          description={
            <>
              <Paragraph>{tp('claude.steps.verify.description')}</Paragraph>
              <ul>
                <li>在对话输入框下方，查找锤子图标（🔨）</li>
                <li>点击锤子图标，查看可用工具列表</li>
                <li>确认列表中包含 Todo for AI 相关工具</li>
              </ul>
            </>
          }
        />
      </Steps>
    </Card>
  )
}
