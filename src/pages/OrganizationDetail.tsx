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
  Typography,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
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

const { Title, Paragraph, Text } = Typography

const ORG_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  invited: 'blue',
  removed: 'default',
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

  const loadEvents = useCallback(async (page = 1) => {
    if (!parsedOrganizationId) {
      return
    }
    try {
      setEventsLoading(true)
      const response = await organizationEventsApi.getOrganizationEvents(parsedOrganizationId, {
        page,
        per_page: 20,
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

  useEffect(() => {
    if (!parsedOrganizationId || Number.isNaN(parsedOrganizationId)) {
      return
    }
    loadOrganization()
    loadMembers()
    loadAgentMembers()
    loadOrganizationRoles()
    loadProjects()
  }, [parsedOrganizationId, loadOrganization, loadMembers, loadAgentMembers, loadOrganizationRoles, loadProjects])

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

  const activeTab = searchParams.get('tab') || 'members'

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

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Space align="center" wrap>
            <Title level={3} style={{ margin: 0 }}>{organization?.name || '-'}</Title>
            <Tag color={organization?.status === 'active' ? 'green' : 'orange'}>
              {tp(`detail.status.${organization?.status || 'active'}`)}
            </Tag>
            {organization?.slug && <Text type="secondary">{organization.slug}</Text>}
          </Space>
          {organization?.description ? (
            <Paragraph style={{ marginBottom: 0 }}>{organization.description}</Paragraph>
          ) : (
            <Text type="secondary">{tp('detail.noDescription')}</Text>
          )}
          <Space wrap size={24}>
            <div>
              <Text type="secondary">{tp('detail.stats.members')}</Text>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{organization?.member_count ?? '-'}</div>
            </div>
            <div>
              <Text type="secondary">{tp('detail.stats.projects')}</Text>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{organization?.project_count ?? '-'}</div>
            </div>
            <div>
              <Text type="secondary">{tp('detail.fields.createdAt')}</Text>
              <div style={{ fontSize: 14 }}>{formatDateTime(organization?.created_at)}</div>
            </div>
            <div>
              <Text type="secondary">{tp('detail.fields.updatedAt')}</Text>
              <div style={{ fontSize: 14 }}>{formatDateTime(organization?.updated_at)}</div>
            </div>
          </Space>
        </Space>
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
