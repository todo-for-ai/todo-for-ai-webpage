import React, { useEffect, useState } from 'react'
import { Tabs, Typography } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { OverviewTab } from './components/MCPInstallation/OverviewTab'
import { InstallationTab } from './components/MCPInstallation/InstallationTab'

const { Title } = Typography
const { TabPane } = Tabs

const validTabs = ['overview', 'installation', 'claude', 'cursor', 'other-ides', 'configuration', 'testing']

const MCPInstallation: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab')
    return validTabs.includes(tabParam || '') ? tabParam! : 'overview'
  })

  useEffect(() => {
    document.title = 'MCP安装文档 - Todo for AI'
    return () => { document.title = 'Todo for AI' }
  }, [])

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams, activeTab])

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    const newSearchParams = new URLSearchParams(searchParams)
    if (key === 'overview') {
      newSearchParams.delete('tab')
    } else {
      newSearchParams.set('tab', key)
    }
    setSearchParams(newSearchParams, { replace: true })
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <ApiOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          MCP 安装文档
        </Title>
      </div>

      <Tabs activeKey={activeTab} onChange={handleTabChange} size="large">
        <TabPane tab="概述" key="overview">
          <OverviewTab />
        </TabPane>
        <TabPane tab="安装步骤" key="installation">
          <InstallationTab />
        </TabPane>
        <TabPane tab="Claude Desktop" key="claude">
          <div>Claude Desktop 配置详情...</div>
        </TabPane>
        <TabPane tab="Cursor IDE" key="cursor">
          <div>Cursor IDE 配置详情...</div>
        </TabPane>
        <TabPane tab="其他 IDE" key="other-ides">
          <div>其他 IDE 配置详情...</div>
        </TabPane>
        <TabPane tab="配置参数" key="configuration">
          <div>配置参数详情...</div>
        </TabPane>
        <TabPane tab="测试验证" key="testing">
          <div>测试验证详情...</div>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default MCPInstallation
