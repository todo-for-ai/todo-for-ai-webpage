import React from 'react'
import { Card, Typography, Alert, Steps } from 'antd'
import {
  CodeOutlined,
  SettingOutlined,
  PlusCircleOutlined,
  SaveOutlined,
  MessageOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography

export const CursorTab: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')

  return (
    <Card>
      <Title level={3}>
        <CodeOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
        {tp('cursor.title')}
      </Title>
      <Paragraph>{tp('cursor.description')}</Paragraph>

      <Alert
        message="Cursor IDE"
        description="Cursor 是基于 VS Code 的 AI 代码编辑器，内置 Claude、GPT-4 等多种 AI 模型。"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Steps direction="vertical" size="small" current={-1}>
        <Steps.Step
          title={tp('cursor.steps.openSettings.title')}
          icon={<SettingOutlined />}
          description={
            <>
              <Paragraph>{tp('cursor.steps.openSettings.description')}</Paragraph>
              <ul>
                <li>
                  方式一：点击左下角 <Text code>⚙️</Text> 设置图标 → 选择 MCP
                </li>
                <li>
                  方式二：按 <Text code>Cmd/Ctrl + Shift + P</Text> 打开命令面板 → 搜索 "MCP"
                </li>
              </ul>
            </>
          }
        />

        <Steps.Step
          title={tp('cursor.steps.addServer.title')}
          icon={<PlusCircleOutlined />}
          description={
            <>
              <Paragraph>{tp('cursor.steps.addServer.description')}</Paragraph>
              <Card size="small" style={{ background: '#f6ffed', marginBottom: '16px' }}>
                <Paragraph style={{ marginBottom: '8px' }}>
                  <Text strong>{tp('cursor.steps.addServer.name')}</Text>
                </Paragraph>
                <Paragraph style={{ marginBottom: '8px' }}>
                  <Text strong>{tp('cursor.steps.addServer.type')}</Text>
                </Paragraph>
                <Paragraph style={{ marginBottom: 0 }}>
                  <Text strong>{tp('cursor.steps.addServer.command')}</Text>
                </Paragraph>
              </Card>
              <Alert
                message="替换 API Token"
                description={
                  <>
                    请将命令中的 <Text code>YOUR_API_TOKEN</Text>{' '}
                    替换为您从个人中心获取的真实 API Token。
                  </>
                }
                type="warning"
                showIcon
              />
            </>
          }
        />

        <Steps.Step
          title={tp('cursor.steps.save.title')}
          icon={<SaveOutlined />}
          description={
            <>
              <Paragraph>{tp('cursor.steps.save.description')}</Paragraph>
              <ul>
                <li>绿色状态：配置成功，MCP 服务器运行正常</li>
                <li>红色状态：配置错误，请检查命令和 Token</li>
                <li>灰色状态：正在启动或连接中</li>
              </ul>
            </>
          }
        />

        <Steps.Step
          title={tp('cursor.steps.useInChat.title')}
          icon={<MessageOutlined />}
          description={
            <>
              <Paragraph>{tp('cursor.steps.useInChat.description')}</Paragraph>
              <Alert
                message="使用提示"
                description={
                  <>
                    在 Cursor 的 AI 对话中（<Text code>Cmd/Ctrl + L</Text>），
                    您可以直接询问任务相关问题，AI 会自动调用 MCP 工具获取信息。
                  </>
                }
                type="info"
                showIcon
              />
            </>
          }
        />
      </Steps>
    </Card>
  )
}
