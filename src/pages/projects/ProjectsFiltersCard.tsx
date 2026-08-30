import { FilterOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Select, Space } from 'antd'
import type { ProjectFilters, ProjectTranslate } from './types'

interface ProjectsFiltersCardProps {
  t: ProjectTranslate
  filters: ProjectFilters
  onFilterChange: (key: keyof ProjectFilters, value: string) => void
  onReset: () => void
}

export const ProjectsFiltersCard = ({
  t,
  filters,
  onFilterChange,
  onReset,
}: ProjectsFiltersCardProps) => {
  return (
    <Card style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
      <Row gutter={16} align="middle">
        <Col span={3}>
          <Space>
            <FilterOutlined />
            <span style={{ fontWeight: 500 }}>{t('filters.title')}</span>
          </Space>
        </Col>
        <Col span={4}>
          <div>
            <div style={{ marginBottom: 4, fontSize: '12px', color: '#666', fontWeight: 500 }}>
              {t('filters.projectStatus')}
            </div>
            <Select
              placeholder={t('filters.projectStatus')}
              value={filters.archived}
              onChange={(value) => onFilterChange('archived', value)}
              style={{ width: '100%' }}
            >
              <Select.Option value="">{t('filters.options.allStatus')}</Select.Option>
              <Select.Option value="false">{t('filters.options.activeProjects')}</Select.Option>
              <Select.Option value="true">{t('filters.options.archivedProjects')}</Select.Option>
            </Select>
          </div>
        </Col>
        <Col span={4}>
          <div>
            <div style={{ marginBottom: 4, fontSize: '12px', color: '#666', fontWeight: 500 }}>
              {t('filters.taskSituation')}
            </div>
            <Select
              placeholder={t('filters.taskSituation')}
              value={filters.has_pending_tasks}
              onChange={(value) => onFilterChange('has_pending_tasks', value)}
              style={{ width: '100%' }}
            >
              <Select.Option value="">{t('filters.options.allProjects')}</Select.Option>
              <Select.Option value="true">{t('filters.options.hasPendingTasks')}</Select.Option>
              <Select.Option value="false">{t('filters.options.noPendingTasks')}</Select.Option>
            </Select>
          </div>
        </Col>
        <Col span={4}>
          <div>
            <div style={{ marginBottom: 4, fontSize: '12px', color: '#666', fontWeight: 500 }}>
              {t('filters.activityTime')}
            </div>
            <Select
              placeholder={t('filters.activityTime')}
              value={filters.time_range}
              onChange={(value) => onFilterChange('time_range', value)}
              style={{ width: '100%' }}
            >
              <Select.Option value="">{t('filters.options.allTime')}</Select.Option>
              <Select.Option value="today">{t('filters.options.todayActivity')}</Select.Option>
              <Select.Option value="week">{t('filters.options.recentWeek')}</Select.Option>
              <Select.Option value="month">{t('filters.options.recentMonth')}</Select.Option>
            </Select>
          </div>
        </Col>
        <Col span={4}>
          <div>
            <div style={{ marginBottom: 4, fontSize: '12px', color: '#666', fontWeight: 500 }}>
              {t('filters.sortBy')}
            </div>
            <Select
              placeholder={t('filters.sortBy')}
              value={filters.sort_by}
              onChange={(value) => onFilterChange('sort_by', value)}
              style={{ width: '100%' }}
            >
              <Select.Option value="last_activity_at">{t('filters.options.lastActivityTime')}</Select.Option>
              <Select.Option value="created_at">{t('filters.options.createdTime')}</Select.Option>
              <Select.Option value="updated_at">{t('filters.options.updatedTime')}</Select.Option>
              <Select.Option value="name">{t('filters.options.projectName')}</Select.Option>
              <Select.Option value="total_tasks">{t('filters.options.totalTasks')}</Select.Option>
              <Select.Option value="pending_tasks">{t('filters.options.pendingTasks')}</Select.Option>
              <Select.Option value="completed_tasks">{t('filters.options.completedTasks')}</Select.Option>
            </Select>
          </div>
        </Col>
        <Col span={4}>
          <div>
            <div style={{ marginBottom: 4, fontSize: '12px', color: '#666', fontWeight: 500 }}>
              {t('filters.sortOrder')}
            </div>
            <Select
              placeholder={t('filters.sortOrder')}
              value={filters.sort_order}
              onChange={(value) => onFilterChange('sort_order', value)}
              style={{ width: '100%' }}
            >
              <Select.Option value="desc">{t('filters.options.descOrder')}</Select.Option>
              <Select.Option value="asc">{t('filters.options.ascOrder')}</Select.Option>
            </Select>
          </div>
        </Col>
        <Col span={1}>
          <Button type="link" size="small" onClick={onReset} style={{ fontSize: '12px' }}>
            {t('buttons.reset')}
          </Button>
        </Col>
      </Row>
    </Card>
  )
}
