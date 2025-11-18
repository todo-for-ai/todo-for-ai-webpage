import React from 'react'
import { Card, Title, Paragraph, Divider, Space, Tag, Text } from 'antd'
import { CheckCircleOutlined, SettingOutlined } from '@ant-design/icons'

export const OverviewTab: React.FC = () => {
  return (
    <Card>
      <Title level={3}>MCP 功能概述</Title>
      <Paragraph>
        Todo for AI 的 MCP 服务器提供以下核心功能：
      </Paragraph>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4}>
          <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
          支持的工具
        </Title>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Tag color="blue">get_project_tasks_by_name</Tag>
            <Text>获取项目的任务列表，支持状态筛选和排序</Text>
          </div>
          <div>
            <Tag color="green">submit_task_feedback</Tag>
            <Text>为任务提交AI反馈和进度更新</Text>
          </div>
          <div>
            <Tag color="purple">get_task_by_id</Tag>
            <Text>根据ID获取任务详细信息</Text>
          </div>
        </Space>
      </div>
      <Divider />
      <Title level={4}>
        <SettingOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
        配置要求
      </Title>
      <ul>
        <li>Node.js 18+ 环境</li>
        <li>Todo for AI 后端服务运行中</li>
        <li>支持MCP协议的AI IDE（Claude Desktop、Cursor等）</li>
        <li>网络连接到Todo API服务器</li>
      </ul>
    </Card>
  )
}
