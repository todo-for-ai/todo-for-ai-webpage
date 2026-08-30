/**
 * Agent 实时监控卡片组件
 *
 * 展示 Agent 的实时状态监控：总数、活跃数、离线数、活跃任务数。
 * 包含 Agent 列表表格，显示状态、类型、角色、任务数、声誉、经验等。
 */
import { Card, Row, Col, Statistic, Spin, Select, Table, Tag, Space, Empty, Button } from 'antd'
import { DashboardOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import ReputationTrendPopover from '../../components/ReputationTrendPopover'

const _KIND_LABELS: Record<string, string> = {
  assistant: '助手',
  autonomous: '自主',
  coordinator: '协调者',
  external: '外部',
}

interface AgentMonitorCardProps {
  monitorData: any
  monitorLoading: boolean
  monitorHours: number
  onHoursChange: (hours: number) => void
  onRefresh: () => void
}

const AgentMonitorCard: FC<AgentMonitorCardProps> = ({
  monitorData,
  monitorLoading,
  monitorHours,
  onHoursChange,
  onRefresh,
}) => {
  return (
    <Card
      title={<Space><DashboardOutlined /> Agent 实时监控</Space>}
      style={{ marginBottom: 24 }}
      extra={
        <Space>
          <Select
            size="small"
            value={monitorHours}
            onChange={onHoursChange}
            style={{ width: 100 }}
            options={[
              { value: 6, label: '6小时' },
              { value: 24, label: '24小时' },
              { value: 72, label: '3天' },
              { value: 168, label: '7天' },
            ]}
          />
          <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} loading={monitorLoading} />
        </Space>
      }
    >
      <Spin spinning={monitorLoading}>
        {monitorData ? (
          <>
            <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
              <Col span={6}>
                <Statistic title="总 Agent" value={monitorData.summary?.total_agents || 0} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={6}>
                <Statistic title="活跃" value={monitorData.summary?.active || 0} valueStyle={{ fontSize: 16, color: '#52c41a' }} prefix={<ThunderboltOutlined />} />
              </Col>
              <Col span={6}>
                <Statistic title="离线" value={monitorData.summary?.offline || 0} valueStyle={{ fontSize: 16, color: '#8c8c8c' }} />
              </Col>
              <Col span={6}>
                <Statistic title="活跃任务" value={monitorData.summary?.total_active_tasks || 0} valueStyle={{ fontSize: 16 }} />
              </Col>
            </Row>
            <Table
              size="small"
              dataSource={monitorData.agents || []}
              rowKey="agent_id"
              pagination={monitorData.agents?.length > 10 ? { pageSize: 10 } : false}
              scroll={{ x: 800 }}
              columns={[
                {
                  title: 'Agent',
                  width: 160,
                  render: (_: any, r: any) => (
                    <Space>
                      <Tag color={r.real_status === 'active' ? 'green' : r.real_status === 'offline' ? 'default' : 'orange'}>{r.real_status}</Tag>
                      <span>{r.agent_name}</span>
                    </Space>
                  ),
                },
                { title: '类型', dataIndex: 'agent_kind', width: 70, render: (v: string) => _KIND_LABELS[v] || v },
                { title: '角色', dataIndex: 'collaboration_role', width: 80, render: (v: string) => <Tag color="blue" style={{ fontSize: 10 }}>{v}</Tag> },
                {
                  title: '任务',
                  dataIndex: 'active_task_count',
                  width: 60,
                  render: (v: number) => v > 0 ? <span style={{ color: '#1890ff', fontWeight: 600 }}>{v}</span> : <span style={{ color: '#8c8c8c' }}>0</span>,
                },
                {
                  title: '声誉',
                  width: 80,
                  render: (_: any, r: any) => r.reputation ? (
                    <ReputationTrendPopover agentId={r.agent_id} score={r.reputation.score}>
                      <span style={{ color: r.reputation.score >= 70 ? '#52c41a' : r.reputation.score >= 40 ? '#faad14' : '#ff4d4f', cursor: 'help', textDecoration: 'underline dotted' }}>
                        {r.reputation.score?.toFixed(0)}
                      </span>
                    </ReputationTrendPopover>
                  ) : '-',
                },
                {
                  title: '经验',
                  width: 70,
                  render: (_: any, r: any) => <span>{r.experience_count || 0}<span style={{ fontSize: 10, color: '#8c8c8c' }}>({r.shared_experience_count || 0}共享)</span></span>,
                },
                {
                  title: '跨项目',
                  dataIndex: 'cross_project_count',
                  width: 70,
                  render: (v: number) => v > 0 ? <Tag color="cyan" style={{ fontSize: 10 }}>{v}</Tag> : '-',
                },
                {
                  title: '活动趋势',
                  dataIndex: 'activity_trend',
                  width: 120,
                  render: (trend: any[]) => {
                    if (!trend || trend.length === 0) return <span style={{ fontSize: 10, color: '#8c8c8c' }}>无数据</span>
                    const maxCount = Math.max(...trend.map((t: any) => t.count), 1)
                    return (
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 24 }}>
                        {trend.slice(-24).map((t: any, i: number) => (
                          <div key={i} style={{ width: 4, height: Math.max(1, (t.count / maxCount) * 20), background: '#1890ff', borderRadius: 1, opacity: 0.4 + (t.count / maxCount) * 0.6 }} />
                        ))}
                      </div>
                    )
                  },
                },
                {
                  title: '最后在线',
                  dataIndex: 'last_seen_at',
                  width: 100,
                  render: (v: string) => {
                    if (!v) return '-'
                    const diff = Math.floor((Date.now() - new Date(v).getTime()) / 60000)
                    if (diff < 1) return <span style={{ color: '#52c41a' }}>刚刚</span>
                    if (diff < 60) return <span style={{ color: '#52c41a' }}>{diff}分钟前</span>
                    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
                    return `${Math.floor(diff / 1440)}天前`
                  },
                },
              ]}
            />
          </>
        ) : (
          <Empty description="暂无监控数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </Card>
  )
}

export default AgentMonitorCard