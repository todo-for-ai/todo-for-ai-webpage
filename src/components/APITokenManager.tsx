import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, message, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, DeleteOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons'
import { apiTokensApi } from '../api/apiTokens'
import type { ApiToken } from '../api/apiTokens'
import { useTranslation } from '../i18n/hooks/useTranslation'

const APITokenManager: React.FC = () => {
  const { tc } = useTranslation()
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [visibleTokens, setVisibleTokens] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = async () => {
    setLoading(true)
    try {
      const result = await apiTokensApi.list()
      setTokens(result)
    } catch (error) {
      message.error(tc('apiTokenManager.messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateToken = async (values: any) => {
    try {
      await apiTokensApi.create(values)
      message.success(tc('apiTokenManager.messages.createSuccess'))
      setModalVisible(false)
      form.resetFields()
      loadTokens()
    } catch (error) {
      message.error(tc('apiTokenManager.messages.createFailed'))
    }
  }

  const handleDeleteToken = async (tokenId: number) => {
    try {
      await apiTokensApi.delete(tokenId)
      message.success(tc('apiTokenManager.messages.deleteSuccess'))
      loadTokens()
    } catch (error) {
      message.error(tc('apiTokenManager.messages.deleteFailed'))
    }
  }

  const toggleTokenVisibility = (tokenId: number) => {
    const newVisible = new Set(visibleTokens)
    if (newVisible.has(tokenId)) {
      newVisible.delete(tokenId)
    } else {
      newVisible.add(tokenId)
    }
    setVisibleTokens(newVisible)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(tc('apiTokenManager.messages.copySuccess'))
    }).catch(() => {
      message.error(tc('apiTokenManager.messages.copyFailed'))
    })
  }

  const columns = [
    {
      title: tc('apiTokenManager.table.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: tc('apiTokenManager.table.token'),
      dataIndex: 'token',
      key: 'token',
      render: (token: string, record: ApiToken) => (
        <Space>
          <code>
            {visibleTokens.has(record.id) ? token : '*'.repeat(20)}
          </code>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => toggleTokenVisibility(record.id)}
          />
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(token)}
          />
        </Space>
      ),
    },
    {
      title: tc('apiTokenManager.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? tc('status.active') : tc('status.disabled')}
        </Tag>
      ),
    },
    {
      title: tc('apiTokenManager.table.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: tc('apiTokenManager.table.actions'),
      key: 'actions',
      render: (_, record: ApiToken) => (
        <Space>
          <Popconfirm
            title={tc('apiTokenManager.confirmDelete')}
            onConfirm={() => handleDeleteToken(record.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{tc('apiTokenManager.title')}</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          {tc('apiTokenManager.create')}
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={tokens}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={tc('apiTokenManager.modalTitle')}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateToken}>
          <Form.Item
            name="name"
            label={tc('apiTokenManager.table.name')}
            rules={[{ required: true, message: tc('apiTokenManager.validation.nameRequired') }]}
          >
            <Input placeholder={tc('apiTokenManager.namePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default APITokenManager
