import { Button, Card, Col, Empty, Row, Space, Tag, Tooltip } from 'antd'
import { CheckSquareOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import type { Project } from '../../api/projects'
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
        <Row gutter={[16, 16]}>
          {projects.map((project) => (
            <Col key={project.id} xs={12} sm={12} md={8} lg={6} xl={6}>
              <Card
                className="project-card"
                style={{
                  height: '140px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                bodyStyle={{
                  padding: '16px',
                  height: '100%',
                  background: '#ffffff',
                }}
                hoverable
                onClick={() => onOpenProject(project.id)}
              >
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #f5f5f5',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: project.color,
                          flexShrink: 0,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      />
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '15px',
                          color: '#262626',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                        title={project.name}
                      >
                        {project.name}
                      </div>
                    </div>
                    <Tag
                      color={project.status === 'active' ? 'green' : 'orange'}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        lineHeight: '16px',
                        marginLeft: '8px',
                        borderRadius: '4px',
                        fontWeight: 500,
                      }}
                    >
                      {project.status === 'active' ? t('status.active') : t('status.archived')}
                    </Tag>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {project.description && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#595959',
                          lineHeight: '1.5',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          marginBottom: '12px',
                          minHeight: '40px',
                        }}
                        title={project.description}
                      >
                        {project.description}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: '12px',
                        marginBottom: '12px',
                        padding: '6px 8px',
                        backgroundColor: '#fafafa',
                        borderRadius: '4px',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      {project.total_tasks && project.total_tasks > 0 ? (
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ color: '#595959' }}>
                            <strong style={{ color: '#1890ff' }}>{project.total_tasks}</strong> {t('stats.total')}
                          </span>
                          <span style={{ color: '#595959' }}>
                            <strong style={{ color: '#52c41a' }}>{project.completed_tasks}</strong> {t('stats.completed')}
                          </span>
                          <span style={{ color: '#595959' }}>
                            <strong style={{ color: '#fa8c16' }}>{project.pending_tasks}</strong> {t('stats.pending')}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#8c8c8c' }}>{t('stats.noTasks')}</span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        borderTop: '1px solid #f5f5f5',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#8c8c8c',
                          fontWeight: 400,
                        }}
                      >
                        {project.last_activity_at ? (
                          <Tooltip title={formatFullDateTime(project.last_activity_at)}>
                            <span style={{ cursor: 'help' }}>
                              {formatRelativeTimeI18n(project.last_activity_at, t)}
                            </span>
                          </Tooltip>
                        ) : (
                          t('empty.noActivity')
                        )}
                      </div>
                      <div onClick={(event) => event.stopPropagation()}>
                        <Space size={2}>
                          <LinkButton
                            to={`/todo-for-ai/pages/projects/${project.id}?tab=overview`}
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            style={{
                              fontSize: '12px',
                              padding: '2px 6px',
                              height: '24px',
                              color: '#595959',
                              borderRadius: '4px',
                            }}
                            title={t('buttons.view')}
                          >
                            {t('buttons.view')}
                          </LinkButton>
                          <LinkButton
                            to={`/todo-for-ai/pages/projects/${project.id}?tab=tasks`}
                            type="text"
                            size="small"
                            icon={<CheckSquareOutlined />}
                            style={{
                              fontSize: '12px',
                              padding: '2px 6px',
                              height: '24px',
                              color: '#595959',
                              borderRadius: '4px',
                            }}
                            title={t('buttons.tasks')}
                          >
                            {t('buttons.tasks')}
                          </LinkButton>
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            style={{
                              fontSize: '12px',
                              padding: '2px 6px',
                              height: '24px',
                              color: '#595959',
                              borderRadius: '4px',
                            }}
                            onClick={() => onEditProject(project)}
                            title={t('buttons.edit')}
                          />
                        </Space>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
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
