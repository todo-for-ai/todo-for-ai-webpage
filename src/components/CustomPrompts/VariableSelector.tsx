import React, { useState } from 'react'
import { Modal, Collapse, List, Button, Input, Space, Typography, Tag } from 'antd'
import { SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { getVariableDescription } from '../../utils/promptRenderer'

const { Panel } = Collapse
const { Search } = Input
const { Text } = Typography

interface VariableInfo {
  name: string
  description: string
  example: string
}

interface VariableSelectorProps {
  visible: boolean
  onClose: () => void
  onInsertVariable?: (variable: string) => void
}

const VariableSelector: React.FC<VariableSelectorProps> = ({
  visible,
  onClose,
  onInsertVariable
}) => {
  const { tp } = usePageTranslation('customPrompts')
  const [searchText, setSearchText] = useState('')

  // 变量分类
  const variableCategories = {
    project: [
      { name: 'project.name', description: tp('variables.project.name'), example: '示例项目' },
      { name: 'project.description', description: tp('variables.project.description'), example: '这是一个示例项目' },
      { name: 'project.github_repo', description: tp('variables.project.github_repo'), example: 'https://github.com/example/project' },
      { name: 'project.context', description: tp('variables.project.context'), example: '项目上下文信息' },
      { name: 'project.color', description: tp('variables.project.color'), example: '#1890ff' },
    ],
    task: [
      { name: 'task.id', description: tp('variables.task.id'), example: '123' },
      { name: 'task.title', description: tp('variables.task.title'), example: '示例任务' },
      { name: 'task.content', description: tp('variables.task.content'), example: '任务详细内容' },
      { name: 'task.status', description: tp('variables.task.status'), example: 'todo' },
      { name: 'task.priority', description: tp('variables.task.priority'), example: 'high' },
      { name: 'task.created_at', description: tp('variables.task.created_at'), example: '2024-01-01 10:00:00' },
      { name: 'task.due_date', description: tp('variables.task.due_date'), example: '2024-01-31 18:00:00' },
      { name: 'task.estimated_hours', description: tp('variables.task.estimated_hours'), example: '8' },
      { name: 'task.tags', description: tp('variables.task.tags'), example: 'frontend, urgent' },
      { name: 'task.related_files', description: tp('variables.task.related_files'), example: 'file1.js, file2.css' },
    ],
    system: [
      { name: 'system.url', description: tp('variables.system.url'), example: 'https://todo4ai.org' },
      { name: 'system.current_time', description: tp('variables.system.current_time'), example: '2024-01-01 10:00:00' },
    ],
    tasks: [
      { name: 'tasks.count', description: tp('variables.tasks.count'), example: '5' },
      { name: 'tasks.list', description: tp('variables.tasks.list'), example: '1. [高] 任务1\n2. [中] 任务2' },
    ]
  }

  // 过滤变量
  const filterVariables = (variables: VariableInfo[]) => {
    if (!searchText) return variables
    return variables.filter(v => 
      v.name.toLowerCase().includes(searchText.toLowerCase()) ||
      v.description.toLowerCase().includes(searchText.toLowerCase())
    )
  }

  // 插入变量
  const handleInsertVariable = (variableName: string) => {
    const variableText = `\${${variableName}}`
    if (onInsertVariable) {
      onInsertVariable(variableText)
    }
  }

  // 复制变量
  const handleCopyVariable = (variableName: string) => {
    const variableText = `\${${variableName}}`
    navigator.clipboard.writeText(variableText)
  }

  const renderVariableList = (variables: VariableInfo[]) => {
    const filteredVariables = filterVariables(variables)
    
    return (
      <List
        dataSource={filteredVariables}
        renderItem={(variable) => (
          <List.Item
            actions={[
              <Button
                key="insert"
                type="link"
                size="small"
                onClick={() => handleInsertVariable(variable.name)}
              >
                插入
              </Button>,
              <Button
                key="copy"
                type="link"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyVariable(variable.name)}
              >
                复制
              </Button>
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Tag color="blue">${`{${variable.name}}`}</Tag>
                  <Text>{variable.description}</Text>
                </Space>
              }
              description={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  示例: {variable.example}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    )
  }

  return (
    <Modal
      title={tp('variables.title')}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={800}
      style={{ top: 20 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Search
          placeholder="搜索变量..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '100%' }}
          allowClear
        />

        <Collapse defaultActiveKey={['project', 'task']}>
          <Panel header={tp('variables.project.title')} key="project">
            {renderVariableList(variableCategories.project)}
          </Panel>
          
          <Panel header={tp('variables.task.title')} key="task">
            {renderVariableList(variableCategories.task)}
          </Panel>
          
          <Panel header={tp('variables.system.title')} key="system">
            {renderVariableList(variableCategories.system)}
          </Panel>
          
          <Panel header={tp('variables.tasks.title')} key="tasks">
            {renderVariableList(variableCategories.tasks)}
          </Panel>
        </Collapse>
      </Space>
    </Modal>
  )
}

export default VariableSelector
