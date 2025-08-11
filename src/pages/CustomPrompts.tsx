import React, { useState, useEffect } from 'react'
import { Card, Tabs, Typography, Space } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from '../i18n/hooks/useTranslation'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { ProjectPromptEditor, TaskPromptButtons } from '../components/CustomPrompts'

const { Title, Paragraph } = Typography

const CustomPrompts: React.FC = () => {
  const { t } = useTranslation()
  const { tp } = usePageTranslation('customPrompts')
  const navigate = useNavigate()
  const location = useLocation()

  // 根据当前路径确定活跃的标签页
  const getActiveTabFromPath = () => {
    const path = location.pathname
    if (path.includes('/task-prompts')) {
      return 'task-prompts'
    } else {
      return 'project-prompts' // 默认为项目提示词
    }
  }

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath())

  // 监听路径变化，更新活跃标签页
  useEffect(() => {
    const newActiveTab = getActiveTabFromPath()
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab)
    }
  }, [location.pathname])

  // 设置页面标题
  useEffect(() => {
    document.title = tp('pageTitle')
  }, [tp])

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    // 更新URL路径
    navigate(`/todo-for-ai/pages/custom-prompts/${key}`, { replace: true })
  }

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
            onChange={handleTabChange}
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
