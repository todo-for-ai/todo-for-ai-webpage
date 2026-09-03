/**
 * 项目上下文头：把项目放回它的上下文里（组织 / 代码仓库 / Agent）。
 *
 * 与旧头部的区别：面包屑显示组织归属并可跳回组织详情；事实行展示
 * repo 绑定、Agent 覆盖、负责人等跨域信号，chip 可点击跳到对应 Tab。
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Button, Card, Spin, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  ApiOutlined,
  BranchesOutlined,
  HomeOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { organizationsApi, type Organization } from '../../api/organizations'
import {
  projectContextApi,
  type ProjectRepoBinding,
  type WorkspaceAgentSummary,
} from '../../api/projectContext'
import type { Project } from '../../api/projects'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import './projectDetail.css'

interface ProjectContextHeaderProps {
  project: Project
  onOpenTab: (tabKey: string) => void
  actions?: ReactNode
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

export function ProjectContextHeader({ project, onOpenTab, actions }: ProjectContextHeaderProps) {
  const navigate = useNavigate()
  const { tp, tc } = usePageTranslation('projectDetail')

  const [orgName, setOrgName] = useState<string | null>(null)
  const [repoBinding, setRepoBinding] = useState<ProjectRepoBinding | null | undefined>(undefined)
  const [agents, setAgents] = useState<WorkspaceAgentSummary[] | null>(null)

  const organizationId = project.organization_id ?? null

  useEffect(() => {
    let cancelled = false
    if (!organizationId) {
      setOrgName(null)
      return
    }
    organizationsApi
      .getOrganizations({ page: 1, per_page: 200 })
      .then((resp) => {
        if (cancelled) return
        const list = (resp as { items?: Organization[] }).items ?? []
        const match = list.find((org) => org.id === organizationId)
        setOrgName(match?.name ?? `#${organizationId}`)
      })
      .catch(() => {
        if (!cancelled) setOrgName(`#${organizationId}`)
      })
    return () => {
      cancelled = true
    }
  }, [organizationId])

  useEffect(() => {
    let cancelled = false
    projectContextApi
      .getRepoBinding(project.id)
      .then((binding) => {
        if (!cancelled) setRepoBinding(binding)
      })
      .catch(() => {
        if (!cancelled) setRepoBinding(null)
      })
    return () => {
      cancelled = true
    }
  }, [project.id])

  useEffect(() => {
    let cancelled = false
    if (!organizationId) {
      setAgents(null)
      return
    }
    projectContextApi
      .getWorkspaceAgents(organizationId, { page: 1, per_page: 200 })
      .then((resp) => {
        if (cancelled) return
        const visible = (resp.items ?? []).filter(
          (agent) =>
            !agent.allowed_project_ids || agent.allowed_project_ids.includes(project.id)
        )
        setAgents(visible)
      })
      .catch(() => {
        if (!cancelled) setAgents([])
      })
    return () => {
      cancelled = true
    }
  }, [organizationId, project.id])

  const activeAgents = (agents ?? []).filter((agent) => agent.status === 'active')

  return (
    <Card style={{ marginBottom: '16px' }} className="pd-context-header">
      <div className="pd-context-header__row">
        <div className="pd-context-header__breadcrumb">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/todo-for-ai/pages/projects')}>
            {tc('actions.back')}
          </Button>
          <span className="pd-context-header__divider">|</span>
          <HomeOutlined style={{ color: '#00b96b' }} />
          {organizationId && (
            <>
              <a
                onClick={() => navigate(`/todo-for-ai/pages/organizations/${organizationId}`)}
                className="pd-context-header__org-link"
                title={tp('contextHeader.goToOrganization')}
              >
                {orgName ?? <Spin size="small" />}
              </a>
              <span className="pd-context-header__divider">/</span>
            </>
          )}
          <span className="pd-context-header__name">{project.name}</span>
          <Tag color={project.status === 'active' ? 'green' : 'orange'}>
            {tp(`status.${project.status}`)}
          </Tag>
        </div>
        <div className="pd-context-header__actions">{actions}</div>
      </div>

      <div className="pd-context-header__facts">
        <Tag
          icon={<BranchesOutlined />}
          color={repoBinding ? 'green' : 'default'}
          onClick={() => onOpenTab('code')}
          className="pd-context-header__chip"
          title={tp('contextHeader.repoChipTitle')}
        >
          {repoBinding === undefined
            ? tp('contextHeader.repoLoading')
            : repoBinding
              ? `${repoBinding.repo_full_name} @ ${repoBinding.default_branch}`
              : tp('contextHeader.repoUnbound')}
        </Tag>
        {organizationId && (
          <Tag
            icon={<ApiOutlined />}
            color={activeAgents.length > 0 ? 'green' : 'default'}
            onClick={() => onOpenTab('agents')}
            className="pd-context-header__chip"
            title={tp('contextHeader.agentsChipTitle')}
          >
            {agents === null
              ? tp('contextHeader.agentsLoading')
              : `${tp('contextHeader.agentsCount')} ${agents.length} · ${tp('contextHeader.agentsActive')} ${activeAgents.length}`}
          </Tag>
        )}
        <Tag
          icon={<SafetyOutlined />}
          color="default"
          onClick={() => onOpenTab('context-rules')}
          className="pd-context-header__chip"
        >
          {`${tp('contextHeader.contextRules')} ${project.stats?.context_rules_count ?? 0}`}
        </Tag>
        {project.owner_id != null && (
          <Tag color="default">
            {`${tp('contextHeader.owner')} #${project.owner_id}`}
          </Tag>
        )}
        {agents !== null && agents.length > 0 && (
          <Tag color="default">
            {`${tp('contextHeader.agentOnlinePrefix')} ${activeAgents
              .slice(0, 3)
              .map((agent) => agent.display_name || agent.name)
              .join('、')}${activeAgents.length > 3 ? '…' : ''}`}
          </Tag>
        )}
        {project.last_activity_at && (
          <Tag color="default">
            {`${tp('contextHeader.lastActivity')} ${dayjs(project.last_activity_at).format('YYYY-MM-DD HH:mm')}`}
          </Tag>
        )}
      </div>
    </Card>
  )
}

export { AgentStatusColor }
