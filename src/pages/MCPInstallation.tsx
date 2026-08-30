import React, { useEffect, useState } from 'react'
import { Alert, Card, List, Tabs, Typography } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography

const validTabs = ['skill', 'mcp', 'openclaw']

const MCPInstallation: React.FC = () => {
  const { tp } = usePageTranslation('mcpInstallation')
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab')
    return validTabs.includes(tabParam || '') ? tabParam! : 'skill'
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
    if (key === 'skill') {
      newSearchParams.delete('tab')
    } else {
      newSearchParams.set('tab', key)
    }
    setSearchParams(newSearchParams, { replace: true })
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Title level={2}>
          <ApiOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          {tp('title')}
        </Title>
        <Paragraph type="secondary">{tp('subtitle')}</Paragraph>
      </div>

      <Tabs activeKey={activeTab} onChange={handleTabChange} size="large" items={[
        {
          key: 'skill',
          label: tp('tabs.skill'),
          children: (
            <Card>
              <Title level={4}>{tp('skill.title')}</Title>
              <Paragraph>{tp('skill.description')}</Paragraph>
              <Alert
                type="info"
                showIcon
                message={tp('skill.alertTitle')}
                description={tp('skill.alertDescription')}
                style={{ marginBottom: 16 }}
              />
              <Paragraph>
                <Text code>{tp('skill.pathLabel')}</Text>: <Text>{tp('skill.pathValue')}</Text>
              </Paragraph>
              <List
                header={<strong>{tp('skill.stepsTitle')}</strong>}
                dataSource={[
                  tp('skill.steps.0'),
                  tp('skill.steps.1'),
                  tp('skill.steps.2'),
                  tp('skill.steps.3'),
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          )
        },
        {
          key: 'mcp',
          label: tp('tabs.mcp'),
          children: (
            <Card>
              <Title level={4}>{tp('mcp.title')}</Title>
              <Paragraph>{tp('mcp.description')}</Paragraph>
              <Paragraph>
                <Text strong>{tp('mcp.commandTitle')}</Text>
              </Paragraph>
              <Paragraph>
                <Text code>{tp('mcp.command')}</Text>
              </Paragraph>
              <List
                header={<strong>{tp('mcp.recommendationsTitle')}</strong>}
                dataSource={[
                  tp('mcp.recommendations.0'),
                  tp('mcp.recommendations.1'),
                  tp('mcp.recommendations.2'),
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          )
        },
        {
          key: 'openclaw',
          label: tp('tabs.openclaw'),
          children: (
            <Card>
              <Title level={4}>{tp('openclaw.title')}</Title>
              <Paragraph>{tp('openclaw.description')}</Paragraph>
              <Paragraph>
                <Text strong>{tp('openclaw.protocolTitle')}</Text>
              </Paragraph>
              <List
                dataSource={[
                  tp('openclaw.protocol.0'),
                  tp('openclaw.protocol.1'),
                  tp('openclaw.protocol.2'),
                  tp('openclaw.protocol.3'),
                ]}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
              <Alert type="warning" showIcon message={tp('openclaw.notice')} />
            </Card>
          )
        }
      ]} />
    </div>
  )
}

export default MCPInstallation
