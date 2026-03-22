/**
 * 组织统计面板组件
 */

import { Typography } from 'antd'
import type { MemberStats, ProjectStats, ActivityStats } from '../types'
import './OrgStatsPanel.css'

const { Text } = Typography

interface OrgStatsPanelProps {
  memberStats: MemberStats
  projectStats: ProjectStats
  activityStats: ActivityStats
  membersLoading: boolean
  projectsLoading: boolean
  formatNumber: (value: number | undefined) => string
  formatDateTime: (value: string | undefined) => string
  tp: (key: string, options?: { defaultValue?: string }) => string
}

interface BarSegment {
  key: string
  width: string
  color: string
}

export const OrgStatsPanel: React.FC<OrgStatsPanelProps> = ({
  memberStats,
  projectStats,
  activityStats,
  membersLoading,
  projectsLoading,
  formatNumber,
  formatDateTime,
  tp,
}) => {
  const getWidth = (value: number, total: number): string =>
    total > 0 ? `${(value / total) * 100}%` : '0%'

  const memberBarSegments: BarSegment[] = [
    { key: 'human', width: getWidth(memberStats.humanActive, memberStats.total), color: '#1677ff' },
    { key: 'ai', width: getWidth(memberStats.aiActive, memberStats.total), color: '#52c41a' },
    { key: 'invited', width: getWidth(memberStats.invited, memberStats.total), color: '#faad14' },
  ]

  const projectBarSegments: BarSegment[] = [
    { key: 'active', width: getWidth(projectStats.active, projectStats.total), color: '#1677ff' },
    { key: 'archived', width: getWidth(projectStats.archived, projectStats.total), color: '#bfbfbf' },
    { key: 'deleted', width: getWidth(projectStats.deleted, projectStats.total), color: '#ff7875' },
  ]

  return (
    <div className="org-stats">
      {/* 成员统计面板 */}
      <div className="org-stats__panel">
        <div className="org-stats__panel-header">
          <Text type="secondary">{tp('detail.stats.membersOverview')}</Text>
          <div className="org-stats__metric">
            {formatNumber(membersLoading ? undefined : memberStats.total)}
          </div>
        </div>
        <div className="org-stats__bar">
          {memberBarSegments.map((segment) => (
            <span
              key={segment.key}
              className="org-stats__bar-segment"
              style={{ width: segment.width, background: segment.color }}
            />
          ))}
        </div>
        <div className="org-stats__legend">
          <span className="org-stats__legend-item">
            <span className="org-stats__dot" style={{ background: '#1677ff' }} />
            {tp('detail.stats.humanMembers')} {formatNumber(membersLoading ? undefined : memberStats.humanActive)}
          </span>
          <span className="org-stats__legend-item">
            <span className="org-stats__dot" style={{ background: '#52c41a' }} />
            {tp('detail.stats.aiMembers')} {formatNumber(membersLoading ? undefined : memberStats.aiActive)}
          </span>
          <span className="org-stats__legend-item">
            <span className="org-stats__dot" style={{ background: '#faad14' }} />
            {tp('detail.stats.invitedMembers')} {formatNumber(membersLoading ? undefined : memberStats.invited)}
          </span>
        </div>
      </div>

      {/* 项目统计面板 */}
      <div className="org-stats__panel">
        <div className="org-stats__panel-header">
          <Text type="secondary">{tp('detail.stats.projectsOverview')}</Text>
          <div className="org-stats__metric">
            {formatNumber(projectsLoading ? undefined : projectStats.total)}
          </div>
        </div>
        <div className="org-stats__bar">
          {projectBarSegments.map((segment) => (
            <span
              key={segment.key}
              className="org-stats__bar-segment"
              style={{ width: segment.width, background: segment.color }}
            />
          ))}
        </div>
        <div className="org-stats__legend">
          <span className="org-stats__legend-item">
            <span className="org-stats__dot" style={{ background: '#1677ff' }} />
            {tp('detail.stats.projectsActive')} {formatNumber(projectsLoading ? undefined : projectStats.active)}
          </span>
          <span className="org-stats__legend-item">
            <span className="org-stats__dot" style={{ background: '#bfbfbf' }} />
            {tp('detail.stats.projectsArchived')} {formatNumber(projectsLoading ? undefined : projectStats.archived)}
          </span>
          <span className="org-stats__legend-item">
            <span className="org-stats__dot" style={{ background: '#ff7875' }} />
            {tp('detail.stats.projectsDeleted')} {formatNumber(projectsLoading ? undefined : projectStats.deleted)}
          </span>
        </div>
      </div>

      {/* 活动统计面板 */}
      <div className="org-stats__panel">
        <div className="org-stats__panel-header">
          <Text type="secondary">{tp('detail.stats.activityOverview')}</Text>
          <div className="org-stats__metric">
            {formatNumber(projectsLoading ? undefined : activityStats.activeProjects7d)}
          </div>
        </div>
        <div className="org-stats__details">
          <div className="org-stats__detail-item">
            <span className="org-stats__detail-label">{tp('detail.stats.activeProjects7d')}</span>
            <span className="org-stats__detail-value">
              {formatNumber(projectsLoading ? undefined : activityStats.activeProjects7d)}
            </span>
          </div>
          <div className="org-stats__detail-item">
            <span className="org-stats__detail-label">{tp('detail.stats.lastActivity')}</span>
            <span className="org-stats__detail-value">{formatDateTime(activityStats.latestActivityAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
