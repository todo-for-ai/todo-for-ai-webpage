import { Button, Popconfirm, Space, Tag } from 'antd'
import {
  CheckSquareOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Project } from '../../api/projects'
import { LinkButton } from '../../components/SmartLink'
import type { ProjectActionHandlers, ProjectTranslate } from './types'

interface CreateProjectTableColumnsOptions extends ProjectActionHandlers {
  t: ProjectTranslate
  locale: string
}

export const createProjectTableColumns = ({
  t,
  locale,
  onEdit,
  onDelete,
  onArchive,
}: CreateProjectTableColumnsOptions): ColumnsType<Project> => {
  return [
    {
      title: t('table.columns.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text: string, record: Project) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: record.color,
                flexShrink: 0,
              }}
            />
            <LinkButton
              to={`/todo-for-ai/pages/projects/${record.id}`}
              type="link"
              style={{ padding: 0, fontWeight: 500, height: 'auto' }}
            >
              {text}
            </LinkButton>
          </div>
          {record.description && (
            <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('table.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: t('status.active') },
          archived: { color: 'orange', text: t('status.archived') },
          deleted: { color: 'red', text: t('status.deleted') },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: t('table.columns.stats'),
      key: 'stats',
      width: 140,
      render: (_: unknown, record: Project) => {
        if (record.total_tasks && record.total_tasks > 0) {
          return (
            <div style={{ fontSize: '12px' }}>
              <div>
                {t('stats.total')}: {record.total_tasks}
              </div>
              <div style={{ color: '#52c41a' }}>
                {t('stats.completed')}: {record.completed_tasks}
              </div>
              <div style={{ color: '#fa8c16', fontWeight: 500 }}>
                {t('stats.pending')}: {record.pending_tasks}
              </div>
            </div>
          )
        }
        return '-'
      },
    },
    {
      title: t('table.columns.lastActivity'),
      dataIndex: 'last_activity_at',
      key: 'last_activity_at',
      width: 160,
      sorter: true,
      render: (date: string) => {
        if (!date) return '-'
        const dateObj = new Date(date)
        return (
          <div style={{ fontSize: '12px' }}>
            <div>{dateObj.toLocaleDateString(locale)}</div>
            <div style={{ color: '#999' }}>
              {dateObj.toLocaleTimeString(locale, { hour12: false })}
            </div>
          </div>
        )
      },
    },
    {
      title: t('table.columns.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      sorter: true,
      render: (date: string) => {
        const dateObj = new Date(date)
        return (
          <div style={{ fontSize: '12px' }}>
            <div>{dateObj.toLocaleDateString(locale)}</div>
            <div style={{ color: '#999' }}>
              {dateObj.toLocaleTimeString(locale, { hour12: false })}
            </div>
          </div>
        )
      },
    },
    {
      title: t('table.columns.actions'),
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: unknown, record: Project) => (
        <Space size="small">
          <LinkButton
            to={`/todo-for-ai/pages/projects/${record.id}`}
            type="text"
            icon={<EyeOutlined />}
            size="small"
          >
            {t('buttons.view')}
          </LinkButton>
          <LinkButton
            to={`/todo-for-ai/pages/projects/${record.id}?tab=tasks`}
            type="text"
            icon={<CheckSquareOutlined />}
            size="small"
          >
            {t('buttons.tasks')}
          </LinkButton>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => onEdit(record)}>
            {t('buttons.edit')}
          </Button>
          {record.status === 'active' && (
            <Popconfirm
              title={t('confirm.archive')}
              onConfirm={() => onArchive(record)}
              okText={t('confirm.ok')}
              cancelText={t('confirm.cancel')}
            >
              <Button type="text" size="small">
                {t('buttons.archive')}
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title={t('confirm.delete')}
            description={t('confirm.deleteDescription')}
            onConfirm={() => onDelete(record)}
            okText={t('confirm.ok')}
            cancelText={t('confirm.cancel')}
          >
            <Button type="text" icon={<DeleteOutlined />} size="small" danger>
              {t('buttons.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]
}
