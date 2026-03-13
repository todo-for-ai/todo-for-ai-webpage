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

  const [pageLoading, setPageLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(false)
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

  const activeTab = searchParams.get('tab') || 'members'

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
