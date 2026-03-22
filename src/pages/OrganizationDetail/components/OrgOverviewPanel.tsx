/**
 * 组织概览面板组件
 */

import { Button, Space, Tag, Typography } from 'antd'
import { translateStatusLabel, translateRoleLabel } from '../../organizations/components/organizationViewShared'
import type { Organization } from '../../../api/organizations'
import type { OrgSignal, ProfileFact } from '../types'
import './OrgOverviewPanel.css'

const { Title, Text } = Typography

interface OrgOverviewPanelProps {
  organization: Organization | null
  canManageMembers: boolean
  memberStats: { invited: number }
  projectStats: { archived: number; deleted: number; total: number }
  roleStats: { total: number; active: number }
  currentRoleKeys: string[]
  formatNumber: (value: number | undefined) => string
  tp: (key: string, options?: { defaultValue?: string; count?: number }) => string
  onTabChange: (tab: string) => void
  onOpenRoleManager: () => void
}

export const OrgOverviewPanel: React.FC<OrgOverviewPanelProps> = ({
  organization,
  canManageMembers,
  memberStats,
  projectStats,
  roleStats,
  currentRoleKeys,
  formatNumber,
  tp,
  onTabChange,
  onOpenRoleManager,
}) => {
  const statusColorMap: Record<string, string> = {
    active: 'green',
    invited: 'blue',
    removed: 'default',
  }

  const roleColorMap: Record<string, string> = {
    owner: 'gold',
    admin: 'blue',
    member: 'green',
  }

  const profileFacts: ProfileFact[] = [
    {
      key: 'slug',
      label: tp('detail.overview.slug'),
      value: organization?.slug || '-',
    },
    {
      key: 'access',
      label: tp('detail.overview.myAccess'),
      value: currentRoleKeys.length
        ? currentRoleKeys.map((roleKey) => translateRoleLabel(tp, roleKey)).join(' / ')
        : '-',
    },
    {
      key: 'manage',
      label: tp('detail.overview.manageAccess'),
      value: canManageMembers
        ? tp('detail.overview.manageEnabled')
        : tp('detail.overview.manageDisabled'),
    },
    {
      key: 'roles',
      label: tp('detail.stats.totalRoles'),
      value: formatNumber(roleStats.total),
    },
  ]

  const signals: OrgSignal[] = []
  if (memberStats.invited > 0) {
    signals.push({
      key: 'invited',
      color: 'gold',
      text: tp('detail.signals.invitedMembers', { count: memberStats.invited }),
    })
  }
  const inactiveRoles = Math.max(roleStats.total - roleStats.active, 0)
  if (inactiveRoles > 0) {
    signals.push({
      key: 'inactiveRoles',
      color: 'blue',
      text: tp('detail.signals.inactiveRoles', { count: inactiveRoles }),
    })
  }
  if (projectStats.deleted > 0) {
    signals.push({
      key: 'deletedProjects',
      color: 'red',
      text: tp('detail.signals.deletedProjects', { count: projectStats.deleted }),
    })
  } else if (projectStats.archived > 0) {
    signals.push({
      key: 'archivedProjects',
      color: 'orange',
      text: tp('detail.signals.archivedProjects', { count: projectStats.archived }),
    })
  }
  if (projectStats.total === 0) {
    signals.push({
      key: 'noProjects',
      color: 'blue',
      text: tp('detail.signals.noProjects'),
    })
  }

  return (
    <div className="org-overview">
      {/* 头部信息 */}
      <div className="org-overview__header">
        <div className="org-overview__title">
          <Title level={3} style={{ margin: 0 }}>{organization?.name || '-'}</Title>
          <Tag color={statusColorMap[organization?.status || 'active'] || 'default'}>
            {translateStatusLabel(tp, organization?.status || 'active')}
          </Tag>
          {organization?.slug && (
            <span className="org-overview__slug">{organization.slug}</span>
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
          <Text>{organization.description}</Text>
        ) : (
          <Text type="secondary">{tp('detail.noDescription')}</Text>
        )}
      </div>

      {/* 概览卡片 */}
      <div className="org-overview__card">
        <div className="org-overview__card-header">
          <Text strong>{tp('detail.overview.title')}</Text>
          <div className="org-overview__card-subtitle">{tp('detail.overview.subtitle')}</div>
        </div>

        <div className="org-overview__facts">
          {profileFacts.map((fact) => (
            <div key={fact.key} className="org-overview__fact">
              <span className="org-overview__fact-label">{fact.label}</span>
              <span className="org-overview__fact-value">{fact.value}</span>
            </div>
          ))}
        </div>

        <div className="org-overview__actions">
          <Button size="small" onClick={() => onTabChange('members')}>
            {tp('detail.tabs.members')}
          </Button>
          <Button size="small" onClick={() => onTabChange('activity')}>
            {tp('detail.tabs.activity')}
          </Button>
          <Button size="small" onClick={() => onTabChange('projects')}>
            {tp('detail.tabs.projects')}
          </Button>
          {canManageMembers ? (
            <Button size="small" onClick={onOpenRoleManager}>
              {tp('roles.manage')}
            </Button>
          ) : null}
        </div>

        <div>
          <div className="org-overview__section-title">{tp('detail.overview.healthSignals')}</div>
          {signals.length > 0 ? (
            <Space size={[8, 8]} wrap>
              {signals.map((signal) => (
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
    </div>
  )
}
