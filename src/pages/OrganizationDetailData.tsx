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

const { Title, Paragraph, Text } = Typography

export const ORG_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  invited: 'blue',
  removed: 'default',
}

export const PROJECT_STATUS_COLORS: Record<string, string> = {
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

export const extractProjectItems = (payload: any): Project[] => {
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

export const getProjectTaskCount = (project: Project) => (
  project.total_tasks ??
  project.stats?.total_tasks ??
  0
)

/**
 * OrganizationDetail 页面的数据与派生层：状态/加载器/记忆化派生/表格列定义
 * 全部在此（视图 JSX 留在 OrganizationDetail.tsx）。由单文件组件原样拆出，
 * 本文件含表格列 JSX 故为 .tsx；与页面同目录，相对导入与拆分前完全一致。
 */
export function useOrganizationDetailData() {
  const { organizationId } = useParams<{ organizationId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tp, tc, language } = usePageTranslation('organizations')
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

  useEffect(() => {
    if (activeTab === 'activity') {
      void loadEvents(1)
    }
  }, [activeTab, loadEvents])

  return {
    organizationId,
    searchParams,
    setSearchParams,
    navigate,
    tp,
    tc,
    language,
    tpRef,
    organization,
    setOrganization,
    members,
    setMembers,
    agentMembers,
    setAgentMembers,
    organizationRoles,
    setOrganizationRoles,
    projects,
    setProjects,
    events,
    setEvents,
    eventsPagination,
    setEventsPagination,
    pageLoading,
    setPageLoading,
    membersLoading,
    setMembersLoading,
    projectsLoading,
    setProjectsLoading,
    eventsLoading,
    setEventsLoading,
    actionLoading,
    setActionLoading,
    createAgentVisible,
    setCreateAgentVisible,
    inviteEmail,
    setInviteEmail,
    inviteAgentId,
    setInviteAgentId,
    inviteRoleIds,
    setInviteRoleIds,
    createAgentForm,
    parsedOrganizationId,
    activeTab,
    canManageMembers,
    formatDateTime,
    formatNumber,
    formatEventType,
    loadOrganization,
    loadMembers,
    loadAgentMembers,
    loadOrganizationRoles,
    loadProjects,
    loadEvents,
    refreshActivityPreview,
    inviteMember,
    updateMemberRoles,
    removeMember,
    createAgent,
    inviteAgentMember,
    removeAgentMember,
    openRoleManagerPage,
  }
}
