/**
 * 治理 Tab：项目维度的审批与审计信号。
 *
 * - PR 审批队列：后端按"当前用户可管理的项目"隐式过滤，item 带 project_id，
 *   这里做项目级过滤呈现。
 * - 审计事件：来自项目 overview 聚合端点（服务端按 project_id / 项目任务
 *   ID 匹配最新事件）。
 */
import { useEffect, useState } from 'react'
import { Button, Card, Empty, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { LinkButton } from '../SmartLink'
import {
  projectContextApi,
  type PendingPRApproval,
  type ProjectAuditEvent,
  type ProjectOverview,
} from '../../api/projectContext'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { withHint } from '../common/HintIcon'
import { GoalLoopsCard } from './GoalLoopsCard'

interface GovernanceTabProps {
  projectId: number
  overview?: ProjectOverview | null
  canManage?: boolean
}

function LevelColor(level?: string | null): string {
  switch ((level ?? '').toLowerCase()) {
    case 'error':
    case 'critical':
      return 'red'
    case 'warning':
      return 'orange'
    case 'info':
      return 'blue'
    default:
      return 'default'
  }
}

export function GovernanceTab({ projectId, overview, canManage = false }: GovernanceTabProps) {
  const { tp } = usePageTranslation('projectDetail')
  const [loadingApprovals, setLoadingApprovals] = useState(true)
  const [approvals, setApprovals] = useState<PendingPRApproval[]>([])

  useEffect(() => {
    let cancelled = false
    setLoadingApprovals(true)
    projectContextApi
      .getPendingPRApprovals({ page: 1, per_page: 100 })
      .then((resp) => {
        if (cancelled) return
        setApprovals(
          (resp.items ?? []).filter((item) => item.project_id === projectId)
        )
      })
      .catch(() => {
        if (!cancelled) setApprovals([])
      })
      .finally(() => {
        if (!cancelled) setLoadingApprovals(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  const auditEvents: ProjectAuditEvent[] = overview?.recent_events ?? []

  const approvalColumns: ColumnsType<PendingPRApproval> = [
    {
      title: tp('governanceTab.colPR'),
      key: 'pr',
      render: (_, record) =>
        record.repo_full_name ? (
          <span>
            #{record.pr_number ?? '-'} · {record.repo_full_name}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: tp('governanceTab.colTask'),
      key: 'task',
      render: (_, record) =>
        record.task_id ? (
          <LinkButton to={`/todo-for-ai/pages/tasks/${record.task_id}`} type="link">
            {record.task_title || `#${record.task_id}`}
          </LinkButton>
        ) : (
          record.task_title || '-'
        ),
    },
    {
      title: tp('governanceTab.colBranch'),
      dataIndex: 'head_branch',
      width: 200,
      render: (branch: string | null) => branch ?? '-',
    },
    {
      title: tp('governanceTab.colRequestedAt'),
      dataIndex: 'requested_at',
      render: (value: string | null) => (value ? new Date(value).toLocaleString() : '-'),
    },
  ]

  const auditColumns: ColumnsType<ProjectAuditEvent> = [
    {
      title: tp('governanceTab.colTime'),
      dataIndex: 'occurred_at',
      width: 170,
      render: (value: string | null | undefined) =>
        value ? new Date(value).toLocaleString() : '-',
    },
    {
      title: tp('governanceTab.colEvent'),
      dataIndex: 'event_type',
    },
    {
      title: tp('governanceTab.colLevel'),
      dataIndex: 'level',
      width: 90,
      render: (level: string | null | undefined) => (
        <Tag color={LevelColor(level)}>{level ?? '-'}</Tag>
      ),
    },
    {
      title: tp('governanceTab.colActor'),
      dataIndex: 'actor_type',
      width: 110,
      render: (actorType: string | null | undefined, record) =>
        actorType ?? (record.actor_agent_id ? `agent #${record.actor_agent_id}` : '-'),
    },
    {
      title: tp('governanceTab.colTask'),
      key: 'task',
      width: 90,
      render: (_, record) =>
        record.task_id ? (
          <LinkButton to={`/todo-for-ai/pages/tasks/${record.task_id}`} type="link">
            #{record.task_id}
          </LinkButton>
        ) : (
          '-'
        ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <GoalLoopsCard projectId={projectId} overview={overview} canManage={canManage} />

      <Card title={withHint(tp('governanceTab.prTitle'), tp('governanceTab.hintPr'))}>
        <Table
          rowKey="interaction_id"
          size="small"
          loading={loadingApprovals}
          columns={approvalColumns}
          dataSource={approvals}
          pagination={false}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tp('governanceTab.prEmpty')} />
            ),
          }}
        />
      </Card>

      <Card
        title={withHint(tp('governanceTab.auditTitle'), tp('governanceTab.hintAudit'))}
        extra={
          overview?.organization ? (
            <Button
              type="link"
              size="small"
              href={`/todo-for-ai/pages/organizations/${overview.organization.id}?tab=activity`}
            >
              {tp('governanceTab.viewAllAudit')}
            </Button>
          ) : undefined
        }
      >
        <Table
          rowKey="id"
          size="small"
          columns={auditColumns}
          dataSource={auditEvents}
          pagination={false}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tp('governanceTab.auditEmpty')} />
            ),
          }}
        />
        <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>{tp('governanceTab.auditNote')}</p>
      </Card>
    </div>
  )
}
