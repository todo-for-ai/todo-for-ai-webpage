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

const { Title, Paragraph, Text } = Typography

const ORG_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  invited: 'blue',
  removed: 'default',
}

const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  archived: 'orange',
  deleted: 'default',
}

const EVENT_LABEL_KEY_MAP: Record<string, string> = {
  'task.created': 'taskCreated',
  'task.updated': 'taskUpdated',
  'task.status_changed': 'taskStatusChanged',
  'task.deleted': 'taskDeleted',
  'task.log.appended': 'taskLogAppended',
  'project.created': 'projectCreated',
  'project.updated': 'projectUpdated',
  'project.archived': 'projectArchived',
  'project.restored': 'projectRestored',
  'project.deleted': 'projectDeleted',
  'member.invited': 'memberInvited',
  'member.updated': 'memberUpdated',
  'member.removed': 'memberRemoved',
  'agent.created': 'agentCreated',
  'agent.invited': 'agentInvited',
  'agent.removed': 'agentRemoved',
  'agent.accepted': 'agentAccepted',
  'agent.rejected': 'agentRejected',
  'org.created': 'orgCreated',
  'org.updated': 'orgUpdated',
  'org.archived': 'orgArchived',
}

const extractProjectItems = (payload: any): Project[] => {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  if (Array.isArray(payload.items)) {
    return payload.items as Project[]
  }
  if (Array.isArray(payload.data)) {
    return payload.data as Project[]
  }
  if (payload.data && Array.isArray(payload.data.items)) {
    return payload.data.items as Project[]
  }
  return []
}

const getProjectTaskCount = (project: Project) => (
  project.total_tasks ??
  project.stats?.total_tasks ??
  0
)

const OrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tp, language } = usePageTranslation('organizations')
  const tpRef = useRef(tp)

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [agentMembers, setAgentMembers] = useState<OrganizationAgentMember[]>([])
  const [organizationRoles, setOrganizationRoles] = useState<OrganizationRoleDefinition[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [events, setEvents] = useState<OrganizationEvent[]>([])
  const [eventsPagination, setEventsPagination] = useState<{ page: number; per_page: number; total: number } | null>(null)

  const [pageLoading, setPageLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [createAgentVisible, setCreateAgentVisible] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteAgentId, setInviteAgentId] = useState('')
  const [inviteRoleIds, setInviteRoleIds] = useState<number[]>([])
  const [createAgentForm] = Form.useForm()

  useEffect(() => {
    tpRef.current = tp
  }, [tp])

  const parsedOrganizationId = Number(organizationId)
  const activeTab = searchParams.get('tab') || 'members'

  const canManageMembers =
    organization?.current_user_role === 'owner' || organization?.current_user_role === 'admin'

  const formatDateTime = useCallback(
    (value?: string) => {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return date.toLocaleString(language, { hour12: false })
    },
    [language]
  )

  const formatNumber = useCallback(
    (value?: number) => {
      if (value === undefined || value === null || Number.isNaN(value)) return '-'
      return value.toLocaleString(language)
    },
    [language]
  )

  const formatEventType = useCallback(
    (eventType: string) => {
      const key = EVENT_LABEL_KEY_MAP[eventType]
      if (key) {
        return tp(`detail.activity.eventTypes.${key}`, { defaultValue: eventType })
      }
      return eventType
    },
    [tp]
  )

  const loadOrganization = useCallback(async () => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      setPageLoading(true)
      const data = await organizationsApi.getOrganization(parsedOrganizationId)
      setOrganization(data)
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.loadFailed'))
    } finally {
      setPageLoading(false)
    }
  }, [parsedOrganizationId])

  const loadMembers = useCallback(async () => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      setMembersLoading(true)
      const data = await organizationsApi.getOrganizationMembers(parsedOrganizationId)
      setMembers(data.items || [])
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.memberLoadFailed'))
    } finally {
      setMembersLoading(false)
    }
  }, [parsedOrganizationId])

  const loadAgentMembers = useCallback(async () => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      const data = await organizationAgentsApi.getOrganizationAgentMembers(parsedOrganizationId)
      setAgentMembers(data.items || [])
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.agentMemberLoadFailed'))
      setAgentMembers([])
    }
  }, [parsedOrganizationId])

  const loadOrganizationRoles = useCallback(async () => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      const data = await organizationsApi.getOrganizationRoles(parsedOrganizationId)
      const items = data.items || []
      setOrganizationRoles(items)
      setInviteRoleIds((current) => current.filter((roleId) => items.some((role) => role.id === roleId)))
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.roleLoadFailed'))
      setOrganizationRoles([])
    }
  }, [parsedOrganizationId])

  const loadProjects = useCallback(async () => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      setProjectsLoading(true)
      const response = await projectsApi.getProjects({
        page: 1,
        per_page: 200,
        include_stats: true,
        organization_id: parsedOrganizationId,
      })
      setProjects(extractProjectItems(response))
    } catch (error: any) {
      message.error(error?.message || tpRef.current('detail.projects.loadFailed'))
      setProjects([])
    } finally {
      setProjectsLoading(false)
    }
  }, [parsedOrganizationId])

  const loadEvents = useCallback(async (page = 1, perPage = 20) => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      setEventsLoading(true)
      const response = await organizationEventsApi.getOrganizationEvents(parsedOrganizationId, {
        page,
        per_page: perPage,
      })
      setEvents(response.items || [])
      setEventsPagination(response.pagination || null)
    } catch (error: any) {
      message.error(error?.message || tpRef.current('detail.activity.loadFailed'))
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [parsedOrganizationId])

  const refreshActivityPreview = useCallback(async () => {
    await loadEvents(1, activeTab === 'activity' ? 20 : 6)
  }, [activeTab, loadEvents])

  useEffect(() => {
    if (!parsedOrganizationId || Number.isNaN(parsedOrganizationId)) {
      return
    }
    loadOrganization()
    loadMembers()
    loadAgentMembers()
    loadOrganizationRoles()
    loadProjects()
    void loadEvents(1, 6)
  }, [parsedOrganizationId, loadOrganization, loadMembers, loadAgentMembers, loadOrganizationRoles, loadProjects, loadEvents])

  const inviteMember = async () => {
    if (!parsedOrganizationId) {
      return
    }
    if (!inviteEmail.trim()) {
      message.warning(tp('members.emailRequired'))
      return
    }
    try {
      setActionLoading(true)
      await organizationsApi.inviteOrganizationMember(parsedOrganizationId, {
        email: inviteEmail.trim(),
        role_ids: inviteRoleIds,
      })
      message.success(tp('messages.inviteSuccess'))
      setInviteEmail('')
      setInviteRoleIds([])
      await loadMembers()
      await refreshActivityPreview()
    } catch (error: any) {
      message.error(error?.message || tp('messages.inviteFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const updateMemberRoles = async (member: OrganizationMember, roleIds: number[]) => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      setActionLoading(true)
      await organizationsApi.updateOrganizationMember(parsedOrganizationId, member.user_id, { role_ids: roleIds })
      message.success(tp('messages.memberUpdated'))
      await loadMembers()
      await refreshActivityPreview()
    } catch (error: any) {
      message.error(error?.message || tp('messages.memberUpdateFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const removeMember = async (member: OrganizationMember) => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      setActionLoading(true)
      await organizationsApi.removeOrganizationMember(parsedOrganizationId, member.user_id)
      message.success(tp('messages.memberRemoved'))
      await loadMembers()
      await refreshActivityPreview()
    } catch (error: any) {
      message.error(error?.message || tp('messages.memberRemoveFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const createAgent = async () => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      const values = await createAgentForm.validateFields()
      setActionLoading(true)
      await organizationAgentsApi.createOrganizationAgent(parsedOrganizationId, {
        name: values.name,
        description: values.description,
      })
      message.success(tp('messages.createAgentSuccess'))
      setCreateAgentVisible(false)
      createAgentForm.resetFields()
      await loadAgentMembers()
      await refreshActivityPreview()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      message.error(error?.message || tp('messages.createAgentFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const inviteAgentMember = async () => {
    if (!parsedOrganizationId) {
      return
    }
    const parsedAgentId = Number(inviteAgentId)
    if (!parsedAgentId || Number.isNaN(parsedAgentId)) {
      message.warning(tp('members.agentIdRequired'))
      return
    }
    try {
      setActionLoading(true)
      await organizationAgentsApi.inviteOrganizationAgentMember(parsedOrganizationId, parsedAgentId)
      message.success(tp('messages.agentInviteSuccess'))
      setInviteAgentId('')
      await loadAgentMembers()
      await refreshActivityPreview()
    } catch (error: any) {
      message.error(error?.message || tp('messages.agentInviteFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const removeAgentMember = async (member: OrganizationAgentMember) => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      setActionLoading(true)
      await organizationAgentsApi.removeOrganizationAgentMember(parsedOrganizationId, member.id)
      message.success(tp('messages.agentMemberRemoved'))
      await loadAgentMembers()
      await refreshActivityPreview()
    } catch (error: any) {
      message.error(error?.message || tp('messages.agentMemberRemoveFailed'))
    } finally {
      setActionLoading(false)
    }
  }

  const openRoleManagerPage = () => {
    if (!parsedOrganizationId) {
      return
    }
    navigate(`/todo-for-ai/pages/organizations/${parsedOrganizationId}/roles`)
  }

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
      { key: 'human', width: getWidth(memberStats.humanActive), color: '#1677ff' },
      { key: 'ai', width: getWidth(memberStats.aiActive), color: '#52c41a' },
      { key: 'invited', width: getWidth(memberStats.invited), color: '#faad14' },
    ]
  }, [memberStats])

  const projectBarSegments = useMemo(() => {
    const total = projectStats.total || 0
    const getWidth = (value: number) => (total > 0 ? `${(value / total) * 100}%` : '0%')
    return [
      { key: 'active', width: getWidth(projectStats.active), color: '#1677ff' },
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

  useEffect(() => {
    if (activeTab === 'activity') {
      void loadEvents(1)
    }
  }, [activeTab, loadEvents])

  if (pageLoading && !organization) {
    return (
      <div className="page-container" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <Title level={2} className="page-title">{tp('detail.title')}</Title>
            <Paragraph className="page-description">{tp('detail.subtitle')}</Paragraph>
          </div>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/todo-for-ai/pages/organizations')}>
            {tp('detail.back')}
          </Button>
        </div>
      </div>

      <Card className="org-summary-card" style={{ marginBottom: 16 }}>
        <div className="org-summary">
          <div className="org-summary__head">
            <div>
              <div className="org-summary__title">
                <Title level={3} style={{ margin: 0 }}>{organization?.name || '-'}</Title>
                <Tag color={statusColorMap[organization?.status || 'active'] || 'default'}>
                  {translateStatusLabel(tp, organization?.status || 'active')}
                </Tag>
                {organization?.slug && (
                  <span className="org-summary__slug">{organization.slug}</span>
                )}
              </div>
              {currentRoleKeys.length > 0 ? (
                <Space size={[8, 8]} wrap style={{ marginBottom: 12 }}>
                  {currentRoleKeys.map((roleKey) => (
                    <Tag
                      key={roleKey}
                      color={roleColorMap[roleKey] || 'default'}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {translateRoleLabel(tp, roleKey)}
                    </Tag>
                  ))}
                </Space>
              ) : null}
              {organization?.description ? (
                <Paragraph style={{ marginBottom: 0 }}>{organization.description}</Paragraph>
              ) : (
                <Text type="secondary">{tp('detail.noDescription')}</Text>
              )}
            </div>
          </div>

          <div className="org-summary__grid">
            <div className="org-summary__panel">
              <div className="org-summary__panel-top">
                <Text type="secondary">{tp('detail.stats.membersOverview')}</Text>
                <div className="org-summary__panel-metric">
                  {formatNumber(membersLoading ? undefined : memberStats.total)}
                </div>
              </div>
              <div className="org-summary__bar">
                {memberBarSegments.map((segment) => (
                  <span
                    key={segment.key}
                    className="org-summary__bar-segment"
                    style={{ width: segment.width, background: segment.color }}
                  />
                ))}
              </div>
              <div className="org-summary__legend">
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#1677ff' }} />
                  {tp('detail.stats.humanMembers')} {formatNumber(membersLoading ? undefined : memberStats.humanActive)}
                </span>
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#52c41a' }} />
                  {tp('detail.stats.aiMembers')} {formatNumber(membersLoading ? undefined : memberStats.aiActive)}
                </span>
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#faad14' }} />
                  {tp('detail.stats.invitedMembers')} {formatNumber(membersLoading ? undefined : memberStats.invited)}
                </span>
              </div>
            </div>

            <div className="org-summary__panel">
              <div className="org-summary__panel-top">
                <Text type="secondary">{tp('detail.stats.projectsOverview')}</Text>
                <div className="org-summary__panel-metric">
                  {formatNumber(projectsLoading ? undefined : projectStats.total)}
                </div>
              </div>
              <div className="org-summary__bar">
                {projectBarSegments.map((segment) => (
                  <span
                    key={segment.key}
                    className="org-summary__bar-segment"
                    style={{ width: segment.width, background: segment.color }}
                  />
                ))}
              </div>
              <div className="org-summary__legend">
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#1677ff' }} />
                  {tp('detail.stats.projectsActive')} {formatNumber(projectsLoading ? undefined : projectStats.active)}
                </span>
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#bfbfbf' }} />
                  {tp('detail.stats.projectsArchived')} {formatNumber(projectsLoading ? undefined : projectStats.archived)}
                </span>
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#ff7875' }} />
                  {tp('detail.stats.projectsDeleted')} {formatNumber(projectsLoading ? undefined : projectStats.deleted)}
                </span>
              </div>
            </div>

            <div className="org-summary__panel">
              <div className="org-summary__panel-top">
                <Text type="secondary">{tp('detail.stats.activityOverview')}</Text>
                <div className="org-summary__panel-metric">
                  {formatNumber(projectsLoading ? undefined : activityStats.activeProjects7d)}
                </div>
              </div>
              <div className="org-summary__stats">
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.stats.activeProjects7d')}</span>
                  <span className="org-summary__stat-value">
                    {formatNumber(projectsLoading ? undefined : activityStats.activeProjects7d)}
                  </span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.stats.lastActivity')}</span>
                  <span className="org-summary__stat-value">{formatDateTime(activityStats.latestActivityAt)}</span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.stats.activeRoles')}</span>
                  <span className="org-summary__stat-value">{formatNumber(roleStats.active)}</span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.stats.totalRoles')}</span>
                  <span className="org-summary__stat-value">{formatNumber(roleStats.total)}</span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.fields.createdAt')}</span>
                  <span className="org-summary__stat-value">{formatDateTime(organization?.created_at)}</span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.fields.updatedAt')}</span>
                  <span className="org-summary__stat-value">{formatDateTime(organization?.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="org-insights">
            <div className="org-insights__panel">
              <div className="org-insights__panel-head">
                <div>
                  <Text strong>{tp('detail.overview.title')}</Text>
                  <div className="org-insights__panel-subtitle">{tp('detail.overview.subtitle')}</div>
                </div>
              </div>

              <div className="org-insights__facts">
                {profileFacts.map((fact) => (
                  <div key={fact.key} className="org-insights__fact">
                    <span className="org-insights__fact-label">{fact.label}</span>
                    <span className="org-insights__fact-value">{fact.value}</span>
                  </div>
                ))}
              </div>

              <div className="org-insights__actions">
                <Button size="small" onClick={() => setSearchParams({ tab: 'members' })}>
                  {tp('detail.tabs.members')}
                </Button>
                <Button size="small" onClick={() => setSearchParams({ tab: 'activity' })}>
                  {tp('detail.tabs.activity')}
                </Button>
                <Button size="small" onClick={() => setSearchParams({ tab: 'projects' })}>
                  {tp('detail.tabs.projects')}
                </Button>
                {canManageMembers ? (
                  <Button size="small" onClick={openRoleManagerPage}>
                    {tp('roles.manage')}
                  </Button>
                ) : null}
              </div>

              <div>
                <div className="org-insights__section-title">{tp('detail.overview.healthSignals')}</div>
                {organizationSignals.length > 0 ? (
                  <Space size={[8, 8]} wrap>
                    {organizationSignals.map((signal) => (
                      <Tag key={signal.key} color={signal.color} style={{ marginInlineEnd: 0 }}>
                        {signal.text}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{tp('detail.overview.noSignals')}</Text>
                )}
              </div>
            </div>

            <div className="org-insights__panel">
              <div className="org-insights__panel-head">
                <div>
                  <Text strong>{tp('detail.recentActivity.title')}</Text>
                  <div className="org-insights__panel-subtitle">{tp('detail.recentActivity.subtitle')}</div>
                </div>
                <Button type="link" size="small" onClick={() => setSearchParams({ tab: 'activity' })}>
                  {tp('detail.recentActivity.viewAll')}
                </Button>
              </div>

              {eventsLoading && activityPreviewItems.length === 0 ? (
                <div className="org-insights__empty">
                  <Spin size="small" />
                </div>
              ) : activityPreviewItems.length > 0 ? (
                <div className="org-insights__list">
                  {activityPreviewItems.map((record) => {
                    const eventAt = getEventTimestamp(record)
                    return (
                      <div key={record.id} className="org-insights__list-item">
                        <div className="org-insights__list-icon">
                          <HistoryOutlined />
                        </div>
                        <div className="org-insights__list-main">
                          <div className="org-insights__list-title">{formatEventType(record.event_type)}</div>
                          <div className="org-insights__list-body">{getEventSummary(record)}</div>
                          <div className="org-insights__list-meta">
                            <span>{tp('detail.recentActivity.actor')}: {record.actor_name || record.actor_type || '-'}</span>
                            <Tooltip title={formatFullDateTime(eventAt)}>
                              <span>{formatRelativeTimeI18n(eventAt, tp)}</span>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="org-insights__empty">
                  <Text type="secondary">{tp('detail.recentActivity.empty')}</Text>
                </div>
              )}
            </div>

            <div className="org-insights__panel">
              <div className="org-insights__panel-head">
                <div>
                  <Text strong>{tp('detail.projectSpotlight.title')}</Text>
                  <div className="org-insights__panel-subtitle">{tp('detail.projectSpotlight.subtitle')}</div>
                </div>
                <Button type="link" size="small" onClick={() => setSearchParams({ tab: 'projects' })}>
                  {tp('detail.projectSpotlight.viewAll')}
                </Button>
              </div>

              {projectsLoading && recentProjects.length === 0 ? (
                <div className="org-insights__empty">
                  <Spin size="small" />
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="org-insights__list">
                  {recentProjects.map((project) => {
                    const projectActivityAt = project.last_activity_at || project.updated_at || project.created_at
                    return (
                      <div key={project.id} className="org-insights__list-item">
                        <div className="org-insights__list-icon">
                          <FolderOpenOutlined />
                        </div>
                        <div className="org-insights__list-main">
                          <div className="org-insights__list-title">
                            <LinkButton to={`/todo-for-ai/pages/projects/${project.id}`} type="link" style={{ padding: 0, height: 'auto' }}>
                              {project.name}
                            </LinkButton>
                          </div>
                          <div className="org-insights__list-meta">
                            <Tag color={PROJECT_STATUS_COLORS[project.status] || 'default'} style={{ marginInlineEnd: 0 }}>
                              {translateStatusLabel(tp, project.status)}
                            </Tag>
                            <span>{tp('detail.projectSpotlight.taskCount')}: {formatNumber(getProjectTaskCount(project))}</span>
                          </div>
                          <div className="org-insights__list-meta">
                            <Tooltip title={formatFullDateTime(projectActivityAt)}>
                              <span>{tp('detail.projectSpotlight.lastActivity')}: {formatRelativeTimeI18n(projectActivityAt, tp)}</span>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="org-insights__empty">
                  <Text type="secondary">{tp('detail.projectSpotlight.empty')}</Text>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setSearchParams({ tab: key })}
          items={[
            {
              key: 'members',
              label: tp('detail.tabs.members'),
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <OrganizationMembersCard
                    tp={tp}
                    organizationId={parsedOrganizationId}
                    organizationName={organization?.name || ''}
                    canManageMembers={!!canManageMembers}
                    loading={membersLoading || actionLoading}
                    inviteEmail={inviteEmail}
                    inviteRoleIds={inviteRoleIds}
                    inviteAgentId={inviteAgentId}
                    memberRows={mergedMemberRows}
                    roleOptions={roleOptions}
                    statusColorMap={ORG_STATUS_COLORS}
                    onInviteEmailChange={setInviteEmail}
                    onInviteRoleChange={setInviteRoleIds}
                    onInviteAgentIdChange={setInviteAgentId}
                    onInviteMember={inviteMember}
                    onInviteAgent={inviteAgentMember}
                    onOpenCreateAgent={() => setCreateAgentVisible(true)}
                    onOpenRoleManager={openRoleManagerPage}
                    onUpdateMemberRoles={updateMemberRoles}
                    onRemoveMember={removeMember}
                    onRemoveAgentMember={removeAgentMember}
                  />
                  <NotificationChannelManager
                    scopeType="organization"
                    scopeId={parsedOrganizationId}
                    title={tp('detail.notifications.title')}
                    description={tp('detail.notifications.description')}
                    canManage={!!canManageMembers}
                  />
                </Space>
              ),
            },
            {
              key: 'activity',
              label: tp('detail.tabs.activity'),
              children: (
                <Table
                  rowKey="id"
                  loading={eventsLoading}
                  dataSource={events}
                  columns={eventColumns}
                  pagination={{
                    current: eventsPagination?.page || 1,
                    pageSize: eventsPagination?.per_page || 20,
                    total: eventsPagination?.total || 0,
                    showSizeChanger: false,
                  }}
                  onChange={(pagination) => {
                    const nextPage = pagination.current || 1
                    void loadEvents(nextPage)
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={tp('detail.activity.empty')}
                      />
                    ),
                  }}
                />
              ),
            },
            {
              key: 'projects',
              label: tp('detail.tabs.projects'),
              children: (
                <Table
                  rowKey="id"
                  loading={projectsLoading}
                  dataSource={projects}
                  columns={projectColumns}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={tp('detail.projects.empty')}
                      />
                    ),
                  }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={tp('createAgentModal.title')}
        open={createAgentVisible}
        onOk={createAgent}
        onCancel={() => setCreateAgentVisible(false)}
        confirmLoading={actionLoading}
        okText={tp('createAgentModal.confirm')}
        cancelText={tp('createAgentModal.cancel')}
      >
        <Form layout="vertical" form={createAgentForm}>
          <Form.Item
            name="name"
            label={tp('createAgentModal.name')}
            rules={[{ required: true, message: tp('createAgentModal.nameRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label={tp('createAgentModal.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrganizationDetail
