import { useState, useEffect, useCallback } from 'react'
import { Card, Row, Col, Statistic, Empty, Space, Typography, Tag, Button, Spin } from 'antd'
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons'
import { agentsApi, type ConflictsSandboxCorrelation } from '../../api/agents'

const { Text } = Typography

const ConflictSection = () => {
  const [conflictData, setConflictData] = useState<any>(null)
  const [conflictLoading, setConflictLoading] = useState(false)
  const [conflictsSandboxCorrelation, setConflictsSandboxCorrelation] = useState<ConflictsSandboxCorrelation | null>(null)

  const loadConflictData = useCallback(async () => {
    setConflictLoading(true)
    try {
      const result = await agentsApi.getConflictsDashboard()
      setConflictData(result)
      agentsApi.getConflictsSandboxCorrelation(30, 2).then(setConflictsSandboxCorrelation).catch(() => {})
    } catch {
      // silent
    } finally {
      setConflictLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConflictData()
  }, [loadConflictData])

  return (
    <>
      <Card
        title={<Space><WarningOutlined /> 协作冲突监控</Space>}
        style={{ marginBottom: 24 }}
        extra={<Space><Button size="small" icon={<ReloadOutlined />} onClick={loadConflictData} loading={conflictLoading} /></Space>}
      >
        <Spin spinning={conflictLoading}>
          {conflictData ? (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}><Statistic title="冲突总数" value={conflictData.total || 0} valueStyle={{ fontSize: 16 }} /></Col>
                <Col span={6}><Statistic title="活跃冲突" value={conflictData.active || 0} valueStyle={{ fontSize: 16, color: (conflictData.active || 0) > 0 ? '#ff4d4f' : undefined }} prefix={(conflictData.active || 0) > 0 ? <WarningOutlined /> : undefined} /></Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按严重度:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(conflictData.by_severity || {}).map(([k, v]: any) => (
                      <Tag key={k} color={k === 'critical' ? 'red' : k === 'warning' ? 'orange' : 'blue'} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ))}
                  </Space>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按类型:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(conflictData.by_type || {}).map(([k, v]: any) => v > 0 ? (
                      <Tag key={k} color="purple" style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ) : null)}
                  </Space>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>按状态:</Text>
                  <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                    {Object.entries(conflictData.by_status || {}).map(([k, v]: any) => v > 0 ? (
                      <Tag key={k} color={k === 'resolved' ? 'green' : k === 'detected' ? 'red' : k === 'ignored' ? 'default' : 'blue'} style={{ fontSize: 11 }}>{k}: {v}</Tag>
                    ) : null)}
                  </Space>
                </Col>
              </Row>
              {conflictsSandboxCorrelation && conflictsSandboxCorrelation.total_conflicts > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    冲突↔沙盒违规关联（近 {conflictsSandboxCorrelation.days} 天，±{conflictsSandboxCorrelation.window_hours}h，{conflictsSandboxCorrelation.total_conflicts} 个冲突中 {conflictsSandboxCorrelation.with_violation} 个伴随违规，{conflictsSandboxCorrelation.violation_rate}%）
                  </Text>
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>按冲突类型:</Text>
                    <Space size={[8, 8]} wrap style={{ marginTop: 4 }}>
                      {Object.entries(conflictsSandboxCorrelation.by_conflict_type).map(([k, v]: any) => (
                        <Tag key={k} color={v.with_violation > 0 ? 'volcano' : 'default'} style={{ fontSize: 11 }}>{k}: {v.with_violation}/{v.total} ({v.rate}%)</Tag>
                      ))}
                    </Space>
                  </div>
                  {conflictsSandboxCorrelation.top_agents.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>伴随违规最多的 Agent:</Text>
                      {conflictsSandboxCorrelation.top_agents.map((a) => (
                        <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                          <span style={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name} #{a.agent_id}</span>
                          <Tag style={{ fontSize: 10 }}>冲突 {a.conflicts}</Tag>
                          <Tag color={a.with_violation > 0 ? 'red' : 'default'} style={{ fontSize: 10 }}>伴随违规 {a.with_violation}</Tag>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Empty description="暂无冲突数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Spin>
      </Card>

    </>
  )
}

export default ConflictSection
