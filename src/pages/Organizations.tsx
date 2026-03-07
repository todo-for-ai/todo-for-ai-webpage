import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Segmented,
  Space,
  Typography
} from 'antd'
import { AppstoreOutlined, OrderedListOutlined, PlusOutlined } from '@ant-design/icons'
import {
  organizationsApi,
  type Organization,
  type OrganizationMember,
  type OrganizationRoleDefinition,
} from '../api/organizations'
import { organizationAgentsApi, type OrganizationAgentMember } from '../api/organizationAgents'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { OrganizationsCardView } from './organizations/components/OrganizationsCardView'
import { OrganizationsListView } from './organizations/components/OrganizationsListView'
import { OrganizationMembersCard } from './organizations/components/OrganizationMembersCard'
import NotificationChannelManager from '../components/NotificationChannelManager'
import {
  loadOrganizationsViewModeFromIndexedDb,
  saveOrganizationsViewModeToIndexedDb,
  type OrganizationsViewMode,
} from './organizations/storage'

const { Title, Paragraph, Text } = Typography

const ORG_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  invited: 'blue',
  removed: 'default',
}

const Organizations = () => {
  const { tp } = usePageTranslation('organizations')
  const navigate = useNavigate()
  const tpRef = useRef(tp)
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [agentMembers, setAgentMembers] = useState<OrganizationAgentMember[]>([])
  const [organizationRoles, setOrganizationRoles] = useState<OrganizationRoleDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<OrganizationsViewMode>('list')
  const [createVisible, setCreateVisible] = useState(false)
  const [createAgentVisible, setCreateAgentVisible] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteAgentId, setInviteAgentId] = useState('')
  const [inviteRoleIds, setInviteRoleIds] = useState<number[]>([])
  const [createForm] = Form.useForm()
  const [createAgentForm] = Form.useForm()

  useEffect(() => {
    tpRef.current = tp
  }, [tp])

  const selectedOrg = useMemo(
    () => orgs.find((item) => item.id === selectedOrgId) || null,
    [orgs, selectedOrgId]
  )
  const canManageMembers = selectedOrg?.current_user_role === 'owner' || selectedOrg?.current_user_role === 'admin'

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await organizationsApi.getOrganizations({ page: 1, per_page: 200 })
      const items = data.items || []
      setOrgs(items)
      setSelectedOrgId((prev) => {
        if (!prev && items.length > 0) {
          return items[0].id
        }
        if (prev && !items.find((item) => item.id === prev)) {
          return items.length > 0 ? items[0].id : null
        }
        return prev
      })
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMembers = useCallback(async (organizationId: number) => {
    try {
      setLoading(true)
      const data = await organizationsApi.getOrganizationMembers(organizationId)
      setMembers(data.items || [])
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.memberLoadFailed'))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAgentMembers = useCallback(async (organizationId: number) => {
    try {
      const data = await organizationAgentsApi.getOrganizationAgentMembers(organizationId)
      setAgentMembers(data.items || [])
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.agentMemberLoadFailed'))
      setAgentMembers([])
    }
  }, [])

  const loadOrganizationRoles = useCallback(async (organizationId: number) => {
    try {
      const data = await organizationsApi.getOrganizationRoles(organizationId)
      const items = data.items || []
      setOrganizationRoles(items)
      setInviteRoleIds((current) => current.filter((roleId) => items.some((role) => role.id === roleId)))
    } catch (error: any) {
      message.error(error?.message || tpRef.current('messages.roleLoadFailed'))
      setOrganizationRoles([])
    }
  }, [])

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  useEffect(() => {
    let active = true
    void loadOrganizationsViewModeFromIndexedDb().then((mode) => {
      if (active) {
        setViewMode(mode)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (selectedOrgId) {
      loadMembers(selectedOrgId)
      loadAgentMembers(selectedOrgId)
      loadOrganizationRoles(selectedOrgId)
    } else {
      setMembers([])
      setAgentMembers([])
      setOrganizationRoles([])
      setInviteRoleIds([])
    }
  }, [selectedOrgId, loadMembers, loadAgentMembers, loadOrganizationRoles])

  const createOrganization = async () => {
    try {
      const values = await createForm.validateFields()
      setLoading(true)
      await organizationsApi.createOrganization(values)
      message.success(tp('messages.createSuccess'))
      setCreateVisible(false)
      createForm.resetFields()
      await loadOrganizations()
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      message.error(error?.message || tp('messages.createFailed'))
    } finally {
      setLoading(false)
    }
  }

  const inviteMember = async () => {
    if (!selectedOrgId) {
      return
    }
    if (!inviteEmail.trim()) {
      message.warning(tp('members.emailRequired'))
      return
    }
    try {
      setLoading(true)
      await organizationsApi.inviteOrganizationMember(selectedOrgId, {
        email: inviteEmail.trim(),
        role_ids: inviteRoleIds,
      })
      message.success(tp('messages.inviteSuccess'))
      setInviteEmail('')
      setInviteRoleIds([])
      await loadMembers(selectedOrgId)
    } catch (error: any) {
      message.error(error?.message || tp('messages.inviteFailed'))
    } finally {
      setLoading(false)
    }
  }

  const updateMemberRoles = async (
    member: OrganizationMember,
    roleIds: number[]
  ) => {
    if (!selectedOrgId) {
      return
    }
    try {
      setLoading(true)
      await organizationsApi.updateOrganizationMember(selectedOrgId, member.user_id, { role_ids: roleIds })
      message.success(tp('messages.memberUpdated'))
      await loadMembers(selectedOrgId)
    } catch (error: any) {
      message.error(error?.message || tp('messages.memberUpdateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (member: OrganizationMember) => {
    if (!selectedOrgId) {
      return
    }
    try {
      setLoading(true)
      await organizationsApi.removeOrganizationMember(selectedOrgId, member.user_id)
      message.success(tp('messages.memberRemoved'))
      await loadMembers(selectedOrgId)
    } catch (error: any) {
      message.error(error?.message || tp('messages.memberRemoveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const createAgent = async () => {
    if (!selectedOrgId) {
      return
    }
    try {
      const values = await createAgentForm.validateFields()
      setLoading(true)
      await organizationAgentsApi.createOrganizationAgent(selectedOrgId, {
        name: values.name,
        description: values.description,
      })
      message.success(tp('messages.createAgentSuccess'))
      setCreateAgentVisible(false)
      createAgentForm.resetFields()
      await loadAgentMembers(selectedOrgId)
    } catch (error: any) {
      if (error?.errorFields) {
        return
      }
      message.error(error?.message || tp('messages.createAgentFailed'))
    } finally {
      setLoading(false)
    }
  }

  const inviteAgentMember = async () => {
    if (!selectedOrgId) {
      return
    }
    const parsedAgentId = Number(inviteAgentId)
    if (!parsedAgentId || Number.isNaN(parsedAgentId)) {
      message.warning(tp('members.agentIdRequired'))
      return
    }
    try {
      setLoading(true)
      await organizationAgentsApi.inviteOrganizationAgentMember(selectedOrgId, parsedAgentId)
      message.success(tp('messages.agentInviteSuccess'))
      setInviteAgentId('')
      await loadAgentMembers(selectedOrgId)
    } catch (error: any) {
      message.error(error?.message || tp('messages.agentInviteFailed'))
    } finally {
      setLoading(false)
    }
  }

  const removeAgentMember = async (member: OrganizationAgentMember) => {
    if (!selectedOrgId) {
      return
    }
    try {
      setLoading(true)
      await organizationAgentsApi.removeOrganizationAgentMember(selectedOrgId, member.id)
      message.success(tp('messages.agentMemberRemoved'))
      await loadAgentMembers(selectedOrgId)
    } catch (error: any) {
      message.error(error?.message || tp('messages.agentMemberRemoveFailed'))
    } finally {
      setLoading(false)
    }
  }

  const openRoleManagerPage = () => {
    if (!selectedOrgId) {
      return
    }
    navigate(`/todo-for-ai/pages/organizations/${selectedOrgId}/roles`)
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

  const handleViewModeChange = (mode: OrganizationsViewMode) => {
    setViewMode(mode)
    void saveOrganizationsViewModeToIndexedDb(mode)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <Title level={2} className="page-title">{tp('title')}</Title>
            <Paragraph className="page-description">{tp('subtitle')}</Paragraph>
          </div>
          <Space>
            <Space>
              <Text type="secondary">{tp('viewMode.label')}</Text>
              <Segmented<OrganizationsViewMode>
                value={viewMode}
                onChange={(value) => handleViewModeChange(value)}
                options={[
                  {
                    value: 'list',
                    label: (
                      <Space size={6}>
                        <OrderedListOutlined />
                        {tp('viewMode.list')}
                      </Space>
                    ),
                  },
                  {
                    value: 'card',
                    label: (
                      <Space size={6}>
                        <AppstoreOutlined />
                        {tp('viewMode.card')}
                      </Space>
                    ),
                  },
                ]}
              />
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
              {tp('actions.create')}
            </Button>
          </Space>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        {viewMode === 'list' ? (
          <OrganizationsListView
            tp={tp}
            orgs={orgs}
            loading={loading}
            selectedOrgId={selectedOrgId}
            onSelectOrg={setSelectedOrgId}
          />
        ) : (
          <OrganizationsCardView
            tp={tp}
            orgs={orgs}
            loading={loading}
            selectedOrgId={selectedOrgId}
            onSelectOrg={setSelectedOrgId}
          />
        )}
      </Card>

      {selectedOrg && (
        <OrganizationMembersCard
          tp={tp}
          organizationName={selectedOrg.name}
          canManageMembers={canManageMembers}
          loading={loading}
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
      )}

      {selectedOrg && (
        <div style={{ marginTop: 16 }}>
          <NotificationChannelManager
            scopeType="organization"
            scopeId={selectedOrg.id}
            title="组织通知设置"
            description="配置当前组织级别的外部通知同步渠道。"
            canManage={canManageMembers}
          />
        </div>
      )}

      <Modal
        title={tp('createModal.title')}
        open={createVisible}
        onOk={createOrganization}
        onCancel={() => setCreateVisible(false)}
        confirmLoading={loading}
        okText={tp('createModal.confirm')}
        cancelText={tp('createModal.cancel')}
      >
        <Form layout="vertical" form={createForm}>
          <Form.Item
            name="name"
            label={tp('createModal.name')}
            rules={[{ required: true, message: tp('createModal.nameRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="slug" label={tp('createModal.slug')}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={tp('createModal.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={tp('createAgentModal.title')}
        open={createAgentVisible}
        onOk={createAgent}
        onCancel={() => setCreateAgentVisible(false)}
        confirmLoading={loading}
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

export default Organizations
