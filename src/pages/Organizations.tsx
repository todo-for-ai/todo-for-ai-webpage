import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography
} from 'antd'
import { DeleteOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons'
import {
  organizationsApi,
  type Organization,
  type OrganizationMember
} from '../api/organizations'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

const { Title, Paragraph, Text } = Typography

const ORG_ROLE_OPTIONS = [
  { label: 'Admin', value: 'admin' },
  { label: 'Member', value: 'member' },
  { label: 'Viewer', value: 'viewer' },
]

const ORG_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  invited: 'blue',
  removed: 'default',
}

const Organizations = () => {
  const { tp } = usePageTranslation('organizations')
  const tpRef = useRef(tp)
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [loading, setLoading] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [createForm] = Form.useForm()

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

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  useEffect(() => {
    if (selectedOrgId) {
      loadMembers(selectedOrgId)
    } else {
      setMembers([])
    }
  }, [selectedOrgId, loadMembers])

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
        role: inviteRole,
      })
      message.success(tp('messages.inviteSuccess'))
      setInviteEmail('')
      await loadMembers(selectedOrgId)
    } catch (error: any) {
      message.error(error?.message || tp('messages.inviteFailed'))
    } finally {
      setLoading(false)
    }
  }

  const updateMemberRole = async (
    member: OrganizationMember,
    role: 'admin' | 'member' | 'viewer'
  ) => {
    if (!selectedOrgId) {
      return
    }
    try {
      setLoading(true)
      await organizationsApi.updateOrganizationMember(selectedOrgId, member.user_id, { role })
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <Title level={2} className="page-title">{tp('title')}</Title>
            <Paragraph className="page-description">{tp('subtitle')}</Paragraph>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
            {tp('actions.create')}
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={orgs}
          pagination={false}
          onRow={(record) => ({
            onClick: () => setSelectedOrgId(record.id),
          })}
          rowClassName={(record) => record.id === selectedOrgId ? 'ant-table-row-selected' : ''}
          columns={[
            {
              title: tp('table.orgName'),
              key: 'name',
              render: (_: any, org: Organization) => (
                <Space>
                  <TeamOutlined style={{ color: '#1890ff' }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{org.name}</div>
                    <Text type="secondary">{org.slug}</Text>
                  </div>
                </Space>
              )
            },
            {
              title: tp('table.role'),
              dataIndex: 'current_user_role',
              key: 'current_user_role',
              render: (value: string) => <Tag>{value || '-'}</Tag>
            },
            {
              title: tp('table.members'),
              key: 'member_count',
              render: (_: any, org: Organization) => org.member_count ?? '-',
              width: 120
            },
            {
              title: tp('table.projects'),
              key: 'project_count',
              render: (_: any, org: Organization) => org.project_count ?? '-',
              width: 120
            }
          ]}
        />
      </Card>

      {selectedOrg && (
        <Card title={tp('members.title', { name: selectedOrg.name })}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {canManageMembers && (
              <Space wrap>
                <Input
                  value={inviteEmail}
                  placeholder={tp('members.emailPlaceholder')}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  style={{ width: 320 }}
                />
                <Select
                  value={inviteRole}
                  options={ORG_ROLE_OPTIONS}
                  style={{ width: 140 }}
                  onChange={(value) => setInviteRole(value)}
                />
                <Button type="primary" onClick={inviteMember}>{tp('members.invite')}</Button>
              </Space>
            )}

            <Table
              rowKey="id"
              loading={loading}
              pagination={false}
              dataSource={members}
              columns={[
                {
                  title: tp('members.table.user'),
                  key: 'user',
                  render: (_: any, member: OrganizationMember) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {member.user?.full_name || member.user?.nickname || member.user?.username || `#${member.user_id}`}
                      </div>
                      <Text type="secondary">ID: {member.user_id}</Text>
                    </div>
                  )
                },
                {
                  title: tp('members.table.role'),
                  key: 'role',
                  render: (_: any, member: OrganizationMember) => {
                    if (!canManageMembers || member.role === 'owner') {
                      return <Tag>{member.role}</Tag>
                    }
                    return (
                      <Select
                        size="small"
                        value={member.role}
                        options={ORG_ROLE_OPTIONS}
                        style={{ width: 140 }}
                        onChange={(value) => updateMemberRole(member, value)}
                      />
                    )
                  }
                },
                {
                  title: tp('members.table.status'),
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={ORG_STATUS_COLORS[status] || 'default'}>
                      {status}
                    </Tag>
                  )
                },
                {
                  title: tp('members.table.actions'),
                  key: 'actions',
                  width: 120,
                  render: (_: any, member: OrganizationMember) => {
                    if (!canManageMembers || member.role === 'owner') {
                      return null
                    }
                    return (
                      <Popconfirm
                        title={tp('members.removeConfirmTitle')}
                        description={tp('members.removeConfirmDescription')}
                        onConfirm={() => removeMember(member)}
                        okText={tp('members.confirmOk')}
                        cancelText={tp('members.confirmCancel')}
                      >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                          {tp('members.remove')}
                        </Button>
                      </Popconfirm>
                    )
                  }
                }
              ]}
            />
          </Space>
        </Card>
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
    </div>
  )
}

export default Organizations
