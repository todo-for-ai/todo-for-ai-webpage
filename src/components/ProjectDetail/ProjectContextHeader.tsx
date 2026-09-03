/**
 * 项目上下文头：把项目放回它的上下文里（组织 / 代码仓库 / Agent）。
 *
 * 数据来自 GET /projects/{id}/overview 聚合端点（页面级拉取后传入），
 * 面包屑显示组织归属并可跳回组织详情；事实行展示 repo 绑定、Agent
 * 覆盖、运行中任务等跨域信号，chip 可点击跳到对应 Tab。
 */
import { type ReactNode } from 'react'
import { Button, Card, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  ApiOutlined,
  BranchesOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { ProjectOverview } from '../../api/projectContext'
import type { Project } from '../../api/projects'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import './projectDetail.css'

interface ProjectContextHeaderProps {
  project: Project
  overview?: ProjectOverview | null
  onOpenTab: (tabKey: string) => void
  actions?: ReactNode
}

export function ProjectContextHeader({ project, overview, onOpenTab, actions }: ProjectContextHeaderProps) {
  const navigate = useNavigate()
  const { tp, tc } = usePageTranslation('projectDetail')

  const organization = overview?.organization ?? null
  const repoBinding = overview?.repo ?? null
  const agents = overview?.agents ?? null
  const activeAgents = (agents ?? []).filter((agent) => agent.status === 'active')
  const runningTasks = overview?.runs_summary.running_tasks ?? 0

  return (
    <Card style={{ marginBottom: '16px' }} className="pd-context-header">
      <div className="pd-context-header__row">
        <div className="pd-context-header__breadcrumb">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/todo-for-ai/pages/projects')}>
            {tc('actions.back')}
          </Button>
          <span className="pd-context-header__divider">|</span>
          <HomeOutlined style={{ color: '#00b96b' }} />
          {organization && (
            <>
              <a
                onClick={() => navigate(`/todo-for-ai/pages/organizations/${organization.id}`)}
                className="pd-context-header__org-link"
                title={tp('contextHeader.goToOrganization')}
              >
                {organization.name}
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
          {overview === undefined
            ? tp('contextHeader.repoLoading')
            : repoBinding
              ? `${repoBinding.repo_full_name} @ ${repoBinding.default_branch}`
              : tp('contextHeader.repoUnbound')}
        </Tag>
        {organization && (
          <Tag
            icon={<ApiOutlined />}
            color={(agents ?? []).length > 0 ? 'green' : 'default'}
            onClick={() => onOpenTab('agents')}
            className="pd-context-header__chip"
            title={tp('contextHeader.agentsChipTitle')}
          >
            {agents === null
              ? tp('contextHeader.agentsLoading')
              : `${tp('contextHeader.agentsCount')} ${agents.length} · ${tp('contextHeader.agentsActive')} ${activeAgents.length}`}
          </Tag>
        )}
        {runningTasks > 0 && (
          <Tag
            icon={<PlayCircleOutlined />}
            color="processing"
            onClick={() => onOpenTab('governance')}
            className="pd-context-header__chip"
            title={tp('contextHeader.runningChipTitle')}
          >
            {`${tp('contextHeader.runningTasks')} ${runningTasks}`}
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
