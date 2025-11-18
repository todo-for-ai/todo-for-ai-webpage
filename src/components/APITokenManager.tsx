import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Space, Tag, Modal, Form, Input, message, Popconfirm, Tooltip } from 'antd'
import { PlusOutlined, DeleteOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons'
import { apiTokensApi } from '../api/apiTokens'
import type { ApiToken } from '../api/apiTokens'

const APITokenManager: React.FC = () => {
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
      message.error('加载API Token失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateToken = async (values: any) => {
    try {
      await apiTokensApi.create(values)
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      loadTokens()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleDeleteToken = async (tokenId: number) => {
    try {
      await apiTokensApi.delete(tokenId)
      message.success('删除成功')
      loadTokens()
    } catch (error) {
      message.error('删除失败')
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
      message.success('已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Token',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: ApiToken) => (
        <Space>
          <Popconfirm
            title="确定要删除这个Token吗？"
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
        <h1>API Token 管理</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          创建 Token
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
        title="创建 API Token"
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
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="给这个Token起个名字" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default APITokenManager
