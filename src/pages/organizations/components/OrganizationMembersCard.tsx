import { ApiOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Card, Input, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import type { OrganizationMember } from '../../../api/organizations'
import type { OrganizationAgentMember } from '../../../api/organizationAgents'

const { Text } = Typography

export interface OrganizationMemberRow {
  row_id: string
  entity_type: 'human' | 'agent'
  member: OrganizationMember | null
  agentMember: OrganizationAgentMember | null
  status: string
}

interface OrganizationMembersCardProps {
  tp: (key: string, options?: Record<string, unknown>) => string
  organizationName: string
  canManageMembers: boolean
  loading: boolean
  inviteEmail: string
  inviteRoleIds: number[]
  inviteAgentId: string
  memberRows: OrganizationMemberRow[]
  roleOptions: Array<{ label: string; value: number }>
  statusColorMap: Record<string, string>
  onInviteEmailChange: (value: string) => void
  onInviteRoleChange: (value: number[]) => void
  onInviteAgentIdChange: (value: string) => void
  onInviteMember: () => void
  onInviteAgent: () => void
  onOpenCreateAgent: () => void
  onOpenRoleManager: () => void
  onUpdateMemberRoles: (member: OrganizationMember, roleIds: number[]) => void
  onRemoveMember: (member: OrganizationMember) => void
  onRemoveAgentMember: (member: OrganizationAgentMember) => void
}

export function OrganizationMembersCard({
  tp,
  organizationName,
  canManageMembers,
  loading,
  inviteEmail,
  inviteRoleIds,
  inviteAgentId,
  memberRows,
  roleOptions,
  statusColorMap,
  onInviteEmailChange,
  onInviteRoleChange,
  onInviteAgentIdChange,
  onInviteMember,
  onInviteAgent,
  onOpenCreateAgent,
  onOpenRoleManager,
  onUpdateMemberRoles,
  onRemoveMember,
  onRemoveAgentMember,
}: OrganizationMembersCardProps) {
  return (
    <Card title={tp('members.title', { name: organizationName })}>
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {canManageMembers && (
          <Space wrap>
            <Input
              value={inviteEmail}
              placeholder={tp('members.emailPlaceholder')}
              onChange={(event) => onInviteEmailChange(event.target.value)}
              style={{ width: 320 }}
            />
            <Select
              mode="multiple"
              value={inviteRoleIds}
              allowClear
              maxTagCount="responsive"
              placeholder={tp('roles.selectPlaceholder')}
              options={roleOptions}
              style={{ width: 260 }}
              onChange={(value) => onInviteRoleChange(value as number[])}
            />
            <Button type="primary" onClick={onInviteMember}>{tp('members.invite')}</Button>
            <Input
              value={inviteAgentId}
              placeholder={tp('members.agentIdPlaceholder')}
              onChange={(event) => onInviteAgentIdChange(event.target.value)}
              style={{ width: 220 }}
            />
            <Button icon={<ApiOutlined />} onClick={onInviteAgent}>
              {tp('members.inviteAgent')}
            </Button>
            <Button icon={<ApiOutlined />} onClick={onOpenCreateAgent}>
              {tp('members.createAgent')}
            </Button>
            <Button icon={<SettingOutlined />} onClick={onOpenRoleManager}>
              {tp('roles.manage')}
            </Button>
          </Space>
        )}

        <Table<OrganizationMemberRow>
          rowKey="row_id"
          loading={loading}
          pagination={false}
          dataSource={memberRows}
          columns={[
            {
              title: tp('members.table.user'),
              key: 'user',
              render: (_, row) => {
                if (row.entity_type === 'agent' && row.agentMember?.agent) {
                  return (
                    <div>
                      <div style={{ fontWeight: 500 }}>{row.agentMember.agent.name}</div>
                      <Space>
                        <Text type="secondary">Agent #{row.agentMember.agent.id}</Text>
                        <Tag>{tp('members.entity.agent')}</Tag>
                      </Space>
                    </div>
                  )
                }

                const member = row.member
                if (!member) {
                  return null
                }

                return (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {member.user?.full_name || member.user?.nickname || member.user?.username || `#${member.user_id}`}
                    </div>
                    <Space>
                      <Text type="secondary">ID: {member.user_id}</Text>
                      <Tag>{tp('members.entity.human')}</Tag>
                    </Space>
                  </div>
                )
              },
            },
            {
              title: tp('members.table.type'),
              key: 'entity_type',
              width: 120,
              render: (_, row) => (
                <Tag>{row.entity_type === 'agent' ? tp('members.entity.agent') : tp('members.entity.human')}</Tag>
              ),
            },
            {
              title: tp('members.table.role'),
              key: 'role',
              render: (_, row) => {
                if (row.entity_type === 'agent') {
                  return <Tag>{tp('members.entity.agent')}</Tag>
                }

                const member = row.member
                if (!member) {
                  return null
                }

                const memberRoleTags = (member.roles || []).map((role) => (
                  <Tag key={role.id}>{role.name}</Tag>
                ))

                if (!canManageMembers || member.role === 'owner') {
                  return memberRoleTags.length > 0 ? <Space wrap>{memberRoleTags}</Space> : <span>-</span>
                }

                return (
                  <Select
                    mode="multiple"
                    size="small"
                    allowClear
                    maxTagCount="responsive"
                    value={(member.roles || []).map((item) => item.id)}
                    options={roleOptions}
                    style={{ width: 260 }}
                    placeholder={tp('roles.selectPlaceholder')}
                    onChange={(value) => onUpdateMemberRoles(member, value as number[])}
                  />
                )
              },
            },
            {
              title: tp('members.table.status'),
              key: 'status',
              render: (_, row) => <Tag color={statusColorMap[row.status] || 'default'}>{row.status}</Tag>,
            },
            {
              title: tp('members.table.actions'),
              key: 'actions',
              width: 120,
              render: (_, row) => {
                if (!canManageMembers) {
                  return null
                }

                if (row.entity_type === 'agent' && row.agentMember) {
                  return (
                    <Popconfirm
                      title={tp('members.removeConfirmTitle')}
                      description={tp('members.removeConfirmDescription')}
                      onConfirm={() => onRemoveAgentMember(row.agentMember)}
                      okText={tp('members.confirmOk')}
                      cancelText={tp('members.confirmCancel')}
                    >
                      <Button danger size="small" icon={<DeleteOutlined />}>
                        {tp('members.remove')}
                      </Button>
                    </Popconfirm>
                  )
                }

                const member = row.member
                if (!member || member.role === 'owner') {
                  return null
                }

                return (
                  <Popconfirm
                    title={tp('members.removeConfirmTitle')}
                    description={tp('members.removeConfirmDescription')}
                    onConfirm={() => onRemoveMember(member)}
                    okText={tp('members.confirmOk')}
                    cancelText={tp('members.confirmCancel')}
                  >
                    <Button danger size="small" icon={<DeleteOutlined />}>
                      {tp('members.remove')}
                    </Button>
                  </Popconfirm>
                )
              },
            },
          ]}
        />
      </Space>
    </Card>
  )
}
