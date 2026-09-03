import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Empty, Row, Space, Tag, Tooltip } from 'antd'
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  EditOutlined,
  EyeOutlined,
  GithubOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { Project } from '../../api/projects'
import { organizationsApi, type Organization } from '../../api/organizations'
import { LinkButton } from '../../components/SmartLink'
import { formatFullDateTime, formatRelativeTimeI18n } from '../../utils/dateUtils'
import type { ProjectFilters, ProjectPagination, ProjectTranslate } from './types'

interface ProjectsCardViewProps {
  t: ProjectTranslate
  projects: Project[]
  filters: ProjectFilters
  pagination: ProjectPagination | null
  loading: boolean
  onOpenProject: (projectId: number) => void
  onEditProject: (project: Project) => void
  onSearchClear: () => void
  onCreate: () => void
  onPrevPage: () => void
  onNextPage: () => void
}

/** 项目名首字母头像：项目色 15% 底 + 项目色字符 */
function ProjectAvatar({ project }: { project: Project }) {
  const letter = (project.name || '?').trim().charAt(0).toUpperCase()
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 6,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 15,
        color: project.color || '#00b96b',
        background: `${project.color || '#00b96b'}26`,
      }}
    >
      {letter}
    </div>
  )
}

export const ProjectsCardView = ({
  t,
  projects,
  filters,
  pagination,
  loading,
  onOpenProject,
  onEditProject,
  onSearchClear,
  onCreate,
  onPrevPage,
  onNextPage,
}: ProjectsCardViewProps) => {
  // 组织名映射：列表接口只带 organization_id，一次拉组织列表做 id→name
  const [orgMap, setOrgMap] = useState<Map<number, string>>(new Map())
  useEffect(() => {
    let cancelled = false
    organizationsApi
      .getOrganizations({ page: 1, per_page: 200 })
      .then((resp) => {
        if (cancelled) return
        const items = (resp as { items?: Organization[] }).items ?? []
        setOrgMap(new Map(items.map((org) => [org.id, org.name])))
      })
      .catch(() => {
        // 组织名仅用于卡片展示，失败时隐藏该 chip 即可
      })
    return () => {
      cancelled = true
    }
  }, [])

  const statsOf = (project: Project) => {
    const s = project.stats
    return {
      total: s?.total_tasks ?? project.total_tasks ?? 0,
      inProgress: s?.in_progress_tasks ?? 0,
      completed: s?.done_tasks ?? project.completed_tasks ?? 0,
    }
  }

  const metaStyle = { fontSize: 11, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 } as const

  const cards = useMemo(
    () =>
      projects.map((project) => {
        const stats = statsOf(project)
        const orgName = project.organization_id ? orgMap.get(project.organization_id) : undefined
        return (
          <Col key={project.id} xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card
              className="project-card"
              style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease' }}
              styles={{ body: { padding: '16px 16px 12px', height: '100%' } }}
              hoverable
              onClick={() => onOpenProject(project.id)}
            >
              {/* 顶部项目色条 */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${project.color || '#00b96b'}, ${project.color || '#00b96b'}55)`,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 172 }}>
                {/* 头部：头像 + 名称 + 状态 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ProjectAvatar project={project} />
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: '#262626',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      minWidth: 0,
                    }}
                    title={project.name}
                  >
                    {project.name}
                  </div>
                  <Tag
                    color={project.status === 'active' ? 'green' : 'orange'}
                    style={{ fontSize: 10, padding: '1px 6px', lineHeight: '16px', marginInlineEnd: 0, borderRadius: 4, fontWeight: 500 }}
                  >
                    {project.status === 'active' ? t('status.active') : t('status.archived')}
                  </Tag>
                </div>

                {/* 描述 */}
                <div
                  style={{
                    fontSize: 12.5,
                    color: '#595959',
                    lineHeight: 1.55,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    minHeight: 38,
                  }}
                  title={project.description || undefined}
                >
                  {project.description || t('empty.noDescription')}
                </div>

                {/* 三格统计 */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { label: t('stats.total'), value: stats.total, color: '#00b96b' },
                    { label: t('stats.inProgress'), value: stats.inProgress, color: '#1890ff' },
                    { label: t('stats.completed'), value: stats.completed, color: '#52c41a' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '6px 4px',
                        background: '#fafafa',
                        borderRadius: 6,
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 600, color: item.color, lineHeight: 1.2 }}>
                        {item.value}
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                {/* 元信息：组织 / GitHub / 最后活动 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {orgName && (
                    <Tooltip title={t('card.orgTooltip')}>
                      <span style={{ ...metaStyle, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <TeamOutlined />
                        {orgName}
                      </span>
                    </Tooltip>
                  )}
                  {project.github_url && (
                    <Tooltip title={project.github_url}>
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        style={{ ...metaStyle, color: '#8c8c8c' }}
                      >
                        <GithubOutlined /> GitHub
                      </a>
                    </Tooltip>
                  )}
                  <span style={{ ...metaStyle, marginLeft: 'auto' }}>
                    <ClockCircleOutlined />
                    {project.last_activity_at ? (
                      <Tooltip title={formatFullDateTime(project.last_activity_at)}>
                        <span style={{ cursor: 'help' }}>{formatRelativeTimeI18n(project.last_activity_at, t)}</span>
                      </Tooltip>
                    ) : (
                      t('empty.noActivity')
                    )}
                  </span>
                </div>

                {/* 操作行 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 8,
                    borderTop: '1px solid #f5f5f5',
                  }}
                >
                  <span style={{ fontSize: 11, color: '#bfbfbf' }}>#{project.id}</span>
                  <div onClick={(event) => event.stopPropagation()}>
                    <Space size={0}>
                      <LinkButton
                        to={`/todo-for-ai/pages/projects/${project.id}?tab=overview`}
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        style={{ fontSize: 12, height: 24, color: '#595959', borderRadius: 4 }}
                        title={t('buttons.view')}
                      >
                        {t('buttons.view')}
                      </LinkButton>
                      <LinkButton
                        to={`/todo-for-ai/pages/projects/${project.id}?tab=tasks`}
                        type="text"
                        size="small"
                        icon={<CheckSquareOutlined />}
                        style={{ fontSize: 12, height: 24, color: '#595959', borderRadius: 4 }}
                        title={t('buttons.tasks')}
                      >
                        {t('buttons.tasks')}
                      </LinkButton>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        style={{ fontSize: 12, height: 24, color: '#595959', borderRadius: 4 }}
                        onClick={() => onEditProject(project)}
                        title={t('buttons.edit')}
                      />
                    </Space>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        )
      }),
    [projects, orgMap, t, onOpenProject, onEditProject]
  )

  return (
    <div>
      {projects.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              filters.search ? (
                <span>
                  {t('empty.noSearchResults', { keyword: filters.search })}
                  <br />
                  <Button
                    type="link"
                    size="small"
                    onClick={onSearchClear}
                    style={{ padding: 0, marginTop: '8px' }}
                  >
                    {t('buttons.clearSearch')}
                  </Button>
                </span>
              ) : (
                <span>
                  {t('empty.noData')}
                  <br />
                  <Button type="link" size="small" onClick={onCreate} style={{ padding: 0, marginTop: '8px' }}>
                    {t('buttons.createFirst')}
                  </Button>
                </span>
              )
            }
          />
        </div>
      ) : (
        <Row gutter={[16, 16]}>{cards}</Row>
      )}

      {projects.length > 0 && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block' }}>
            <Space direction="vertical" size="small">
              <div style={{ fontSize: '12px', color: '#666' }}>
                {t('pagination.cardTotal', {
                  start: ((pagination?.page || 1) - 1) * (pagination?.per_page || 100) + 1,
                  end: Math.min((pagination?.page || 1) * (pagination?.per_page || 100), pagination?.total || 0),
                  total: pagination?.total || 0,
                })}
              </div>
              <Space>
                <Button size="small" disabled={!pagination?.has_prev} onClick={onPrevPage}>
                  {t('buttons.prev')}
                </Button>
                <span style={{ fontSize: '12px' }}>
                  {t('pagination.pageInfo', { current: pagination?.page || 1, total: pagination?.pages || 1 })}
                </span>
                <Button size="small" disabled={!pagination?.has_next} onClick={onNextPage}>
                  {t('buttons.next')}
                </Button>
              </Space>
            </Space>
          </div>
        </div>
      )}
    </div>
  )
}
