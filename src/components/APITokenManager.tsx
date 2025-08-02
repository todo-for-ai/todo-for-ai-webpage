import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Alert,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CopyOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { fetchApiClient } from '../api/fetchClient'
import { getApiBaseUrl } from '../utils/apiConfig'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const { Title, Text } = Typography
const { TextArea } = Input

interface APIToken {
  id: number
  name: string
  prefix: string
  description?: string
  is_active: boolean
  expires_at?: string
  last_used_at?: string
  created_at: string
  usage_count: number
}

export const APITokenManager: React.FC = () => {
  const [tokens, setTokens] = useState<APIToken[]>([])
  const [loading, setLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [tokenModalVisible, setTokenModalVisible] = useState(false)
  const [newToken, setNewToken] = useState<string>('')
  const [viewTokenModalVisible, setViewTokenModalVisible] = useState(false)
  const [viewingToken, setViewingToken] = useState<APIToken | null>(null)
  // 用于在View弹窗中显示完整Token的状态
  const [isTokenRevealed, setIsTokenRevealed] = useState(false)
  const [revealedTokenInView, setRevealedTokenInView] = useState<string>('')
  // 用于显示加载状态
  const [isRevealingToken, setIsRevealingToken] = useState(false)
  const [isCopyingToken, setIsCopyingToken] = useState(false)
  const [form] = Form.useForm()
  const { tp } = usePageTranslation('profile')

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    setLoading(true)
    try {
      const response = await fetchApiClient.get('/tokens')
      // 处理标准API响应格式
      const data = response?.data || response
      const tokens = data?.tokens || []
      setTokens(tokens)
    } catch (error: any) {
      message.error(tp('apiTokens.messages.fetchFailed'))
      console.error('Failed to fetch tokens:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateToken = async (values: any) => {
    try {
      const response = await fetchApiClient.post('/tokens', values)
      const data = response?.data || response

      // 显示新创建的token
      setNewToken(data.token || data.raw_token)
      setTokenModalVisible(true)
      setCreateModalVisible(false)
      form.resetFields()

      // 刷新列表
      fetchTokens()
      message.success(tp('apiTokens.messages.createSuccess'))
    } catch (error: any) {
      message.error(tp('apiTokens.messages.createFailed'))
    }
  }

  const handleDeleteToken = async (tokenId: number) => {
    try {
      await fetchApiClient.delete(`/tokens/${tokenId}`)
      message.success('Token删除成功')
      fetchTokens()
    } catch (error: any) {
      message.error(tp('apiTokens.messages.deleteFailed'))
    }
  }

  const handleViewToken = (token: APIToken) => {
    setViewingToken(token)
    setViewTokenModalVisible(true)
    // 重置Token显示状态
    setIsTokenRevealed(false)
    setRevealedTokenInView('')
  }

  // 在View弹窗中切换Token显示状态
  const handleToggleTokenInView = async (token: APIToken) => {
    if (isTokenRevealed) {
      // 如果已经显示，则隐藏
      setIsTokenRevealed(false)
      setRevealedTokenInView('')
    } else {
      // 如果未显示，则获取并显示完整Token
      setIsRevealingToken(true)
      try {
        const response = await fetchApiClient.get(`/tokens/${token.id}/reveal`)
        const data = response?.data || response

        // 检查是否有token字段（fetchApiClient可能已经解包了data）
        if (data.token) {
          setRevealedTokenInView(data.token)
          setIsTokenRevealed(true)
          message.success(tp('apiTokens.messages.revealSuccess'))
        } else if (data.success && data.data && data.data.token) {
          // 备用方案：如果数据结构是嵌套的
          setRevealedTokenInView(data.data.token)
          setIsTokenRevealed(true)
          message.success(tp('apiTokens.messages.revealSuccess'))
        } else {
          // 显示具体的错误信息
          const errorMessage = data.error || data.message || tp('apiTokens.messages.revealFailed')
          message.error(errorMessage)

          // 如果是旧Token的错误，显示更友好的提示
          if (errorMessage.includes('before the encryption feature was enabled')) {
            Modal.info({
              title: 'Token查看功能说明',
              content: (
                <div>
                  <p>此Token创建于加密功能启用之前，出于安全考虑无法显示完整内容。</p>
                  <p>如需查看完整Token，请删除此Token并创建新的Token。</p>
                  <p><strong>建议：</strong>创建新Token以启用查看功能。</p>
                </div>
              ),
              okText: '我知道了'
            })
          }
        }
      } catch (error: any) {
        console.error('Token reveal error:', error)

        // 尝试获取详细的错误信息
        let errorMessage = tp('apiTokens.messages.revealFailed')

        // 由于fetchApiClient的限制，我们需要通过重新发起请求来获取错误详情
        try {
          const response = await fetch(`${getApiBaseUrl()}/tokens/${token.id}/reveal`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          })

          if (!response.ok && response.status === 400) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          }
        } catch (fetchError) {
          console.error('Failed to get detailed error:', fetchError)
        }

        message.error(errorMessage)

        // 如果是旧Token的错误，显示更友好的提示
        if (errorMessage.includes('before the encryption feature was enabled')) {
          Modal.info({
            title: 'Token查看功能说明',
            content: (
              <div>
                <p>此Token创建于加密功能启用之前，出于安全考虑无法显示完整内容。</p>
                <p>如需查看完整Token，请删除此Token并创建新的Token。</p>
                <p><strong>建议：</strong>创建新Token以启用查看功能。</p>
              </div>
            ),
            okText: '我知道了'
          })
        }
      } finally {
        setIsRevealingToken(false)
      }
    }
  }

  const handleCopyTokenPrefix = (token: APIToken) => {
    // 复制Token前缀（这是我们能安全显示的部分）
    copyToClipboard(`${token.prefix}***`)
    message.info(tp('apiTokens.messages.copyPrefixSuccess'))
  }

  // 复制完整Token的函数
  const handleCopyFullToken = async (token: APIToken) => {
    setIsCopyingToken(true)
    try {
      // 如果已经显示了完整token，直接复制
      if (isTokenRevealed && revealedTokenInView) {
        copyToClipboard(revealedTokenInView)
        return
      }

      // 否则先获取完整token再复制
      const response = await fetchApiClient.get(`/tokens/${token.id}/reveal`)
      const data = response?.data || response

      let fullToken = ''
      if (data.token) {
        fullToken = data.token
      } else if (data.success && data.data && data.data.token) {
        fullToken = data.data.token
      } else {
        // 显示具体的错误信息
        const errorMessage = data.error || data.message || tp('apiTokens.messages.revealFailed')
        message.error(errorMessage)

        // 如果是旧Token的错误，显示更友好的提示
        if (errorMessage.includes('before the encryption feature was enabled')) {
          Modal.info({
            title: 'Token复制功能说明',
            content: (
              <div>
                <p>此Token创建于加密功能启用之前，出于安全考虑无法复制完整内容。</p>
                <p>当前只能复制Token前缀：<code>{token.prefix}***</code></p>
                <p>如需复制完整Token，请删除此Token并创建新的Token。</p>
              </div>
            ),
            okText: '我知道了'
          })
        }
        return
      }

      copyToClipboard(fullToken)
    } catch (error: any) {
      console.error('Token copy error:', error)

      // 尝试获取详细的错误信息
      let errorMessage = tp('apiTokens.messages.revealFailed')

      // 由于fetchApiClient的限制，我们需要通过重新发起请求来获取错误详情
      try {
        const response = await fetch(`${getApiBaseUrl()}/tokens/${token.id}/reveal`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })

        if (!response.ok && response.status === 400) {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        }
      } catch (fetchError) {
        console.error('Failed to get detailed error:', fetchError)
      }

      message.error(errorMessage)

      // 如果是旧Token的错误，显示更友好的提示
      if (errorMessage.includes('before the encryption feature was enabled')) {
        Modal.info({
          title: 'Token复制功能说明',
          content: (
            <div>
              <p>此Token创建于加密功能启用之前，出于安全考虑无法复制完整内容。</p>
              <p>当前只能复制Token前缀：<code>{token.prefix}***</code></p>
              <p>如需复制完整Token，请删除此Token并创建新的Token。</p>
            </div>
          ),
          okText: '我知道了'
        })
      }
    } finally {
      setIsCopyingToken(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(tp('apiTokens.messages.copySuccess'))
    }).catch(() => {
      message.error(tp('apiTokens.messages.copyFailed'))
    })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const columns = [
    {
      title: tp('apiTokens.table.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: APIToken) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: tp('apiTokens.table.prefix'),
      dataIndex: 'prefix',
      key: 'prefix',
      render: (prefix: string) => (
        <Text code>{prefix}***</Text>
      )
    },
    {
      title: tp('apiTokens.table.status'),
      key: 'status',
      render: (record: APIToken) => {
        if (!record.is_active) {
          return <Tag color="red">{tp('apiTokens.status.inactive')}</Tag>
        }
        if (isExpired(record.expires_at)) {
          return <Tag color="orange">{tp('apiTokens.status.expired')}</Tag>
        }
        return <Tag color="green">{tp('apiTokens.status.active')}</Tag>
      }
    },
    {
      title: tp('apiTokens.table.lastUsed'),
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      render: (date: string) => (
        <Text type="secondary">{formatDate(date)}</Text>
      )
    },
    {
      title: tp('apiTokens.table.usageCount'),
      dataIndex: 'usage_count',
      key: 'usage_count',
      render: (count: number) => (
        <Text>{count || 0}</Text>
      )
    },
    {
      title: tp('apiTokens.table.expiresAt'),
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (date: string) => (
        <Text type={isExpired(date) ? 'danger' : 'secondary'}>
          {date ? formatDate(date) : tp('apiTokens.table.neverExpires')}
        </Text>
      )
    },
    {
      title: tp('apiTokens.table.actions'),
      key: 'actions',
      render: (record: APIToken) => (
        <Space size="small">
          <Tooltip title={tp('apiTokens.actions.viewTooltip')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewToken(record)}
            >
              {tp('apiTokens.actions.view')}
            </Button>
          </Tooltip>
          <Tooltip title={tp('apiTokens.actions.copyPrefix')}>
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              onClick={() => handleCopyTokenPrefix(record)}
            >
              {tp('apiTokens.actions.copy')}
            </Button>
          </Tooltip>
          <Popconfirm
            title={tp('apiTokens.confirm.deleteTitle')}
            description={tp('apiTokens.confirm.deleteContent')}
            onConfirm={() => handleDeleteToken(record.id)}
            okText={tp('apiTokens.confirm.ok')}
            cancelText={tp('apiTokens.confirm.cancel')}
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              {tp('apiTokens.actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>{tp('apiTokens.title')}</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              {tp('apiTokens.createToken')}
            </Button>
          </div>
        }
      >


        <Table
          columns={columns}
          dataSource={tokens}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => tp('apiTokens.pagination.total', { total })
          }}
        />
      </Card>

      {/* 创建Token模态框 */}
      <Modal
        title={tp('apiTokens.createTitle')}
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateToken}
        >
          <Form.Item
            label={tp('apiTokens.tokenName')}
            name="name"
            rules={[
              { required: true, message: tp('apiTokens.validation.nameRequired') },
              { min: 2, max: 50, message: tp('apiTokens.validation.nameLength') }
            ]}
          >
            <Input placeholder={tp('apiTokens.placeholders.tokenName')} />
          </Form.Item>

          <Form.Item
            label={tp('apiTokens.description')}
            name="description"
          >
            <TextArea
              rows={3}
              placeholder={tp('apiTokens.placeholders.description')}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            label={tp('apiTokens.expireDays')}
            name="expires_days"
            help={tp('apiTokens.expireHelp')}
          >
            <InputNumber
              min={1}
              max={365}
              placeholder="如：30"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {tp('apiTokens.createToken')}
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false)
                form.resetFields()
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 显示新Token模态框 */}
      <Modal
        title={tp('apiTokens.modals.tokenCreated.title')}
        open={tokenModalVisible}
        onCancel={() => setTokenModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTokenModalVisible(false)}>
            {tp('buttons.close')}
          </Button>
        ]}
        width={600}
      >
        <Alert
          message={tp('apiTokens.modals.tokenCreated.saveWarning')}
          description={tp('apiTokens.modals.tokenCreated.saveDescription')}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '6px',
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          marginBottom: 16
        }}>
          {newToken}
        </div>

        <Button
          type="primary"
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(newToken)}
          block
        >
          {tp('apiTokens.modals.tokenCreated.copyToken')}
        </Button>
      </Modal>

      {/* 查看Token详情模态框 */}
      <Modal
        title={tp('apiTokens.modals.tokenDetails.title')}
        open={viewTokenModalVisible}
        onCancel={() => {
          setViewTokenModalVisible(false)
          setViewingToken(null)
          setIsTokenRevealed(false)
          setRevealedTokenInView('')
          setIsRevealingToken(false)
          setIsCopyingToken(false)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewTokenModalVisible(false)
            setViewingToken(null)
            setIsTokenRevealed(false)
            setRevealedTokenInView('')
            setIsRevealingToken(false)
            setIsCopyingToken(false)
          }}>
            {tp('buttons.close')}
          </Button>
        ]}
        width={600}
      >
        {viewingToken && (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong>{tp('apiTokens.modals.tokenDetails.name')}</Text>
                <Text>{viewingToken.name}</Text>
              </div>

              {viewingToken.description && (
                <div>
                  <Text strong>{tp('apiTokens.modals.tokenDetails.description')}</Text>
                  <Text>{viewingToken.description}</Text>
                </div>
              )}

              <div>
                <Text strong>{tp('apiTokens.modals.tokenDetails.token')}</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div style={{
                    background: '#f5f5f5',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    border: '1px solid #d9d9d9',
                    flex: 1,
                    wordBreak: 'break-all'
                  }}>
                    {isTokenRevealed ? revealedTokenInView : `${viewingToken.prefix}***`}
                  </div>
                  <Tooltip title={isTokenRevealed ? tp('apiTokens.actions.hideToken') : tp('apiTokens.actions.showToken')}>
                    <Button
                      type="text"
                      icon={isTokenRevealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      size="small"
                      loading={isRevealingToken}
                      onClick={() => handleToggleTokenInView(viewingToken)}
                    />
                  </Tooltip>
                  <Tooltip title={tp('apiTokens.actions.copyToken')}>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      size="small"
                      loading={isCopyingToken}
                      onClick={() => handleCopyFullToken(viewingToken)}
                    />
                  </Tooltip>
                </div>
              </div>

              <div>
                <Text strong>{tp('apiTokens.modals.tokenDetails.status')}</Text>
                {!viewingToken.is_active ? (
                  <Tag color="red">{tp('apiTokens.modals.tokenDetails.statusLabels.inactive')}</Tag>
                ) : isExpired(viewingToken.expires_at) ? (
                  <Tag color="orange">{tp('apiTokens.modals.tokenDetails.statusLabels.expired')}</Tag>
                ) : (
                  <Tag color="green">{tp('apiTokens.modals.tokenDetails.statusLabels.active')}</Tag>
                )}
              </div>

              <div>
                <Text strong>{tp('apiTokens.modals.tokenDetails.createdAt')}</Text>
                <Text>{formatDate(viewingToken.created_at)}</Text>
              </div>

              <div>
                <Text strong>{tp('apiTokens.modals.tokenDetails.expiresAt')}</Text>
                <Text type={isExpired(viewingToken.expires_at) ? 'danger' : 'secondary'}>
                  {viewingToken.expires_at ? formatDate(viewingToken.expires_at) : tp('apiTokens.modals.tokenDetails.neverExpires')}
                </Text>
              </div>

              <div>
                <Text strong>{tp('apiTokens.modals.tokenDetails.lastUsed')}</Text>
                <Text type="secondary">{formatDate(viewingToken.last_used_at)}</Text>
              </div>

              <div>
                <Text strong>{tp('apiTokens.modals.tokenDetails.usageCount')}</Text>
                <Text>{viewingToken.usage_count || 0}</Text>
              </div>

              <Alert
                message={tp('apiTokens.modals.tokenDetails.securityTip')}
                description={tp('apiTokens.modals.tokenDetails.securityDescription')}
                type="info"
                showIcon
              />
            </Space>
          </div>
        )}
      </Modal>


    </div>
  )
}
