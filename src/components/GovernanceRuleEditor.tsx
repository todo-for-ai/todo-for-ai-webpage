import { useEffect, useState, useCallback } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
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
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { governanceRulesApi } from '../api/governanceRules.js'
import type { GovernanceRule } from '../api/governanceRules.js'
import { getErrorMessage } from '../utils/errorUtils.js'

const { Text, Paragraph } = Typography

const defaultRules: GovernanceRule[] = [
  {
    id: 'auto_approve_low_risk',
    name: '低风险自动审批',
    description: '风险分数低于阈值时自动审批',
    interaction_type: '*',
    require_approval: false,
    risk_threshold: 30,
  },
  {
    id: 'require_approval_high_risk',
    name: '高风险需人工审批',
    description: '风险分数高于阈值时需要人工审批',
    interaction_type: '*',
    require_approval: true,
    risk_threshold: 70,
  },
  {
    id: 'require_approval_data_access',
    name: '数据访问需审批',
    description: '涉及数据访问的交互需审批',
    interaction_type: 'data_access',
    require_approval: true,
  },
]

const INTERACTION_TYPE_OPTIONS = [
  { label: '所有类型', value: '*' },
  { label: '数据访问', value: 'data_access' },
  { label: '文件操作', value: 'file_operation' },
  { label: 'API 调用', value: 'api_call' },
  { label: '代码执行', value: 'code_execution' },
  { label: '网络请求', value: 'network_request' },
]

interface GovernanceRuleEditorProps {
  workspaceId: number
}

const GovernanceRuleEditor: React.FC<GovernanceRuleEditorProps> = ({ workspaceId }) => {
  const [rules, setRules] = useState<GovernanceRule[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<GovernanceRule | null>(null)
  const [form] = Form.useForm()

  const loadRules = useCallback(async () => {
    try {
      setLoading(true)
      const data = await governanceRulesApi.list(workspaceId)
      const loaded = data.rules && data.rules.length > 0 ? data.rules : defaultRules
      setRules(loaded)
    } catch {
      // If endpoint does not exist yet, use defaults
      setRules(defaultRules)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const handleSave = async () => {
    try {
      setSaving(true)
      await governanceRulesApi.update(workspaceId, rules)
      message.success('治理规则已保存')
    } catch (error) {
      message.error(getErrorMessage(error, '保存治理规则失败'))
    } finally {
      setSaving(false)
    }
  }

  const openAddModal = () => {
    setEditingRule(null)
    form.resetFields()
    form.setFieldsValue({
      interaction_type: '*',
      require_approval: true,
      risk_threshold: 50,
    })
    setModalOpen(true)
  }

  const openEditModal = (rule: GovernanceRule) => {
    setEditingRule(rule)
    form.setFieldsValue({
      name: rule.name,
      description: rule.description || '',
      interaction_type: rule.interaction_type,
      require_approval: rule.require_approval,
      risk_threshold: rule.risk_threshold,
    })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingRule) {
        // Update existing rule
        setRules((prev) =>
          prev.map((r) =>
            r.id === editingRule.id ? { ...r, ...values } : r
          )
        )
      } else {
        // Add new rule
        const newRule: GovernanceRule = {
          id: `custom_${Date.now()}`,
          ...values,
        }
        setRules((prev) => [...prev, newRule])
      }
      setModalOpen(false)
      form.resetFields()
    } catch {
      // validation failed, ignore
    }
  }

  const handleDelete = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId))
  }

  const handleToggleApproval = (ruleId: string, checked: boolean) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, require_approval: checked } : r
      )
    )
  }

  const handleThresholdChange = (ruleId: string, value: number | null) => {
    if (value === null) return
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, risk_threshold: value } : r
      )
    )
  }

  return (
    <Card
      title={
        <Space>
          <SafetyOutlined />
          <span>治理规则</span>
        </Space>
      }
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            添加规则
          </Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
      loading={loading}
    >
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        配置工作空间的治理规则，控制 AI Agent 的行为审批策略。
      </Paragraph>

      <List
        dataSource={rules}
        renderItem={(rule) => (
          <List.Item
            key={rule.id}
            actions={[
              <Button
                key="edit"
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditModal(rule)}
              />,
              <Popconfirm
                key="delete"
                title="确定删除此规则？"
                onConfirm={() => handleDelete(rule.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{rule.name}</Text>
                  <Tag>{rule.interaction_type === '*' ? '所有类型' : rule.interaction_type}</Tag>
                  {rule.require_approval ? (
                    <Tag color="orange">需审批</Tag>
                  ) : (
                    <Tag color="green">自动通过</Tag>
                  )}
                </Space>
              }
              description={
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {rule.description && (
                    <Text type="secondary">{rule.description}</Text>
                  )}
                  <Space size={16}>
                    <Space size={4}>
                      <Text type="secondary">需审批:</Text>
                      <Switch
                        size="small"
                        checked={rule.require_approval}
                        onChange={(checked) => handleToggleApproval(rule.id, checked)}
                      />
                    </Space>
                    <Space size={4}>
                      <Text type="secondary">风险阈值:</Text>
                      <InputNumber
                        size="small"
                        min={0}
                        max={100}
                        value={rule.risk_threshold}
                        onChange={(val) => handleThresholdChange(rule.id, val)}
                        style={{ width: 80 }}
                      />
                    </Space>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title={editingRule ? '编辑规则' : '添加规则'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        okText={editingRule ? '更新' : '添加'}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="例如：低风险自动审批" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="规则描述..." rows={2} />
          </Form.Item>
          <Form.Item
            name="interaction_type"
            label="交互类型"
            rules={[{ required: true, message: '请选择交互类型' }]}
          >
            <Select options={INTERACTION_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="require_approval"
            label="需要审批"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item name="risk_threshold" label="风险阈值">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default GovernanceRuleEditor
