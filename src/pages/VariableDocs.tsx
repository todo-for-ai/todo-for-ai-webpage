import React, { useEffect } from 'react'
import { Card, Typography, Table, Space, Tag, Button, message, Anchor } from 'antd'
import { BookOutlined, CopyOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography
const { Link } = Anchor

interface VariableInfo {
  variable: string
  description: string
  example: string
  type: string
}

const VariableDocs: React.FC = () => {
  const { tp } = usePageTranslation('customPrompts')
  const navigate = useNavigate()

  // 设置页面标题
  useEffect(() => {
    document.title = '变量文档 - Todo for AI'
  }, [])

  // 返回上一页
  const handleGoBack = () => {
    // 优先返回到自定义提示词页面，如果没有历史记录则使用navigate
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigate('/todo-for-ai/pages/custom-prompts')
    }
  }

  // 变量数据
  const projectVariables: VariableInfo[] = [
    { variable: '${project.name}', description: tp('variables.project.name'), example: '示例项目', type: 'string' },
    { variable: '${project.description}', description: tp('variables.project.description'), example: '这是一个示例项目', type: 'string' },
    { variable: '${project.github_repo}', description: tp('variables.project.github_repo'), example: 'https://github.com/example/project', type: 'string' },
    { variable: '${project.context}', description: tp('variables.project.context'), example: '项目上下文信息', type: 'string' },
    { variable: '${project.color}', description: tp('variables.project.color'), example: '#1890ff', type: 'string' },
  ]

  const taskVariables: VariableInfo[] = [
    { variable: '${task.id}', description: tp('variables.task.id'), example: '123', type: 'number' },
    { variable: '${task.title}', description: tp('variables.task.title'), example: '示例任务', type: 'string' },
    { variable: '${task.content}', description: tp('variables.task.content'), example: '任务详细内容', type: 'string' },
    { variable: '${task.status}', description: tp('variables.task.status'), example: 'todo', type: 'string' },
    { variable: '${task.priority}', description: tp('variables.task.priority'), example: 'high', type: 'string' },
    { variable: '${task.created_at}', description: tp('variables.task.created_at'), example: '2024-01-01 10:00:00', type: 'datetime' },
    { variable: '${task.due_date}', description: tp('variables.task.due_date'), example: '2024-01-31 18:00:00', type: 'datetime' },
    { variable: '${task.estimated_hours}', description: tp('variables.task.estimated_hours'), example: '8', type: 'number' },
    { variable: '${task.tags}', description: tp('variables.task.tags'), example: 'frontend, urgent', type: 'array' },
    { variable: '${task.related_files}', description: tp('variables.task.related_files'), example: 'file1.js, file2.css', type: 'array' },
  ]

  const systemVariables: VariableInfo[] = [
    { variable: '${system.url}', description: tp('variables.system.url'), example: 'https://todo4ai.org', type: 'string' },
    { variable: '${system.current_time}', description: tp('variables.system.current_time'), example: '2024-01-01 10:00:00', type: 'datetime' },
  ]

  const tasksVariables: VariableInfo[] = [
    { variable: '${tasks.count}', description: tp('variables.tasks.count'), example: '5', type: 'number' },
    { variable: '${tasks.list}', description: tp('variables.tasks.list'), example: '1. [高] 任务1\n2. [中] 任务2', type: 'string' },
  ]

  // 复制变量
  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable)
    message.success('已复制到剪贴板')
  }

  // 表格列定义
  const columns = [
    {
      title: '变量',
      dataIndex: 'variable',
      key: 'variable',
      width: 250,
      render: (text: string) => (
        <Space>
          <Tag color="blue" style={{ fontFamily: 'monospace' }}>{text}</Tag>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyVariable(text)}
          />
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          string: 'green',
          number: 'orange',
          datetime: 'purple',
          array: 'cyan'
        }
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>
      },
    },
    {
      title: '示例',
      dataIndex: 'example',
      key: 'example',
      render: (text: string) => (
        <Text code style={{ fontSize: '12px' }}>{text}</Text>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div>
          <Space align="center" style={{ marginBottom: '16px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
              size="large"
            >
              返回
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              <BookOutlined style={{ marginRight: '8px' }} />
              变量文档
            </Title>
          </Space>
          <Paragraph type="secondary">
            这里列出了在自定义提示词中可以使用的所有变量。您可以在提示词模板中使用这些变量，系统会在生成提示词时自动替换为实际值。
          </Paragraph>
        </div>

        {/* 导航锚点 */}
        <Card size="small">
          <Anchor
            direction="horizontal"
            items={[
              { key: 'project', href: '#project', title: tp('variables.project.title') },
              { key: 'task', href: '#task', title: tp('variables.task.title') },
              { key: 'system', href: '#system', title: tp('variables.system.title') },
              { key: 'tasks', href: '#tasks', title: tp('variables.tasks.title') },
            ]}
          />
        </Card>

        {/* 项目变量 */}
        <Card id="project">
          <Title level={3}>{tp('variables.project.title')}</Title>
          <Paragraph>
            项目相关的变量，包含项目的基本信息和配置。
          </Paragraph>
          <Table
            dataSource={projectVariables}
            columns={columns}
            pagination={false}
            size="small"
            rowKey="variable"
          />
        </Card>

        {/* 任务变量 */}
        <Card id="task">
          <Title level={3}>{tp('variables.task.title')}</Title>
          <Paragraph>
            任务相关的变量，包含任务的详细信息和状态。
          </Paragraph>
          <Table
            dataSource={taskVariables}
            columns={columns}
            pagination={false}
            size="small"
            rowKey="variable"
          />
        </Card>

        {/* 系统变量 */}
        <Card id="system">
          <Title level={3}>{tp('variables.system.title')}</Title>
          <Paragraph>
            系统相关的变量，包含系统配置和运行时信息。
          </Paragraph>
          <Table
            dataSource={systemVariables}
            columns={columns}
            pagination={false}
            size="small"
            rowKey="variable"
          />
        </Card>

        {/* 任务列表变量 */}
        <Card id="tasks">
          <Title level={3}>{tp('variables.tasks.title')}</Title>
          <Paragraph>
            任务列表相关的变量，用于显示项目中的任务统计和列表。
          </Paragraph>
          <Table
            dataSource={tasksVariables}
            columns={columns}
            pagination={false}
            size="small"
            rowKey="variable"
          />
        </Card>

        {/* 使用说明 */}
        <Card>
          <Title level={3}>使用说明</Title>
          <Space direction="vertical" size="middle">
            <div>
              <Title level={4}>基本语法</Title>
              <Paragraph>
                变量使用 <Text code>${`{variable.property}`}</Text> 的格式，其中：
              </Paragraph>
              <ul>
                <li><Text code>variable</Text> 是变量类别（project、task、system、tasks）</li>
                <li><Text code>property</Text> 是具体的属性名</li>
              </ul>
            </div>
            
            <div>
              <Title level={4}>示例</Title>
              <Paragraph>
                <Text code>${`{project.name}`}</Text> - 获取项目名称<br/>
                <Text code>${`{task.title}`}</Text> - 获取任务标题<br/>
                <Text code>${`{system.current_time}`}</Text> - 获取当前时间
              </Paragraph>
            </div>

            <div>
              <Title level={4}>注意事项</Title>
              <ul>
                <li>变量名区分大小写</li>
                <li>如果变量值不存在，会显示默认占位符</li>
                <li>时间类型的变量会自动格式化为本地时间</li>
                <li>数组类型的变量会自动转换为逗号分隔的字符串</li>
              </ul>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default VariableDocs
