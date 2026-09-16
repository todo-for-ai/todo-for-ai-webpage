/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react'
import {
  Alert, Badge, Button, Card, Drawer, Empty, Form, Input, InputNumber, Modal, Select,
  Space, Switch, Table, Tabs, Tag, Typography, message,
} from 'antd'
import {
  ApiOutlined, BellOutlined, DeleteOutlined, LinkOutlined, PlusOutlined, ReloadOutlined, SendOutlined,
} from '@ant-design/icons'
import { integrationsApi, WEBHOOK_EVENT_OPTIONS } from '../api/integrations'
import type { ConnectorConfig, ConnectorProvider, WebhookDelivery, WebhookSubscription } from '../api/integrations'

const { Text, Title } = Typography

/** 每个入站连接器的 UI 元信息（ingest 路径与后端路由一致） */
const CONNECTOR_META: Record<string, { title: string; ingestPath: (wsId: number) => string; secretLabel: string; secretPlaceholder: string; desc: string }> = {
  lark: {
    title: '飞书（Lark）',
    ingestPath: (wsId) => `/todo-for-ai/api/v1/connectors/lark/${wsId}/ingest`,
    secretLabel: '凭据 JSON（verification_token / app_id / app_secret）',
    secretPlaceholder: '{"verification_token":"...","app_id":"cli_xxx","app_secret":"..."}',
    desc: '在飞书开放平台创建自建应用，事件订阅指向下方回调地址；群里 @机器人 发消息即自动建任务并回执卡片。',
  },
  wecom: {
    title: '企业微信（WeCom）',
    ingestPath: (wsId) => `/todo-for-ai/api/v1/connectors/wecom/${wsId}/callback`,
    secretLabel: '凭据 JSON（token / encoding_aes_key / corp_secret）',
    secretPlaceholder: '{"token":"...","encoding_aes_key":"...","corp_secret":"..."}',
    desc: '企业微信自建应用接收消息回调（GET 验证 + 加密消息）；用户发文本即自动建任务并应用消息回执。',
  },
  generic: {
    title: '通用 Webhook',
    ingestPath: (wsId) => `/todo-for-ai/api/v1/connectors/generic/${wsId}/ingest`,
    secretLabel: 'X-Todo4AI-Token',
    secretPlaceholder: '自定义调用令牌',
    desc: '任何能发 HTTP 的内部系统（OA / 工单 / 告警）零适配接入：POST JSON + 字段映射模板。',
  },
}

interface IntegrationsPageProps {
  workspaceId?: number
}

