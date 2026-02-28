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
  const { tp } = usePageTranslation('variableDocs')
  const navigate = useNavigate()

  // 设置页面标题
  useEffect(() => {
    document.title = tp('pageTitle')
  }, [tp])

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
    { variable: '${project.name}', description: tp('variables.project.name'), example: tp('sampleData.project.name'), type: 'string' },
    { variable: '${project.description}', description: tp('variables.project.description'), example: tp('sampleData.project.description'), type: 'string' },
    { variable: '${project.github_repo}', description: tp('variables.project.github_repo'), example: 'https://github.com/example/project', type: 'string' },
    { variable: '${project.context}', description: tp('variables.project.context'), example: tp('sampleData.project.context'), type: 'string' },
    { variable: '${project.color}', description: tp('variables.project.color'), example: '#1890ff', type: 'string' },
  ]

  const taskVariables: VariableInfo[] = [
    { variable: '${task.id}', description: tp('variables.task.id'), example: '123', type: 'number' },
    { variable: '${task.title}', description: tp('variables.task.title'), example: tp('sampleData.task.title'), type: 'string' },
    { variable: '${task.content}', description: tp('variables.task.content'), example: tp('sampleData.task.content'), type: 'string' },
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
    { variable: '${tasks.list}', description: tp('variables.tasks.list'), example: tp('sampleData.tasks.list'), type: 'string' },
  ]

  const contextRulesVariables: VariableInfo[] = [
    { variable: '${context_rules.global.all}', description: tp('variables.contextRules.global.all'), example: tp('examplesData.contextRules.global.all'), type: 'string' },
    { variable: '${context_rules.global.count}', description: tp('variables.contextRules.global.count'), example: tp('examplesData.contextRules.global.count'), type: 'number' },
    { variable: '${context_rules.global.names}', description: tp('variables.contextRules.global.names'), example: tp('examplesData.contextRules.global.names'), type: 'array' },
    { variable: '${context_rules.global.by_name.rule_name}', description: tp('variables.contextRules.global.byName'), example: tp('examplesData.contextRules.global.byName'), type: 'string' },
    { variable: '${context_rules.project.all}', description: tp('variables.contextRules.project.all'), example: tp('examplesData.contextRules.project.all'), type: 'string' },
    { variable: '${context_rules.project.count}', description: tp('variables.contextRules.project.count'), example: tp('examplesData.contextRules.project.count'), type: 'number' },
    { variable: '${context_rules.project.names}', description: tp('variables.contextRules.project.names'), example: tp('examplesData.contextRules.project.names'), type: 'array' },
    { variable: '${context_rules.project.by_name.rule_name}', description: tp('variables.contextRules.project.byName'), example: tp('examplesData.contextRules.project.byName'), type: 'string' },
    { variable: '${context_rules.merged.all}', description: tp('variables.contextRules.merged.all'), example: tp('examplesData.contextRules.merged.all'), type: 'string' },
    { variable: '${context_rules.merged.count}', description: tp('variables.contextRules.merged.count'), example: tp('examplesData.contextRules.merged.count'), type: 'number' },
    { variable: '${context_rules.merged.names}', description: tp('variables.contextRules.merged.names'), example: tp('examplesData.contextRules.merged.names'), type: 'array' },
    { variable: '${context_rules.merged.by_name.rule_name}', description: tp('variables.contextRules.merged.byName'), example: tp('examplesData.contextRules.merged.byName'), type: 'string' },
  ]

  // 复制变量
  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable)
    message.success(tp('messages.copySuccess'))
  }

  // 表格列定义
  const columns = [
    {
      title: tp('table.columns.variable'),
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
      title: tp('table.columns.description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: tp('table.columns.type'),
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
      title: tp('table.columns.example'),
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
              {tp('navigation.back')}
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              <BookOutlined style={{ marginRight: '8px' }} />
              {tp('title')}
            </Title>
          </Space>
          <Paragraph type="secondary">
            {tp('subtitle')}
          </Paragraph>
        </div>

        {/* 导航锚点 */}
        <Card size="small">
          <Anchor
            direction="horizontal"
            items={[
              { key: 'project', href: '#project', title: tp('sections.project.title') },
              { key: 'task', href: '#task', title: tp('sections.task.title') },
              { key: 'system', href: '#system', title: tp('sections.system.title') },
              { key: 'tasks', href: '#tasks', title: tp('sections.tasks.title') },
              { key: 'context_rules', href: '#context_rules', title: tp('sections.contextRules.title') },
            ]}
          />
        </Card>

        {/* 项目变量 */}
        <Card id="project">
          <Title level={3}>{tp('sections.project.title')}</Title>
          <Paragraph>
            {tp('sections.project.description')}
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
          <Title level={3}>{tp('sections.task.title')}</Title>
          <Paragraph>
            {tp('sections.task.description')}
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
          <Title level={3}>{tp('sections.system.title')}</Title>
          <Paragraph>
            {tp('sections.system.description')}
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
          <Title level={3}>{tp('sections.tasks.title')}</Title>
          <Paragraph>
            {tp('sections.tasks.description')}
          </Paragraph>
          <Table
            dataSource={tasksVariables}
            columns={columns}
            pagination={false}
            size="small"
            rowKey="variable"
          />
        </Card>

        {/* 上下文规则变量 */}
        <Card id="context_rules">
          <Title level={3}>{tp('sections.contextRules.title')}</Title>
          <Paragraph>
            {tp('sections.contextRules.description')}
          </Paragraph>
          <Table
            dataSource={contextRulesVariables}
            columns={columns}
            pagination={false}
            size="small"
            rowKey="variable"
          />
          <div style={{ marginTop: '16px' }}>
            <Title level={4}>{tp('examples.title')}</Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text strong>{tp('examples.globalRules')}</Text>
                <br />
                <Text code>${`{context_rules.global.all}`}</Text>
              </div>
              <div>
                <Text strong>{tp('examples.projectRules')}</Text>
                <br />
                <Text code>${`{context_rules.project.all}`}</Text>
              </div>
              <div>
                <Text strong>{tp('examples.mergedRules')}</Text>
                <br />
                <Text code>${`{context_rules.merged.all}`}</Text>
              </div>
              <div>
                <Text strong>{tp('examples.specificRule')}</Text>
                <br />
                <Text code>${`{context_rules.global.by_name.${tp('examples.ruleNamePlaceholder')}}`}</Text>
                <br />
                <Text code>${`{context_rules.project.by_name.${tp('examples.ruleNamePlaceholder')}}`}</Text>
              </div>
            </Space>
          </div>
        </Card>

        {/* 使用说明 */}
        <Card>
          <Title level={3}>{tp('usage.title')}</Title>
          <Space direction="vertical" size="middle">
            <div>
              <Title level={4}>{tp('usage.basicSyntax.title')}</Title>
              <Paragraph>
                {tp('usage.basicSyntax.description')}
              </Paragraph>
              <ul>
                <li><Text code>variable</Text> {tp('usage.basicSyntax.variableDesc')}</li>
                <li><Text code>property</Text> {tp('usage.basicSyntax.propertyDesc')}</li>
              </ul>
            </div>

            <div>
              <Title level={4}>{tp('usage.exampleUsage.title')}</Title>
              <Paragraph>
                <Text code>${`{project.name}`}</Text> - {tp('usage.exampleUsage.projectName')}<br/>
                <Text code>${`{task.title}`}</Text> - {tp('usage.exampleUsage.taskTitle')}<br/>
                <Text code>${`{system.current_time}`}</Text> - {tp('usage.exampleUsage.currentTime')}<br/>
                <Text code>${`{context_rules.merged.all}`}</Text> - {tp('usage.exampleUsage.allRules')}
              </Paragraph>
            </div>

            <div>
              <Title level={4}>{tp('usage.extraNotes.title')}</Title>
              <ul>
                <li>{tp('usage.extraNotes.item1')}</li>
                <li>{tp('usage.extraNotes.item2')}</li>
                <li>{tp('usage.extraNotes.item3')}</li>
                <li>{tp('usage.extraNotes.item4')}</li>
              </ul>
            </div>

            <div>
              <Title level={4}>{tp('usage.notes.title')}</Title>
              <ul>
                <li>{tp('usage.notes.item1')}</li>
                <li>{tp('usage.notes.item2')}</li>
                <li>{tp('usage.notes.item3')}</li>
                <li>{tp('usage.notes.item4')}</li>
              </ul>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  )
}

export default VariableDocs
