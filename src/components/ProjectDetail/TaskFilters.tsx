import React, { useState, useEffect, useRef } from 'react'
import { Card, Row, Col, Select, Button, Space, Checkbox, InputNumber } from 'antd'
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTaskFilters } from '../../hooks/useTaskFilters'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

const { Option } = Select

interface TaskFiltersProps {
  onRefresh: () => Promise<void>
  loading?: boolean
}

const AUTO_REFRESH_ENABLED_KEY = 'taskList.autoRefresh.enabled'
const AUTO_REFRESH_INTERVAL_KEY = 'taskList.autoRefresh.interval'

export const TaskFilters: React.FC<TaskFiltersProps> = ({ onRefresh, loading }) => {
  const { tp } = usePageTranslation('projectDetail')
  const { taskFilters, handleFilterChange } = useTaskFilters()
  
  // 从LocalStorage读取自动刷新设置
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(AUTO_REFRESH_ENABLED_KEY)
    return saved === 'true'
  })
  
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    const saved = localStorage.getItem(AUTO_REFRESH_INTERVAL_KEY)
    return saved ? parseInt(saved, 10) : 5
  })
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 自动刷新逻辑
  useEffect(() => {
    if (autoRefreshEnabled && refreshInterval > 0) {
      timerRef.current = setInterval(() => {
        onRefresh()
      }, refreshInterval * 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [autoRefreshEnabled, refreshInterval, onRefresh])

  // 保存自动刷新开关到LocalStorage
  const handleAutoRefreshChange = (checked: boolean) => {
    setAutoRefreshEnabled(checked)
    localStorage.setItem(AUTO_REFRESH_ENABLED_KEY, String(checked))
  }

  // 保存刷新间隔到LocalStorage
  const handleIntervalChange = (value: number | null) => {
    const interval = value || 5
    setRefreshInterval(interval)
    localStorage.setItem(AUTO_REFRESH_INTERVAL_KEY, String(interval))
  }

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
        <Col span={17}>
          <Space size={8}>
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
            <Checkbox
              checked={autoRefreshEnabled}
              onChange={(e) => handleAutoRefreshChange(e.target.checked)}
              style={{ fontSize: '11px' }}
            >
              {tp('tasks.autoRefresh.enable')}
            </Checkbox>
            {autoRefreshEnabled && (
              <Space size={4}>
                <span style={{ fontSize: '11px' }}>{tp('tasks.autoRefresh.interval')}:</span>
                <InputNumber
                  size="small"
                  min={1}
                  max={300}
                  value={refreshInterval}
                  onChange={handleIntervalChange}
                  style={{ width: '60px' }}
                  formatter={value => `${value}`}
                  parser={value => parseInt((value || '').replace(/[^\d]/g, '') || '5', 10)}
                />
              </Space>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  )
}
