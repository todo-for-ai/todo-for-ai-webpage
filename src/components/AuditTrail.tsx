import { useCallback, useEffect, useState } from 'react'
import {
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CloseCircleOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { auditEventsApi } from '../api/auditEvents.js'
import type { AuditEvent, AuditStats } from '../api/auditEvents.js'
import { getErrorMessage } from '../utils/errorUtils.js'

const { RangePicker } = DatePicker
const { Text } = Typography

const LEVEL_COLORS: Record<string, string> = {
  info: 'blue',
  warning: 'orange',
  error: 'red',
  critical: '#cf1322',
}

interface AuditTrailProps {
  workspaceId: number
}

const AuditTrail: React.FC<AuditTrailProps> = ({ workspaceId }) => {
  const [items, setItems] = useState<AuditEvent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    by_level: {},
    by_actor_type: {},
  })

  // Filters
  const [filterEventType, setFilterEventType] = useState<string | undefined>()
  const [filterActorType, setFilterActorType] = useState<string | undefined>()
  const [filterLevel, setFilterLevel] = useState<string | undefined>()
  const [filterDateRange, setFilterDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null)

  const loadStats = useCallback(async () => {
    try {
      const data = await auditEventsApi.stats(workspaceId)
      setStats(data)
    } catch (error) {
      console.error('Failed to load audit stats:', error)
    }
  }, [workspaceId])

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      }
      if (filterEventType) params.event_type = filterEventType
      if (filterActorType) params.actor_type = filterActorType
      if (filterLevel) params.level = filterLevel
      if (filterDateRange && filterDateRange[0]) {
        params.start_date = filterDateRange[0].startOf('day').toISOString()
      }
      if (filterDateRange && filterDateRange[1]) {
        params.end_date = filterDateRange[1].endOf('day').toISOString()
      }
      const data = await auditEventsApi.list(workspaceId, params)
      setItems(data.items || [])
      setTotal(data.total)
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to load audit events'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, page, pageSize, filterEventType, filterActorType, filterLevel, filterDateRange])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const formatDuration = (ms: number | undefined): string => {
    if (ms === undefined || ms === null) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const columns: ColumnsType<AuditEvent> = [
    {
      title: '时间',
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      width: 180,
      render: (val: string) => new Date(val).toLocaleString(),
    },
    {
      title: '事件类型',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 160,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '执行者',
      key: 'actor',
      width: 180,
      render: (_: unknown, record: AuditEvent) => (
        <Space size={4}>
          <Tag color={record.actor_type === 'agent' ? 'purple' : 'blue'}>
            {record.actor_type}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.actor_agent_id ? `Agent #${record.actor_agent_id}` : record.actor_id}
          </Text>
        </Space>
      ),
    },
    {
      title: '目标',
      key: 'target',
      width: 180,
      render: (_: unknown, record: AuditEvent) => (
        <Space size={4}>
          <Tag>{record.target_type}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.target_agent_id ? `Agent #${record.target_agent_id}` : record.target_id}
          </Text>
        </Space>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Tag color={LEVEL_COLORS[level.toLowerCase()] || 'default'}>{level}</Tag>
      ),
    },
    {
      title: '风险',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 80,
      render: (score: number) => (
        <Text
          strong
          type={
            score >= 70 ? 'danger' : score >= 40 ? 'warning' : undefined
          }
        >
          {score}
        </Text>
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 90,
      render: (ms: number | undefined) => formatDuration(ms),
    },
  ]

  return (
    <Card title={<Space><SafetyOutlined />审计日志</Space>}>
      {/* Stats row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="总事件" value={stats.total} prefix={<SafetyOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic
            title="Info"
            value={stats.by_level?.info || 0}
            prefix={<InfoCircleOutlined />}
            valueStyle={{ color: '#1677ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Warning"
            value={stats.by_level?.warning || 0}
            prefix={<WarningOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Error"
            value={stats.by_level?.error || 0}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
      </Row>

      {/* Filter bar */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="事件类型"
          style={{ width: 160 }}
          value={filterEventType}
          onChange={(val) => {
            setFilterEventType(val)
            setPage(1)
          }}
          options={[
            { label: 'task_created', value: 'task_created' },
            { label: 'task_completed', value: 'task_completed' },
            { label: 'agent_action', value: 'agent_action' },
            { label: 'approval_granted', value: 'approval_granted' },
            { label: 'approval_rejected', value: 'approval_rejected' },
            { label: 'data_access', value: 'data_access' },
          ]}
        />
        <Select
          allowClear
          placeholder="执行者类型"
          style={{ width: 140 }}
          value={filterActorType}
          onChange={(val) => {
            setFilterActorType(val)
            setPage(1)
          }}
          options={[
            { label: 'agent', value: 'agent' },
            { label: 'user', value: 'user' },
            { label: 'system', value: 'system' },
          ]}
        />
        <Select
          allowClear
          placeholder="级别"
          style={{ width: 120 }}
          value={filterLevel}
          onChange={(val) => {
            setFilterLevel(val)
            setPage(1)
          }}
          options={[
            { label: 'info', value: 'info' },
            { label: 'warning', value: 'warning' },
            { label: 'error', value: 'error' },
            { label: 'critical', value: 'critical' },
          ]}
        />
        <RangePicker
          value={filterDateRange}
          onChange={(dates) => {
            setFilterDateRange(dates)
            setPage(1)
          }}
        />
      </Space>

      {/* Table */}
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          size="small"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={(paginationInfo) => {
            setPage(paginationInfo.current || 1)
            setPageSize(paginationInfo.pageSize || 20)
          }}
          expandable={{
            rowExpandable: (record) => !!record.payload && Object.keys(record.payload).length > 0,
            expandedRowRender: (record) => (
              <pre style={{ fontSize: 12, maxHeight: 300, overflow: 'auto' }}>
                {JSON.stringify(record.payload, null, 2)}
              </pre>
            ),
          }}
        />
      </Spin>
    </Card>
  )
}

export default AuditTrail
