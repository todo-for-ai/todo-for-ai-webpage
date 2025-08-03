import React, { useState, useEffect } from 'react'
import { Card, Tabs, Typography, Space } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../i18n/hooks/useTranslation'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { ProjectPromptEditor, TaskPromptButtons } from '../components/CustomPrompts'

const { Title, Paragraph } = Typography

const CustomPrompts: React.FC = () => {
  const { t } = useTranslation()
  const { tp } = usePageTranslation('customPrompts')
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('project-prompts')

  // 设置页面标题
  useEffect(() => {
    document.title = tp('pageTitle')
  }, [tp])

  // 处理变量文档点击
  const handleVariableDocsClick = () => {
    navigate('/todo-for-ai/pages/variable-docs')
  }

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 页面标题 */}
        <div>
          <Title level={2}>
            <EditOutlined style={{ marginRight: '8px' }} />
            {tp('title')}
          </Title>
          <Paragraph type="secondary">
            {tp('description')}
          </Paragraph>
        </div>

        {/* 主要内容 */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'project-prompts',
                label: (
                  <span>
                    <EditOutlined />
                    {tp('tabs.projectPrompts')}
                  </span>
                ),
                children: (
                  <ProjectPromptEditor onVariableDocsClick={handleVariableDocsClick} />
                )
              },
              {
                key: 'task-prompts',
                label: (
                  <span>
                    <EditOutlined />
                    {tp('tabs.taskPrompts')}
                  </span>
                ),
                children: (
                  <TaskPromptButtons onVariableDocsClick={handleVariableDocsClick} />
                )
              }
            ]}
          />
        </Card>
      </Space>
    </div>
  )
}

export default CustomPrompts
