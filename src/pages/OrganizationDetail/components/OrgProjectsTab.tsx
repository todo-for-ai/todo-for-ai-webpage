/**
 * 项目标签页组件
 */

import { Empty, Space, Table, Tag } from 'antd'
import { LinkButton } from '../../../components/SmartLink'
import type { Project } from '../../../api/projects'
import { formatDateTime } from '../utils'

interface OrgProjectsTabProps {
  projects: Project[]
  loading: boolean
  tp: (key: string, options?: { defaultValue?: string }) => string
  formatDateTime: (value: string | undefined) => string
}

export const OrgProjectsTab: React.FC<OrgProjectsTabProps> = ({
  projects,
  loading,
  tp,
  formatDateTime,
}) => {
  const columns = [
    {
      title: tp('detail.projects.columns.name'),
      key: 'name',
      render: (_: unknown, record: Project) => (
        <div>
          <LinkButton
            to={`/todo-for-ai/pages/projects/${record.id}`}
            type="link"
            style={{ padding: 0, fontWeight: 600, height: 'auto' }}
          >
            {record.name}
          </LinkButton>
          {record.description && (
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: tp('detail.projects.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {tp(`detail.status.${status}`, { defaultValue: status })}
        </Tag>
      ),
    },
    {
      title: tp('detail.projects.columns.tasks'),
      key: 'tasks',
      width: 120,
      render: (_: unknown, record: Project) => (
        <span>{record.total_tasks ?? record.stats?.total_tasks ?? '-'}</span>
      ),
    },
    {
      title: tp('detail.projects.columns.lastActivity'),
      dataIndex: 'last_activity_at',
      key: 'last_activity_at',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: tp('detail.projects.columns.actions'),
      key: 'actions',
      width: 180,
      render: (_: unknown, record: Project) => (
        <Space size={8}>
          <LinkButton to={`/todo-for-ai/pages/projects/${record.id}`} type="link">
            {tp('detail.projects.actions.view')}
          </LinkButton>
          <LinkButton to={`/todo-for-ai/pages/projects/${record.id}?tab=tasks`} type="link">
            {tp('detail.projects.actions.tasks')}
          </LinkButton>
        </Space>
      ),
    },
  ]

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={projects}
      columns={columns}
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
  )
}
