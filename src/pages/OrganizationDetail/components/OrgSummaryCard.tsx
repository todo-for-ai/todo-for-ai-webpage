/**
 * 组织摘要卡片组件
 */

import { Card } from 'antd'
import { OrgStatsPanel } from './OrgStatsPanel'
import { OrgOverviewPanel } from './OrgOverviewPanel'
import { OrgActivityList } from './OrgActivityList'
import { OrgProjectSpotlight } from './OrgProjectSpotlight'
import type { Organization } from '../../../api/organizations'
import type { OrganizationEvent } from '../../../api/organizationEvents'
import type { Project } from '../../../api/projects'
import type { MemberStats, ProjectStats, ActivityStats } from '../types'
import './OrgSummaryCard.css'

interface OrgSummaryCardProps {
  organization: Organization | null
  memberStats: MemberStats
  projectStats: ProjectStats
  activityStats: ActivityStats
  roleStats: { total: number; active: number }
  currentRoleKeys: string[]
  events: OrganizationEvent[]
  projects: Project[]
  membersLoading: boolean
  projectsLoading: boolean
  eventsLoading: boolean
  formatNumber: (value: number | undefined) => string
  formatDateTime: (value: string | undefined) => string
  tp: (key: string, options?: { defaultValue?: string }) => string
  onTabChange: (tab: string) => void
  onOpenRoleManager: () => void
}

export const OrgSummaryCard: React.FC<OrgSummaryCardProps> = ({
  organization,
  memberStats,
  projectStats,
  activityStats,
  roleStats,
  currentRoleKeys,
  events,
  projects,
  membersLoading,
  projectsLoading,
  eventsLoading,
  formatNumber,
  formatDateTime,
  tp,
  onTabChange,
  onOpenRoleManager,
}) => {
  return (
    <Card className="org-summary-card">
      <div className="org-summary">
        {/* 统计面板 */}
        <OrgStatsPanel
          memberStats={memberStats}
          projectStats={projectStats}
          activityStats={activityStats}
          membersLoading={membersLoading}
          projectsLoading={projectsLoading}
          formatNumber={formatNumber}
          formatDateTime={formatDateTime}
          tp={tp}
        />

        {/* 洞察面板网格 */}
        <div className="org-summary__insights">
          <OrgOverviewPanel
            organization={organization}
            canManageMembers={currentRoleKeys.includes('owner') || currentRoleKeys.includes('admin')}
            memberStats={memberStats}
            projectStats={projectStats}
            roleStats={roleStats}
            currentRoleKeys={currentRoleKeys}
            formatNumber={formatNumber}
            tp={tp}
            onTabChange={onTabChange}
            onOpenRoleManager={onOpenRoleManager}
          />

          <OrgActivityList
            events={events}
            loading={eventsLoading}
            tp={tp}
            onViewAll={() => onTabChange('activity')}
          />

          <OrgProjectSpotlight
            projects={projects}
            loading={projectsLoading}
            formatNumber={formatNumber}
            tp={tp}
            onViewAll={() => onTabChange('projects')}
          />
        </div>
      </div>
    </Card>
  )
}
