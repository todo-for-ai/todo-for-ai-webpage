/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import {
  organizationsApi,
  type Organization,
  type OrganizationMember,
  type OrganizationRoleDefinition,
} from '../api/organizations'
import { organizationAgentsApi, type OrganizationAgentMember } from '../api/organizationAgents'
import { organizationEventsApi, type OrganizationEvent } from '../api/organizationEvents'
import { projectsApi, type Project } from '../api/projects'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { OrganizationMembersCard } from './organizations/components/OrganizationMembersCard'
import NotificationChannelManager from '../components/NotificationChannelManager'
import { OrgBudgetsTab } from './OrganizationDetail/components/OrgBudgetsTab'
import { OrgRuntimeSettingsTab } from './OrganizationDetail/components/OrgRuntimeSettingsTab'
import { LinkButton } from '../components/SmartLink'
import { formatFullDateTime, formatRelativeTimeI18n } from '../utils/dateUtils'
import {
  getRoleKeys,
  roleColorMap,
  statusColorMap,
  translateRoleLabel,
  translateStatusLabel,
} from './organizations/components/organizationViewShared'
import './OrganizationDetail.css'
import { PageIntro } from '../components/common/PageIntro'
import type { useOrganizationDetailData } from './OrganizationDetailData'

// 派生层 hook：接收数据 hook 的返回包（仅类型级引用，无运行时循环依赖）。import 块整块复制自数据 hook。
type DataHook = ReturnType<typeof useOrganizationDetailData>

/**
 * OrganizationDetail 的记忆化派生（成员/角色/项目/活动统计、徽标段、
 * 表格列定义等）。由 useOrganizationDetailData 原样拆出。
 */
