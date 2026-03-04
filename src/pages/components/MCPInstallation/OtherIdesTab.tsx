import React from 'react'
import { Card, Typography, Alert, List, Tag } from 'antd'
import {
  AppstoreOutlined,
  InfoCircleOutlined,
  CodeOutlined,
  LaptopOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { generateMcpConfigWithArgs } from '../../../utils/mcpConfig'
import CodeBlock from '../common/CodeBlock'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography

export const OtherIdesTab: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')

  const ides = [
    {
      key: 'windsurf',
      icon: <RocketOutlined style={{ color: '#ff6b6b' }} />,
    },
    {
      key: 'cline',
      icon: <CodeOutlined style={{ color: '#1890ff' }} />,
    },
    {
      key: 'continue',
      icon: <LaptopOutlined style={{ color: '#52c41a' }} />,
    },
  ]

  return (
    <Card>
      <Title level={3}>
        <AppstoreOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
        {tp('otherIdes.title')}
      </Title>
      <Paragraph>{tp('otherIdes.description')}</Paragraph>

      <Alert
        message="MCP 生态系统"
        description="MCP 是一个开放协议，越来越多的 AI 工具开始支持。以下是一些流行的 MCP 客户端："
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <List
        itemLayout="horizontal"
        dataSource={ides}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={item.icon}
              title={tp(`otherIdes.ides.${item.key}.title`)}
              description={tp(`otherIdes.ides.${item.key}.description`)}
            />
          </List.Item>
        )}
      />

      <Title level={4} style={{ marginTop: '32px' }}>
        <CodeOutlined style={{ marginRight: '8px' }} />
        {tp('otherIdes.genericConfig.title')}
      </Title>
      <Paragraph>{tp('otherIdes.genericConfig.description')}</Paragraph>
      <CodeBlock language="json">{generateMcpConfigWithArgs()}</CodeBlock>

      <Alert
        message="配置说明"
        description={
          <ul style={{ marginBottom: 0 }}>
            <li>
              <Text code>command</Text>：启动 MCP 服务器的命令
            </li>
            <li>
              <Text code>args</Text>：传递给命令的参数
            </li>
            <li>
              <Text code>--api-base-url</Text>：API 服务器地址
            </li>
            <li>
              <Text code>--api-token</Text>：您的 API Token
            </li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginTop: '16px' }}
      />
    </Card>
  )
}
