import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Tag, Input, message, Modal } from 'antd'
import { PlusOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useMarketplaceStore } from '../stores'
import { RuleMarketplaceFilter } from '../components/RuleMarketplaceFilter'
import { RuleMarketplaceModal } from '../components/RuleMarketplaceModal'

const RuleMarketplace: React.FC = () => {
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
      message.success('安装成功')
    } catch (error) {
      message.error('安装失败')
    }
  }

  const handlePreview = (rule: any) => {
    setSelectedRule(rule)
    setModalVisible(true)
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: '下载量',
      dataIndex: 'downloads',
      key: 'downloads',
      sorter: (a: any, b: any) => a.downloads - b.downloads,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => handlePreview(record)}>
            预览
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleInstall(record)}
          >
            安装
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
        <h1>规则市场</h1>
      </div>

      <Card style={{ marginBottom: '16px' }}>
        <Input
          placeholder="搜索规则..."
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
