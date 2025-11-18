import React from 'react'
import { Card, Row, Col, Select, Search, Button, Space } from 'antd'
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTaskFilters } from '../../hooks/useTaskFilters'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Option } = Select

interface TaskFiltersProps {
  onRefresh: () => Promise<void>
  loading?: boolean
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ onRefresh, loading }) => {
  const { tp } = usePageTranslation('projectDetail')
  const { taskFilters, handleFilterChange } = useTaskFilters()

  return (
    <Card style={{ marginBottom: 6, backgroundColor: '#fafafa' }} bodyStyle={{ padding: '6px 12px' }}>
      <Row gutter={6} align="middle" style={{ minHeight: '28px' }}>
        <Col span={3}>
          <Space size={4}>
            <FilterOutlined style={{ fontSize: '12px' }} />
            <span style={{ fontSize: '12px' }}>{tp('tasks.filters.label')}</span>
          </Space>
        </Col>
        <Col span={4}>
          <Select
            mode="multiple"
            size="small"
            placeholder={tp('tasks.filters.status.placeholder')}
            value={taskFilters.status}
            onChange={(value) => handleFilterChange('status', value)}
            style={{ width: '100%', minHeight: '22px' }}
            allowClear
            maxTagCount="responsive"
            showSearch={false}
          >
            <Option value="todo">{tp('tasks.filters.status.todo')}</Option>
            <Option value="in_progress">{tp('tasks.filters.status.inProgress')}</Option>
            <Option value="review">{tp('tasks.filters.status.review')}</Option>
            <Option value="done">{tp('tasks.filters.status.done')}</Option>
            <Option value="cancelled">{tp('tasks.filters.status.cancelled')}</Option>
          </Select>
        </Col>
        <Col span={21}>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined style={{ fontSize: '12px' }} />}
            onClick={onRefresh}
            loading={loading}
            style={{ fontSize: '11px', height: '22px', padding: '0 4px' }}
          >
            {tp('buttons.refreshTasks')}
          </Button>
        </Col>
      </Row>
    </Card>
  )
}
