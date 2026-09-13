/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Tooltip,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
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
import { OrgBudgetsTab } from './OrganizationDetail/components/OrgBudgetsTab'
import { OrgRuntimeSettingsTab } from './OrganizationDetail/components/OrgRuntimeSettingsTab'
import { LinkButton } from '../components/SmartLink'
import { formatFullDateTime, formatRelativeTimeI18n } from '../utils/dateUtils'
import {
  getRoleKeys,
  roleColorMap,
  statusColorMap,
  translateRoleLabel,
  translateStatusLabel,
} from './organizations/components/organizationViewShared'
import './OrganizationDetail.css'
import { PageIntro } from '../components/common/PageIntro'
import type { useOrganizationDetailData } from './OrganizationDetailData'
import { ORG_STATUS_COLORS, PROJECT_STATUS_COLORS, getProjectTaskCount } from './OrganizationDetailData'
import type { useOrganizationDetailDerived } from './OrganizationDetailDerived'



type Bundle = ReturnType<typeof useOrganizationDetailData> & ReturnType<typeof useOrganizationDetailDerived>

/**
 * 组织详情页的成员/项目/动态三个 Tab 表格区。props 直接收双 hook 合并包，
 * 由 OrganizationDetail 页面原样拆出。
 */
export function OrganizationDetailTabsSection(props: Bundle) {
  const {
    actionLoading,
    activeTab,
    canManageMembers,
    eventColumns,
    events,
    eventsLoading,
    eventsPagination,
    inviteAgentId,
    inviteAgentMember,
    inviteEmail,
    inviteMember,
    inviteRoleIds,
    loadEvents,
    members,
    membersLoading,
    mergedMemberRows,
    openRoleManagerPage,
    organization,
    organizationId,
    parsedOrganizationId,
    projectColumns,
    projects,
    projectsLoading,
    removeAgentMember,
    removeMember,
    roleOptions,
    setCreateAgentVisible,
    setInviteAgentId,
    setInviteEmail,
    setInviteRoleIds,
    setSearchParams,
    tp,
    updateMemberRoles,
  } = props

  return (
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
                    organizationId={parsedOrganizationId}
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
                  className="flat-table"
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
                  className="flat-table"
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
            {
              key: 'budgets',
              label: tp('detail.tabs.budgets'),
              children: (
                <OrgBudgetsTab organizationId={parsedOrganizationId} canManage={!!canManageMembers} />
              ),
            },
            {
              key: 'runtime',
              label: tp('detail.tabs.runtime'),
              children: (
                <OrgRuntimeSettingsTab organizationId={parsedOrganizationId} canManage={!!canManageMembers} />
              ),
            },
          ]}
        />
  )
}
