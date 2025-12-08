import React, { useState } from 'react'
import { Modal, Collapse, List, Button, Input, Space, Typography, Tag } from 'antd'
import { SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { getVariableDescription } from '../../utils/promptRenderer'

const { Panel } = Collapse
const Search = Input.Search
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
      { name: 'project.name', description: tp('variables.project.name'), example: tp('variables.examples.project.name') },
      { name: 'project.description', description: tp('variables.project.description'), example: tp('variables.examples.project.description') },
      { name: 'project.github_repo', description: tp('variables.project.github_repo'), example: tp('variables.examples.project.github_repo') },
      { name: 'project.context', description: tp('variables.project.context'), example: tp('variables.examples.project.context') },
      { name: 'project.color', description: tp('variables.project.color'), example: tp('variables.examples.project.color') },
    ],
    task: [
      { name: 'task.id', description: tp('variables.task.id'), example: tp('variables.examples.task.id') },
      { name: 'task.title', description: tp('variables.task.title'), example: tp('variables.examples.task.title') },
      { name: 'task.content', description: tp('variables.task.content'), example: tp('variables.examples.task.content') },
      { name: 'task.status', description: tp('variables.task.status'), example: tp('variables.examples.task.status') },
      { name: 'task.priority', description: tp('variables.task.priority'), example: tp('variables.examples.task.priority') },
      { name: 'task.created_at', description: tp('variables.task.created_at'), example: tp('variables.examples.task.created_at') },
      { name: 'task.due_date', description: tp('variables.task.due_date'), example: tp('variables.examples.task.due_date') },
      { name: 'task.estimated_hours', description: tp('variables.task.estimated_hours'), example: tp('variables.examples.task.estimated_hours') },
      { name: 'task.tags', description: tp('variables.task.tags'), example: tp('variables.examples.task.tags') },
      { name: 'task.related_files', description: tp('variables.task.related_files'), example: tp('variables.examples.task.related_files') },
    ],
    system: [
      { name: 'system.url', description: tp('variables.system.url'), example: tp('variables.examples.system.url') },
      { name: 'system.current_time', description: tp('variables.system.current_time'), example: tp('variables.examples.system.current_time') },
    ],
    tasks: [
      { name: 'tasks.count', description: tp('variables.tasks.count'), example: tp('variables.examples.tasks.count') },
      { name: 'tasks.list', description: tp('variables.tasks.list'), example: tp('variables.examples.tasks.list') },
    ],
    context_rules: [
      { name: 'context_rules.global.all', description: tp('variables.contextRules.global.all'), example: tp('variables.examples.contextRules.global.all') },
      { name: 'context_rules.global.count', description: tp('variables.contextRules.global.count'), example: tp('variables.examples.contextRules.global.count') },
      { name: 'context_rules.global.names', description: tp('variables.contextRules.global.names'), example: tp('variables.examples.contextRules.global.names') },
      { name: `context_rules.global.by_name.${tp('variableNames.ruleName')}`, description: tp('variables.contextRules.global.byName'), example: tp('variables.examples.contextRules.global.byName') },
      { name: 'context_rules.project.all', description: tp('variables.contextRules.project.all'), example: tp('variables.examples.contextRules.project.all') },
      { name: 'context_rules.project.count', description: tp('variables.contextRules.project.count'), example: tp('variables.examples.contextRules.project.count') },
      { name: 'context_rules.project.names', description: tp('variables.contextRules.project.names'), example: tp('variables.examples.contextRules.project.names') },
      { name: `context_rules.project.by_name.${tp('variableNames.ruleName')}`, description: tp('variables.contextRules.project.byName'), example: tp('variables.examples.contextRules.project.byName') },
      { name: 'context_rules.merged.all', description: tp('variables.contextRules.merged.all'), example: tp('variables.examples.contextRules.merged.all') },
      { name: 'context_rules.merged.count', description: tp('variables.contextRules.merged.count'), example: tp('variables.examples.contextRules.merged.count') },
      { name: 'context_rules.merged.names', description: tp('variables.contextRules.merged.names'), example: tp('variables.examples.contextRules.merged.names') },
      { name: `context_rules.merged.by_name.${tp('variableNames.ruleName')}`, description: tp('variables.contextRules.merged.byName'), example: tp('variables.examples.contextRules.merged.byName') },
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
                {tp('variables.insert')}
              </Button>,
              <Button
                key="copy"
                type="link"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyVariable(variable.name)}
              >
                {tp('variables.copy')}
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
                  {tp('variables.example')}: {variable.example}
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
          {tp('variables.close')}
        </Button>
      ]}
      width={800}
      style={{ top: 20 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Search
          placeholder={tp('variables.searchPlaceholder')}
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

          <Panel header={tp('variables.contextRules.title')} key="context_rules">
            {renderVariableList(variableCategories.context_rules)}
          </Panel>
        </Collapse>
      </Space>
    </Modal>
  )
}

export default VariableSelector