export function useOrganizationDetailDerived(data: DataHook) {
  const {
    agentMembers,
    canManageMembers,
    events,
    formatDateTime,
    formatEventType,
    formatNumber,
    members,
    organization,
    organizationRoles,
    projects,
    tp,
  } = data


  const mergedMemberRows = useMemo(() => {
    const humanRows = members.map((member) => ({
      row_id: `human-${member.id}`,
      entity_type: 'human' as const,
      member,
      agentMember: null as OrganizationAgentMember | null,
      status: member.status,
    }))

    const agentRows = agentMembers.map((agentMember) => ({
      row_id: `agent-${agentMember.id}`,
      entity_type: 'agent' as const,
      member: null as OrganizationMember | null,
      agentMember,
      status: agentMember.status,
    }))

    return [...humanRows, ...agentRows]
  }, [members, agentMembers])

  const roleOptions = useMemo(
    () =>
      organizationRoles
        .filter((item) => item.is_active && item.key !== 'owner')
        .map((item) => ({ label: item.name, value: item.id })),
    [organizationRoles]
  )

  const memberStats = useMemo(() => {
    const humanActive = members.filter((member) => member.status === 'active').length
    const humanInvited = members.filter((member) => member.status === 'invited').length
    const aiActive = agentMembers.filter((member) => member.status === 'active').length
    const aiInvited = agentMembers.filter((member) => member.status === 'invited').length
    const total = humanActive + humanInvited + aiActive + aiInvited
    return {
      total,
      humanActive,
      aiActive,
      invited: humanInvited + aiInvited,
    }
  }, [members, agentMembers])

  const roleStats = useMemo(() => {
    const total = organizationRoles.length
    const active = organizationRoles.filter((role) => role.is_active).length
    return { total, active }
  }, [organizationRoles])

  const projectStats = useMemo(() => {
    const counts = {
      total: projects.length,
      active: 0,
      archived: 0,
      deleted: 0,
    }
    projects.forEach((project) => {
      if (project.status === 'active') {
        counts.active += 1
      } else if (project.status === 'archived') {
        counts.archived += 1
      } else if (project.status === 'deleted') {
        counts.deleted += 1
      }
    })
    return counts
  }, [projects])

  const memberBarSegments = useMemo(() => {
    const total = memberStats.total || 0
    const getWidth = (value: number) => (total > 0 ? `${(value / total) * 100}%` : '0%')
    return [
      { key: 'human', width: getWidth(memberStats.humanActive), color: '#00b96b' },
      { key: 'ai', width: getWidth(memberStats.aiActive), color: '#52c41a' },
      { key: 'invited', width: getWidth(memberStats.invited), color: '#faad14' },
    ]
  }, [memberStats])

  const projectBarSegments = useMemo(() => {
    const total = projectStats.total || 0
    const getWidth = (value: number) => (total > 0 ? `${(value / total) * 100}%` : '0%')
    return [
      { key: 'active', width: getWidth(projectStats.active), color: '#00b96b' },
      { key: 'archived', width: getWidth(projectStats.archived), color: '#bfbfbf' },
      { key: 'deleted', width: getWidth(projectStats.deleted), color: '#ff7875' },
    ]
  }, [projectStats])

  const activityStats = useMemo(() => {
    const now = Date.now()
    const windowMs = 7 * 24 * 60 * 60 * 1000
    let activeProjects7d = 0
    let latestActivityAt: string | undefined
    let latestActivityTs = 0

    const considerTime = (value?: string) => {
      if (!value) return
      const ts = new Date(value).getTime()
      if (Number.isNaN(ts)) return
      if (ts > latestActivityTs) {
        latestActivityTs = ts
        latestActivityAt = value
      }
    }

    projects.forEach((project) => {
      const activityAt = project.last_activity_at || project.updated_at
      considerTime(activityAt)
      if (activityAt) {
        const ts = new Date(activityAt).getTime()
        if (!Number.isNaN(ts) && now - ts <= windowMs) {
          activeProjects7d += 1
        }
      }
    })

    considerTime(organization?.updated_at)

    return {
      activeProjects7d,
      latestActivityAt: latestActivityAt || organization?.updated_at,
    }
  }, [projects, organization?.updated_at])

  const currentRoleKeys = useMemo(
    () => (organization ? getRoleKeys(organization) : []),
    [organization]
  )

  const recentProjects = useMemo(() => {
    const getTimestamp = (value?: string) => {
      if (!value) return 0
      const timestamp = new Date(value).getTime()
      return Number.isNaN(timestamp) ? 0 : timestamp
    }

    return [...projects]
      .sort((left, right) => {
        const rightTs = getTimestamp(right.last_activity_at || right.updated_at || right.created_at)
        const leftTs = getTimestamp(left.last_activity_at || left.updated_at || left.created_at)
        return rightTs - leftTs
      })
      .slice(0, 4)
  }, [projects])

  const activityPreviewItems = useMemo(
    () => events.slice(0, 5),
    [events]
  )

  const organizationSignals = useMemo(() => {
    const signals: Array<{ key: string; color: string; text: string }> = []

    if (memberStats.invited > 0) {
      signals.push({
        key: 'invited',
        color: 'gold',
        text: tp('detail.signals.invitedMembers', { count: memberStats.invited }),
      })
    }

    const inactiveRoles = Math.max(roleStats.total - roleStats.active, 0)
    if (inactiveRoles > 0) {
      signals.push({
        key: 'inactiveRoles',
        color: 'blue',
        text: tp('detail.signals.inactiveRoles', { count: inactiveRoles }),
      })
    }

    if (projectStats.deleted > 0) {
      signals.push({
        key: 'deletedProjects',
        color: 'red',
        text: tp('detail.signals.deletedProjects', { count: projectStats.deleted }),
      })
    } else if (projectStats.archived > 0) {
      signals.push({
        key: 'archivedProjects',
        color: 'orange',
        text: tp('detail.signals.archivedProjects', { count: projectStats.archived }),
      })
    }

    if (projectStats.total === 0) {
      signals.push({
        key: 'noProjects',
        color: 'blue',
        text: tp('detail.signals.noProjects'),
      })
    }

    return signals
  }, [memberStats.invited, projectStats.archived, projectStats.deleted, projectStats.total, roleStats.active, roleStats.total, tp])

  const profileFacts = useMemo(() => [
    {
      key: 'slug',
      label: tp('detail.overview.slug'),
      value: organization?.slug || '-',
    },
    {
      key: 'access',
      label: tp('detail.overview.myAccess'),
      value: currentRoleKeys.length
        ? currentRoleKeys.map((roleKey) => translateRoleLabel(tp, roleKey)).join(' / ')
        : '-',
    },
    {
      key: 'manage',
      label: tp('detail.overview.manageAccess'),
      value: canManageMembers
        ? tp('detail.overview.manageEnabled')
        : tp('detail.overview.manageDisabled'),
    },
    {
      key: 'roles',
      label: tp('detail.stats.totalRoles'),
      value: formatNumber(roleStats.total),
    },
  ], [canManageMembers, currentRoleKeys, formatNumber, organization?.slug, roleStats.total, tp])

  const getEventSummary = useCallback((record: OrganizationEvent) => {
    const payload = record.payload || {}
    const changedFields = Array.isArray(payload.changed_fields)
      ? payload.changed_fields.filter(Boolean).join(', ')
      : ''

    return (
      record.message ||
      payload.task_title ||
      payload.project_name ||
      payload.organization_name ||
      payload.agent_name ||
      changedFields ||
      formatEventType(record.event_type)
    )
  }, [formatEventType])

  const getEventTimestamp = useCallback(
    (record: OrganizationEvent) => record.occurred_at || record.created_at,
    []
  )

  const projectColumns = useMemo(() => {
    return [
      {
        title: tp('detail.projects.columns.name'),
        key: 'name',
        render: (_: unknown, record: Project) => (
          <div>
            <LinkButton
              to={`/todo-for-ai/pages/projects/${record.id}`}
              type="link"
              style={{ padding: 0, fontWeight: 600, height: 'auto' }}
            >
              {record.name}
            </LinkButton>
            {record.description && (
              <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>{record.description}</div>
            )}
          </div>
        ),
      },
      {
        title: tp('detail.projects.columns.status'),
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (status: string) => (
          <Tag color={status === 'active' ? 'green' : 'orange'}>{tp(`detail.status.${status}`, { defaultValue: status })}</Tag>
        ),
      },
      {
        title: tp('detail.projects.columns.tasks'),
        key: 'tasks',
        width: 120,
        render: (_: unknown, record: Project) => (
          <span>{record.total_tasks ?? record.stats?.total_tasks ?? '-'}</span>
        ),
      },
      {
        title: tp('detail.projects.columns.lastActivity'),
        dataIndex: 'last_activity_at',
        key: 'last_activity_at',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: tp('detail.projects.columns.actions'),
        key: 'actions',
        width: 180,
        render: (_: unknown, record: Project) => (
          <Space size={8}>
            <LinkButton to={`/todo-for-ai/pages/projects/${record.id}`} type="link">
              {tp('detail.projects.actions.view')}
            </LinkButton>
            <LinkButton to={`/todo-for-ai/pages/projects/${record.id}?tab=tasks`} type="link">
              {tp('detail.projects.actions.tasks')}
            </LinkButton>
          </Space>
        ),
      },
    ]
  }, [formatDateTime, tp])

  const eventColumns = useMemo(() => {
    return [
      {
        title: tp('detail.activity.columns.time'),
        key: 'occurred_at',
        width: 180,
        render: (_: unknown, record: OrganizationEvent) =>
          formatDateTime(record.occurred_at || record.created_at || undefined),
      },
      {
        title: tp('detail.activity.columns.event'),
        key: 'event',
        render: (_: unknown, record: OrganizationEvent) => {
          const detailText =
            record.message ||
            record.payload?.task_title ||
            record.payload?.project_name ||
            ''
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{formatEventType(record.event_type)}</div>
              {detailText ? (
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>{detailText}</div>
              ) : null}
            </div>
          )
        },
      },
      {
        title: tp('detail.activity.columns.actor'),
        key: 'actor',
        width: 160,
        render: (_: unknown, record: OrganizationEvent) => (
          <span>{record.actor_name || record.actor_id || '-'}</span>
        ),
      },
      {
        title: tp('detail.activity.columns.related'),
        key: 'related',
        width: 220,
        render: (_: unknown, record: OrganizationEvent) => {
          const hasProject = !!record.project_id
          const hasTask = !!record.task_id
          if (!hasProject && !hasTask) {
            return <span>-</span>
          }
          return (
            <Space size={8} wrap>
              {hasProject ? (
                <LinkButton to={`/todo-for-ai/pages/projects/${record.project_id}`} type="link">
                  {record.payload?.project_name || tp('detail.activity.labels.project')}
                </LinkButton>
              ) : null}
              {hasTask ? (
                <LinkButton to={`/todo-for-ai/pages/tasks/${record.task_id}`} type="link">
                  {record.payload?.task_title || `#${record.task_id}`}
                </LinkButton>
              ) : null}
            </Space>
          )
        },
      },
    ]
  }, [formatDateTime, formatEventType, tp])

  return {
    mergedMemberRows,
    roleOptions,
    memberStats,
    roleStats,
    projectStats,
    memberBarSegments,
    projectBarSegments,
    activityStats,
    currentRoleKeys,
    recentProjects,
    activityPreviewItems,
    organizationSignals,
    profileFacts,
    getEventSummary,
    getEventTimestamp,
    projectColumns,
    eventColumns,
  }
}
