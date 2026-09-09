/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import { BellOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { agentAutomationApi, type AgentTrigger, type CreateAgentTriggerRequest } from '../../../../api/agents'
import { projectsApi } from '../../../../api/projects'
import { usePageTranslation } from '../../../../i18n/hooks/useTranslation'
import './AgentTriggersTab.css'

const { Text, Paragraph } = Typography
const { TextArea } = Input

const TASK_EVENT_OPTIONS = [
  'created',
  'updated',
  'status_changed',
  'completed',
  'assigned',
  'mentioned',
] as const

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const

interface AgentTriggersTabProps {
  workspaceId: number | null
  agentId: number
  active: boolean
}

interface ProjectOption {
  id: number
  name: string
}

export function AgentTriggersTab({ workspaceId, agentId, active }: AgentTriggersTabProps) {
  const { tp } = usePageTranslation('agents')
  const [loading, setLoading] = useState(false)
  const [triggers, setTriggers] = useState<AgentTrigger[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([])
  const [form] = Form.useForm()
  const triggerType = Form.useWatch('trigger_type', form)
  const actionType = Form.useWatch('action', form)

  const loadTriggers = useCallback(async () => {
    if (!workspaceId || !active) {
      return
    }
    try {
      setLoading(true)
      const data = await agentAutomationApi.listTriggers(workspaceId, agentId)
      setTriggers(data.items || [])
    } catch (error: any) {
      message.error(error?.message || tp('detail.triggers.messages.loadFailed', { defaultValue: '加载触发器失败' }))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId, active, tp])

  const loadProjectOptions = useCallback(async () => {
    if (!workspaceId) {
      return
    }
    try {
      const data = await projectsApi.getProjects({ organization_id: workspaceId, per_page: 100 })
      setProjectOptions((data.data || []).map(p => ({ id: p.id, name: p.name })))
    } catch {
      // 项目列表加载失败不阻塞表单，仅下拉为空
      setProjectOptions([])
    }
  }, [workspaceId])

  useEffect(() => {
    if (active) {
      void loadTriggers()
    }
  }, [active, loadTriggers])

  const openCreate = useCallback(() => {
    form.resetFields()
    form.setFieldsValue({
      trigger_type: 'task_event',
      task_event_types: ['created'],
      action: 'run_agent',
      priority: 100,
    })
    void loadProjectOptions()
    setCreateOpen(true)
  }, [form, loadProjectOptions])

  const handleCreate = useCallback(async () => {
    if (!workspaceId) {
      return
    }
    try {
      const values = await form.validateFields()
      setCreating(true)
      const request: CreateAgentTriggerRequest = {
        name: values.name,
        trigger_type: values.trigger_type,
        enabled: true,
        priority: values.priority ?? 100,
      }
      if (values.trigger_type === 'task_event') {
        request.task_event_types = values.task_event_types
        request.task_filter = {}
      } else {
        request.cron_expr = values.cron_expr
        request.misfire_policy = 'catch_up_once'
        request.action = values.action
        if (values.action === 'create_task') {
          request.action_payload = {
            project_id: values.task_project_id,
            title: values.task_title,
            description: values.task_description || '',
            priority: values.task_priority || 'medium',
            tags: (values.task_tags || '')
              .split(',')
              .map((t: string) => t.trim())
              .filter(Boolean),
          }
        }
      }
      await agentAutomationApi.createTrigger(workspaceId, agentId, request)
      message.success(tp('detail.triggers.messages.createSuccess', { defaultValue: '触发器创建成功' }))
      setCreateOpen(false)
      void loadTriggers()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      message.error(error?.message || tp('detail.triggers.messages.createFailed', { defaultValue: '触发器创建失败' }))
    } finally {
      setCreating(false)
    }
  }, [workspaceId, agentId, form, loadTriggers, tp])

  const handleToggle = useCallback(async (record: AgentTrigger, enabled: boolean) => {
    if (!workspaceId) {
      return
    }
    try {
      await agentAutomationApi.updateTrigger(workspaceId, agentId, record.id, { enabled })
      setTriggers(prev => prev.map(t => (t.id === record.id ? { ...t, enabled } : t)))
    } catch (error: any) {
      message.error(error?.message || tp('detail.triggers.messages.updateFailed', { defaultValue: '触发器更新失败' }))
      void loadTriggers()
    }
  }, [workspaceId, agentId, loadTriggers, tp])

  const handleDelete = useCallback(async (record: AgentTrigger) => {
    if (!workspaceId) {
      return
    }
    try {
      await agentAutomationApi.deleteTrigger(workspaceId, agentId, record.id)
      message.success(tp('detail.triggers.messages.deleteSuccess', { defaultValue: '触发器已停用' }))
      void loadTriggers()
    } catch (error: any) {
      message.error(error?.message || tp('detail.triggers.messages.deleteFailed', { defaultValue: '触发器停用失败' }))
    }
  }, [workspaceId, agentId, loadTriggers, tp])

  const renderMatchRule = useCallback((record: AgentTrigger) => {
    if (record.trigger_type === 'cron') {
      return <Tag color="blue" className="agent-triggers-tab__mono">{record.cron_expr || '-'}</Tag>
    }
    const events = record.task_event_types || []
    return (
      <Space size={4} wrap>
        {events.map(e => <Tag key={e} color="cyan">{e}</Tag>)}
      </Space>
    )
  }, [])

  const columns: ColumnsType<AgentTrigger> = [
    {
      title: tp('detail.triggers.table.name', { defaultValue: '名称' }),
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: tp('detail.triggers.table.type', { defaultValue: '类型' }),
      dataIndex: 'trigger_type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'cron' ? 'geekblue' : 'cyan'}>
          {tp(`detail.triggers.types.${type}`, { defaultValue: type })}
        </Tag>
      ),
    },
    {
      title: tp('detail.triggers.table.action', { defaultValue: '动作' }),
      dataIndex: 'action',
      width: 130,
      render: (action: string | undefined, record: AgentTrigger) => {
        const value = action || 'run_agent'
        return (
          <Space size={4}>
            <Tag color={value === 'create_task' ? 'green' : 'blue'}>
              {tp(`detail.triggers.actions.${value}`, { defaultValue: value })}
            </Tag>
            {value === 'create_task' && record.action_payload?.title && (
              <Text type="secondary" ellipsis className="agent-triggers-tab__payload-title">
                {String(record.action_payload.title)}
              </Text>
            )}
          </Space>
        )
      },
    },
    {
      title: tp('detail.triggers.table.match', { defaultValue: '触发条件' }),
      key: 'match',
      render: (_: any, record: AgentTrigger) => renderMatchRule(record),
    },
    {
      title: tp('detail.triggers.table.nextFire', { defaultValue: '下次触发' }),
      dataIndex: 'next_fire_at',
      width: 170,
      render: (value: string | undefined) => (value ? formatTime(value) : '-'),
    },
    {
      title: tp('detail.triggers.table.enabled', { defaultValue: '启用' }),
      dataIndex: 'enabled',
      width: 80,
      render: (_: boolean, record: AgentTrigger) => (
        <Switch size="small" checked={record.enabled} onChange={v => void handleToggle(record, v)} />
      ),
    },
    {
      title: tp('detail.triggers.table.actions', { defaultValue: '操作' }),
      key: 'actions',
      width: 80,
      render: (_: any, record: AgentTrigger) => (
        <Popconfirm
          title={tp('detail.triggers.messages.deleteConfirm', { defaultValue: '停用该触发器？' })}
          onConfirm={() => void handleDelete(record)}
        >
          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  return (
    <div className="agent-triggers-tab">
      <div className="agent-triggers-tab__header">
        <Space align="center" size={16}>
          <div className="agent-triggers-tab__icon-wrapper">
            <BellOutlined className="agent-triggers-tab__icon" />
          </div>
          <div>
            <Text strong>{tp('detail.triggers.title', { defaultValue: '触发器' })}</Text>
            <Paragraph type="secondary" className="agent-triggers-tab__subtitle">
              {tp('detail.triggers.subtitle', { defaultValue: '任务事件或定时计划自动驱动该 Agent 工作' })}
            </Paragraph>
          </div>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void loadTriggers()}>
            {tp('detail.triggers.refresh', { defaultValue: '刷新' })}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {tp('detail.triggers.create', { defaultValue: '新建触发器' })}
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={triggers}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={tp('detail.triggers.empty', { defaultValue: '暂无触发器' })}
            />
          ),
        }}
      />

      <Modal
        title={tp('detail.triggers.createModal.title', { defaultValue: '新建触发器' })}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void handleCreate()}
        confirmLoading={creating}
        okText={tp('detail.triggers.createModal.ok', { defaultValue: '创建' })}
        cancelText={tp('detail.triggers.createModal.cancel', { defaultValue: '取消' })}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="agent-triggers-tab__form">
          <Form.Item
            name="name"
            label={tp('detail.triggers.createModal.name', { defaultValue: '名称' })}
            rules={[{ required: true, message: tp('detail.triggers.createModal.nameRequired', { defaultValue: '请输入触发器名称' }) }]}
          >
            <Input
              placeholder={tp('detail.triggers.createModal.namePlaceholder', { defaultValue: '例如：新任务自动响应' })}
              maxLength={128}
            />
          </Form.Item>

          <Form.Item
            name="trigger_type"
            label={tp('detail.triggers.createModal.type', { defaultValue: '触发类型' })}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'task_event', label: tp('detail.triggers.types.task_event', { defaultValue: '任务事件' }) },
                { value: 'cron', label: tp('detail.triggers.types.cron', { defaultValue: '定时计划' }) },
              ]}
            />
          </Form.Item>

          {triggerType === 'task_event' && (
            <Form.Item
              name="task_event_types"
              label={tp('detail.triggers.createModal.eventTypes', { defaultValue: '任务事件' })}
              rules={[{ required: true, message: tp('detail.triggers.createModal.eventTypesRequired', { defaultValue: '请选择至少一个事件' }) }]}
            >
              <Select
                mode="multiple"
                options={TASK_EVENT_OPTIONS.map(e => ({
                  value: e,
                  label: tp(`detail.triggers.events.${e}`, { defaultValue: e }),
                }))}
              />
            </Form.Item>
          )}

          {triggerType === 'cron' && (
            <>
              <Form.Item
                name="cron_expr"
                label={tp('detail.triggers.createModal.cronExpr', { defaultValue: 'Cron 表达式（UTC）' })}
                extra={tp('detail.triggers.createModal.cronExprHelp', { defaultValue: '5 段式：分 时 日 月 周，如 0 9 * * 1-5 表示工作日每天 09:00' })}
                rules={[{ required: true, message: tp('detail.triggers.createModal.cronExprRequired', { defaultValue: '请输入 Cron 表达式' }) }]}
              >
                <Input placeholder="0 9 * * 1-5" className="agent-triggers-tab__mono" />
              </Form.Item>

              <Form.Item
                name="action"
                label={tp('detail.triggers.createModal.action', { defaultValue: '触发动作' })}
                initialValue="run_agent"
              >
                <Select
                  options={[
                    { value: 'run_agent', label: tp('detail.triggers.actions.run_agent', { defaultValue: '运行 Agent' }) },
                    { value: 'create_task', label: tp('detail.triggers.actions.create_task', { defaultValue: '定时创建任务' }) },
                  ]}
                />
              </Form.Item>

              {actionType === 'create_task' && (
                <>
                  <Form.Item
                    name="task_project_id"
                    label={tp('detail.triggers.createModal.taskProject', { defaultValue: '目标项目' })}
                    rules={[{ required: true, message: tp('detail.triggers.createModal.taskProjectRequired', { defaultValue: '请选择目标项目' }) }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      options={projectOptions.map(p => ({ value: p.id, label: p.name }))}
                      placeholder={tp('detail.triggers.createModal.taskProjectPlaceholder', { defaultValue: '选择定时创建任务的目标项目' })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="task_title"
                    label={tp('detail.triggers.createModal.taskTitle', { defaultValue: '任务标题' })}
                    rules={[{ required: true, message: tp('detail.triggers.createModal.taskTitleRequired', { defaultValue: '请输入任务标题' }) }]}
                  >
                    <Input
                      maxLength={200}
                      placeholder={tp('detail.triggers.createModal.taskTitlePlaceholder', { defaultValue: '例如：每日巡检待办任务' })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="task_description"
                    label={tp('detail.triggers.createModal.taskDescription', { defaultValue: '任务描述' })}
                  >
                    <TextArea rows={3} maxLength={5000} />
                  </Form.Item>
                  <Space size={16} className="agent-triggers-tab__form-row">
                    <Form.Item
                      name="task_priority"
                      label={tp('detail.triggers.createModal.taskPriority', { defaultValue: '优先级' })}
                      initialValue="medium"
                      className="agent-triggers-tab__form-item"
                    >
                      <Select
                        options={PRIORITY_OPTIONS.map(p => ({
                          value: p,
                          label: tp(`detail.triggers.priorities.${p}`, { defaultValue: p }),
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="task_tags"
                      label={tp('detail.triggers.createModal.taskTags', { defaultValue: '标签（逗号分隔）' })}
                      className="agent-triggers-tab__form-item"
                    >
                      <Input placeholder="daily, report" />
                    </Form.Item>
                  </Space>
                </>
              )}
            </>
          )}

          <Form.Item
            name="priority"
            label={tp('detail.triggers.createModal.priority', { defaultValue: '优先级权重' })}
            extra={tp('detail.triggers.createModal.priorityHelp', { defaultValue: '数值越小越先匹配' })}
          >
            <Input type="number" min={1} max={999} />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message={tp('detail.triggers.createModal.utcNotice', { defaultValue: '时区目前仅支持 UTC，错过触发的计划默认补偿执行一次' })}
          />
        </Form>
      </Modal>
    </div>
  )
}

function formatTime(value: string): string {
  const date = new Date(value.endsWith('Z') || value.includes('+') ? value : `${value}Z`)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export default AgentTriggersTab
