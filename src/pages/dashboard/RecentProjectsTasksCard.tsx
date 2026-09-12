/**
 * Dashboard「最近项目和任务」面板（从 Dashboard.tsx 原样抽出）。
 */

import { useState } from 'react'
import { Card, Col, List, Row, Space, Table, Tag, Typography } from 'antd'
import { CalendarOutlined, CheckSquareOutlined, ProjectOutlined, FileTextOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Text } = Typography

interface Props {
  formatDate: any
  getStatusColor: any
  getStatusText: any
  loading: any
  stats: any
  // recent_projects/recent_tasks 内元素为 unknown → 渲染处用 any 断言由调用方保证
}

export default function RecentProjectsTasksCard(props: Props) {
  const { formatDate,
    getStatusColor,
    getStatusText,
    loading,
    stats } = props
  const { tp, tc } = usePageTranslation('dashboard')

  return (
    <>
      {/* 最近项目和任务 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={tp('sections.recentProjects')} variant="borderless" loading={loading}>
            {stats?.recent_projects && stats.recent_projects.length > 0 ? (
              <List
                dataSource={(stats.recent_projects as any[]) || []}
                renderItem={(project) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<ProjectOutlined style={{ color: '#1890ff' }} />}
                      title={project.name}
                      description={
                        <div>
                          <div>{project.description || tp('misc.noDescription')}</div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            <CalendarOutlined style={{ marginRight: '4px' }} />
                            {formatDate(project.updated_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <ProjectOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>{tc('empty.noProjects')}</div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={tp('sections.recentTasks')} variant="borderless" loading={loading}>
            {stats?.recent_tasks && stats.recent_tasks.length > 0 ? (
              <List
                dataSource={(stats.recent_tasks as any[]) || []}
                renderItem={(task) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<CheckSquareOutlined style={{ color: '#52c41a' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{task.title}</span>
                          <Tag color={getStatusColor(task.status)}>
                            {getStatusText(task.status)}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ color: '#666' }}>
                            {task.project?.name || tp('misc.unknownProject')}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            <CalendarOutlined style={{ marginRight: '4px' }} />
                            {formatDate(task.updated_at)}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <CheckSquareOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>{tc('empty.noTasks')}</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </>
  )
}
