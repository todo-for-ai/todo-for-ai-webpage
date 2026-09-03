/**
 * Agent 协作 Tab：本项目可见的 Agent 一览。
 *
 * Agent 挂在组织（工作区）下，通过 allowed_project_ids 控制项目级可见性；
 * allowed_project_ids 为空表示继承全工作区（与后端 _resolve_accessible_project_ids
 * 的语义一致）。项目未挂组织时 Agent 无法接入，这里给出明确提示。
 */
import { useEffect, useMemo, useState } from 'react'
import { Card, Empty, Spin, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { LinkButton } from '../SmartLink'
import {
  projectContextApi,
  type WorkspaceAgentSummary,
} from '../../api/projectContext'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { AgentStatusColor } from './ProjectContextHeader'

interface AgentsTabProps {
  projectId: number
  workspaceId?: number | null
}

export function AgentsTab({ projectId, workspaceId }: AgentsTabProps) {
  const { tp } = usePageTranslation('projectDetail')
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState<WorkspaceAgentSummary[]>([])

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false)
      setAgents([])
      return
    }
    let cancelled = false
    setLoading(true)
    projectContextApi
      .getWorkspaceAgents(workspaceId, { page: 1, per_page: 200 })
      .then((resp) => {
        if (cancelled) return
        setAgents(
          (resp.items ?? []).filter(
            (agent) =>
              !agent.allowed_project_ids || agent.allowed_project_ids.includes(projectId)
          )
        )
      })
      .catch(() => {
        if (!cancelled) setAgents([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, workspaceId])

  const columns: ColumnsType<WorkspaceAgentSummary> = [
    {
      title: tp('agentsTab.colAgent'),
      key: 'name',
      render: (_, record) => (
        <LinkButton to={`/todo-for-ai/pages/agents/${record.id}`} type="link">
          {record.display_name || record.name}
        </LinkButton>
      ),
    },
    {
      title: tp('agentsTab.colStatus'),
      dataIndex: 'status',
      width: 100,
      render: (status: string | undefined) => (
        <Tag color={AgentStatusColor(status)}>{status ?? '-'}</Tag>
      ),
    },
    {
      title: tp('agentsTab.colRole'),
      dataIndex: 'collaboration_role',
      width: 130,
      render: (role: string | undefined) => role ?? '-',
    },
    {
      title: tp('agentsTab.colExecution'),
      dataIndex: 'execution_mode',
      width: 120,
      render: (mode: string | undefined) => mode ?? '-',
    },
    {
      title: tp('agentsTab.colSandbox'),
      dataIndex: 'sandbox_profile',
      width: 130,
      render: (profile: string | undefined, record) =>
        profile ?? (record.runner_enabled ? 'runner' : '-'),
    },
    {
      title: tp('agentsTab.colAuthz'),
      key: 'authz',
      width: 120,
      render: (_, record) =>
        record.allowed_project_ids ? (
          <Tag color="blue">{tp('agentsTab.explicitGrant')}</Tag>
        ) : (
          <Tag>{tp('agentsTab.workspaceInherit')}</Tag>
        ),
    },
    {
      title: tp('agentsTab.colLastSeen'),
      dataIndex: 'last_seen_at',
      render: (value: string | undefined) =>
        value ? new Date(value).toLocaleString() : '-',
    },
  ]

  const summary = useMemo(() => {
    const explicit = agents.filter((agent) => agent.allowed_project_ids).length
    const inherited = agents.length - explicit
    return tp('agentsTab.summary')
      .replace('{total}', String(agents.length))
      .replace('{explicit}', String(explicit))
      .replace('{inherited}', String(inherited))
  }, [agents, tp])

  if (!workspaceId) {
    return (
      <Card title={tp('agentsTab.title')}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={tp('agentsTab.noWorkspaceHint')}
        />
      </Card>
    )
  }

  return (
    <Card title={tp('agentsTab.title')} extra={<span style={{ color: '#999', fontSize: 12 }}>{summary}</span>}>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={agents}
        pagination={false}
        locale={{
          emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tp('agentsTab.empty')} />,
        }}
      />
    </Card>
  )
}
