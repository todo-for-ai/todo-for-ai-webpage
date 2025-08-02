import React, { useEffect, useState } from 'react'
import { Card, Tabs, Typography, Alert, Divider, Space, Tag, Button, message } from 'antd'
import {
  ApiOutlined,
  DownloadOutlined,
  SettingOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  CopyOutlined
} from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useSearchParams } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

const MCPInstallation: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  // 定义所有有效的标签页key
  const validTabs = ['overview', 'api-token', 'installation', 'claude', 'cursor', 'other-ides', 'configuration', 'testing']

  // 获取初始标签页，确保是有效的
  const getInitialTab = () => {
    const tabParam = searchParams.get('tab')
    return validTabs.includes(tabParam || '') ? tabParam! : 'overview'
  }

  const [activeTab, setActiveTab] = useState(getInitialTab())

  // 设置网页标题
  useEffect(() => {
    document.title = 'MCP安装文档 - Todo for AI'

    // 组件卸载时恢复默认标题
    return () => {
      document.title = 'Todo for AI'
    }
  }, [])

  // 监听URL参数变化，同步标签页状态
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    } else if (!tabParam && activeTab !== 'overview') {
      // 如果URL中没有tab参数，默认显示overview
      setActiveTab('overview')
    }
  }, [searchParams, activeTab, validTabs])

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    // 更新URL参数以保持标签页状态
    const newSearchParams = new URLSearchParams(searchParams)
    if (key === 'overview') {
      // overview是默认标签页，不需要在URL中显示
      newSearchParams.delete('tab')
    } else {
      newSearchParams.set('tab', key)
    }
    setSearchParams(newSearchParams, { replace: true })
  }

  // 复制到剪贴板功能
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  // CodeBlock组件
  const CodeBlock = ({
    children,
    copyable = true,
    language = 'bash'
  }: {
    children: string,
    copyable?: boolean,
    language?: string
  }) => (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      <SyntaxHighlighter
        language={language}
        style={tomorrow}
        customStyle={{
          backgroundColor: '#f6f8fa',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '13px',
          lineHeight: '1.45',
          margin: 0
        }}
        showLineNumbers={false}
        wrapLines={true}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
      {copyable && (
        <Button
          type="text"
          icon={<CopyOutlined />}
          size="small"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            opacity: 0.7,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}
          onClick={() => copyToClipboard(children)}
        />
      )}
    </div>
  )

  const codeStyle = {
    backgroundColor: '#f6f8fa',
    padding: '12px',
    borderRadius: '6px',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: '13px',
    lineHeight: '1.45',
    overflow: 'auto'
  }

  const configStyle = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e1e4e8',
    borderRadius: '6px',
    padding: '16px',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: '13px',
    lineHeight: '1.45',
    whiteSpace: 'pre-wrap' as const,
    overflow: 'auto'
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <ApiOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          MCP 安装文档
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          Model Context Protocol (MCP) 是一个标准化协议，允许AI助手与外部系统进行交互。
          本文档详细介绍如何在不同的AI IDE中安装和配置Todo for AI的MCP服务器。
        </Paragraph>
      </div>

      <Alert
        message="重要提示"
        description="在配置MCP之前，请确保Todo for AI后端服务正在运行，默认地址为 http://localhost:50110"
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
        showIcon
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        size="large"
      >
        <TabPane 
          tab={
            <span>
              <InfoCircleOutlined />
              概述
            </span>
          } 
          key="overview"
        >
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
                  <Text>根据项目名称获取待办任务列表，支持状态筛选</Text>
                </div>
                <div>
                  <Tag color="green">get_task_by_id</Tag>
                  <Text>获取特定任务的详细信息，包括项目上下文规则</Text>
                </div>
                <div>
                  <Tag color="orange">submit_task_feedback</Tag>
                  <Text>提交任务反馈并更新任务状态，支持多种状态转换</Text>
                </div>
                <div>
                  <Tag color="purple">create_task</Tag>
                  <Text>在指定项目中创建新任务，支持优先级和标签设置</Text>
                </div>
                <div>
                  <Tag color="cyan">get_project_info</Tag>
                  <Text>获取项目详细信息，包括统计数据和配置</Text>
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
        </TabPane>

        <TabPane
          tab={
            <span>
              <KeyOutlined />
              API Token
            </span>
          }
          key="api-token"
        >
          <Card>
            <Title level={3}>
              <KeyOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
              API Token 配置
            </Title>



            <Title level={4} style={{
              marginBottom: '16px',
              color: '#1890ff',
              borderLeft: '4px solid #1890ff',
              paddingLeft: '12px',
              background: 'linear-gradient(90deg, rgba(24, 144, 255, 0.05) 0%, transparent 100%)',
              padding: '8px 12px',
              borderRadius: '4px'
            }}>
              <KeyOutlined style={{ marginRight: '8px' }} />
              1. 创建API Token
            </Title>

            <div style={{
              background: '#fafafa',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e8e8e8',
              marginBottom: '24px'
            }}>
              <ol style={{
                margin: 0,
                paddingLeft: '20px',
                lineHeight: '2',
                fontSize: '14px'
              }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>登录Todo for AI系统</strong>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                    访问系统主页并使用您的账户登录
                  </div>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>点击右上角用户头像，选择"个人中心"</strong>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                    在导航栏右上角找到用户头像并点击
                  </div>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>切换到"API Token"标签页</strong>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                    在个人中心页面中找到API Token管理选项
                  </div>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>点击"创建Token"按钮</strong>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                    开始创建新的API访问令牌
                  </div>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>填写Token名称（如：MCP Client Token）</strong>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                    为Token设置一个便于识别的名称
                  </div>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>设置过期时间（可选，留空表示永不过期）</strong>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                    根据安全需要设置Token的有效期
                  </div>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>点击"创建Token"</strong>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                    确认创建并生成Token
                  </div>
                </li>
                <li style={{
                  marginBottom: '0',
                  padding: '12px',
                  background: '#fff2e8',
                  border: '1px solid #ffbb96',
                  borderRadius: '6px',
                  color: '#d4380d'
                }}>
                  <strong>⚠️ 重要：</strong>立即复制并保存Token，它只会显示一次
                  <div style={{ color: '#ad2102', fontSize: '13px', marginTop: '4px' }}>
                    Token创建后只显示一次，请务必立即复制并妥善保存
                  </div>
                </li>
              </ol>
            </div>

            <Title level={4} style={{ marginTop: '24px' }}>2. 配置Token</Title>
            <Paragraph>
              将获取的API Token配置到MCP客户端中，有两种方式：
            </Paragraph>

            <Title level={5}>方式一：命令行参数（推荐）</Title>
            <div style={codeStyle}>
              node /path/to/your/todo-for-ai/todo-mcp/dist/index.js --api-token=tfa_your_token_here
            </div>

            <Title level={5}>方式二：环境变量</Title>
            <div style={codeStyle}>
              export TODO_API_TOKEN=tfa_your_token_here<br/>
              node /path/to/your/todo-for-ai/todo-mcp/dist/index.js
            </div>

            <Title level={4} style={{ marginTop: '24px' }}>3. 权限说明</Title>
            <ul>
              <li><strong>项目访问：</strong>只能访问自己创建的项目</li>
              <li><strong>任务管理：</strong>可以创建、查看、更新自己项目中的任务</li>
              <li><strong>上下文规则：</strong>可以查看和应用项目的上下文规则</li>
              <li><strong>管理员：</strong>拥有所有项目和任务的访问权限</li>
            </ul>

            <Title level={4} style={{ marginTop: '24px' }}>4. 完整配置示例</Title>
            <Paragraph>
              以下是一个完整的Claude Desktop配置示例：
            </Paragraph>
            <CodeBlock language="json">
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "node",
      "args": [
        "/Users/cc11001100/github/ai-coding-labs/todo-for-ai/todo-mcp/dist/index.js"
      ],
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110",
        "TODO_API_TOKEN": "AmXxPQulszHqGd_VbEiO748DSseIGJZppjtMI53lm84",
        "LOG_LEVEL": "info"
      }
    }
  }
}`}
            </CodeBlock>

            <Alert
              message="安全提醒"
              description={
                <div>
                  <p>• 请妥善保管您的API Token，不要分享给他人</p>
                  <p>• 如果Token泄露，请立即在个人中心删除并重新创建</p>
                  <p>• 建议定期更换API Token以提高安全性</p>
                  <p>• 请将示例中的路径替换为你的实际项目路径</p>
                </div>
              }
              type="info"
              style={{ marginTop: '16px' }}
              showIcon
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <DownloadOutlined />
              安装步骤
            </span>
          }
          key="installation"
        >
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

            <Title level={4} style={{
              marginBottom: '16px',
              color: '#1890ff',
              borderLeft: '4px solid #1890ff',
              paddingLeft: '12px',
              background: 'linear-gradient(90deg, rgba(24, 144, 255, 0.05) 0%, transparent 100%)',
              padding: '8px 12px',
              borderRadius: '4px'
            }}>
              <SettingOutlined style={{ marginRight: '8px' }} />
              第一步：获取 MCP 配置
            </Title>

            <Paragraph style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              根据您使用的 AI 客户端，复制对应的 MCP JSON 配置：
            </Paragraph>

            <Title level={5} style={{ marginTop: '20px', marginBottom: '12px' }}>
              📋 Claude Desktop 配置
            </Title>
            <Paragraph style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              复制以下配置到 Claude Desktop 的配置文件中：
            </Paragraph>
            <CodeBlock language="json">
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "npx",
      "args": ["@todo-for-ai/mcp"],
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110",
        "TODO_API_TOKEN": "your-api-token-here"
      }
    }
  }
}`}
            </CodeBlock>

            <Title level={5} style={{ marginTop: '20px', marginBottom: '12px' }}>
              🎯 Cursor IDE 配置
            </Title>
            <Paragraph style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              在 Cursor IDE 的设置中添加以下 MCP 配置：
            </Paragraph>
            <CodeBlock language="json">
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "npx",
      "args": ["@todo-for-ai/mcp"],
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110",
        "TODO_API_TOKEN": "your-api-token-here"
      }
    }
  }
}`}
            </CodeBlock>

            <Title level={5} style={{ marginTop: '20px', marginBottom: '12px' }}>
              🔧 其他 AI IDE 通用配置
            </Title>
            <Paragraph style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              对于其他支持 MCP 的 AI IDE，使用以下通用配置：
            </Paragraph>
            <CodeBlock language="json">
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "npx",
      "args": ["@todo-for-ai/mcp"],
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110",
        "TODO_API_TOKEN": "your-api-token-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}`}
            </CodeBlock>

            <Alert
              message="重要提醒"
              description={
                <div>
                  <p>• 请将 <code>your-api-token-here</code> 替换为您在 "API Token" 标签页中创建的实际 Token</p>
                  <p>• 确保 Todo for AI 后端服务正在 http://localhost:50110 运行</p>
                  <p>• 配置完成后需要重启您的 AI 客户端应用</p>
                </div>
              }
              type="warning"
              style={{ marginTop: '20px' }}
              showIcon
            />

            <Divider style={{ margin: '32px 0' }} />

            <Title level={4} style={{
              marginBottom: '16px',
              color: '#52c41a',
              borderLeft: '4px solid #52c41a',
              paddingLeft: '12px',
              background: 'linear-gradient(90deg, rgba(82, 196, 26, 0.05) 0%, transparent 100%)',
              padding: '8px 12px',
              borderRadius: '4px'
            }}>
              <CheckCircleOutlined style={{ marginRight: '8px' }} />
              第二步：验证 MCP 配置
            </Title>

            <Paragraph style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              通过以下步骤验证 MCP 配置是否成功，我们将创建一个测试项目和任务：
            </Paragraph>

            <div style={{
              background: '#f6f8fa',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e1e4e8',
              marginBottom: '20px'
            }}>
              <Title level={5} style={{ marginTop: 0, marginBottom: '16px', color: '#1890ff' }}>
                🎯 验证步骤
              </Title>

              <div style={{ marginBottom: '24px' }}>
                <strong style={{ color: '#262626' }}>1. 创建测试项目</strong>
                <div style={{ color: '#666', fontSize: '13px', marginTop: '8px', marginLeft: '16px' }}>
                  <p>• 访问 Todo for AI 系统</p>
                  <p>• 点击"项目管理" → "创建项目"</p>
                  <p>• 项目名称：<code>MCP 测试项目</code></p>
                  <p>• 项目描述：<code>用于验证 MCP 配置是否正常工作的测试项目</code></p>
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    📸 创建项目后的效果图：
                  </div>
                  <div style={{
                    background: '#f9fafb',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#374151',
                    fontFamily: 'monospace'
                  }}>
                    项目创建成功后，您将看到项目详情页面，显示项目名称、描述和任务统计信息。
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <strong style={{ color: '#262626' }}>2. 创建测试任务</strong>
                <div style={{ color: '#666', fontSize: '13px', marginTop: '8px', marginLeft: '16px' }}>
                  <p>• 在项目详情页面点击"New Task"按钮</p>
                  <p>• 任务标题：<code>测试 MCP 连接</code></p>
                  <p>• 任务内容：包含测试目标和验证步骤的详细描述</p>
                  <p>• 优先级：选择"Medium"（中等）</p>
                  <p>• 点击"Create Task"创建任务</p>
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    📸 任务创建成功后的效果图：
                  </div>
                  <div style={{
                    background: '#f9fafb',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#374151',
                    fontFamily: 'monospace'
                  }}>
                    任务创建后，您将看到任务详情页面，包含任务信息、内容和项目上下文规则。
                    在项目任务列表中也能看到新创建的"测试 MCP 连接"任务。
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <strong style={{ color: '#262626' }}>3. 在 AI 客户端中测试</strong>
                <div style={{ color: '#666', fontSize: '13px', marginTop: '8px', marginLeft: '16px' }}>
                  <p>• 重启您的 AI 客户端（Claude Desktop/Cursor 等）</p>
                  <p>• 在对话中输入：<code>"请帮我查看 MCP 测试项目 的任务列表"</code></p>
                  <p>• 如果配置成功，AI 应该能够：</p>
                  <ul style={{ marginTop: '8px', marginLeft: '16px' }}>
                    <li>找到"MCP 测试项目"</li>
                    <li>显示"测试 MCP 连接"任务</li>
                    <li>显示任务的详细信息</li>
                  </ul>
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    💡 AI 客户端测试示例：
                  </div>
                  <div style={{
                    background: '#f9fafb',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#374151',
                    fontFamily: 'monospace'
                  }}>
                    用户: "请帮我查看 MCP 测试项目 的任务列表"<br/>
                    AI: "我来为您查看 MCP 测试项目的任务列表..."<br/>
                    AI: "找到项目：MCP 测试项目"<br/>
                    AI: "任务列表：#327 测试 MCP 连接 (状态: To Do, 优先级: Medium)"
                  </div>
                </div>
              </div>

              <div>
                <strong style={{ color: '#262626' }}>4. 测试任务操作</strong>
                <div style={{ color: '#666', fontSize: '13px', marginTop: '8px', marginLeft: '16px' }}>
                  <p>• 请 AI 帮您更新任务状态：<code>"请将'测试 MCP 连接'任务标记为进行中"</code></p>
                  <p>• 请 AI 创建新任务：<code>"在 MCP 测试项目中创建一个新任务：完成 MCP 配置验证"</code></p>
                  <p>• 如果这些操作都能成功执行，说明 MCP 配置完全正常！</p>
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db'
                }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                    ✅ 成功验证的标志：
                  </div>
                  <div style={{
                    background: '#f0f9ff',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#0369a1',
                    border: '1px solid #bae6fd'
                  }}>
                    • AI 能够找到并列出您的项目<br/>
                    • AI 能够查看和显示任务详情<br/>
                    • AI 能够创建新任务<br/>
                    • AI 能够更新任务状态<br/>
                    • AI 能够应用项目的上下文规则
                  </div>
                </div>
              </div>
            </div>

            <Alert
              message="验证成功标志"
              description={
                <div>
                  <p><strong>✅ 配置成功的标志：</strong></p>
                  <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    <li>AI 能够找到并列出您的项目</li>
                    <li>AI 能够查看和显示任务详情</li>
                    <li>AI 能够创建新任务</li>
                    <li>AI 能够更新任务状态</li>
                    <li>AI 能够应用项目的上下文规则</li>
                  </ul>
                </div>
              }
              type="success"
              style={{ marginTop: '16px' }}
              showIcon
            />

            <Alert
              message="常见问题排查"
              description={
                <div>
                  <p><strong>❌ 如果验证失败，请检查：</strong></p>
                  <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    <li>API Token 是否正确配置且有效</li>
                    <li>Todo for AI 后端服务是否正在运行</li>
                    <li>网络连接是否正常（能否访问 http://localhost:50110）</li>
                    <li>AI 客户端是否已重启</li>
                    <li>MCP 配置 JSON 格式是否正确</li>
                  </ul>
                </div>
              }
              type="error"
              style={{ marginTop: '16px' }}
              showIcon
            />


          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <CodeOutlined />
              Claude Desktop
            </span>
          } 
          key="claude"
        >
          <Card>
            <Title level={3}>Claude Desktop 配置</Title>
            
            <Paragraph>
              Claude Desktop 是 Anthropic 官方的桌面应用程序，支持MCP协议集成。
            </Paragraph>

            <Title level={4}>配置文件位置</Title>
            <ul>
              <li><strong>macOS:</strong> <code>~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
              <li><strong>Windows:</strong> <code>%APPDATA%\Claude\claude_desktop_config.json</code></li>
              <li><strong>Linux:</strong> <code>~/.config/Claude/claude_desktop_config.json</code></li>
            </ul>

            <Title level={4}>基础配置（使用npm包）</Title>
            <Alert
              message="推荐配置"
              description="使用npm包安装后，配置更加简单，无需指定复杂的路径。"
              type="info"
              style={{ marginBottom: '16px' }}
              showIcon
            />
            <CodeBlock language="json">
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "@todo-for-ai/mcp",
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110",
        "LOG_LEVEL": "info"
      }
    }
  }
}`}
            </CodeBlock>



            <Title level={4} style={{ marginTop: '24px' }}>高级配置（带认证）</Title>
            <Alert
              message="API Token 认证"
              description={
                <div>
                  <p>从版本2.0开始，MCP服务器支持API Token认证，提供更安全的访问控制。</p>
                  <p>请在个人中心创建API Token，然后在配置中使用。</p>
                </div>
              }
              type="warning"
              style={{ marginBottom: '16px' }}
              showIcon
            />
            <CodeBlock language="json">
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "@todo-for-ai/mcp",
      "args": [
        "--api-token=your-api-token-here"
      ],
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110",
        "LOG_LEVEL": "info"
      }
    }
  }
}`}
            </CodeBlock>

            <Title level={5} style={{ marginTop: '16px' }}>或者使用环境变量方式：</Title>
            <div style={configStyle}>
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "@todo-for-ai/mcp",
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110",
        "TODO_API_TOKEN": "your-api-token-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}`}
            </div>

            <Alert
              message="重启提醒"
              description="修改配置文件后，需要重启Claude Desktop应用程序才能生效。"
              type="info"
              style={{ marginTop: '16px' }}
              showIcon
            />
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <CodeOutlined />
              Cursor IDE
            </span>
          } 
          key="cursor"
        >
          <Card>
            <Title level={3}>Cursor IDE 配置</Title>
            
            <Paragraph>
              Cursor 是一个基于VS Code的AI代码编辑器，支持MCP协议扩展。
            </Paragraph>

            <Title level={4}>配置方法</Title>
            <Paragraph>
              1. 打开 Cursor IDE<br/>
              2. 按 <code>Cmd/Ctrl + Shift + P</code> 打开命令面板<br/>
              3. 搜索并选择 "Preferences: Open Settings (JSON)"<br/>
              4. 添加以下MCP配置：
            </Paragraph>

            <div style={configStyle}>
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "npx",
      "args": ["@todo-for-ai/mcp"],
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110",
        "LOG_LEVEL": "info"
      }
    }
  }
}`}
            </div>


          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <CodeOutlined />
              其他 IDE
            </span>
          }
          key="other-ides"
        >
          <Card>
            <Title level={3}>其他 AI IDE 配置</Title>

            <Title level={4}>Continue.dev</Title>
            <Paragraph>
              Continue 是一个开源的AI代码助手，支持多种IDE集成。
            </Paragraph>
            <div style={configStyle}>
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "@todo-for-ai/mcp",
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110"
      }
    }
  }
}`}
            </div>

            <Title level={4} style={{ marginTop: '24px' }}>Zed Editor</Title>
            <Paragraph>
              Zed 是一个高性能的代码编辑器，正在添加MCP支持。
            </Paragraph>
            <div style={configStyle}>
{`// 在 ~/.config/zed/settings.json 中添加
{
  "experimental": {
    "mcp": {
      "servers": {
        "todo-for-ai": {
          "command": "@todo-for-ai/mcp",
          "env": {
            "TODO_API_BASE_URL": "http://localhost:50110"
          }
        }
      }
    }
  }
}`}
            </div>

            <Title level={4} style={{ marginTop: '24px' }}>通用配置模板</Title>
            <Paragraph>
              对于其他支持MCP的IDE，可以参考以下通用配置模板：
            </Paragraph>
            <div style={configStyle}>
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "@todo-for-ai/mcp",
      "args": [],
      "env": {
        "TODO_API_BASE_URL": "http://localhost:50110",
        "TODO_API_TIMEOUT": "10000",
        "LOG_LEVEL": "info"
      }
    }
  }
}`}
            </div>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <SettingOutlined />
              配置参数
            </span>
          }
          key="configuration"
        >
          <Card>
            <Title level={3}>配置参数详解</Title>

            <Title level={4}>环境变量</Title>
            <div style={{ marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa' }}>
                    <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>参数名</th>
                    <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>必需</th>
                    <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>默认值</th>
                    <th style={{ padding: '12px', border: '1px solid #d9d9d9', textAlign: 'left' }}>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}><code>TODO_API_BASE_URL</code></td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>是</td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>-</td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>Todo API 服务器地址</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}><code>TODO_API_TOKEN</code></td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>否</td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>""</td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>API 认证令牌</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}><code>TODO_API_TIMEOUT</code></td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>否</td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>10000</td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>API 请求超时时间（毫秒）</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}><code>LOG_LEVEL</code></td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>否</td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>info</td>
                    <td style={{ padding: '12px', border: '1px solid #d9d9d9' }}>日志级别（debug, info, warn, error）</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Title level={4}>配置文件示例</Title>
            <Paragraph>
              除了环境变量，你也可以创建 <code>config.json</code> 文件：
            </Paragraph>
            <div style={configStyle}>
{`{
  "apiBaseUrl": "http://localhost:50110",
  "apiTimeout": 10000,
  "apiToken": "",
  "logLevel": "info"
}`}
            </div>

            <Title level={4} style={{ marginTop: '24px' }}>生产环境配置</Title>
            <div style={configStyle}>
{`{
  "mcpServers": {
    "todo-for-ai": {
      "command": "@todo-for-ai/mcp",
      "env": {
        "TODO_API_BASE_URL": "https://your-domain.com",
        "TODO_API_TOKEN": "your-production-token",
        "TODO_API_TIMEOUT": "15000",
        "LOG_LEVEL": "warn",
        "NODE_ENV": "production"
      }
    }
  }
}`}
            </div>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <CheckCircleOutlined />
              测试验证
            </span>
          }
          key="testing"
        >
          <Card>
            <Title level={3}>测试和验证</Title>

            <Title level={4}>1. 检查服务状态</Title>
            <Paragraph>
              首先确认Todo for AI后端服务正在运行：
            </Paragraph>
            <div style={codeStyle}>
              curl http://localhost:50110/api/health
            </div>

            <Title level={4} style={{ marginTop: '24px' }}>2. 测试MCP连接</Title>
            <Paragraph>
              使用内置的测试脚本验证MCP服务器：
            </Paragraph>
            <div style={codeStyle}>
{`# 进入todo-mcp目录
cd todo-mcp