/** 工作区选择：取当前用户第一个组织，可从组织详情页带 workspaceId 进入 */
const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ workspaceId: propWsId }) => {
  const [wsId, setWsId] = useState<number | null>(propWsId ?? null)
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([])
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<ConnectorProvider | null>(null)
  const [form] = Form.useForm()
  const [webhookModal, setWebhookModal] = useState(false)
  const [webhookForm] = Form.useForm()
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [deliverySub, setDeliverySub] = useState<WebhookSubscription | null>(null)
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])

  const loadAll = useCallback(async (ws: number) => {
    setLoading(true)
    try {
      const [conns, hooks] = await Promise.all([
        integrationsApi.listConnectors(ws),
        integrationsApi.listWebhooks(ws),
      ])
      setConnectors(conns)
      setWebhooks(hooks)
    } catch (e: any) {
      message.error(`加载集成配置失败：${e?.message || e}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (propWsId) { setWsId(propWsId); return }
    // 从当前用户组织推断工作区
    ;(async () => {
      try {
        const { organizationsApi } = await import('../api/organizations')
        const data = await organizationsApi.getOrganizations()
        const items = (data as any)?.items ?? []
        if (items?.length) {
          setWsId(items[0].id)
        }
      } catch { /* 未登录/无组织时静默 */ }
    })()
  }, [propWsId])

  useEffect(() => {
    if (wsId) loadAll(wsId)
  }, [wsId, loadAll])

  const openEdit = (provider: ConnectorProvider) => {
    const existing = connectors.find((c) => c.provider === provider)
    form.setFieldsValue({
      enabled: existing?.enabled ?? false,
      default_project_id: existing?.default_project_id ?? null,
      secret: '',
      api_base: existing?.config_json?.api_base ?? '',
      chats_json: existing?.config_json?.chats ? JSON.stringify(existing.config_json.chats, null, 2) : '',
      mapping_json: existing?.config_json?.mapping ? JSON.stringify(existing.config_json.mapping, null, 2) : '',
      corp_id: existing?.config_json?.corp_id ?? '',
      agent_id: existing?.config_json?.agent_id ?? null,
    })
    setEditing(provider)
  }

  const saveConnector = async () => {
    if (!wsId || !editing) return
    try {
      const values = await form.validateFields()
      const config_json: Record<string, any> = {}
      if (values.api_base) config_json.api_base = values.api_base
      if (values.chats_json) {
        try { config_json.chats = JSON.parse(values.chats_json) } catch {
          message.error('群路由映射必须是合法 JSON'); return
        }
      }
      if (values.mapping_json) {
        try { config_json.mapping = JSON.parse(values.mapping_json) } catch {
          message.error('字段映射必须是合法 JSON'); return
        }
      }
      if (values.corp_id) config_json.corp_id = values.corp_id
      if (values.agent_id) config_json.agent_id = Number(values.agent_id)

      await integrationsApi.configureConnector(wsId, editing, {
        enabled: !!values.enabled,
        secret: values.secret || undefined,
        default_project_id: values.default_project_id ?? null,
        config_json,
      })
      message.success('已保存')
      setEditing(null)
      loadAll(wsId)
    } catch (e: any) {
      if (e?.errorFields) return // 表单校验错误
      message.error(`保存失败：${e?.message || e}`)
    }
  }

  const copyIngestUrl = (provider: ConnectorProvider) => {
    if (!wsId) return
    const url = `${window.location.origin}${CONNECTOR_META[provider].ingestPath(wsId)}`
    navigator.clipboard.writeText(url)
    message.success('回调地址已复制')
  }

  const handleCreateWebhook = async () => {
    if (!wsId) return
    try {
      const values = await webhookForm.validateFields()
      const result = await integrationsApi.createWebhook(wsId, {
        url: values.url,
        events: values.events,
        secret: values.secret || undefined,
        description: values.description,
      })
      setCreatedSecret(result.secret)
      setWebhookModal(false)
      webhookForm.resetFields()
      loadAll(wsId)
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(`创建失败：${e?.message || e}`)
    }
  }

  const pingWebhook = async (sub: WebhookSubscription) => {
    if (!wsId) return
    try {
      const delivery = await integrationsApi.pingWebhook(wsId, sub.id)
      if (delivery.ok) message.success(`测试事件投递成功（${delivery.duration_ms}ms）`)
      else message.error(`投递失败：${delivery.error || `HTTP ${delivery.status_code}`}`)
      loadAll(wsId)
    } catch (e: any) {
      message.error(`ping 失败：${e?.message || e}`)
    }
  }

  const removeWebhook = (sub: WebhookSubscription) => {
    if (!wsId) return
    Modal.confirm({
      title: '删除该 Webhook 订阅？',
      content: sub.url,
      okText: '删除',
      okType: 'danger',
      onOk: async () => {
        await integrationsApi.deleteWebhook(wsId, sub.id)
        message.success('已删除')
        loadAll(wsId)
      },
    })
  }

  const showDeliveries = async (sub: WebhookSubscription) => {
    if (!wsId) return
    setDeliverySub(sub)
    setDeliveries(await integrationsApi.listWebhookDeliveries(wsId, sub.id))
  }

  const connectorCard = (provider: ConnectorProvider) => {
    const meta = CONNECTOR_META[provider]
    const config = connectors.find((c) => c.provider === provider)
    return (
      <Card
        key={provider}
        size="small"
        title={<Space>{meta.title}{config?.enabled ? <Badge status="success" text="已启用" /> : <Badge status="default" text="未启用" />}</Space>}
        extra={<Button size="small" type="primary" ghost onClick={() => openEdit(provider)}>配置</Button>}
        style={{ borderRadius: 6 }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>{meta.desc}</Text>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Text code style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {wsId ? `${window.location.origin}${meta.ingestPath(wsId)}` : '—'}
          </Text>
          <Button size="small" icon={<LinkOutlined />} onClick={() => copyIngestUrl(provider)}>复制</Button>
        </div>
      </Card>
    )
  }

  const webhookColumns = [
    { title: 'URL', dataIndex: 'url', ellipsis: true },
    { title: '事件', dataIndex: 'events', width: 200, render: (evs: string[]) => (
      <Space size={4} wrap>{evs.map((e) => <Tag key={e} color={e === '*' ? 'blue' : 'cyan'} style={{ borderRadius: 4 }}>{e}</Tag>)}</Space>
    ) },
    { title: '状态', dataIndex: 'active', width: 80, render: (v: boolean) => v ? <Tag color="green">启用</Tag> : <Tag>停用</Tag> },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '操作', width: 240, render: (_: any, record: WebhookSubscription) => (
      <Space size={4}>
        <Button size="small" icon={<SendOutlined />} onClick={() => pingWebhook(record)}>测试</Button>
        <Button size="small" onClick={() => showDeliveries(record)}>记录</Button>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeWebhook(record)} />
      </Space>
    ) },
  ]

  const deliveryColumns = [
    { title: '事件', dataIndex: 'event_type', width: 160 },
    { title: '结果', dataIndex: 'ok', width: 80, render: (v: boolean) => v ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag> },
    { title: 'HTTP', dataIndex: 'status_code', width: 70 },
    { title: '尝试', dataIndex: 'attempts', width: 60 },
    { title: '耗时', dataIndex: 'duration_ms', width: 90, render: (v: number | null) => v != null ? `${v}ms` : '—' },
    { title: '错误', dataIndex: 'error', ellipsis: true },
    { title: '时间', dataIndex: 'created_at', width: 170, render: (v: string) => v ? new Date(v).toLocaleString() : '—' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={4} style={{ marginBottom: 4 }}><ApiOutlined /> 集成中心</Title>
      <Text type="secondary">把平台接入企业内部：IM 机器人入站建任务（飞书 / 企业微信 / 通用 Webhook）+ 出站事件订阅推送。</Text>
      {!wsId && <Alert style={{ marginTop: 12 }} type="info" showIcon message="尚未定位到工作区，请先创建组织或从组织详情进入本页。" />}
      {wsId && (
        <Tabs
          style={{ marginTop: 12 }}
          items={[
            {
              key: 'inbound',
              label: <span><BellOutlined /> 入站集成</span>,
              children: (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
                  {connectorCard('lark')}
                  {connectorCard('wecom')}
                  {connectorCard('generic')}
                </div>
              ),
            },
            {
              key: 'webhooks',
              label: <span><ApiOutlined /> 出站 Webhook</span>,
              children: (
                <>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">任务创建 / 状态变更 / 完成 / 失败 事件将以 HMAC 签名推送到订阅地址。</Text>
                    <Space>
                      <Button icon={<ReloadOutlined />} onClick={() => wsId && loadAll(wsId)} />
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setWebhookModal(true)}>新建订阅</Button>
                    </Space>
                  </div>
                  <Table
                    rowKey="id"
                    size="small"
                    loading={loading}
                    columns={webhookColumns as any}
                    dataSource={webhooks}
                    locale={{ emptyText: <Empty description="暂无订阅" /> }}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                  />
                </>
              ),
            },
          ]}
        />
      )}

      {/* 连接器配置抽屉 */}
      <Drawer
        title={editing ? `配置 ${CONNECTOR_META[editing].title}` : ''}
        open={!!editing}
        onClose={() => setEditing(null)}
        width={480}
        extra={<Button type="primary" onClick={saveConnector}>保存</Button>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="enabled" valuePropName="checked" label={<span>启用连接器 <Text type="secondary" style={{ fontSize: 12 }}>(关闭时回调返回 not enabled)</Text></span>}>
            <Switch />
          </Form.Item>
          <Form.Item name="secret" label={editing ? CONNECTOR_META[editing].secretLabel : ''} extra="留空则保持原值不变">
            <Input.TextArea rows={2} placeholder={editing ? CONNECTOR_META[editing].secretPlaceholder : ''} />
          </Form.Item>
          <Form.Item name="default_project_id" label="默认落地项目">
            <InputNumber style={{ width: '100%' }} min={1} placeholder="任务默认落到该项目" />
          </Form.Item>
          {editing === 'lark' && (
            <>
              <Form.Item name="api_base" label="API Base（私有化/测试可覆盖，默认 https://open.feishu.cn）">
                <Input placeholder="https://open.feishu.cn" />
              </Form.Item>
              <Form.Item name="chats_json" label="群路由 {群chat_id: 项目id}" extra="命中群路由的任务落到指定项目，未命中走默认项目">
                <Input.TextArea rows={3} placeholder='{"oc_abc123": 6184}' />
              </Form.Item>
            </>
          )}
          {editing === 'wecom' && (
            <>
              <Form.Item name="corp_id" label="企业 CorpID">
                <Input placeholder="wwxxxxxxxx" />
              </Form.Item>
              <Form.Item name="agent_id" label="应用 AgentID">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
              <Form.Item name="api_base" label="API Base（默认 https://qyapi.weixin.qq.com）">
                <Input placeholder="https://qyapi.weixin.qq.com" />
              </Form.Item>
              <Form.Item name="chats_json" label="用户路由 {用户userid: 项目id}">
                <Input.TextArea rows={3} placeholder='{"ZhangSan": 6184}' />
              </Form.Item>
            </>
          )}
          {editing === 'generic' && (
            <Form.Item name="mapping_json" label="字段映射（点分路径）" extra='支持 title/content/external_key/priority 四个键，如 {"title":"issue.subject","content":"issue.body"}'>
              <Input.TextArea rows={4} placeholder='{"title":"issue.subject","content":"issue.body","external_key":"issue.key"}' />
            </Form.Item>
          )}
        </Form>
      </Drawer>

      {/* 新建 Webhook */}
      <Modal
        title="新建出站 Webhook 订阅"
        open={webhookModal}
        onOk={handleCreateWebhook}
        onCancel={() => setWebhookModal(false)}
        okText="创建"
        destroyOnClose
      >
        <Form form={webhookForm} layout="vertical">
          <Form.Item name="url" label="推送地址" rules={[
            { required: true },
            { pattern: /^https?:\/\//, message: '必须以 http(s):// 开头' },
          ]}>
            <Input placeholder="https://oa.example.com/hooks/todo4ai" />
          </Form.Item>
          <Form.Item name="events" label="订阅事件" rules={[{ required: true, message: '至少选择一个事件' }]}>
            <Select mode="multiple" options={WEBHOOK_EVENT_OPTIONS} placeholder="选择要接收的事件" />
          </Form.Item>
          <Form.Item name="secret" label="签名密钥" extra="留空自动生成；创建后仅显示一次">
            <Input.Password placeholder="自动生成强密钥" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input placeholder="例如：对接内部 OA 通知" />
          </Form.Item>
        </Form>
      </Modal>

      {/* secret 一次性展示 */}
      <Modal
        title="订阅已创建 — 请立即保存签名密钥"
        open={!!createdSecret}
        onCancel={() => setCreatedSecret(null)}
        footer={<Button type="primary" onClick={() => setCreatedSecret(null)}>我已保存</Button>}
      >
        <Alert type="warning" showIcon message="此密钥仅显示这一次，用于接收方验签（X-Todo4AI-Signature）。" style={{ marginBottom: 12 }} />
        <Input.TextArea readOnly value={createdSecret ?? ''} rows={3} />
      </Modal>

      {/* 派发记录 */}
      <Drawer
        title={deliverySub ? `派发记录 — ${deliverySub.url}` : ''}
        open={!!deliverySub}
        onClose={() => setDeliverySub(null)}
        width={720}
      >
        <Table rowKey="id" size="small" columns={deliveryColumns as any} dataSource={deliveries} pagination={{ pageSize: 15 }} />
      </Drawer>
    </div>
  )
}

export default IntegrationsPage
