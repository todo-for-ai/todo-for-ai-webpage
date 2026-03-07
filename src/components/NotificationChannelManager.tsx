import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { NotificationChannel } from '../api/agents/automationTypes'
import { useNotificationCatalog, useNotificationChannels, notificationChannelTypeOptions } from '../modules/notifications'

const { Paragraph, Text } = Typography

type ScopeType = 'user' | 'project' | 'organization'

interface NotificationChannelManagerProps {
  scopeType: ScopeType
  scopeId: number
  title?: string
  description?: string
  canManage?: boolean
}

const toCsv = (value: unknown) => Array.isArray(value) ? value.join(', ') : ''
const fromCsv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)

export const NotificationChannelManager = ({
  scopeType,
  scopeId,
  title = '外部通知渠道',
  description = '为当前范围配置外部通知同步规则。',
  canManage = true,
}: NotificationChannelManagerProps) => {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null)
  const [channelType, setChannelType] = useState<string>('webhook')
  const { loading, items, reload, createChannel, updateChannel, deleteChannel } = useNotificationChannels(scopeType, scopeId)
  const { items: catalog } = useNotificationCatalog()

  const eventOptions = useMemo(
    () => catalog.filter((item) => item.supports_external).map((item) => ({
      label: `${item.title}（${item.event_type}）`,
      value: item.event_type,
    })),
    [catalog],
  )

  const openCreateModal = () => {
    setEditingChannel(null)
    setChannelType('webhook')
    form.resetFields()
    form.setFieldsValue({
      enabled: true,
      events: [],
      channel_type: 'webhook',
    })
    setVisible(true)
  }

  const openEditModal = (item: NotificationChannel) => {
    setEditingChannel(item)
    setChannelType(item.channel_type)
    form.setFieldsValue({
      name: item.name,
      channel_type: item.channel_type,
      enabled: item.enabled,
      events: item.events || [],
      webhook_url: item.config?.webhook_url || item.config?.url || '',
      secret: item.config?.secret === '******' ? '' : (item.config?.secret || ''),
      headers_json: item.config?.headers ? JSON.stringify(item.config.headers, null, 2) : '',
      mentioned_list: toCsv(item.config?.mentioned_list),
      mentioned_mobile_list: toCsv(item.config?.mentioned_mobile_list),
      at_mobiles: toCsv(item.config?.at_mobiles),
    })
    setVisible(true)
  }

  const buildConfig = (values: any) => {
    const type = values.channel_type
    const webhookUrl = String(values.webhook_url || '').trim()
    if (type === 'webhook') {
      let headers = {}
      if (values.headers_json) {
        headers = JSON.parse(values.headers_json)
      }
      return {
        url: webhookUrl,
        headers,
      }
    }
    if (type === 'feishu') {
      return {
        webhook_url: webhookUrl,
        secret: values.secret || undefined,
      }
    }
    if (type === 'wecom') {
      return {
        webhook_url: webhookUrl,
        mentioned_list: fromCsv(values.mentioned_list || ''),
        mentioned_mobile_list: fromCsv(values.mentioned_mobile_list || ''),
      }
    }
    if (type === 'dingtalk') {
      return {
        webhook_url: webhookUrl,
        secret: values.secret || undefined,
        at_mobiles: fromCsv(values.at_mobiles || ''),
      }
    }
    return {}
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const payload = {
        name: values.name,
        channel_type: values.channel_type,
        enabled: values.enabled,
        events: values.events || [],
        config: buildConfig(values),
      }

      if (editingChannel) {
        await updateChannel(editingChannel.id, payload)
        message.success('通知渠道已更新')
      } else {
        await createChannel(payload)
        message.success('通知渠道已创建')
      }

      setVisible(false)
      form.resetFields()
      await reload()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || '保存通知渠道失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: NotificationChannel) => {
    try {
      await deleteChannel(item.id)
      message.success('通知渠道已删除')
      await reload()
    } catch (error: any) {
      message.error(error?.message || '删除通知渠道失败')
    }
  }

  return (
    <Card
      title={title}
      extra={canManage ? (
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          新增渠道
        </Button>
      ) : null}
    >
      <Paragraph type="secondary" style={{ marginTop: -8 }}>
        {description}
      </Paragraph>

      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: '当前还没有配置通知渠道' }}
        renderItem={(item) => (
          <List.Item
            actions={canManage ? [
              <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => openEditModal(item)}>
                编辑
              </Button>,
              <Popconfirm
                key="delete"
                title="确认删除该通知渠道？"
                okText="删除"
                cancelText="取消"
                onConfirm={() => void handleDelete(item)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>,
            ] : []}
          >
            <List.Item.Meta
              title={(
                <Space wrap>
                  <Text strong>{item.name}</Text>
                  <Tag color="blue">{item.channel_type}</Tag>
                  <Tag color={item.enabled ? 'green' : 'default'}>
                    {item.enabled ? '启用中' : '已停用'}
                  </Tag>
                </Space>
              )}
              description={(
                <Space direction="vertical" size={4}>
                  <Text type="secondary">
                    事件：{item.events?.length ? item.events.join('、') : '全部事件'}
                  </Text>
                  {item.config?.url && <Text type="secondary">Webhook: {item.config.url}</Text>}
                  {item.config?.webhook_url && <Text type="secondary">Webhook: {item.config.webhook_url}</Text>}
                </Space>
              )}
            />
          </List.Item>
        )}
      />

      <Modal
        title={editingChannel ? '编辑通知渠道' : '新增通知渠道'}
        open={visible}
        onOk={() => void handleSubmit()}
        onCancel={() => setVisible(false)}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="渠道名称"
            name="name"
            rules={[{ required: true, message: '请输入渠道名称' }]}
          >
            <Input placeholder="例如：项目群机器人" />
          </Form.Item>

          <Form.Item
            label="渠道类型"
            name="channel_type"
            rules={[{ required: true, message: '请选择渠道类型' }]}
          >
            <Select options={notificationChannelTypeOptions} onChange={(value) => setChannelType(value)} />
          </Form.Item>

          <Form.Item
            label="通知事件"
            name="events"
            extra="留空表示当前范围的全部事件都会同步。"
          >
            <Select mode="multiple" allowClear options={eventOptions} placeholder="选择需要同步的事件" />
          </Form.Item>

          <Form.Item label="启用状态" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            label="Webhook 地址"
            name="webhook_url"
            rules={[{ required: true, message: '请输入 Webhook 地址' }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          {channelType === 'webhook' && (
            <Form.Item
              label="自定义请求头 JSON"
              name="headers_json"
              extra='例如：{"Authorization":"Bearer token"}'
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          )}

          {(channelType === 'feishu' || channelType === 'dingtalk') && (
            <Form.Item label="签名密钥（可选）" name="secret">
              <Input.Password placeholder="如平台启用了签名校验，可在此填写" />
            </Form.Item>
          )}

          {channelType === 'wecom' && (
            <>
              <Form.Item label="提及成员（逗号分隔）" name="mentioned_list">
                <Input placeholder="user1, user2" />
              </Form.Item>
              <Form.Item label="提及手机号（逗号分隔）" name="mentioned_mobile_list">
                <Input placeholder="13800000000, 13900000000" />
              </Form.Item>
            </>
          )}

          {channelType === 'dingtalk' && (
            <Form.Item label="@手机号（逗号分隔）" name="at_mobiles">
              <Input placeholder="13800000000, 13900000000" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  )
}

export default NotificationChannelManager
