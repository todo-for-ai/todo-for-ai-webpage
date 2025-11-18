import React from 'react'
import { Card, Title, Paragraph, Alert } from 'antd'
import { DownloadOutlined, KeyOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { generateMcpConfig } from '../../../utils/mcpConfig'
import { getMcpServerUrl, getApiBaseUrl } from '../../../utils/apiConfig'
import CodeBlock from '../common/CodeBlock'

export const InstallationTab: React.FC = () => {
  return (
    <Card>
      <Title level={3}>
        <DownloadOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
        MCP 配置安装指南
      </Title>
      <Alert
        message="简单配置"
        description="Todo for AI 的 MCP 集成无需安装额外软件，只需要复制 JSON 配置到您的 AI 客户端即可！"
        type="success"
        style={{ marginBottom: '24px' }}
        showIcon
      />
      
      <Title level={4}>
        <KeyOutlined style={{ marginRight: '8px' }} />
        第一步：获取 API Token
      </Title>
      <Paragraph>
        前往 <a href="/todo-for-ai/pages/profile?tab=tokens" target="_blank">个人中心 → API Token</a> 创建您的专属 Token
      </Paragraph>
      
      <Title level={4}>
        <SettingOutlined style={{ marginRight: '8px' }} />
        第二步：获取 MCP 配置
      </Title>
      <Paragraph>根据您使用的 AI 客户端，复制对应的 MCP JSON 配置：</Paragraph>
      
      <Title level={5}>📋 Claude Desktop 配置</Title>
      <CodeBlock language="json">
{generateMcpConfig()}
      </CodeBlock>
      
      <Title level={5}>🎯 Cursor IDE 配置</Title>
      <CodeBlock language="json">
{generateMcpConfig()}
      </CodeBlock>
      
      <Title level={4}>
        <CheckCircleOutlined style={{ marginRight: '8px' }} />
        第三步：验证 MCP 配置
      </Title>
      <Paragraph>通过以下步骤验证 MCP 配置是否成功：</Paragraph>
      <ol>
        <li>重启您的 AI 客户端应用</li>
        <li>在对话中输入测试命令</li>
        <li>检查是否能正常获取任务信息</li>
      </ol>
    </Card>
  )
}
