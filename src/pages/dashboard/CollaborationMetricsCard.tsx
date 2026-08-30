/**
 * 协作指标卡片组件
 *
 * 展示多 Agent 协作的核心指标：任务完成率、Agent 利用率、工作流成功率、任务交接数。
 * 包含任务状态分布、Agent 状态分布、任务趋势图和 Top Agent 排行。
 */
import { Card, Row, Col, Statistic, Spin, Select, Tooltip, Tag, Table, Empty } from 'antd'
import {
  DashboardOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SwapOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { FC } from 'react'

const _formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
  return `${(seconds / 3600).toFixed(1)}小时`
}

const _KIND_LABELS: Record<string, string> = {
  assistant: '助手',
  autonomous: '自主',
  coordinator: '协调者',
  external: '外部',
}

interface CollaborationMetricsCardProps {
  collabMetrics: any
  collabLoading: boolean
  collabDays: number
  onDaysChange: (days: number) => void
  onRefresh: () => void
}

const CollaborationMetricsCard: FC<CollaborationMetricsCardProps> = ({
  collabMetrics,
  collabLoading,
  collabDays,
  onDaysChange,
  onRefresh,
}) => {
  return (
    <Card
      title={
        <span>
          <DashboardOutlined style={{ marginRight: 8 }} />
          多 Agent 协作指标
        </span>
      }
      extra={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Select
            size="small"
            value={collabDays}
            onChange={onDaysChange}
            style={{ width: 120 }}
            options={[
              { value: 1, label: '最近 1 天' },
              { value: 7, label: '最近 7 天' },
              { value: 30, label: '最近 30 天' },
              { value: 90, label: '最近 90 天' },
            ]}
          />
          <Tooltip title="刷新">
            <ReloadOutlined spin={collabLoading} onClick={onRefresh} style={{ cursor: 'pointer' }} />
          </Tooltip>
        </div>
      }
      style={{ marginBottom: 24 }}
    >
      <Spin spinning={collabLoading}>
        {collabMetrics ? (
          <>
            {/* Core stats row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="任务完成率"
                  value={collabMetrics.tasks?.completion_rate ?? 0}
                  suffix="%"
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: (collabMetrics.tasks?.completion_rate ?? 0) >= 70 ? '#52c41a' : '#faad14', fontSize: 20 }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Agent 利用率"
                  value={collabMetrics.agents?.utilization_pct ?? 0}
                  suffix="%"
                  prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: (collabMetrics.agents?.utilization_pct ?? 0) >= 60 ? '#1890ff' : '#faad14', fontSize: 20 }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="工作流成功率"
                  value={collabMetrics.workflows?.success_rate ?? 0}
                  suffix="%"
                  prefix={<ApartmentOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: (collabMetrics.workflows?.success_rate ?? 0) >= 80 ? '#52c41a' : '#faad14', fontSize: 20 }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="任务交接"
                  value={collabMetrics.handoffs ?? 0}
                  prefix={<SwapOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ fontSize: 20 }}
                />
              </Col>
            </Row>

            {/* Task breakdown + Agent status */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12}>
                <Card size="small" title="任务状态" extra={<Tag>共 {collabMetrics.tasks?.total ?? 0} 个</Tag>}>
                  <Row gutter={8}>
                    <Col span={8}><Statistic title="进行中" value={collabMetrics.tasks?.in_progress ?? 0} valueStyle={{ fontSize: 16, color: '#1890ff' }} /></Col>
                    <Col span={8}><Statistic title="已阻塞" value={collabMetrics.tasks?.blocked ?? 0} valueStyle={{ fontSize: 16, color: '#ff4d4f' }} /></Col>
                    <Col span={8}><Statistic title="待审查" value={collabMetrics.tasks?.review ?? 0} valueStyle={{ fontSize: 16, color: '#faad14' }} /></Col>
                  </Row>
                  <div style={{ marginTop: 4, fontSize: 11, color: '#8c8c8c' }}>
                    平均完成时间: {_formatDuration(collabMetrics.tasks?.avg_completion_seconds ?? 0)}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card size="small" title="Agent 状态" extra={<Tag>共 {collabMetrics.agents?.total ?? 0} 个</Tag>}>
                  <Row gutter={8}>
                    <Col span={8}><Statistic title="活跃" value={collabMetrics.agents?.active ?? 0} valueStyle={{ fontSize: 16, color: '#52c41a' }} prefix={<ThunderboltOutlined />} /></Col>
                    <Col span={8}><Statistic title="暂停" value={collabMetrics.agents?.paused ?? 0} valueStyle={{ fontSize: 16, color: '#faad14' }} /></Col>
                    <Col span={8}><Statistic title="离线" value={collabMetrics.agents?.offline ?? 0} valueStyle={{ fontSize: 16, color: '#8c8c8c' }} /></Col>
                  </Row>
                  {collabMetrics.agents?.kind_distribution && (
                    <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {Object.entries(collabMetrics.agents.kind_distribution).map(([k, v]) => (
                        <Tag key={k} color="blue" style={{ fontSize: 11 }}>{_KIND_LABELS[k] || k}: {v as number}</Tag>
                      ))}
                    </div>
                  )}
                </Card>
              </Col>
            </Row>

            {/* Trend chart */}
            {collabMetrics.trend?.length > 0 && (
              <Card size="small" title="任务趋势" style={{ marginBottom: 16 }} extra={<span style={{ fontSize: 11, color: '#8c8c8c' }}><span style={{ color: '#1890ff' }}>■</span> 创建 <span style={{ color: '#52c41a' }}>■</span> 完成</span>}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, padding: '0 4px' }}>
                  {collabMetrics.trend.map((t: any, i: number) => {
                    const maxVal = Math.max(...collabMetrics.trend.map((x: any) => Math.max(x.created, x.completed)), 1)
                    return (
                      <Tooltip key={i} title={`${t.date}: 创建 ${t.created}, 完成 ${t.completed}`}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 16 }}>
                          <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 60 }}>
                            <div style={{ width: 8, height: Math.max(2, (t.created / maxVal) * 56), background: '#1890ff', borderRadius: 2 }} />
                            <div style={{ width: 8, height: Math.max(2, (t.completed / maxVal) * 56), background: '#52c41a', borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 9, color: '#8c8c8c', marginTop: 2 }}>{t.date.slice(5)}</span>
                        </div>
                      </Tooltip>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Top agents */}
            {collabMetrics.top_agents?.length > 0 && (
              <Card size="small" title="Top Agent（完成任务数）">
                <Table
                  size="small"
                  dataSource={collabMetrics.top_agents}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '排名', width: 60, render: (_: any, __: any, i: number) => <Tag color={i < 3 ? 'gold' : 'default'}>{i + 1}</Tag> },
                    { title: 'Agent', dataIndex: 'name', render: (name: string, r: any) => <>{name} <Tag>{_KIND_LABELS[r.kind] || r.kind}</Tag></> },
                    { title: '完成任务', dataIndex: 'completed_count', sorter: (a: any, b: any) => a.completed_count - b.completed_count },
                  ]}
                />
              </Card>
            )}

            {/* Agent performance analysis */}
            {collabMetrics.agent_performance?.length > 0 && (
              <Card size="small" title="Agent 性能分析" style={{ marginTop: 16 }}>
                <Table
                  size="small"
                  dataSource={collabMetrics.agent_performance}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: 'Agent', dataIndex: 'name' },
                    { title: '总分配', dataIndex: 'total_assignments', width: 80 },
                    { title: '完成', dataIndex: 'done', width: 60 },
                    { title: '失败', dataIndex: 'failed', width: 60, render: (v: number) => v > 0 ? <span style={{ color: '#ff4d4f' }}>{v}</span> : v },
                    {
                      title: '成功率',
                      dataIndex: 'success_rate',
                      width: 100,
                      sorter: (a: any, b: any) => a.success_rate - b.success_rate,
                      render: (rate: number) => (
                        <span style={{ color: rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f' }}>
                          {rate}%
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>
            )}
          </>
        ) : (
          <Empty description="暂无协作数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </Card>
  )
}

export default CollaborationMetricsCard