# 运行测试脚本
node test-mcp.js

# 或者运行验证脚本
node verify.js`}
            </div>

            <Title level={4} style={{ marginTop: '24px' }}>3. IDE中测试</Title>
            <Paragraph>
              在配置好的AI IDE中，尝试以下操作来验证MCP功能：
            </Paragraph>

            <Title level={5}>基础功能测试</Title>
            <ul>
              <li>询问AI助手："请获取'ToDo For AI'项目的任务列表"</li>
              <li>请求AI助手："帮我查看任务ID为233的详细信息"</li>
              <li>让AI助手："为任务233提交完成反馈"</li>
            </ul>

            <Title level={5}>高级功能测试</Title>
            <ul>
              <li>创建任务："在'ToDo For AI'项目中创建一个新的测试任务"</li>
              <li>项目信息："获取'ToDo For AI'项目的详细信息和统计数据"</li>
              <li>批量操作："获取所有待办状态的任务并逐个处理"</li>
            </ul>

            <Title level={5}>测试示例对话</Title>
            <div style={configStyle}>
{`用户: "请帮我获取ToDo For AI项目中所有待办任务"
AI: 我来为您获取ToDo For AI项目的待办任务...

用户: "请为任务ID 233提交完成反馈，说明已经完善了MCP文档"
AI: 我来为您提交任务反馈...

用户: "在ToDo For AI项目中创建一个新任务：优化前端性能"
AI: 我来为您创建新任务...`}
            </div>

            <Title level={4} style={{ marginTop: '24px' }}>4. 常见问题排查</Title>
            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>连接失败</Title>
              <ul>
                <li>检查 <code>TODO_API_BASE_URL</code> 是否正确</li>
                <li>确认Todo后端服务正在运行</li>
                <li>检查网络连接和防火墙设置</li>
              </ul>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>认证错误</Title>
              <ul>
                <li>验证 <code>TODO_API_TOKEN</code> 是否有效</li>
                <li>检查API令牌权限设置</li>
                <li>确认令牌格式正确</li>
              </ul>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>工具未找到</Title>
              <ul>
                <li>重启AI IDE应用程序</li>
                <li>检查MCP配置文件语法</li>
                <li>确认MCP服务器已正确安装</li>
              </ul>
            </div>

            <Alert
              message="调试提示"
              description="如果遇到问题，可以设置 LOG_LEVEL=debug 来获取详细的调试信息。"
              type="info"
              style={{ marginTop: '16px' }}
              showIcon
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default MCPInstallation
