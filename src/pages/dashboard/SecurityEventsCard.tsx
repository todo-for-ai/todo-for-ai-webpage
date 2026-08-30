/**
 * 安全审计事件聚合卡片组件
 *
 * 展示安全事件的聚合视图，支持按级别、类型、时间范围筛选和搜索。
 * 包含事件趋势图和事件列表。
 */
import { Card, Spin, Space, Segmented, Input, Select, DatePicker, Dropdown, Button, List, Empty } from 'antd'
import { SafetyOutlined, DownloadOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import SecurityTrendSection from '../../components/SecurityTrendSection'
import SecurityEventListItem from '../../components/SecurityEventListItem'
import type { SecurityDailyTrend, SecurityByAgent } from '../../api/agents'

const { RangePicker } = DatePicker

interface SecurityEventsCardProps {
  securityEvents: any[]
  securityLoading: boolean
  securityTrend: SecurityDailyTrend | null
  securityByAgent: SecurityByAgent | null
  securityFilter: string
  securitySeverity: string
  securitySearch: string
  exporting: boolean
  onFilterChange: (filter: string | undefined) => void
  onSeverityChange: (severity: string) => void
  onSearch: (search: string) => void
  onDateRangeChange: (since: string, until: string) => void
  onExport: (format: 'csv' | 'json') => void
  onRefresh: () => void
  onShowDetail: (event: any) => void
}

const SecurityEventsCard: FC<SecurityEventsCardProps> = ({
  securityEvents,
  securityLoading,
  securityTrend,
  securityByAgent,
  securitySeverity,
  exporting,
  onSeverityChange,
  onFilterChange,
  onSearch,
  onDateRangeChange,
  onExport,
  onRefresh,
  onShowDetail,
}) => {
  const navigate = useNavigate()

  return (
    <Card
      title={<Space><SafetyOutlined /> 安全审计事件聚合</Space>}
      style={{ marginBottom: 24 }}
      extra={
        <Space wrap size={[8, 4]}>
          <Segmented
            size="small"
            value={securitySeverity || 'all'}
            onChange={(v) => {
              const val = v === 'all' ? '' : String(v)
              onSeverityChange(val)
            }}
            options={[
              { value: 'all', label: '全部' },
              { value: 'CRITICAL', label: '高危' },
              { value: 'WARNING', label: '警告' },
              { value: 'INFO', label: '普通' },
            ]}
          />
          <Input.Search
            size="small"
            allowClear
            placeholder="搜索标题/详情"
            style={{ width: 180 }}
            onSearch={(v) => onSearch(v || '')}
            onChange={(e) => { if (!e.target.value) onSearch('') }}
          />
          <Select
            size="small"
            style={{ width: 130 }}
            allowClear
            placeholder="事件类型"
            onChange={(v) => onFilterChange(v || undefined)}
            options={[
              { value: 'sandbox_violation', label: '沙盒违规' },
              { value: 'conflict', label: '协作冲突' },
              { value: 'audit', label: '审计日志' },
            ]}
          />
          <RangePicker
            size="small"
            showTime
            style={{ width: 340 }}
            onChange={(range) => {
              onDateRangeChange(range?.[0]?.toISOString() || '', range?.[1]?.toISOString() || '')
            }}
          />
          <Dropdown
            menu={{
              items: [
                { key: 'csv', label: '导出为 CSV' },
                { key: 'json', label: '导出为 JSON' },
              ],
              onClick: ({ key }) => onExport(key as 'csv' | 'json'),
            }}
          >
            <Button size="small" icon={<DownloadOutlined />} loading={exporting}>
              导出 <DownOutlined />
            </Button>
          </Dropdown>
          <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} loading={securityLoading} />
        </Space>
      }
    >
      <Spin spinning={securityLoading}>
        <SecurityTrendSection trend={securityTrend} byAgent={securityByAgent} />
        {securityEvents.length > 0 ? (
          <List
            size="small"
            dataSource={securityEvents}
            renderItem={(e: any) => (
              <SecurityEventListItem
                event={e}
                onRunClick={(runId) => navigate(`/todo-for-ai/pages/workflows?run_id=${runId}`)}
                onShowDetail={(ev) => onShowDetail(ev)}
              />
            )}
          />
        ) : (
          <Empty description="暂无安全事件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </Card>
  )
}

export default SecurityEventsCard