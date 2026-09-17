import { Card, Col, Row, Statistic, Table, Tag, Empty } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import MiniTrendChart from './MiniTrendChart'
import type {
  LlmMetricsAgentRow,
  LlmMetricsDayPoint,
  LlmMetricsFailureRow,
  LlmMetricsModelRow,
  LlmMetricsSummary,
} from '../api/llmMetrics'
import { usePageTranslation } from '../i18n/hooks/useTranslation'

/** 共享的 LLM 调用指标面板：用户级 / 组织级 / 单 Agent 三处复用 */

const fmtInt = (v: number | null | undefined) => (v ?? 0).toLocaleString()

const fmtMs = (v: number | null | undefined) => {
  if (v == null) return '-'
  return v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`
}

const fmtPct = (v: number | null | undefined) =>
  v == null ? '-' : `${(v * 100).toFixed(1)}%`

const fmtCost = (v: number | null | undefined) => (v == null ? '-' : `$${v.toFixed(4)}`)

const statusTag = (status: string) => {
  if (status === 'success') return <Tag color="green" icon={<CheckCircleOutlined />}>success</Tag>
  if (status === 'timeout') return <Tag color="orange" icon={<WarningOutlined />}>timeout</Tag>
  return <Tag color="red" icon={<CloseCircleOutlined />}>failed</Tag>
}

interface LlmMetricsPanelProps {
  summary: LlmMetricsSummary | null
  loading?: boolean
  /** 组织/Agent 视角隐藏 Agent 维度重复表头时可关 */
  showByAgent?: boolean
}

export function LlmMetricsPanel({ summary, loading = false, showByAgent = true }: LlmMetricsPanelProps) {
  const { tp } = usePageTranslation('dashboard')
  if (!loading && !summary) {
    return <Empty description={tp('llmUsage.empty', { defaultValue: '暂无调用数据' })} />
  }

  const totals = summary?.totals
  const byDay: LlmMetricsDayPoint[] = summary?.by_day ?? []
  const byAgent: LlmMetricsAgentRow[] = summary?.by_agent ?? []
  const byModel: LlmMetricsModelRow[] = summary?.by_model ?? []
  const failures: LlmMetricsFailureRow[] = summary?.recent_failures ?? []

  const dayColumns: ColumnsType<LlmMetricsDayPoint> = [
    { title: tp('llmUsage.date', { defaultValue: '日期' }), dataIndex: 'date', key: 'date' },
    { title: tp('llmUsage.calls', { defaultValue: '调用' }), dataIndex: 'calls', key: 'calls', render: fmtInt },
    { title: tp('llmUsage.tokens', { defaultValue: 'Tokens' }), dataIndex: 'total_tokens', key: 'tokens', render: fmtInt },
    { title: tp('llmUsage.avgDuration', { defaultValue: '平均耗时' }), dataIndex: 'avg_duration_ms', key: 'avg', render: fmtMs },
  ]

  const agentColumns: ColumnsType<LlmMetricsAgentRow> = [
    { title: tp('llmUsage.agent', { defaultValue: 'Agent' }), dataIndex: 'agent_name', key: 'name' },
    { title: tp('llmUsage.calls', { defaultValue: '调用' }), dataIndex: 'calls', key: 'calls', render: fmtInt },
    { title: tp('llmUsage.tokens', { defaultValue: 'Tokens' }), dataIndex: 'total_tokens', key: 'tokens', render: fmtInt },
    { title: tp('llmUsage.successRate', { defaultValue: '成功率' }), dataIndex: 'success_rate', key: 'rate', render: fmtPct },
    { title: tp('llmUsage.avgDuration', { defaultValue: '平均耗时' }), dataIndex: 'avg_duration_ms', key: 'avg', render: fmtMs },
  ]

  const modelColumns: ColumnsType<LlmMetricsModelRow> = [
    { title: tp('llmUsage.model', { defaultValue: '模型' }), dataIndex: 'model', key: 'model' },
    { title: tp('llmUsage.calls', { defaultValue: '调用' }), dataIndex: 'calls', key: 'calls', render: fmtInt },
    { title: tp('llmUsage.tokens', { defaultValue: 'Tokens' }), dataIndex: 'total_tokens', key: 'tokens', render: fmtInt },
  ]

  const failureColumns: ColumnsType<LlmMetricsFailureRow> = [
    { title: tp('llmUsage.time', { defaultValue: '时间' }), dataIndex: 'created_at', key: 'time',
      render: (v: string | null) => (v ? v.replace('T', ' ').slice(0, 19) : '-') },
    { title: tp('llmUsage.status', { defaultValue: '状态' }), dataIndex: 'status', key: 'status', render: statusTag },
    { title: tp('llmUsage.engine', { defaultValue: '引擎' }), dataIndex: 'engine', key: 'engine' },
    { title: tp('llmUsage.model', { defaultValue: '模型' }), dataIndex: 'model', key: 'model' },
    { title: tp('llmUsage.endpoint', { defaultValue: '端点' }), dataIndex: 'base_url', key: 'base_url',
      ellipsis: true },
    { title: tp('llmUsage.errorCode', { defaultValue: '错误码' }), dataIndex: 'error_code', key: 'code' },
    { title: tp('llmUsage.task', { defaultValue: '任务' }), dataIndex: 'task_id', key: 'task' },
  ]

  return (
    <div>
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8} md={4}><Statistic title={tp('llmUsage.calls', { defaultValue: '调用' })} value={fmtInt(totals?.calls)} loading={loading} /></Col>
        <Col xs={12} sm={8} md={4}><Statistic title={tp('llmUsage.successRate', { defaultValue: '成功率' })} value={fmtPct(totals?.success_rate)} valueStyle={{ color: '#3f8600' }} loading={loading} /></Col>
        <Col xs={12} sm={8} md={4}><Statistic title="P50" value={fmtMs(totals?.p50_duration_ms)} loading={loading} /></Col>
        <Col xs={12} sm={8} md={4}><Statistic title="P95" value={fmtMs(totals?.p95_duration_ms)} loading={loading} /></Col>
        <Col xs={12} sm={8} md={4}><Statistic title={tp('llmUsage.tokens', { defaultValue: 'Tokens' })} value={fmtInt(totals?.total_tokens)} loading={loading} /></Col>
        <Col xs={12} sm={8} md={4}><Statistic title={tp('llmUsage.cost', { defaultValue: '成本' })} value={fmtCost(totals?.cost_usd)} loading={loading} /></Col>
      </Row>

      {byDay.length > 0 && (
        <Card size="small" className="flat-card" title={tp('llmUsage.dailyTrend', { defaultValue: '近 7 日调用趋势' })} style={{ marginTop: 16 }}>
          <MiniTrendChart
            labels={byDay.map((d) => d.date.slice(5))}
            series={[{ key: 'calls', label: tp('llmUsage.calls', { defaultValue: '调用' }), color: '#1677ff', values: byDay.map((d) => d.calls) }]}
            height={100}
          />
          <Table<LlmMetricsDayPoint>
            className="flat-table"
            size="small"
            rowKey="date"
            columns={dayColumns}
            dataSource={byDay}
            pagination={false}
            style={{ marginTop: 8 }}
          />
        </Card>
      )}

      {showByAgent && byAgent.length > 0 && (
        <Card size="small" className="flat-card" title={tp('llmUsage.byAgent', { defaultValue: '按 Agent' })} style={{ marginTop: 16 }}>
          <Table<LlmMetricsAgentRow>
            className="flat-table"
            size="small"
            rowKey={(r) => String(r.agent_id ?? r.agent_name)}
            columns={agentColumns}
            dataSource={byAgent}
            pagination={false}
          />
        </Card>
      )}

      {byModel.length > 0 && (
        <Card size="small" className="flat-card" title={tp('llmUsage.byModel', { defaultValue: '按模型' })} style={{ marginTop: 16 }}>
          <Table<LlmMetricsModelRow>
            className="flat-table"
            size="small"
            rowKey="model"
            columns={modelColumns}
            dataSource={byModel}
            pagination={false}
          />
        </Card>
      )}

      {failures.length > 0 && (
        <Card size="small" className="flat-card" title={tp('llmUsage.recentFailures', { defaultValue: '最近失败' })} style={{ marginTop: 16 }}>
          <Table<LlmMetricsFailureRow>
            className="flat-table"
            size="small"
            rowKey={(r, idx) => `${r.created_at}-${r.task_id}-${r.error_code}-${idx}`}
            columns={failureColumns}
            dataSource={failures}
            pagination={false}
          />
        </Card>
      )}
    </div>
  )
}

export default LlmMetricsPanel
