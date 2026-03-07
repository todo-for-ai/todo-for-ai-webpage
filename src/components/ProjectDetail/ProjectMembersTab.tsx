import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Input, message, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { projectsApi, type ProjectMember } from '../../api/projects'
import { agentsApi, type Agent } from '../../api/agents'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Text } = Typography

interface ProjectMembersTabProps {
  projectId: number
  workspaceId?: number | null
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
  workspaceId,
  currentUserRole
}) => {
  const { tp } = usePageTranslation('projectDetail')
  const tpRef = useRef(tp)
  const [items, setItems] = useState<ProjectMember[]>([])
  const [agentItems, setAgentItems] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'maintainer' | 'member' | 'viewer'>('member')

  useEffect(() => {
    tpRef.current = tp
  }, [tp])

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
      message.error(error?.message || tpRef.current('members.messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const loadAgents = useCallback(async () => {
    if (!workspaceId) {
      setAgentItems([])
      return
    }

    try {
      const data = await agentsApi.getAgents(workspaceId, { page: 1, per_page: 200 })
      const filtered = (data.items || []).filter((agent) => {
        const projects = agent.allowed_project_ids || []
        return projects.length === 0 || projects.includes(projectId)
      })
      setAgentItems(filtered)
    } catch (error: any) {
      message.error(error?.message || tpRef.current('members.messages.loadAgentsFailed'))
      setAgentItems([])
    }
  }, [workspaceId, projectId])

  useEffect(() => {
    loadMembers()
    loadAgents()
  }, [loadMembers, loadAgents])

  const mergedItems = useMemo(() => {
    const humanRows = items.map((member) => ({
      row_id: `human-${member.id}`,
      entity_type: 'human' as const,
      status: member.status,
      role: member.role,
      member,
      agent: null as Agent | null,
    }))

    const agentRows = agentItems.map((agent) => ({
      row_id: `agent-${agent.id}`,
      entity_type: 'agent' as const,
      status: agent.status,
      role: 'agent',
      member: null as ProjectMember | null,
      agent,
    }))

    return [...humanRows, ...agentRows]
  }, [items, agentItems])

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
      render: (_: any, row: any) => {
        if (row.entity_type === 'agent' && row.agent) {
          return (
            <div>
              <div style={{ fontWeight: 500 }}>
                {row.agent.name}
              </div>
              <Space>
                <Text type="secondary">Agent #{row.agent.id}</Text>
                <Tag>{tp('members.entity.agent')}</Tag>
              </Space>
            </div>
          )
        }
        const member = row.member as ProjectMember
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
      render: (_: any, row: any) => (
        <Tag>{row.entity_type === 'agent' ? tp('members.entity.agent') : tp('members.entity.human')}</Tag>
      )
    },
    {
      title: tp('members.table.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string, row: any) => {
        if (row.entity_type === 'agent') {
          return <Tag>{tp('members.entity.agent')}</Tag>
        }
        const member = row.member as ProjectMember
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
      render: (_: any, row: any) => {
        if (row.entity_type === 'agent') {
          return null
        }
        const member = row.member as ProjectMember
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
              placeholder={`${tp('members.form.emailPlaceholder')} (${tp('members.form.humanOnly')})`}
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
          rowKey="row_id"
          loading={loading}
          columns={columns}
          dataSource={mergedItems}
          pagination={false}
        />
      </Space>
    </Card>
  )
}
