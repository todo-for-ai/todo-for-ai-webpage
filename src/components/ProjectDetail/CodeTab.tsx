/**
 * 代码 Tab：项目的 GitHub 仓库绑定管理（G1 代码平面的项目级入口）。
 *
 * - 未绑定：接入指引 + 「绑定 GitHub 仓库」表单
 * - 已绑定：绑定事实（仓库/分支/自治等级/评审关卡/Token 状态）
 *   + 维护者可编辑、解绑
 * - PR 的创建/审批/合并在任务维度操作，这里展示流程说明与待审入口
 *
 * 字段语义与后端 PUT /projects/{id}/repo 一致；token 加密存储、
 * 只写不读（更新时留空表示不修改）。
 */
import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Space,
  Spin,
  Switch,
  Tag,
  Timeline,
  message,
} from 'antd'
import { EditOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons'
import {
  projectContextApi,
  type ProjectRepoBinding,
  type RepoBindingPayload,
} from '../../api/projectContext'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { HintIcon, withHint } from '../common/HintIcon'

interface CodeTabProps {
  projectId: number
  canManage: boolean
  onOpenTab?: (tabKey: string) => void
}

const AUTONOMY_LEVELS: Record<number, string> = {
  0: 'L0 · 全审批（每步人工确认）',
  1: 'L1 · 自动 PR，人工合并',
  2: 'L2 · 证据全通过自动合并',
}

export function CodeTab({ projectId, canManage, onOpenTab }: CodeTabProps) {
  const { tp } = usePageTranslation('projectDetail')
  const [loading, setLoading] = useState(true)
  const [binding, setBinding] = useState<ProjectRepoBinding | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const refresh = async () => {
    setLoading(true)
    try {
      setBinding(await projectContextApi.getRepoBinding(projectId))
    } catch {
      setBinding(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    projectContextApi
      .getRepoBinding(projectId)
      .then((result) => {
        if (!cancelled) setBinding(result)
      })
      .catch(() => {
        if (!cancelled) setBinding(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  const openBindModal = () => {
    form.setFieldsValue({
      repo_owner: binding?.repo_owner ?? '',
      repo_name: binding?.repo_name ?? '',
      default_branch: binding?.default_branch ?? 'main',
      autonomy_level: binding?.autonomy_level ?? 0,
      require_agent_review: binding?.require_agent_review ?? false,
      reviewer_agent_id: binding?.reviewer_agent_id ?? undefined,
      token: '',
    })
    setModalOpen(true)
  }

  const submitBind = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const payload: RepoBindingPayload = {
        repo_owner: values.repo_owner.trim(),
        repo_name: values.repo_name.trim(),
        default_branch: values.default_branch?.trim() || 'main',
        autonomy_level: values.autonomy_level ?? 0,
        require_agent_review: !!values.require_agent_review,
        reviewer_agent_id: values.reviewer_agent_id || null,
      }
      if (values.token?.trim()) {
        payload.token = values.token.trim()
      }
      await projectContextApi.bindRepo(projectId, payload)
      message.success(tp('codeTab.bindSuccess'))
      setModalOpen(false)
      await refresh()
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return // 表单校验错误，由表单自身展示
      }
      const msg = error instanceof Error ? error.message : String(error)
      message.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const submitUnbind = async () => {
    try {
      await projectContextApi.unbindRepo(projectId)
      message.success(tp('codeTab.unbindSuccess'))
      await refresh()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      message.error(msg)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  const renderBindingCard = () => {
    if (!binding) {
      return (
        <Card title={withHint(tp('codeTab.bindingTitle'), tp('codeTab.hintBinding'))}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {tp('codeTab.unboundHint1')}
                <br />
                {tp('codeTab.unboundHint2')}
              </span>
            }
          >
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={openBindModal}>
                {tp('codeTab.bindButton')}
              </Button>
            )}
          </Empty>
        </Card>
      )
    }

    return (
      <Card
        title={withHint(tp('codeTab.bindingTitle'), tp('codeTab.hintBinding'))}
        extra={
          <Space>
            <Tag color={binding.has_binding_token ? 'green' : 'orange'}>
              {binding.has_binding_token ? tp('codeTab.tokenConfigured') : tp('codeTab.tokenMissing')}
            </Tag>
            {canManage && (
              <>
                <Button size="small" icon={<EditOutlined />} onClick={openBindModal}>
                  {tp('codeTab.editBinding')}
                </Button>
                <Popconfirm
                  title={tp('codeTab.unbindConfirmTitle')}
                  description={tp('codeTab.unbindConfirmDesc')}
                  onConfirm={submitUnbind}
                >
                  <Button size="small" danger>
                    {tp('codeTab.unbind')}
                  </Button>
                </Popconfirm>
              </>
            )}
          </Space>
        }
      >
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label={tp('codeTab.repo')} span={2}>
            <LinkOutlined /> {binding.repo_full_name}
          </Descriptions.Item>
          <Descriptions.Item label={tp('codeTab.defaultBranch')}>
            {binding.default_branch}
          </Descriptions.Item>
          <Descriptions.Item label={withHint(tp('codeTab.autonomy'), tp('codeTab.hintAutonomy'))}>
            <Tag
              color={binding.autonomy_level >= 2 ? 'green' : binding.autonomy_level === 1 ? 'blue' : 'orange'}
            >
              {AUTONOMY_LEVELS[binding.autonomy_level] ?? `L${binding.autonomy_level}`}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={withHint(tp('codeTab.agentReview'), tp('codeTab.hintAgentReview'))}>
            {binding.require_agent_review
              ? `${tp('codeTab.enabled')} · ${binding.reviewer_agent_id ? `Agent #${binding.reviewer_agent_id}` : tp('codeTab.reviewerFallback')}`
              : tp('codeTab.disabled')}
          </Descriptions.Item>
          <Descriptions.Item label={tp('codeTab.boundAt')}>
            {binding.created_at ? new Date(binding.created_at).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>
        {!canManage && (
          <p style={{ marginTop: 12, color: '#999', fontSize: 12 }}>{tp('codeTab.manageHint')}</p>
        )}
      </Card>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {renderBindingCard()}

      <Card title={tp('codeTab.flowTitle')}>
        <Timeline
          items={[
            { children: tp('codeTab.flowStep1') },
            { children: tp('codeTab.flowStep2') },
            {
              children: (
                <span>
                  {tp('codeTab.flowStep3')}
                  {onOpenTab && (
                    <Button type="link" size="small" onClick={() => onOpenTab('governance')}>
                      {tp('codeTab.flowStep3Link')}
                    </Button>
                  )}
                </span>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={binding ? tp('codeTab.editModalTitle') : tp('codeTab.bindModalTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitBind}
        confirmLoading={saving}
        okText={tp('codeTab.save')}
        cancelText={tp('codeTab.cancel')}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="repo_owner"
                label={withHint(tp('codeTab.fieldOwner'), tp('codeTab.hintOwner'))}
                rules={[{ required: true, message: tp('codeTab.ownerRequired') }]}
              >
                <Input placeholder="todo-for-ai" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="repo_name"
                label={withHint(tp('codeTab.fieldRepo'), tp('codeTab.hintRepoField'))}
                rules={[{ required: true, message: tp('codeTab.repoRequired') }]}
              >
                <Input placeholder="todo-for-ai" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="default_branch" label={withHint(tp('codeTab.defaultBranch'), tp('codeTab.hintBranch'))}>
            <Input placeholder="main" />
          </Form.Item>
          <Form.Item
            name="token"
            label={withHint(tp('codeTab.fieldToken'), tp('codeTab.hintToken'))}
            extra={binding ? tp('codeTab.tokenKeepHint') : tp('codeTab.tokenExtra')}
          >
            <Input.Password
              placeholder={binding ? tp('codeTab.tokenKeepPlaceholder') : 'ghp_xxxxxxxxxxxx'}
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="autonomy_level"
            label={withHint(tp('codeTab.autonomy'), tp('codeTab.hintAutonomy'))}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value={0}>{AUTONOMY_LEVELS[0]}</Radio>
                <Radio value={1}>{AUTONOMY_LEVELS[1]}</Radio>
                <Radio value={2}>{AUTONOMY_LEVELS[2]}</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label={withHint(tp('codeTab.agentReview'), tp('codeTab.hintAgentReview'))}
            name="require_agent_review"
            valuePropName="checked"
          >
            <Switch checkedChildren={tp('codeTab.enabled')} unCheckedChildren={tp('codeTab.disabled')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
