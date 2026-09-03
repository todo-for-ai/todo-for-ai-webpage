/**
 * 治理 Tab：项目维度的审批与审计信号。
 *
 * - PR 审批队列：后端按"当前用户可管理的项目"隐式过滤，item 带 project_id，
 *   这里做项目级过滤呈现。
 * - 审计事件：后端只有工作区级列表（item 带 project_id），这里拉取后
 *   客户端过滤出本项目相关条目——服务端项目级过滤是后续后端聚合点。
 */
import { useEffect, useState } from 'react'
import { Button, Card, Empty, Spin, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { LinkButton } from '../SmartLink'
import {
  projectContextApi,
  type PendingPRApproval,
  type WorkspaceAuditEvent,
} from '../../api/projectContext'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

interface GovernanceTabProps {
  projectId: number
  workspaceId?: number | null
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

export function GovernanceTab({ projectId, workspaceId }: GovernanceTabProps) {
  const { tp } = usePageTranslation('projectDetail')
  const [loadingApprovals, setLoadingApprovals] = useState(true)
  const [approvals, setApprovals] = useState<PendingPRApproval[]>([])
  const [loadingAudit, setLoadingAudit] = useState(workspaceId != null)
  const [auditEvents, setAuditEvents] = useState<WorkspaceAuditEvent[]>([])

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

  useEffect(() => {
    if (!workspaceId) {
      setLoadingAudit(false)
      setAuditEvents([])
      return
    }
    let cancelled = false
    setLoadingAudit(true)
    projectContextApi
      .getWorkspaceAuditEvents(workspaceId, { page: 1, per_page: 100 })
      .then((resp) => {
        if (cancelled) return
        setAuditEvents(
          (resp.items ?? [])
            .filter((event) => event.project_id === projectId)
            .slice(0, 20)
        )
      })
      .catch(() => {
        if (!cancelled) setAuditEvents([])
      })
      .finally(() => {
        if (!cancelled) setLoadingAudit(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, workspaceId])

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

  const auditColumns: ColumnsType<WorkspaceAuditEvent> = [
    {
      title: tp('governanceTab.colTime'),
      dataIndex: 'occurred_at',
      width: 170,
      render: (value: string) => new Date(value).toLocaleString(),
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
      <Card title={tp('governanceTab.prTitle')}>
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
        title={tp('governanceTab.auditTitle')}
        extra={
          workspaceId ? (
            <Button type="link" size="small" href={`/todo-for-ai/pages/organizations/${workspaceId}?tab=activity`}>
              {tp('governanceTab.viewAllAudit')}
            </Button>
          ) : undefined
        }
      >
        {loadingAudit ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Spin />
          </div>
        ) : (
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
        )}
        <p style={{ marginTop: 8, color: '#999', fontSize: 12 }}>{tp('governanceTab.auditNote')}</p>
      </Card>
    </div>
  )
}
