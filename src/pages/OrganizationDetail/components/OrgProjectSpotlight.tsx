/**
 * 组织项目亮点组件
 */

import { Button, Spin, Tag, Tooltip, Typography } from 'antd'
import { FolderOpenOutlined } from '@ant-design/icons'
import { LinkButton } from '../../../components/SmartLink'
import { formatFullDateTime, formatRelativeTimeI18n } from '../../../utils/dateUtils'
import { PROJECT_STATUS_COLORS } from '../constants'
import { getProjectTaskCount } from '../utils'
import { translateStatusLabel } from '../../organizations/components/organizationViewShared'
import type { Project } from '../../../api/projects'
import './OrgProjectSpotlight.css'

const { Text } = Typography

interface OrgProjectSpotlightProps {
  projects: Project[]
  loading: boolean
  formatNumber: (value: number | undefined) => string
  tp: (key: string, options?: { defaultValue?: string }) => string
  onViewAll: () => void
}

export const OrgProjectSpotlight: React.FC<OrgProjectSpotlightProps> = ({
  projects,
  loading,
  formatNumber,
  tp,
  onViewAll,
}) => {
  return (
    <div className="org-project-spotlight">
      <div className="org-project-spotlight__header">
        <div>
          <Text strong>{tp('detail.projectSpotlight.title')}</Text>
          <div className="org-project-spotlight__subtitle">{tp('detail.projectSpotlight.subtitle')}</div>
        </div>
        <Button type="link" size="small" onClick={onViewAll}>
          {tp('detail.projectSpotlight.viewAll')}
        </Button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="org-project-spotlight__empty">
          <Spin size="small" />
        </div>
      ) : projects.length > 0 ? (
        <div className="org-project-spotlight__items">
          {projects.map((project) => {
            const projectActivityAt = project.last_activity_at || project.updated_at || project.created_at
            return (
              <div key={project.id} className="org-project-spotlight__item">
                <div className="org-project-spotlight__icon">
                  <FolderOpenOutlined />
                </div>
                <div className="org-project-spotlight__content">
                  <div className="org-project-spotlight__title">
                    <LinkButton
                      to={`/todo-for-ai/pages/projects/${project.id}`}
                      type="link"
                      style={{ padding: 0, height: 'auto' }}
                    >
                      {project.name}
                    </LinkButton>
                  </div>
                  <div className="org-project-spotlight__meta">
                    <Tag
                      color={PROJECT_STATUS_COLORS[project.status] || 'default'}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {translateStatusLabel(tp, project.status)}
                    </Tag>
                    <span>{tp('detail.projectSpotlight.taskCount')}: {formatNumber(getProjectTaskCount(project))}</span>
                  </div>
                  <div className="org-project-spotlight__meta">
                    <Tooltip title={formatFullDateTime(projectActivityAt)}>
                      <span>
                        {tp('detail.projectSpotlight.lastActivity')}: {formatRelativeTimeI18n(projectActivityAt, tp)}
                      </span>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="org-project-spotlight__empty">
          <Text type="secondary">{tp('detail.projectSpotlight.empty')}</Text>
        </div>
      )}
    </div>
  )
}
