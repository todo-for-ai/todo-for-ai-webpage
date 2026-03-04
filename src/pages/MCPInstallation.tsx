import React, { useEffect, useState } from 'react'
import { Tabs, Typography } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { OverviewTab } from './components/MCPInstallation/OverviewTab'
import { InstallationTab } from './components/MCPInstallation/InstallationTab'
import { ClaudeTab } from './components/MCPInstallation/ClaudeTab'
import { CursorTab } from './components/MCPInstallation/CursorTab'
import { OtherIdesTab } from './components/MCPInstallation/OtherIdesTab'
import { ConfigurationTab } from './components/MCPInstallation/ConfigurationTab'
import { TestingTab } from './components/MCPInstallation/TestingTab'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const { Title } = Typography
const { TabPane } = Tabs

const validTabs = ['overview', 'installation', 'claude', 'cursor', 'other-ides', 'configuration', 'testing']

const MCPInstallation: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab')
    return validTabs.includes(tabParam || '') ? tabParam! : 'overview'
  })

  useEffect(() => {
    document.title = tp('pageTitle')
    return () => { document.title = 'Todo for AI' }
  }, [tp])

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
          {tp('title')}
        </Title>
      </div>

      <Tabs activeKey={activeTab} onChange={handleTabChange} size="large">
        <TabPane tab={tp('tabs.overview')} key="overview">
          <OverviewTab />
        </TabPane>
        <TabPane tab={tp('tabs.installation')} key="installation">
          <InstallationTab />
        </TabPane>
        <TabPane tab={tp('tabs.claude')} key="claude">
          <ClaudeTab />
        </TabPane>
        <TabPane tab={tp('tabs.cursor')} key="cursor">
          <CursorTab />
        </TabPane>
        <TabPane tab={tp('tabs.otherIdes')} key="other-ides">
          <OtherIdesTab />
        </TabPane>
        <TabPane tab={tp('tabs.configuration')} key="configuration">
          <ConfigurationTab />
        </TabPane>
        <TabPane tab={tp('tabs.testing')} key="testing">
          <TestingTab />
        </TabPane>
      </Tabs>
    </div>
  )
}

export default MCPInstallation
