/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Form,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { budgetsApi } from '../../../api/budgets'
import type { Budget, BudgetPeriod, BudgetResource, BudgetScopeType } from '../../../api/budgets'
import { organizationAgentsApi } from '../../../api/organizationAgents'
import { projectsApi } from '../../../api/projects'

const { Text } = Typography

interface OrgBudgetsTabProps {
  organizationId: number
  canManage?: boolean
}

const SCOPE_OPTIONS: { value: BudgetScopeType; label: string }[] = [
  { value: 'workspace', label: '整个工作区' },
  { value: 'agent', label: '单个 Agent' },
  { value: 'project', label: '单个项目' },
]

const RESOURCE_OPTIONS: { value: BudgetResource; label: string; unit: string }[] = [
  { value: 'tokens', label: 'Token 用量', unit: 'tokens' },
  { value: 'duration_minutes', label: '执行时长', unit: '分钟' },
  { value: 'concurrent', label: '并发执行数', unit: '个' },
]

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: 'total', label: '累计（不限起点）' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
]

const resourceLabel = (resource: string) =>
  RESOURCE_OPTIONS.find((item) => item.value === resource)?.label || resource

const resourceUnit = (resource: string) =>
  RESOURCE_OPTIONS.find((item) => item.value === resource)?.unit || ''

const periodLabel = (period: string) =>
  PERIOD_OPTIONS.find((item) => item.value === period)?.label || period

