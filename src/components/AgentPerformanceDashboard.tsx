import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, Row, Col, Select, Spin, Statistic } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { agentPerformanceApi } from '../api/agentPerformance'
import type { AgentPerformance } from '../api/agentPerformance'
import { getErrorMessage } from '../utils/errorUtils'
import { message } from 'antd'

interface AgentPerformanceDashboardProps {
  workspaceId: number
  agentId: number
}

const PERIOD_OPTIONS = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
]

function formatDuration(ms: number | null): string {
  if (ms === null) return '--'
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

const AgentPerformanceDashboard: React.FC<AgentPerformanceDashboardProps> = ({
  workspaceId,
  agentId,
}) => {
  const [performance, setPerformance] = useState<AgentPerformance | null>(null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(30)

  const loadPerformance = useCallback(async () => {
    try {
      setLoading(true)
      const data = await agentPerformanceApi.get(workspaceId, agentId, days)
      setPerformance(data)
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to load agent performance'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, agentId, days])

  useEffect(() => {
    void loadPerformance()
  }, [loadPerformance])

  const maxActivity = useMemo(() => {
    if (!performance?.daily_activity?.length) return 0
    return Math.max(...performance.daily_activity.map((d) => d.count), 1)
  }, [performance?.daily_activity])

  if (loading && !performance) {
    return (
      <Card className="flat-card">
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      </Card>
    )
  }

  if (!performance) {
    return null
  }

  const errorRateColor = performance.error_rate > 10 ? '#ff4d4f' : undefined

  return (
    <Card
      className="flat-card"
      title="Agent Performance"
      extra={
        <Select
          value={days}
          onChange={setDays}
          options={PERIOD_OPTIONS}
          size="small"
          style={{ width: 100 }}
        />
      }
    >
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="Completion Rate"
            value={performance.success_rate}
            precision={1}
            suffix="%"
            prefix={<CheckCircleOutlined />}
            valueStyle={{ fontSize: 18, color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Avg Duration"
            value={formatDuration(performance.avg_duration_ms)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ fontSize: 18 }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Error Rate"
            value={performance.error_rate}
            precision={1}
            suffix="%"
            prefix={<WarningOutlined />}
            valueStyle={{ fontSize: 18, color: errorRateColor }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Tasks Completed"
            value={`${performance.tasks_completed} / ${performance.tasks_total}`}
            prefix={<ThunderboltOutlined />}
            valueStyle={{ fontSize: 18 }}
          />
        </Col>
      </Row>

      {performance.daily_activity && performance.daily_activity.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Daily Activity</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 3,
              height: 120,
              paddingTop: 8,
            }}
          >
            {performance.daily_activity.map((day) => {
              const heightPct = maxActivity > 0 ? (day.count / maxActivity) * 100 : 0
              const isMax = day.count === maxActivity && day.count > 0
              return (
                <div
                  key={day.date}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      minWidth: 4,
                      maxWidth: 20,
                      height: `${Math.max(heightPct, 2)}%`,
                      backgroundColor: isMax ? '#00b96b' : '#b7eb8f',
                      borderRadius: 2,
                      transition: 'height 0.3s ease',
                    }}
                    title={`${day.date}: ${day.count} tasks`}
                  />
                  <div
                    style={{
                      fontSize: 10,
                      color: '#999',
                      marginTop: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {day.date.slice(5)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

export default AgentPerformanceDashboard
