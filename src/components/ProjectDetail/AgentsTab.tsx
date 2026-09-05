/**
 * Agent 协作 Tab：本项目可见的 Agent 及其在本项目上的运行画像。
 *
 * 数据来自项目 overview 聚合端点（服务端完成 allowed_project_ids 语义
 * 的可见性过滤与运行统计）；项目未挂组织时 Agent 无法接入，给出明确提示。
 */
import { Card, Empty, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { LinkButton } from '../SmartLink'
import type { ProjectAgentOverview, ProjectOverview } from '../../api/projectContext'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { withHint } from '../common/HintIcon'

interface AgentsTabProps {
  overview?: ProjectOverview | null
}

function AgentStatusColor(status?: string): string {
  switch (status) {
    case 'active':
      return 'green'
    case 'paused':
      return 'orange'
    case 'revoked':
    case 'disabled':
      return 'red'
    default:
      return 'default'
  }
}

function RunStateColor(state?: string | null): string {
  switch (state) {
    case 'succeeded':
      return 'green'
    case 'failed':
    case 'expired':
      return 'red'
    case 'running':
    case 'leased':
    case 'queued':
      return 'blue'
    default:
      return 'default'
  }
}

export function AgentsTab({ overview }: AgentsTabProps) {
  const { tp } = usePageTranslation('projectDetail')
  const agents: ProjectAgentOverview[] = overview?.agents ?? []

  const columns: ColumnsType<ProjectAgentOverview> = [
    {
      title: tp('agentsTab.colAgent'),
      key: 'name',
      render: (_, record) => (
        <span>
          <LinkButton to={`/todo-for-ai/pages/agents/${record.id}`} type="link">
            {record.display_name || record.name}
          </LinkButton>
          {record.role && (
            <Tooltip title={tp('agentsTab.hintRole')}>
              <Tag color="cyan" style={{ marginLeft: 6 }}>
                {record.role.display_name}
              </Tag>
            </Tooltip>
          )}
        </span>
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
      title: tp('agentsTab.colExecution'),
      dataIndex: 'execution_mode',
      width: 120,
      render: (mode: string | undefined) => mode ?? '-',
    },
    {
      title: tp('agentsTab.colSandbox'),
      dataIndex: 'sandbox_profile',
      width: 120,
      render: (profile: string | undefined) => profile ?? '-',
    },
    {
      title: withHint(tp('agentsTab.colAuthz'), tp('agentsTab.hintAuthz')),
      key: 'authz',
      width: 110,
      render: (_, record) =>
        record.explicitly_allowed ? (
          <Tag color="blue">{tp('agentsTab.explicitGrant')}</Tag>
        ) : (
          <Tag>{tp('agentsTab.workspaceInherit')}</Tag>
        ),
    },
    {
      title: withHint(tp('agentsTab.colRuns'), tp('agentsTab.hintRuns')),
      key: 'runs',
      width: 150,
      render: (_, record) =>
        record.runs_total > 0 ? (
          <span>
            {record.runs_total}
            <Tag color="green" style={{ marginLeft: 6 }}>
              ✓ {record.runs_succeeded}
            </Tag>
            {record.runs_failed > 0 && (
              <Tag color="red" style={{ marginLeft: 4 }}>
                ✗ {record.runs_failed}
              </Tag>
            )}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: withHint(tp('agentsTab.colLastRun'), tp('agentsTab.hintLastRun')),
      key: 'last_run',
      width: 190,
      render: (_, record) => {
        if (record.has_active_lease || record.active_runs > 0) {
          return (
            <Tag color="processing" icon={<span className="pd-pulse-dot" />}>
              {tp('agentsTab.runningNow')}
            </Tag>
          )
        }
        if (!record.last_run_at) return '-'
        return (
          <span>
            <Tag color={RunStateColor(record.last_run_state)}>{record.last_run_state}</Tag>
            {new Date(record.last_run_at).toLocaleString()}
          </span>
        )
      },
    },
  ]

  const explicit = agents.filter((agent) => agent.explicitly_allowed).length
  const inherited = agents.length - explicit
  const summary = tp('agentsTab.summary')
    .replace('{total}', String(agents.length))
    .replace('{explicit}', String(explicit))
    .replace('{inherited}', String(inherited))

  return (
    <Card
      title={tp('agentsTab.title')}
      extra={<span style={{ color: '#999', fontSize: 12 }}>{summary}</span>}
    >
      {!overview?.organization ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={tp('agentsTab.noWorkspaceHint')}
        />
      ) : (
        <Table
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={agents}
          pagination={false}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tp('agentsTab.empty')} />
            ),
          }}
        />
      )}
    </Card>
  )
}