export const OrgBudgetsTab = ({ organizationId, canManage = false }: OrgBudgetsTabProps) => {
  const [form] = Form.useForm()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [scopeType, setScopeType] = useState<BudgetScopeType>('workspace')
  const [agentOptions, setAgentOptions] = useState<{ label: string; value: number }[]>([])
  const [projectOptions, setProjectOptions] = useState<{ label: string; value: number }[]>([])

  const reload = async () => {
    setLoading(true)
    try {
      const data = await budgetsApi.list(organizationId)
      setBudgets(data.budgets || [])
    } catch (error: any) {
      message.error(error?.message || '加载预算失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  useEffect(() => {
    void (async () => {
      try {
        const [agentData, projectData] = await Promise.all([
          organizationAgentsApi.getOrganizationAgentMembers(organizationId),
          projectsApi.getProjects({ organization_id: organizationId, per_page: 100 }),
        ])
        setAgentOptions(
          (agentData.items || [])
            .filter((member) => member.agent)
            .map((member) => ({
              label: member.agent?.name || `Agent #${member.agent_id}`,
              value: member.agent_id,
            })),
        )
        setProjectOptions(
          (projectData.data || []).map((project) => ({
            label: project.name,
            value: project.id,
          })),
        )
      } catch {
        // 选项加载失败不阻塞主列表
      }
    })()
  }, [organizationId])

  const scopeRefLabel = useMemo(() => (scopeType === 'agent' ? 'Agent' : '项目'), [scopeType])

  const openCreateModal = () => {
    setEditing(null)
    setScopeType('workspace')
    form.resetFields()
    form.setFieldsValue({
      scope_type: 'workspace',
      resource: 'tokens',
      period: 'total',
      limit_value: undefined,
    })
    setModalOpen(true)
  }

  const openEditModal = (budget: Budget) => {
    setEditing(budget)
    setScopeType(budget.scope_type)
    form.resetFields()
    form.setFieldsValue({
      scope_type: budget.scope_type,
      resource: budget.resource,
      period: budget.period,
      limit_value: budget.limit_value,
      agent_id: budget.agent_id || undefined,
      project_id: budget.project_id || undefined,
    })
    setModalOpen(true)
  }

  const submit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      if (editing) {
        await budgetsApi.update(organizationId, editing.id, { limit_value: values.limit_value })
        message.success('预算已更新')
      } else {
        await budgetsApi.create(organizationId, {
          scope_type: values.scope_type,
          resource: values.resource,
          period: values.period,
          limit_value: values.limit_value,
          agent_id: values.agent_id,
          project_id: values.project_id,
        })
        message.success('预算已创建')
      }
      setModalOpen(false)
      await reload()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (budget: Budget, next: boolean) => {
    try {
      await budgetsApi.update(organizationId, budget.id, { is_active: next })
      await reload()
    } catch (error: any) {
      message.error(error?.message || '更新失败')
    }
  }

  const remove = async (budget: Budget) => {
    try {
      await budgetsApi.delete(organizationId, budget.id)
      message.success('预算已删除')
      await reload()
    } catch (error: any) {
      message.error(error?.message || '删除失败')
    }
  }

  const scopeText = (budget: Budget) => {
    if (budget.scope_type === 'workspace') return '整个工作区'
    if (budget.scope_type === 'agent') {
      const option = agentOptions.find((item) => item.value === budget.agent_id)
      return `Agent：${option?.label || `#${budget.agent_id}`}`
    }
    const option = projectOptions.find((item) => item.value === budget.project_id)
    return `项目：${option?.label || `#${budget.project_id}`}`
  }

  const columns: any[] = [
    {
      title: '范围',
      key: 'scope',
      render: (_: unknown, record: Budget) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.scope_type === 'workspace' ? 'blue' : record.scope_type === 'agent' ? 'purple' : 'cyan'}>
            {SCOPE_OPTIONS.find((item) => item.value === record.scope_type)?.label}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>{scopeText(record)}</Text>
        </Space>
      ),
    },
    {
      title: '资源',
      key: 'resource',
      render: (_: unknown, record: Budget) => resourceLabel(record.resource),
    },
    {
      title: '周期',
      key: 'period',
      render: (_: unknown, record: Budget) => periodLabel(record.period),
    },
    {
      title: '上限',
      dataIndex: 'limit_value',
      key: 'limit_value',
      render: (value: number, record: Budget) => `${value.toLocaleString()} ${resourceUnit(record.resource)}`,
    },
    {
      title: '当前用量',
      key: 'usage',
      width: 240,
      render: (_: unknown, record: Budget) => {
        const usage = record.usage
        if (!usage) return '-'
        if (usage.not_tracked) return <Tag>未跟踪</Tag>
        const percent = Math.min(Math.round((usage.used / record.limit_value) * 100), 100)
        const exceeded = usage.used >= record.limit_value
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Progress
              percent={percent}
              size="small"
              status={exceeded ? 'exception' : percent >= 80 ? 'active' : 'normal'}
            />
            <Text type={exceeded ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
              {usage.used.toLocaleString()} / {record.limit_value.toLocaleString()} {resourceUnit(record.resource)}
              {exceeded ? '（已超限）' : ''}
            </Text>
          </Space>
        )
      },
    },
    {
      title: '启用',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (value: boolean, record: Budget) => (
        <Switch
          checked={value}
          disabled={!canManage}
          onChange={(next) => void toggleActive(record, next)}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Budget) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            disabled={!canManage}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="确定删除该预算？"
            onConfirm={() => void remove(record)}
            disabled={!canManage}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={!canManage} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      type="inner"
      title="预算与配额"
      extra={
        canManage ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建预算
          </Button>
        ) : null
      }
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        为工作区、Agent 或项目设置 Token / 执行时长 / 并发上限；任务派发超限时将进入审批队列并暂停派发。
      </Text>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        dataSource={budgets}
        columns={columns}
        pagination={false}
        locale={{ emptyText: '暂无预算配置' }}
      />

      <Modal
        title={editing ? '编辑预算' : '新建预算'}
        open={modalOpen}
        onOk={() => void submit()}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="范围类型" name="scope_type" rules={[{ required: true }]}>
            <Select
              options={SCOPE_OPTIONS}
              disabled={!!editing}
              onChange={(value: BudgetScopeType) => setScopeType(value)}
            />
          </Form.Item>
          {scopeType === 'agent' && (
            <Form.Item label="Agent" name="agent_id" rules={[{ required: true, message: '请选择 Agent' }]}>
              <Select options={agentOptions} placeholder="选择 Agent" disabled={!!editing} showSearch optionFilterProp="label" />
            </Form.Item>
          )}
          {scopeType === 'project' && (
            <Form.Item label="项目" name="project_id" rules={[{ required: true, message: '请选择项目' }]}>
              <Select options={projectOptions} placeholder="选择项目" disabled={!!editing} showSearch optionFilterProp="label" />
            </Form.Item>
          )}
          <Form.Item label="资源类型" name="resource" rules={[{ required: true }]}>
            <Select options={RESOURCE_OPTIONS} disabled={!!editing} />
          </Form.Item>
          <Form.Item label="统计周期" name="period" rules={[{ required: true }]}>
            <Select options={PERIOD_OPTIONS} disabled={!!editing} />
          </Form.Item>
          <Form.Item
            label={editing ? '新上限' : `上限（${resourceUnit(form.getFieldValue('resource') || 'tokens')}）`}
            name="limit_value"
            rules={[{ required: true, message: `请输入${scopeRefLabel === 'Agent' ? '' : ''}上限值` }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="正整数" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
