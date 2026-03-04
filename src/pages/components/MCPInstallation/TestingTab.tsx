import React from 'react'
import { Card, Typography, Alert, List, Tag, Collapse } from 'antd'
import {
  ExperimentOutlined,
  BugOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  FileSearchOutlined,
  PlusCircleOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

export const TestingTab: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')

  const testCommands = [
    {
      icon: <FolderOutlined style={{ color: '#1890ff' }} />,
      key: 'listProjects',
    },
    {
      icon: <FileSearchOutlined style={{ color: '#52c41a' }} />,
      key: 'getProjectInfo',
    },
    {
      icon: <CheckCircleOutlined style={{ color: '#fa8c16' }} />,
      key: 'listTasks',
    },
    {
      icon: <PlusCircleOutlined style={{ color: '#722ed1' }} />,
      key: 'createTask',
    },
  ]

  const troubleshooting = [
    {
      symptom: "提示 'npx: command not found'",
      solution: '确保 Node.js 已正确安装，且 npm 全局 bin 目录在 PATH 中。',
    },
    {
      symptom: "提示 'Invalid or expired token'",
      solution: '检查 API Token 是否正确，是否已过期或被删除。前往个人中心重新创建 Token。',
    },
    {
      symptom: 'MCP 服务器启动但无响应',
      solution: '检查日志输出，使用 --log-level debug 查看详细日志。',
    },
    {
      symptom: 'Claude 中看不到工具图标',
      solution: '确保配置文件格式正确，重启 Claude Desktop，等待自动安装完成（可能需要 1-2 分钟）。',
    },
  ]

  return (
    <Card>
      <Title level={3}>
        <ExperimentOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
        {tp('testing.title')}
      </Title>
      <Paragraph>{tp('testing.description')}</Paragraph>

      <Title level={4}>
        <MessageOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
        {tp('testing.testCommands.title')}
      </Title>
      <List
        itemLayout="horizontal"
        dataSource={testCommands}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={item.icon}
              title={tp(`testing.testCommands.${item.key}`)}
              description={
                <Tag color="blue" style={{ fontFamily: 'monospace' }}>
                  {tp(`testing.testCommands.${item.key}`)}
                </Tag>
              }
            />
          </List.Item>
        )}
      />

      <Title level={4} style={{ marginTop: '32px' }}>
        <BugOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
        {tp('testing.troubleshooting.title')}
      </Title>
      <Collapse defaultActiveKey={['0']}>
        {troubleshooting.map((item, index) => (
          <Panel
            header={
              <Text>
                <Tag color="red" style={{ marginRight: '8px' }}>问题</Tag>
                {item.symptom}
              </Text>
            }
            key={index}
          >
            <Paragraph>
              <Tag color="green" style={{ marginRight: '8px' }}>解决</Tag>
              {item.solution}
            </Paragraph>
          </Panel>
        ))}
      </Collapse>

      <Title level={4} style={{ marginTop: '32px' }}>
        <CustomerServiceOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
        {tp('testing.support.title')}
      </Title>
      <Alert
        message={tp('testing.support.description')}
        description={
          <ul style={{ marginBottom: 0 }}>
            {(tp('testing.support.channels') as unknown as string[]).map((channel, index) => (
              <li key={index}>{channel}</li>
            ))}
          </ul>
        }
        type="info"
        showIcon
      />
    </Card>
  )
}
