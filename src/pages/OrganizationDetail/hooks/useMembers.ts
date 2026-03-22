/**
 * Members 数据 Hook
 */

import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { organizationsApi, type OrganizationMember } from '../../../api/organizations'
import { organizationAgentsApi, type OrganizationAgentMember } from '../../../api/organizationAgents'
import { organizationEventsApi } from '../../../api/organizationEvents'
import type { MergedMemberRow, MemberStats } from '../types'

interface UseMembersReturn {
  members: OrganizationMember[]
  agentMembers: OrganizationAgentMember[]
  loading: boolean
  actionLoading: boolean
  mergedMemberRows: MergedMemberRow[]
  memberStats: MemberStats
  loadMembers: () => Promise<void>
  loadAgentMembers: () => Promise<void>
  inviteMember: (email: string, roleIds: number[]) => Promise<void>
  inviteAgentMember: (agentId: string) => Promise<void>
  updateMemberRoles: (member: OrganizationMember, roleIds: number[]) => Promise<void>
  removeMember: (member: OrganizationMember) => Promise<void>
  removeAgentMember: (member: OrganizationAgentMember) => Promise<void>
  refreshActivity: () => Promise<void>
  setActionLoading: (loading: boolean) => void
}

export const useMembers = (
  organizationId: number,
  tp: (key: string, options?: { defaultValue?: string }) => string
): UseMembersReturn => {
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [agentMembers, setAgentMembers] = useState<OrganizationAgentMember[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadMembers = useCallback(async () => {
    if (!organizationId) return
    try {
      setLoading(true)
      const data = await organizationsApi.getOrganizationMembers(organizationId)
      setMembers(data.items || [])
    } catch (error: any) {
      message.error(error?.message || tp('messages.memberLoadFailed', { defaultValue: '加载成员失败' }))
    } finally {
      setLoading(false)
    }
  }, [organizationId, tp])

  const loadAgentMembers = useCallback(async () => {
    if (!organizationId) return
    try {
      const data = await organizationAgentsApi.getOrganizationAgentMembers(organizationId)
      setAgentMembers(data.items || [])
    } catch (error: any) {
      message.error(error?.message || tp('messages.agentMemberLoadFailed', { defaultValue: '加载 Agent 成员失败' }))
      setAgentMembers([])
    }
  }, [organizationId, tp])

  const refreshActivity = useCallback(async () => {
    await organizationEventsApi.getOrganizationEvents(organizationId, { page: 1, per_page: 6 })
  }, [organizationId])

  const inviteMember = useCallback(async (email: string, roleIds: number[]) => {
    if (!organizationId) return
    if (!email.trim()) {
      message.warning(tp('members.emailRequired', { defaultValue: '请输入邮箱' }))
      return
    }
    try {
      setActionLoading(true)
      await organizationsApi.inviteOrganizationMember(organizationId, {
        email: email.trim(),
        role_ids: roleIds,
      })
      message.success(tp('messages.inviteSuccess', { defaultValue: '邀请成功' }))
      await loadMembers()
      await refreshActivity()
    } catch (error: any) {
      message.error(error?.message || tp('messages.inviteFailed', { defaultValue: '邀请失败' }))
    } finally {
      setActionLoading(false)
    }
  }, [organizationId, tp, loadMembers, refreshActivity])

  const inviteAgentMember = useCallback(async (agentId: string) => {
    if (!organizationId) return
    const parsedAgentId = Number(agentId)
    if (!parsedAgentId || Number.isNaN(parsedAgentId)) {
      message.warning(tp('members.agentIdRequired', { defaultValue: '请输入 Agent ID' }))
      return
    }
    try {
      setActionLoading(true)
      await organizationAgentsApi.inviteOrganizationAgentMember(organizationId, parsedAgentId)
      message.success(tp('messages.agentInviteSuccess', { defaultValue: 'Agent 邀请成功' }))
      await loadAgentMembers()
      await refreshActivity()
    } catch (error: any) {
      message.error(error?.message || tp('messages.agentInviteFailed', { defaultValue: 'Agent 邀请失败' }))
    } finally {
      setActionLoading(false)
    }
  }, [organizationId, tp, loadAgentMembers, refreshActivity])

  const updateMemberRoles = useCallback(async (member: OrganizationMember, roleIds: number[]) => {
    if (!organizationId) return
    try {
      setActionLoading(true)
      await organizationsApi.updateOrganizationMember(organizationId, member.user_id, { role_ids: roleIds })
      message.success(tp('messages.memberUpdated', { defaultValue: '成员更新成功' }))
      await loadMembers()
      await refreshActivity()
    } catch (error: any) {
      message.error(error?.message || tp('messages.memberUpdateFailed', { defaultValue: '成员更新失败' }))
    } finally {
      setActionLoading(false)
    }
  }, [organizationId, tp, loadMembers, refreshActivity])

  const removeMember = useCallback(async (member: OrganizationMember) => {
    if (!organizationId) return
    try {
      setActionLoading(true)
      await organizationsApi.removeOrganizationMember(organizationId, member.user_id)
      message.success(tp('messages.memberRemoved', { defaultValue: '成员已移除' }))
      await loadMembers()
      await refreshActivity()
    } catch (error: any) {
      message.error(error?.message || tp('messages.memberRemoveFailed', { defaultValue: '移除成员失败' }))
    } finally {
      setActionLoading(false)
    }
  }, [organizationId, tp, loadMembers, refreshActivity])

  const removeAgentMember = useCallback(async (member: OrganizationAgentMember) => {
    if (!organizationId) return
    try {
      setActionLoading(true)
      await organizationAgentsApi.removeOrganizationAgentMember(organizationId, member.id)
      message.success(tp('messages.agentMemberRemoved', { defaultValue: 'Agent 成员已移除' }))
      await loadAgentMembers()
      await refreshActivity()
    } catch (error: any) {
      message.error(error?.message || tp('messages.agentMemberRemoveFailed', { defaultValue: '移除 Agent 成员失败' }))
    } finally {
      setActionLoading(false)
    }
  }, [organizationId, tp, loadAgentMembers, refreshActivity])

  // 合并成员行
  const mergedMemberRows: MergedMemberRow[] = [
    ...members.map((member) => ({
      row_id: `human-${member.id}`,
      entity_type: 'human' as const,
      member,
      agentMember: null as OrganizationAgentMember | null,
      status: member.status,
    })),
    ...agentMembers.map((agentMember) => ({
      row_id: `agent-${agentMember.id}`,
      entity_type: 'agent' as const,
      member: null as OrganizationMember | null,
      agentMember,
      status: agentMember.status,
    })),
  ]

  // 统计
  const memberStats: MemberStats = {
    total: mergedMemberRows.length,
    humanActive: members.filter((m) => m.status === 'active').length,
    aiActive: agentMembers.filter((m) => m.status === 'active').length,
    invited: members.filter((m) => m.status === 'invited').length +
             agentMembers.filter((m) => m.status === 'invited').length,
  }

  useEffect(() => {
    if (!organizationId) return
    void loadMembers()
    void loadAgentMembers()
  }, [organizationId, loadMembers, loadAgentMembers])

  return {
    members,
    agentMembers,
    loading,
    actionLoading,
    mergedMemberRows,
    memberStats,
    loadMembers,
    loadAgentMembers,
    inviteMember,
    inviteAgentMember,
    updateMemberRoles,
    removeMember,
    removeAgentMember,
    refreshActivity,
    setActionLoading,
  }
}
