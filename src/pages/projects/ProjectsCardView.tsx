import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Empty, Row, Space, Tag, Tooltip } from 'antd'
import {
  CheckSquareOutlined,
  ClockCircleOutlined,
  EditOutlined,
  EyeOutlined,
  GithubOutlined,
  SafetyOutlined,
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

const META_ICON_STYLE = { marginRight: 3 }

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

  const cards = useMemo(
    () =>
      projects.map((project) => {
        const s = project.stats
        const statCells = [
          { key: 'total', label: t('stats.total'), value: s?.total_tasks ?? project.total_tasks ?? 0, color: '#262626' },
          { key: 'pending', label: t('stats.pending'), value: s?.todo_tasks ?? project.pending_tasks ?? 0, color: '#fa8c16' },
          { key: 'inProgress', label: t('stats.inProgress'), value: s?.in_progress_tasks ?? 0, color: '#1890ff' },
          { key: 'completed', label: t('stats.completed'), value: s?.done_tasks ?? project.completed_tasks ?? 0, color: '#52c41a' },
        ]
        const orgName = project.organization_id ? orgMap.get(project.organization_id) : undefined
        const isActive = project.status === 'active'

        return (
          <Col key={project.id} xs={24} sm={12} md={8} lg={6} xl={6}>
            <Card
              className="project-card"
              style={{
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderLeft: `3px solid ${project.color || '#00b96b'}`,
              }}
              styles={{ body: { padding: '14px 16px 10px', height: '100%' } }}
              hoverable
              onClick={() => onOpenProject(project.id)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minHeight: 176 }}>
                {/* 头部：色点 + 名称 + 状态（悬停解释状态含义） */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: project.color || '#00b96b',
                      flexShrink: 0,
                    }}
                  />
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
                  <Tooltip title={isActive ? t('card.statusTipActive') : t('card.statusTipArchived')}>
                    <Tag
                      color={isActive ? 'green' : 'orange'}
                      style={{ fontSize: 10, padding: '1px 6px', lineHeight: '16px', marginInlineEnd: 0, borderRadius: 4, fontWeight: 500 }}
                    >
                      {isActive ? t('status.active') : t('status.archived')}
                    </Tag>
                  </Tooltip>
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

                {/* 四格统计：悬停解释每个数字的统计口径 */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {statCells.map((cell) => (
                    <Tooltip
                      key={cell.key}
                      title={t(`card.tipStat.${cell.key}`)}
                      overlayStyle={{ maxWidth: 320 }}
                    >
                      <div
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          padding: '5px 4px',
                          background: '#fafafa',
                          borderRadius: 6,
                          border: '1px solid #f0f0f0',
                          cursor: 'help',
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 600, color: cell.color, lineHeight: 1.2 }}>
                          {cell.value}
                        </div>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{cell.label}</div>
                      </div>
                    </Tooltip>
                  ))}
                </div>

                {/* 元信息：组织 / GitHub / 上下文规则 / 最后活动（全部悬停有解释） */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {orgName && (
                    <Tooltip title={t('card.tipOrg', { name: orgName })} overlayStyle={{ maxWidth: 320 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: '#595959',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          minWidth: 0,
                          maxWidth: 120,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'help',
                        }}
                      >
                        <TeamOutlined style={META_ICON_STYLE} />
                        {orgName}
                      </span>
                    </Tooltip>
                  )}
                  {project.github_url && (
                    <Tooltip title={t('card.tipGithub', { url: project.github_url })} overlayStyle={{ maxWidth: 320 }}>
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        style={{ fontSize: 12, color: '#595959', display: 'flex', alignItems: 'center', gap: 3 }}
                      >
                        <GithubOutlined style={META_ICON_STYLE} />
                        GitHub
                      </a>
                    </Tooltip>
                  )}
                  {typeof s?.context_rules_count === 'number' && (
                    <Tooltip title={t('card.tipRules')} overlayStyle={{ maxWidth: 320 }}>
                      <span style={{ fontSize: 12, color: '#595959', display: 'flex', alignItems: 'center', gap: 3, cursor: 'help' }}>
                        <SafetyOutlined style={META_ICON_STYLE} />
                        {s.context_rules_count}
                      </span>
                    </Tooltip>
                  )}
                  <span style={{ fontSize: 12, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
                    <ClockCircleOutlined />
                    {project.last_activity_at ? (
                      <Tooltip title={t('card.tipActivity', { time: formatFullDateTime(project.last_activity_at) })} overlayStyle={{ maxWidth: 320 }}>
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
                    paddingTop: 7,
                    borderTop: '1px solid #f5f5f5',
                  }}
                >
                  <Tooltip title={t('card.tipId')}>
                    <span style={{ fontSize: 11, color: '#bfbfbf', cursor: 'help' }}>#{project.id}</span>
                  </Tooltip>
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
