import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Tag, Input, message } from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useMarketplaceStore } from '../stores'
import { RuleMarketplaceModal } from '../components/RuleMarketplaceModal'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const marketplaceApi = {
  install: async (id: number) => Promise.resolve()
}

const RuleMarketplace: React.FC = () => {
  const { tp } = usePageTranslation('ruleMarketplace')
  const [searchText, setSearchText] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedRule, setSelectedRule] = useState<any>(null)

  const { rules, loading, fetchRules } = useMarketplaceStore()

  useEffect(() => {
    fetchRules()
  }, [])

  const handleInstall = async (rule: any) => {
    try {
      await marketplaceApi.install(rule.id)
      message.success(tp('messages.installSuccess'))
    } catch (error) {
      message.error(tp('messages.installFailed'))
    }
  }

  const handlePreview = (rule: any) => {
    setSelectedRule(rule)
    setModalVisible(true)
  }

  const columns = [
    {
      title: tp('table.columns.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: tp('table.columns.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: tp('table.columns.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: tp('table.columns.downloads'),
      dataIndex: 'downloads',
      key: 'downloads',
      sorter: (a: any, b: any) => a.downloads - b.downloads,
    },
    {
      title: tp('table.columns.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => handlePreview(record)}>
            {tp('actions.preview')}
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleInstall(record)}
          >
            {tp('actions.install')}
          </Button>
        </Space>
      ),
    },
  ]

  const filteredRules = rules.filter(rule => {
    if (!searchText) return true
    return rule.name.toLowerCase().includes(searchText.toLowerCase()) ||
           rule.description.toLowerCase().includes(searchText.toLowerCase())
  })

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{tp('title')}</h1>
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <Input
          placeholder={tp('search.placeholder')}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredRules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <RuleMarketplaceModal
        visible={modalVisible}
        rule={selectedRule}
        onClose={() => setModalVisible(false)}
        onInstall={handleInstall}
      />
    </div>
  )
}

export default RuleMarketplace
