/**
 * GoalLoopsCard —— 目标循环卡片（治理 Tab）
 *
 * 展示项目下的目标循环：状态 / 轮数 / 绑定 Agent / 最近受阻原因，支持
 * 新建、暂停、继续、立即推进、停止。创建与控制需要项目管理权限
 * （canManage），普通成员可只读查看。
 */
import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { LinkButton } from '../SmartLink'
import { goalLoopApi, type GoalLoop } from '../../api/goalLoops'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { withHint } from '../common/HintIcon'
import type { ProjectOverview } from '../../api/projectContext'

interface GoalLoopsCardProps {
  projectId: number
  overview?: ProjectOverview | null
  canManage: boolean
}

function statusMeta(status: string): { color: string } {
  switch (status) {
    case 'running':
      return { color: 'processing' }
    case 'paused':
      return { color: 'orange' }
    case 'done':
      return { color: 'success' }
    case 'limit_reached':
    case 'stalled':
      return { color: 'error' }
    default:
      return { color: 'default' }
  }
}

export function GoalLoopsCard({ projectId, overview, canManage }: GoalLoopsCardProps) {
  const { tp } = usePageTranslation('projectDetail')
  const [loops, setLoops] = useState<GoalLoop[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const refresh = useCallback(async () => {
    try {
      setLoops(await goalLoopApi.list(projectId))
    } catch {
      setLoops([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const runAction = async (loopId: number, action: 'pause' | 'resume' | 'stop' | 'kick') => {
    setActionLoading(loopId)
    try {
      await goalLoopApi.action(loopId, action)
      await refresh()
    } finally {
      setActionLoading(null)
    }
  }

  const submitCreate = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await goalLoopApi.create(projectId, {
        title: values.title,
        goal_text: values.goal_text,
        done_definition: values.done_definition,
        rounds_limit: values.rounds_limit,
        agent_id: values.agent_id ?? null,
        director_agent_id: values.director_agent_id ?? null,
        time_budget_hours: values.time_budget_hours ?? null,
      })
      setModalOpen(false)
      form.resetFields()
      await refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const columns: ColumnsType<GoalLoop> = [
    {
      title: tp('goalLoop.colTitle'),
      dataIndex: 'title',
      render: (title: string, record) => (
        <Tooltip title={record.last_error || record.completion_summary || record.goal_text}>
          <span>{title}</span>
        </Tooltip>
      ),
    },
    {
      title: tp('goalLoop.colStatus'),
      dataIndex: 'status',
      width: 120,
      render: (status: string) => (
        <Tooltip title={tp(`goalLoop.statusHint.${status}`)}>
          <Tag color={statusMeta(status).color}>{tp(`goalLoop.status.${status}`)}</Tag>
        </Tooltip>
      ),
    },
    {
      title: tp('goalLoop.colRounds'),
      key: 'rounds',
      width: 100,
      render: (_, record) => {
        const planLen = record.plan?.length ?? 0
        const planText = (record.plan ?? [])
          .slice(0, 8)
          .map((s, i) => {
            const mark = i < (record.plan_index ?? 0) ? '✓' : '○'
            return s.role ? `${mark} ${s.title}（${s.role}）` : `${mark} ${s.title}`
          })
          .join('\n')
        return (
          <Tooltip
            title={
              planLen > 0
                ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    <div>
                      {tp('goalLoop.hintPlan')
                        .replace('{done}', String(record.plan_index ?? 0))
                        .replace('{total}', String(planLen))}
                    </div>
                    <div>{planText}</div>
                  </div>
                )
                : undefined
            }
          >
            <span>
              {record.tasks?.length ?? 0}/{record.rounds_limit}
              {record.time_budget_hours ? (
                <Tooltip title={tp('goalLoop.hintTimeBudget')}>
                  <Tag style={{ marginLeft: 6 }} color="gold">
                    {tp('goalLoop.timeBudgetTag').replace('{hours}', String(record.time_budget_hours))}
                  </Tag>
                </Tooltip>
              ) : null}
              {planLen > 0 && (
                <Tag style={{ marginLeft: 6 }} color="cyan">
                  {tp('goalLoop.planTag')
                    .replace('{index}', String(record.plan_index ?? 0))
                    .replace('{total}', String(planLen))}
                </Tag>
              )}
            </span>
          </Tooltip>
        )
      },
    },
    {
      title: tp('goalLoop.colAgent'),
      key: 'agent',
      width: 180,
      render: (_, record) => {
        const directorName = record.director_display_name || record.director_name
        return (
          <Space size={4} wrap>
            {directorName && (
              <Tooltip title={tp('goalLoop.hintDirector')}>
                <Tag color="blue">
                  {tp('goalLoop.directorTag')}·{directorName}
                </Tag>
              </Tooltip>
            )}
            <span>{record.agent_display_name || record.agent_name || `#${record.agent_id}`}</span>
          </Space>
        )
      },
    },
    {
      title: tp('goalLoop.colTasks'),
      key: 'tasks',
      render: (_, record) => {
        const tasks = record.tasks ?? []
        if (!tasks.length) return '-'
        return (
          <Space size={4} wrap>
            {tasks.slice(0, 5).map((t) => (
              <Tooltip key={t.id} title={t.agent_name || undefined}>
                <LinkButton to={`/todo-for-ai/pages/tasks/${t.id}`} type="link">
                  #{t.id}
                </LinkButton>
              </Tooltip>
            ))}
            {tasks.length > 5 && <span>+{tasks.length - 5}</span>}
          </Space>
        )
      },
    },
    ...(canManage
      ? [
          {
            title: tp('goalLoop.colActions'),
            key: 'actions',
            width: 220,
            render: (_: unknown, record: GoalLoop) => {
              const busy = actionLoading === record.id
              return (
                <Space size={4}>
                  {record.status === 'running' && (
                    <>
                      <Button size="small" loading={busy} onClick={() => runAction(record.id, 'pause')}>
                        {tp('goalLoop.action.pause')}
                      </Button>
                      <Tooltip title={tp('goalLoop.hintKick')}>
                        <Button size="small" loading={busy} onClick={() => runAction(record.id, 'kick')}>
                          {tp('goalLoop.action.kick')}
                        </Button>
                      </Tooltip>
                    </>
                  )}
                  {(record.status === 'paused' || record.status === 'stalled' || record.status === 'limit_reached') && (
                    <Button size="small" type="primary" loading={busy} onClick={() => runAction(record.id, 'resume')}>
                      {tp('goalLoop.action.resume')}
                    </Button>
                  )}
                  {record.status !== 'stopped' && record.status !== 'done' && (
                    <Button size="small" danger loading={busy} onClick={() => runAction(record.id, 'stop')}>
                      {tp('goalLoop.action.stop')}
                    </Button>
                  )}
                </Space>
              )
            },
          } as ColumnsType<GoalLoop>[number],
        ]
      : []),
  ]

  return (
    <Card
      title={withHint(tp('goalLoop.title'), tp('goalLoop.hintTitle'))}
      extra={
        canManage && (
          <Button
            type="primary"
            size="small"
            onClick={() => {
              form.resetFields()
              setModalOpen(true)
            }}
          >
            {tp('goalLoop.action.create')}
          </Button>
        )
      }
    >
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={loops}
        pagination={false}
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tp('goalLoop.empty')} />
          ),
        }}
      />
      <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>{tp('goalLoop.note')}</p>

      <Modal
        title={tp('goalLoop.createTitle')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submitCreate}
        confirmLoading={submitting}
        okText={tp('goalLoop.action.create')}
        cancelText={tp('goalLoop.action.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ rounds_limit: 10 }}>
          <Form.Item
            name="title"
            label={withHint(tp('goalLoop.form.title'), tp('goalLoop.hintFormTitle'))}
            rules={[{ required: true }]}
          >
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item
            name="goal_text"
            label={withHint(tp('goalLoop.form.goal'), tp('goalLoop.hintFormGoal'))}
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="done_definition"
            label={withHint(tp('goalLoop.form.done'), tp('goalLoop.hintFormDone'))}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="rounds_limit"
            label={withHint(tp('goalLoop.form.rounds'), tp('goalLoop.hintFormRounds'))}
          >
            <InputNumber min={1} max={999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="time_budget_hours"
            label={withHint(tp('goalLoop.form.timeBudget'), tp('goalLoop.hintFormTimeBudget'))}
          >
            <InputNumber
              min={1}
              max={720}
              style={{ width: '100%' }}
              placeholder={tp('goalLoop.form.timeBudgetAuto')}
            />
          </Form.Item>
          <Form.Item
            name="agent_id"
            label={withHint(tp('goalLoop.form.agent'), tp('goalLoop.hintFormAgent'))}
          >
            <Select
              allowClear
              placeholder={tp('goalLoop.form.agentAuto')}
              options={(overview?.agents ?? []).map((a) => ({
                value: a.id,
                label: a.role
                  ? `${a.display_name || a.name}（${a.role.display_name}）`
                  : a.display_name || a.name,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="director_agent_id"
            label={withHint(tp('goalLoop.form.director'), tp('goalLoop.hintFormDirector'))}
          >
            <Select
              allowClear
              placeholder={tp('goalLoop.form.directorAuto')}
              options={(overview?.agents ?? []).map((a) => ({
                value: a.id,
                label: a.role
                  ? `${a.display_name || a.name}（${a.role.display_name}）`
                  : a.display_name || a.name,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default GoalLoopsCard
