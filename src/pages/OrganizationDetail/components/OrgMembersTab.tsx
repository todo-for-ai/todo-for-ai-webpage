/**
 * 成员标签页组件
 */

import { Space } from 'antd'
import { OrganizationMembersCard } from '../../organizations/components/OrganizationMembersCard'
import NotificationChannelManager from '../../../components/NotificationChannelManager'
import type { OrganizationMember, OrganizationRoleDefinition } from '../../../api/organizations'
import type { OrganizationAgentMember } from '../../../api/organizationAgents'
import type { MergedMemberRow } from '../types'

interface OrgMembersTabProps {
  organizationId: number
  organizationName: string
  canManageMembers: boolean
  membersLoading: boolean
  actionLoading: boolean
  inviteEmail: string
  inviteRoleIds: number[]
  inviteAgentId: string
  memberRows: MergedMemberRow[]
  roleOptions: { label: string; value: number }[]
  tp: (key: string, options?: { defaultValue?: string }) => string
  onInviteEmailChange: (email: string) => void
  onInviteRoleChange: (roleIds: number[]) => void
  onInviteAgentIdChange: (agentId: string) => void
  onInviteMember: () => void
  onInviteAgent: () => void
  onOpenCreateAgent: () => void
  onOpenRoleManager: () => void
  onUpdateMemberRoles: (member: OrganizationMember, roleIds: number[]) => void
  onRemoveMember: (member: OrganizationMember) => void
  onRemoveAgentMember: (member: OrganizationAgentMember) => void
}

export const OrgMembersTab: React.FC<OrgMembersTabProps> = ({
  organizationId,
  organizationName,
  canManageMembers,
  membersLoading,
  actionLoading,
  inviteEmail,
  inviteRoleIds,
  inviteAgentId,
  memberRows,
  roleOptions,
  tp,
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
}) => {
  const statusColorMap: Record<string, string> = {
    active: 'green',
    invited: 'blue',
    removed: 'default',
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <OrganizationMembersCard
        tp={tp}
        organizationId={organizationId}
        organizationName={organizationName}
        canManageMembers={canManageMembers}
        loading={membersLoading || actionLoading}
        inviteEmail={inviteEmail}
        inviteRoleIds={inviteRoleIds}
        inviteAgentId={inviteAgentId}
        memberRows={memberRows}
        roleOptions={roleOptions}
        statusColorMap={statusColorMap}
        onInviteEmailChange={onInviteEmailChange}
        onInviteRoleChange={onInviteRoleChange}
        onInviteAgentIdChange={onInviteAgentIdChange}
        onInviteMember={onInviteMember}
        onInviteAgent={onInviteAgent}
        onOpenCreateAgent={onOpenCreateAgent}
        onOpenRoleManager={onOpenRoleManager}
        onUpdateMemberRoles={onUpdateMemberRoles}
        onRemoveMember={onRemoveMember}
        onRemoveAgentMember={onRemoveAgentMember}
      />
      <NotificationChannelManager
        scopeType="organization"
        scopeId={organizationId}
        title={tp('detail.notifications.title')}
        description={tp('detail.notifications.description')}
        canManage={canManageMembers}
      />
    </Space>
  )
}
