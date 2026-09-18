/**
 * OrganizationDetail 页面主入口
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Card, Form, Spin, Tabs } from 'antd'
import {
  getRoleKeys,
  roleColorMap,
  statusColorMap,
  translateRoleLabel,
  translateStatusLabel,
} from './organizations/components/organizationViewShared'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

import { useOrganization } from './OrganizationDetail/hooks/useOrganization'
import { useMembers } from './OrganizationDetail/hooks/useMembers'
import { useProjects } from './OrganizationDetail/hooks/useProjects'
import { useEvents } from './OrganizationDetail/hooks/useEvents'

import { OrgHeader } from './OrganizationDetail/components/OrgHeader'
import { OrgSummaryCard } from './OrganizationDetail/components/OrgSummaryCard'
import { OrgMembersTab } from './OrganizationDetail/components/OrgMembersTab'
import { OrgActivityTab } from './OrganizationDetail/components/OrgActivityTab'
import { OrgProjectsTab } from './OrganizationDetail/components/OrgProjectsTab'
import { CreateAgentModal } from './OrganizationDetail/components/CreateAgentModal'

import { formatNumber, formatDateTime } from './OrganizationDetail/utils'

import './OrganizationDetail.css'

const OrganizationDetail = () => {
  const { organizationId } = useParams<{ organizationId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tp } = usePageTranslation('organizations')
  const [createAgentForm] = Form.useForm()

  const parsedOrganizationId = Number(organizationId)
  const activeTab = searchParams.get('tab') || 'members'

  // 使用自定义 hooks
  const { organization, loading: orgLoading } = useOrganization(parsedOrganizationId)
  const {
    members,
    agentMembers,
    loading: membersLoading,
    actionLoading,
    mergedMemberRows,
    memberStats,
    inviteMember,
    inviteAgentMember,
    updateMemberRoles,
    removeMember,
    removeAgentMember,
    refreshActivity,
    setActionLoading,
  } = useMembers(parsedOrganizationId, tp)

  const {
    projects,
    loading: projectsLoading,
    projectStats,
    activityStats,
    recentProjects,
  } = useProjects(parsedOrganizationId, organization?.updated_at, tp)

  const { events, loading: eventsLoading, pagination: eventsPagination, loadEvents } = useEvents(
    parsedOrganizationId,
    tp
  )

  // 本地状态
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoleIds, setInviteRoleIds] = useState<number[]>([])
  const [inviteAgentId, setInviteAgentId] = useState('')
  const [createAgentVisible, setCreateAgentVisible] = useState(false)
  const [organizationRoles, setOrganizationRoles] = useState<
    Array<{ id: number; name: string; key: string; is_active: boolean }>
  >([])

  // 加载角色
  useEffect(() => {
    if (!parsedOrganizationId) return
    import('../api/organizations').then(({ organizationsApi }) => {
      organizationsApi
        .getOrganizationRoles(parsedOrganizationId)
        .then((data) => {
          setOrganizationRoles(data.items || [])
        })
        .catch(() => setOrganizationRoles([]))
    })
  }, [parsedOrganizationId])

  // 权限检查
  const canManageMembers =
    organization?.current_user_role === 'owner' || organization?.current_user_role === 'admin'

  // 当前角色 keys
  const currentRoleKeys = useMemo(
    () => (organization ? getRoleKeys(organization) : []),
    [organization]
  )

  // 角色选项
  const roleOptions = useMemo(
    () =>
      organizationRoles
        .filter((item) => item.is_active && item.key !== 'owner')
        .map((item) => ({ label: item.name, value: item.id })),
    [organizationRoles]
  )

  // 角色统计
  const roleStats = useMemo(() => {
    const total = organizationRoles.length
    const active = organizationRoles.filter((role) => role.is_active).length
    return { total, active }
  }, [organizationRoles])

  // 处理标签页切换
  const handleTabChange = useCallback(
    (key: string) => {
      setSearchParams({ tab: key })
    },
    [setSearchParams]
  )

  // 处理活动页分页
  const handleActivityPageChange = useCallback(
    (page: number) => {
      void loadEvents(page)
    },
    [loadEvents]
  )

  // 打开角色管理页面
  const openRoleManagerPage = useCallback(() => {
    navigate(`/todo-for-ai/pages/organizations/${parsedOrganizationId}/roles`)
  }, [navigate, parsedOrganizationId])

  // 创建 Agent
  const createAgent = useCallback(async () => {
    try {
      const values = await createAgentForm.validateFields()
      setActionLoading(true)
      const { organizationAgentsApi } = await import('../api/organizationAgents')
      await organizationAgentsApi.createOrganizationAgent(parsedOrganizationId, {
        name: values.name,
        description: values.description,
      })
      setCreateAgentVisible(false)
      createAgentForm.resetFields()
      await refreshActivity()
    } catch (error: any) {
      if (error?.errorFields) return
    } finally {
      setActionLoading(false)
    }
  }, [createAgentForm, parsedOrganizationId, refreshActivity, setActionLoading])

  // 返回
  const handleBack = useCallback(() => {
    navigate('/todo-for-ai/pages/organizations')
  }, [navigate])

  // 加载中状态
  if (orgLoading && !organization) {
    return (
      <div className="page-container" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* 页面头部 */}
      <OrgHeader
        title={tp('detail.title')}
        subtitle={tp('detail.subtitle')}
        backText={tp('detail.back')}
        onBack={handleBack}
      />

      {/* 摘要卡片 */}
      <OrgSummaryCard
        organization={organization}
        memberStats={memberStats}
        projectStats={projectStats}
        activityStats={activityStats}
        roleStats={roleStats}
        currentRoleKeys={currentRoleKeys}
        events={events.slice(0, 6)}
        projects={recentProjects}
        membersLoading={membersLoading}
        projectsLoading={projectsLoading}
        eventsLoading={eventsLoading}
        formatNumber={(value) => formatNumber(value, 'zh-CN')}
        formatDateTime={(value) => formatDateTime(value, 'zh-CN')}
        tp={tp}
        onTabChange={handleTabChange}
        onOpenRoleManager={openRoleManagerPage}
      />

      {/* 标签页 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'members',
              label: tp('detail.tabs.members'),
              children: (
                <OrgMembersTab
                  organizationId={parsedOrganizationId}
                  organizationName={organization?.name || ''}
                  canManageMembers={canManageMembers}
                  membersLoading={membersLoading}
                  actionLoading={actionLoading}
                  inviteEmail={inviteEmail}
                  inviteRoleIds={inviteRoleIds}
                  inviteAgentId={inviteAgentId}
                  memberRows={mergedMemberRows}
                  roleOptions={roleOptions}
                  tp={tp}
                  onInviteEmailChange={setInviteEmail}
                  onInviteRoleChange={setInviteRoleIds}
                  onInviteAgentIdChange={setInviteAgentId}
                  onInviteMember={() => inviteMember(inviteEmail, inviteRoleIds)}
                  onInviteAgent={() => inviteAgentMember(inviteAgentId)}
                  onOpenCreateAgent={() => setCreateAgentVisible(true)}
                  onOpenRoleManager={openRoleManagerPage}
                  onUpdateMemberRoles={updateMemberRoles}
                  onRemoveMember={removeMember}
                  onRemoveAgentMember={removeAgentMember}
                />
              ),
            },
            {
              key: 'activity',
              label: tp('detail.tabs.activity'),
              children: (
                <OrgActivityTab
                  events={events}
                  loading={eventsLoading}
                  pagination={eventsPagination}
                  tp={tp}
                  onPageChange={handleActivityPageChange}
                />
              ),
            },
            {
              key: 'projects',
              label: tp('detail.tabs.projects'),
              children: (
                <OrgProjectsTab
                  projects={projects}
                  loading={projectsLoading}
                  tp={tp}
                  formatDateTime={(value) => formatDateTime(value, 'zh-CN')}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* 创建 Agent 弹窗 */}
      <CreateAgentModal
        visible={createAgentVisible}
        loading={actionLoading}
        tp={tp}
        onOk={createAgent}
        onCancel={() => setCreateAgentVisible(false)}
        form={createAgentForm}
      />
    </div>
  )
}

export default OrganizationDetail
