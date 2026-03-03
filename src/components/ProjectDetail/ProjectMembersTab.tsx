import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, message, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { projectsApi, type ProjectMember } from '../../api/projects'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Text } = Typography

interface ProjectMembersTabProps {
  projectId: number
  currentUserRole?: 'owner' | 'maintainer' | 'member' | 'viewer' | null
}

const ROLE_OPTIONS = [
  { label: 'Maintainer', value: 'maintainer' },
  { label: 'Member', value: 'member' },
  { label: 'Viewer', value: 'viewer' },
]

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  invited: 'blue',
  removed: 'default',
}

export const ProjectMembersTab: React.FC<ProjectMembersTabProps> = ({
  projectId,
  currentUserRole
}) => {
  const { tp } = usePageTranslation('projectDetail')
  const [items, setItems] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'maintainer' | 'member' | 'viewer'>('member')

  const canManage = useMemo(
    () => currentUserRole === 'owner' || currentUserRole === 'maintainer',
    [currentUserRole]
  )

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await projectsApi.getProjectMembers(projectId)
      setItems(data.items || [])
    } catch (error: any) {
      message.error(error?.message || tp('members.messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [projectId, tp])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      message.warning(tp('members.form.emailRequired'))
      return
    }
    try {
      setLoading(true)
      await projectsApi.inviteProjectMember(projectId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      })
      message.success(tp('members.messages.inviteSuccess'))
      setInviteEmail('')
      await loadMembers()
    } catch (error: any) {
      message.error(error?.message || tp('members.messages.inviteFailed'))
    } finally {
      setLoading(false)
    }
  }

  const updateMemberRole = async (member: ProjectMember, role: 'maintainer' | 'member' | 'viewer') => {
    try {
      setLoading(true)
      await projectsApi.updateProjectMember(projectId, member.user_id, { role })
      message.success(tp('members.messages.updateSuccess'))
      await loadMembers()
    } catch (error: any) {
      message.error(error?.message || tp('members.messages.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (member: ProjectMember) => {
    try {
      setLoading(true)
      await projectsApi.removeProjectMember(projectId, member.user_id)
      message.success(tp('members.messages.removeSuccess'))
      await loadMembers()
    } catch (error: any) {
      message.error(error?.message || tp('members.messages.removeFailed'))
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: tp('members.table.user'),
      key: 'user',
      render: (_: any, member: ProjectMember) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {member.user?.full_name || member.user?.nickname || member.user?.username || `#${member.user_id}`}
          </div>
          <Text type="secondary">ID: {member.user_id}</Text>
        </div>
      ),
    },
    {
      title: tp('members.table.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string, member: ProjectMember) => {
        if (!canManage || role === 'owner') {
          return <Tag>{role}</Tag>
        }
        return (
          <Select
            size="small"
            style={{ width: 140 }}
            value={role}
            onChange={(value) => updateMemberRole(member, value as 'maintainer' | 'member' | 'viewer')}
            options={ROLE_OPTIONS}
          />
        )
      }
    },
    {
      title: tp('members.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status}
        </Tag>
      )
    },
    {
      title: tp('members.table.actions'),
      key: 'actions',
      width: 120,
      render: (_: any, member: ProjectMember) => {
        if (!canManage || member.role === 'owner') {
          return null
        }
        return (
          <Popconfirm
            title={tp('members.confirm.removeTitle')}
            description={tp('members.confirm.removeDescription')}
            onConfirm={() => removeMember(member)}
            okText={tp('members.confirm.ok')}
            cancelText={tp('members.confirm.cancel')}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              {tp('members.actions.remove')}
            </Button>
          </Popconfirm>
        )
      }
    }
  ]

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {canManage && (
          <Space wrap>
            <Input
              value={inviteEmail}
              placeholder={tp('members.form.emailPlaceholder')}
              onChange={(event) => setInviteEmail(event.target.value)}
              style={{ width: 320 }}
            />
            <Select
              value={inviteRole}
              style={{ width: 140 }}
              onChange={(value) => setInviteRole(value)}
              options={ROLE_OPTIONS}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={inviteMember}
              loading={loading}
            >
              {tp('members.actions.invite')}
            </Button>
          </Space>
        )}

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={false}
        />
      </Space>
    </Card>
  )
}
