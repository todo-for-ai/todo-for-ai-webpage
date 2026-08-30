/**
 * 沙盒安全监控卡片组件
 *
 * 展示沙盒策略执行监控：沙盒数、执行数、运行中、违规数。
 * 包含违规趋势、按 Agent 分布的违规排行、模板使用统计。
 */
import { Card, Row, Col, Statistic, Spin, Space, Tag, Empty, Button } from 'antd'
import { SafetyOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import MiniTrendChart from '../../components/MiniTrendChart'
import type { SandboxViolationTrend, SandboxViolationsByAgent, SandboxTemplateUsage } from '../../api/agents'

interface SandboxMonitorCardProps {
  sandboxData: any
  sandboxLoading: boolean
  sandboxViolationTrend: SandboxViolationTrend | null
  sandboxViolationsByAgent: SandboxViolationsByAgent | null
  sandboxTemplateUsage: SandboxTemplateUsage | null
  onRefresh: () => void
}

const SandboxMonitorCard: FC<SandboxMonitorCardProps> = ({
  sandboxData,
  sandboxLoading,
  sandboxViolationTrend,
  sandboxViolationsByAgent,
  sandboxTemplateUsage,
  onRefresh,
}) => {
  return (
    <Card
      title={<Space><SafetyOutlined /> 沙盒安全监控</Space>}
      style={{ marginBottom: 24 }}
      extra={
        <Space>
          <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} loading={sandboxLoading} />
        </Space>
      }
    >
      <Spin spinning={sandboxLoading}>
        {sandboxData ? (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={4}>
                <Statistic title="沙盒策略" value={sandboxData.total_sandboxes || 0} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={4}>
                <Statistic title="执行总数" value={sandboxData.total_executions || 0} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col span={4}>
                <Statistic title="运行中" value={sandboxData.running_executions || 0} valueStyle={{ fontSize: 16, color: '#1890ff' }} />
              </Col>
              <Col span={4}>
                <Statistic
                  title="违规总数"
                  value={sandboxData.total_violations || 0}
                  valueStyle={{ fontSize: 16, color: (sandboxData.total_violations || 0) > 0 ? '#ff4d4f' : undefined }}
                  prefix={(sandboxData.total_violations || 0) > 0 ? <WarningOutlined /> : undefined}
                />
              </Col>
              <Col span={12}>
                <Space size={[8, 8]} wrap>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>按级别:</span>
                  {Object.entries(sandboxData.by_level || {}).map(([k, v]: any) => (
                    <Tag key={k} color={k === 'strict' ? 'red' : k === 'permissive' ? 'green' : 'orange'} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                  ))}
                </Space>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>执行状态分布:</span>
                <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                  {Object.entries(sandboxData.by_status || {}).map(([k, v]: any) => (
                    <Tag key={k} color={k === 'completed' ? 'green' : k === 'running' ? 'blue' : k === 'violated' ? 'red' : k === 'revoked' ? 'orange' : k === 'failed' ? 'volcano' : 'default'} style={{ fontSize: 11 }}>
                      {k}: {v}
                    </Tag>
                  ))}
                </Space>
              </Col>
            </Row>
            {sandboxViolationTrend && sandboxViolationTrend.trend.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  近 {sandboxViolationTrend.days} 天违规趋势（累计 {sandboxViolationTrend.trend.reduce((s, t) => s + t.count, 0)}）
                </span>
                <div style={{ marginTop: 8 }}>
                  <MiniTrendChart
                    height={100}
                    labels={sandboxViolationTrend.trend.map((t) => t.date)}
                    series={[{ key: 'violations', label: '违规', color: '#ff4d4f', values: sandboxViolationTrend.trend.map((t) => t.count) }]}
                  />
                </div>
                <Space size={[4, 4]} wrap style={{ marginTop: 4 }}>
                  {Object.entries(sandboxViolationTrend.by_type || {}).filter(([, v]) => (v as number) > 0).map(([k, v]: any) => (
                    <Tag key={k} style={{ fontSize: 10 }}>{k}: {v}</Tag>
                  ))}
                </Space>
              </div>
            )}
            {sandboxViolationsByAgent && sandboxViolationsByAgent.items.length > 0 ? (() => {
              const items = sandboxViolationsByAgent.items
              const maxTotal = Math.max(1, ...items.map((it) => it.total))
              return (
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>违规最多的 Agent（近 {sandboxViolationsByAgent.days} 天）</span>
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {items.slice(0, 6).map((it) => (
                      <div key={it.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${it.name} #${it.agent_id}`}>
                          {it.name || `#${it.agent_id}`}
                        </span>
                        <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ width: `${(it.total / maxTotal) * 100}%`, height: '100%', background: '#ff4d4f', borderRadius: 3 }} />
                        </div>
                        <span style={{ color: '#8c8c8c', minWidth: 40, textAlign: 'right' }}>{it.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })() : null}
            {sandboxTemplateUsage && sandboxTemplateUsage.items.length > 0 ? (() => {
              const items = sandboxTemplateUsage.items
              const maxUses = Math.max(1, ...items.map((it) => it.uses))
              return (
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>沙盒模板使用（实例化/绑定 Agent）</span>
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {items.slice(0, 6).map((it) => (
                      <div key={it.template_key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <span style={{ width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={it.template_key}>{it.template_key}</span>
                        <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ width: `${(it.uses / maxUses) * 100}%`, height: '100%', background: '#722ed1', borderRadius: 3 }} />
                        </div>
                        <span style={{ color: '#8c8c8c', minWidth: 70, textAlign: 'right' }}>{it.uses}次 · 绑{it.bound_to_agent}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })() : null}
          </>
        ) : (
          <Empty description="暂无沙盒数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </Card>
  )
}

export default SandboxMonitorCard