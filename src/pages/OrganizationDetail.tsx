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
import { useOrganizationDetailData,
  ORG_STATUS_COLORS,
  PROJECT_STATUS_COLORS,
  getProjectTaskCount } from './OrganizationDetailData'
import { useOrganizationDetailDerived } from './OrganizationDetailDerived'
import { OrganizationDetailTabsSection } from './OrganizationDetailTabsSection'


const { Title, Paragraph, Text } = Typography

const OrganizationDetail = () => {
  const data = useOrganizationDetailData()
  const derived = useOrganizationDetailDerived(data)
  const {
    organizationId,
    searchParams,
    setSearchParams,
    navigate,
    tp,
    tc,
    language,
    tpRef,
    organization,
    setOrganization,
    members,
    setMembers,
    agentMembers,
    setAgentMembers,
    organizationRoles,
    setOrganizationRoles,
    projects,
    setProjects,
    events,
    setEvents,
    eventsPagination,
    setEventsPagination,
    pageLoading,
    setPageLoading,
    membersLoading,
    setMembersLoading,
    projectsLoading,
    setProjectsLoading,
    eventsLoading,
    setEventsLoading,
    actionLoading,
    setActionLoading,
    createAgentVisible,
    setCreateAgentVisible,
    inviteEmail,
    setInviteEmail,
    inviteAgentId,
    setInviteAgentId,
    inviteRoleIds,
    setInviteRoleIds,
    createAgentForm,
    parsedOrganizationId,
    activeTab,
    canManageMembers,
    formatDateTime,
    formatNumber,
    formatEventType,
    loadOrganization,
    loadMembers,
    loadAgentMembers,
    loadOrganizationRoles,
    loadProjects,
    loadEvents,
    refreshActivityPreview,
    inviteMember,
    updateMemberRoles,
    removeMember,
    createAgent,
    inviteAgentMember,
    removeAgentMember,
    openRoleManagerPage,
    mergedMemberRows,
    roleOptions,
    memberStats,
    roleStats,
    projectStats,
    memberBarSegments,
    projectBarSegments,
    activityStats,
    currentRoleKeys,
    recentProjects,
    activityPreviewItems,
    organizationSignals,
    profileFacts,
    getEventSummary,
    getEventTimestamp,
    projectColumns,
    eventColumns,
  } = { ...data, ...derived }
  if (pageLoading && !organization) {
    return (
      <div className="page-container" style={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <PageIntro
        storageKey="page-intro:organizationDetail:v1"
        title={tc('pageIntro.organizationDetail.title')}
        description={tc('pageIntro.organizationDetail.desc')}
      />
      <div className="page-header">
        <div className="flex-between">
          <div>
            <Title level={2} className="page-title">{tp('detail.title')}</Title>
            <Paragraph className="page-description">{tp('detail.subtitle')}</Paragraph>
          </div>
          <Button className="flat-btn" icon={<ArrowLeftOutlined />} onClick={() => navigate('/todo-for-ai/pages/organizations')}>
            {tp('detail.back')}
          </Button>
        </div>
      </div>

      <Card className="org-summary-card flat-card" style={{ marginBottom: 16 }}>
        <div className="org-summary">
          <div className="org-summary__head">
            <div>
              <div className="org-summary__title">
                <Title level={3} style={{ margin: 0 }}>{organization?.name || '-'}</Title>
                <Tag color={statusColorMap[organization?.status || 'active'] || 'default'}>
                  {translateStatusLabel(tp, organization?.status || 'active')}
                </Tag>
                {organization?.slug && (
                  <span className="org-summary__slug">{organization.slug}</span>
                )}
              </div>
              {currentRoleKeys.length > 0 ? (
                <Space size={[8, 8]} wrap style={{ marginBottom: 12 }}>
                  {currentRoleKeys.map((roleKey) => (
                    <Tag
                      key={roleKey}
                      color={roleColorMap[roleKey] || 'default'}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {translateRoleLabel(tp, roleKey)}
                    </Tag>
                  ))}
                </Space>
              ) : null}
              {organization?.description ? (
                <Paragraph style={{ marginBottom: 0 }}>{organization.description}</Paragraph>
              ) : (
                <Text type="secondary">{tp('detail.noDescription')}</Text>
              )}
            </div>
          </div>

          <div className="org-summary__grid">
            <div className="org-summary__panel">
              <div className="org-summary__panel-top">
                <Text type="secondary">{tp('detail.stats.membersOverview')}</Text>
                <div className="org-summary__panel-metric">
                  {formatNumber(membersLoading ? undefined : memberStats.total)}
                </div>
              </div>
              <div className="org-summary__bar">
                {memberBarSegments.map((segment) => (
                  <span
                    key={segment.key}
                    className="org-summary__bar-segment"
                    style={{ width: segment.width, background: segment.color }}
                  />
                ))}
              </div>
              <div className="org-summary__legend">
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#00b96b' }} />
                  {tp('detail.stats.humanMembers')} {formatNumber(membersLoading ? undefined : memberStats.humanActive)}
                </span>
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#52c41a' }} />
                  {tp('detail.stats.aiMembers')} {formatNumber(membersLoading ? undefined : memberStats.aiActive)}
                </span>
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#faad14' }} />
                  {tp('detail.stats.invitedMembers')} {formatNumber(membersLoading ? undefined : memberStats.invited)}
                </span>
              </div>
            </div>

            <div className="org-summary__panel">
              <div className="org-summary__panel-top">
                <Text type="secondary">{tp('detail.stats.projectsOverview')}</Text>
                <div className="org-summary__panel-metric">
                  {formatNumber(projectsLoading ? undefined : projectStats.total)}
                </div>
              </div>
              <div className="org-summary__bar">
                {projectBarSegments.map((segment) => (
                  <span
                    key={segment.key}
                    className="org-summary__bar-segment"
                    style={{ width: segment.width, background: segment.color }}
                  />
                ))}
              </div>
              <div className="org-summary__legend">
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#00b96b' }} />
                  {tp('detail.stats.projectsActive')} {formatNumber(projectsLoading ? undefined : projectStats.active)}
                </span>
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#bfbfbf' }} />
                  {tp('detail.stats.projectsArchived')} {formatNumber(projectsLoading ? undefined : projectStats.archived)}
                </span>
                <span className="org-summary__legend-item">
                  <span className="org-summary__dot" style={{ background: '#ff7875' }} />
                  {tp('detail.stats.projectsDeleted')} {formatNumber(projectsLoading ? undefined : projectStats.deleted)}
                </span>
              </div>
            </div>

            <div className="org-summary__panel">
              <div className="org-summary__panel-top">
                <Text type="secondary">{tp('detail.stats.activityOverview')}</Text>
                <div className="org-summary__panel-metric">
                  {formatNumber(projectsLoading ? undefined : activityStats.activeProjects7d)}
                </div>
              </div>
              <div className="org-summary__stats">
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.stats.activeProjects7d')}</span>
                  <span className="org-summary__stat-value">
                    {formatNumber(projectsLoading ? undefined : activityStats.activeProjects7d)}
                  </span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.stats.lastActivity')}</span>
                  <span className="org-summary__stat-value">{formatDateTime(activityStats.latestActivityAt)}</span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.stats.activeRoles')}</span>
                  <span className="org-summary__stat-value">{formatNumber(roleStats.active)}</span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.stats.totalRoles')}</span>
                  <span className="org-summary__stat-value">{formatNumber(roleStats.total)}</span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.fields.createdAt')}</span>
                  <span className="org-summary__stat-value">{formatDateTime(organization?.created_at)}</span>
                </div>
                <div className="org-summary__stat">
                  <span className="org-summary__stat-label">{tp('detail.fields.updatedAt')}</span>
                  <span className="org-summary__stat-value">{formatDateTime(organization?.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="org-insights">
            <div className="org-insights__panel">
              <div className="org-insights__panel-head">
                <div>
                  <Text strong>{tp('detail.overview.title')}</Text>
                  <div className="org-insights__panel-subtitle">{tp('detail.overview.subtitle')}</div>
                </div>
              </div>

              <div className="org-insights__facts">
                {profileFacts.map((fact) => (
                  <div key={fact.key} className="org-insights__fact">
                    <span className="org-insights__fact-label">{fact.label}</span>
                    <span className="org-insights__fact-value">{fact.value}</span>
                  </div>
                ))}
              </div>

              <div className="org-insights__actions">
                <Button className="flat-btn" size="small" onClick={() => setSearchParams({ tab: 'members' })}>
                  {tp('detail.tabs.members')}
                </Button>
                <Button className="flat-btn" size="small" onClick={() => setSearchParams({ tab: 'activity' })}>
                  {tp('detail.tabs.activity')}
                </Button>
                <Button className="flat-btn" size="small" onClick={() => setSearchParams({ tab: 'projects' })}>
                  {tp('detail.tabs.projects')}
                </Button>
                {canManageMembers ? (
                  <Button className="flat-btn" size="small" onClick={openRoleManagerPage}>
                    {tp('roles.manage')}
                  </Button>
                ) : null}
              </div>

              <div>
                <div className="org-insights__section-title">{tp('detail.overview.healthSignals')}</div>
                {organizationSignals.length > 0 ? (
                  <Space size={[8, 8]} wrap>
                    {organizationSignals.map((signal) => (
                      <Tag key={signal.key} color={signal.color} style={{ marginInlineEnd: 0 }}>
                        {signal.text}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{tp('detail.overview.noSignals')}</Text>
                )}
              </div>
            </div>

            <div className="org-insights__panel">
              <div className="org-insights__panel-head">
                <div>
                  <Text strong>{tp('detail.recentActivity.title')}</Text>
                  <div className="org-insights__panel-subtitle">{tp('detail.recentActivity.subtitle')}</div>
                </div>
                <Button className="flat-btn" type="link" size="small" onClick={() => setSearchParams({ tab: 'activity' })}>
                  {tp('detail.recentActivity.viewAll')}
                </Button>
              </div>

              {eventsLoading && activityPreviewItems.length === 0 ? (
                <div className="org-insights__empty">
                  <Spin size="small" />
                </div>
              ) : activityPreviewItems.length > 0 ? (
                <div className="org-insights__list">
                  {activityPreviewItems.map((record) => {
                    const eventAt = getEventTimestamp(record)
                    return (
                      <div key={record.id} className="org-insights__list-item">
                        <div className="org-insights__list-icon">
                          <HistoryOutlined />
                        </div>
                        <div className="org-insights__list-main">
                          <div className="org-insights__list-title">{formatEventType(record.event_type)}</div>
                          <div className="org-insights__list-body">{getEventSummary(record)}</div>
                          <div className="org-insights__list-meta">
                            <span>{tp('detail.recentActivity.actor')}: {record.actor_name || record.actor_type || '-'}</span>
                            <Tooltip title={formatFullDateTime(eventAt)}>
                              <span>{formatRelativeTimeI18n(eventAt, tp)}</span>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="org-insights__empty">
                  <Text type="secondary">{tp('detail.recentActivity.empty')}</Text>
                </div>
              )}
            </div>

            <div className="org-insights__panel">
              <div className="org-insights__panel-head">
                <div>
                  <Text strong>{tp('detail.projectSpotlight.title')}</Text>
                  <div className="org-insights__panel-subtitle">{tp('detail.projectSpotlight.subtitle')}</div>
                </div>
                <Button className="flat-btn" type="link" size="small" onClick={() => setSearchParams({ tab: 'projects' })}>
                  {tp('detail.projectSpotlight.viewAll')}
                </Button>
              </div>

              {projectsLoading && recentProjects.length === 0 ? (
                <div className="org-insights__empty">
                  <Spin size="small" />
                </div>
              ) : recentProjects.length > 0 ? (
                <div className="org-insights__list">
                  {recentProjects.map((project) => {
                    const projectActivityAt = project.last_activity_at || project.updated_at || project.created_at
                    return (
                      <div key={project.id} className="org-insights__list-item">
                        <div className="org-insights__list-icon">
                          <FolderOpenOutlined />
                        </div>
                        <div className="org-insights__list-main">
                          <div className="org-insights__list-title">
                            <LinkButton to={`/todo-for-ai/pages/projects/${project.id}`} type="link" style={{ padding: 0, height: 'auto' }}>
                              {project.name}
                            </LinkButton>
                          </div>
                          <div className="org-insights__list-meta">
                            <Tag color={PROJECT_STATUS_COLORS[project.status] || 'default'} style={{ marginInlineEnd: 0 }}>
                              {translateStatusLabel(tp, project.status)}
                            </Tag>
                            <span>{tp('detail.projectSpotlight.taskCount')}: {formatNumber(getProjectTaskCount(project))}</span>
                          </div>
                          <div className="org-insights__list-meta">
                            <Tooltip title={formatFullDateTime(projectActivityAt)}>
                              <span>{tp('detail.projectSpotlight.lastActivity')}: {formatRelativeTimeI18n(projectActivityAt, tp)}</span>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="org-insights__empty">
                  <Text type="secondary">{tp('detail.projectSpotlight.empty')}</Text>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <OrganizationDetailTabsSection {...data} {...derived} />
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
