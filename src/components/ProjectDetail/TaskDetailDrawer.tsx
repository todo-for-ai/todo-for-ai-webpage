import { useNavigate } from 'react-router-dom'
import { Button, Drawer, Space, Tag, Tooltip } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, LinkOutlined, QuestionCircleOutlined, RobotOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import type { TaskGraphNode } from '../../api/taskGraph'
import { READINESS_STYLE, agentAssigneesOf } from './taskGraphModel'

interface TaskDetailDrawerProps {
  node: TaskGraphNode | null
  nodeById: Map<number, TaskGraphNode>
  open: boolean
  updating: boolean
  onClose: () => void
  onJumpToTask: (taskId: number) => void
  onStatusChange: (taskId: number, status: string) => void
}

const STATUS_TAG_COLOR: Record<string, string> = {
  todo: 'default',
  in_progress: 'processing',
  review: 'cyan',
  done: 'success',
  cancelled: 'default',
  blocked: 'warning',
}

/** 任务详情抽屉：图上选中即达——信息、执行 Agent、前置依赖、状态操作与页面跳转联动。 */
export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  node,
  nodeById,
  open,
  updating,
  onClose,
  onJumpToTask,
  onStatusChange,
}) => {
  const navigate = useNavigate()
  const { tp } = usePageTranslation('projectDetail')
  const d = (key: string) => tp(`taskGraph.drawer.${key}`)

  if (!node) return null
  const style = READINESS_STYLE[node.readiness]
  const agents = agentAssigneesOf(node)
  const unresolved = new Set(node.unresolved_blockers || [])
  const status = node.status || null

  const actions: Array<{ label: string; status: string; kind: 'primary' | 'default' | 'danger' }> = []
  if (status && status !== 'done') actions.push({ label: d('markDone'), status: 'done', kind: 'primary' })
  if (status && status !== 'cancelled') actions.push({ label: d('cancel'), status: 'cancelled', kind: 'danger' })
  if (status && ['done', 'cancelled', 'blocked'].includes(status)) actions.push({ label: d('reopen'), status: 'todo', kind: 'default' })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={400}
      title={
        <span style={{ fontSize: 14 }}>
          <span style={{ color: '#8c8c8c', fontWeight: 400, marginRight: 6 }}>#{node.id}</span>
          {node.title}
        </span>
      }
    >
      {/* 就绪态 / 状态 / 优先级 */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <Tag style={{ borderRadius: 4, color: style.text, background: style.bg, border: `1px solid ${style.border}44`, marginInlineEnd: 0 }}>
          {tp(`taskGraph.readiness.${node.readiness}`)}
        </Tag>
        {status && <Tag color={STATUS_TAG_COLOR[status] || 'default'} style={{ borderRadius: 4, marginInlineEnd: 0 }}>{d(`status_${status}`)}</Tag>}
        {node.priority && <Tag style={{ borderRadius: 4, marginInlineEnd: 0 }}>{d('priority')}: {node.priority}</Tag>}
        {node.is_ai_task && <Tag color="blue" style={{ borderRadius: 4, marginInlineEnd: 0 }}>AI</Tag>}
      </div>

      {/* 执行 Agent：点击跳 Agent 详情（多 Agent 协作联动入口） */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>{d('assignees')}</div>
        {agents.length === 0 ? (
          <span style={{ fontSize: 13, color: '#bfbfbf' }}>{d('noAssignees')}</span>
        ) : (
          <Space size={6} wrap>
            {agents.map((a) => (
              <Button
                key={a.id}
                size="small"
                icon={<RobotOutlined />}
                style={{ borderRadius: 6, fontSize: 12 }}
                onClick={() => navigate(`/todo-for-ai/pages/agents/${a.id}/overview`)}
              >
                {a.name}
              </Button>
            ))}
          </Space>
        )}
      </div>

      {/* 前置依赖：点击跳转到该节点（图聚焦随动），解除态与派发依赖门同语义 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
          {d('deps')} · {node.blocked_by.length}
        </div>
        {node.blocked_by.length === 0 ? (
          <span style={{ fontSize: 13, color: '#bfbfbf' }}>{d('depsEmpty')}</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {node.blocked_by.map((depId) => {
              const resolved = !unresolved.has(depId)
              const target = nodeById.get(depId)
              return (
                <div
                  key={depId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 8px',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  {resolved ? (
                    <CheckCircleOutlined style={{ color: '#389e0d' }} />
                  ) : (
                    <ClockCircleOutlined style={{ color: '#d46b08' }} />
                  )}
                  {target ? (
                    <a style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onClick={() => onJumpToTask(depId)}>
                      #{depId} {target.title}
                    </a>
                  ) : (
                    <Tooltip title={d('depGhost')}>
                      <span style={{ flex: 1, color: '#8c8c8c' }}>
                        #{depId} <QuestionCircleOutlined />
                      </span>
                    </Tooltip>
                  )}
                  <span style={{ color: resolved ? '#389e0d' : '#d46b08', flexShrink: 0 }}>
                    {resolved ? d('depResolved') : d('depUnresolved')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 状态操作：改状态 → 实时推送 → 任务图自动刷新 */}
      {actions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>{d('actions')}</div>
          <Space size={8} wrap>
            {actions.map((a) => (
              <Button
                key={a.status}
                type={a.kind === 'primary' ? 'primary' : a.kind === 'danger' ? 'primary' : 'default'}
                danger={a.kind === 'danger'}
                size="small"
                loading={updating}
                style={{ borderRadius: 6 }}
                onClick={() => onStatusChange(node.id, a.status)}
              >
                {a.label}
              </Button>
            ))}
          </Space>
        </div>
      )}

      <Button
        type="link"
        size="small"
        icon={<LinkOutlined />}
        style={{ padding: 0 }}
        onClick={() => navigate(`/todo-for-ai/pages/tasks/${node.id}`)}
      >
        {d('openDetail')}
      </Button>
    </Drawer>
  )
}
