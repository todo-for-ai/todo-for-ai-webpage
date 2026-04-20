import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, Col, Empty, Progress, Row, Spin, Statistic, Table, Tag, Tooltip, message } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RobotOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { apiClient } from '../api'
import { getErrorMessage } from '../utils/errorUtils'

interface TaskAttempt {
  attempt_id: string
  task_id: number
  task_title: string
  agent_name: string
  state: string
  progress: number
  duration_seconds: number
}

interface MonitorData {
  active_tasks: number
  completed_today: number
  failed_today: number
  avg_duration_seconds: number
  recent_attempts: TaskAttempt[]
}

interface AgentTaskMonitorProps {
  workspaceId: number
}

const STATE_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  CREATED: { color: 'blue', label: '排队中', icon: <ClockCircleOutlined /> },
  ACTIVE: { color: 'orange', label: '执行中', icon: <SyncOutlined spin /> },
  COMMITTED: { color: 'green', label: '已完成', icon: <CheckCircleOutlined /> },
  ABORTED: { color: 'red', label: '已中止', icon: <CloseCircleOutlined /> },
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  if (m < 60) return `${m}m ${s}s`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h}h ${rm}m`
}

export function AgentTaskMonitor({ workspaceId }: AgentTaskMonitorProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MonitorData | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const result = await apiClient.get<MonitorData>(
        `/workspaces/${workspaceId}/agents/health/summary`
      )
      setData(result)
    } catch (error) {
      message.error(getErrorMessage(error, '获取任务监控数据失败'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      void fetchData()
    }, 15_000)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [fetchData])

  const columns = [
    {
      title: 'Agent',
      dataIndex: 'agent_name',
      key: 'agent_name',
      width: 140,
      render: (name: string) => (
        <span>
          <RobotOutlined style={{ marginRight: 6 }} />
          {name}
        </span>
      ),
    },
    {
      title: '任务',
      dataIndex: 'task_title',
      key: 'task_title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      width: 110,
      render: (state: string) => {
        const config = STATE_CONFIG[state] || { color: 'default', label: state, icon: null }
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        )
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 160,
      render: (progress: number, record: TaskAttempt) => {
        const config = STATE_CONFIG[record.state]
        const status: 'success' | 'exception' | 'normal' | 'active' =
          record.state === 'COMMITTED' ? 'success'
          : record.state === 'ABORTED' ? 'exception'
          : record.state === 'ACTIVE' ? 'active'
          : 'normal'
        return (
          <Tooltip title={`${progress}%`}>
            <Progress
              percent={progress}
              size='small'
              status={status}
              strokeColor={config?.color === 'blue' ? undefined : config?.color}
            />
          </Tooltip>
        )
      },
    },
    {
      title: '耗时',
      dataIndex: 'duration_seconds',
      key: 'duration_seconds',
      width: 100,
      render: (seconds: number) => (
        <span>{seconds > 0 ? formatDuration(seconds) : '-'}</span>
      ),
    },
  ]

  if (loading && !data) {
    return (
      <Card>
        <Spin />
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <Empty description='暂无任务监控数据' />
      </Card>
    )
  }

  return (
    <Card title='Agent 任务监控'>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title='活跃任务'
            value={data.active_tasks}
            prefix={<SyncOutlined spin={data.active_tasks > 0} />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title='今日完成'
            value={data.completed_today}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title='今日失败'
            value={data.failed_today}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title='平均耗时'
            value={data.avg_duration_seconds > 0 ? formatDuration(data.avg_duration_seconds) : '-'}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
      </Row>

      <Table
        rowKey='attempt_id'
        columns={columns}
        dataSource={data.recent_attempts || []}
        loading={loading}
        pagination={false}
        size='small'
        locale={{ emptyText: '暂无近期任务记录' }}
      />
    </Card>
  )
}

export default AgentTaskMonitor
