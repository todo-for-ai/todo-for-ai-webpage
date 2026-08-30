/**
 * Agent 错误模式聚类卡片
 *
 * 展示 Agent 错误模式聚类统计。
 */
import { Card, Space, Tooltip, Typography, Empty } from 'antd'
import { ClusterOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { AgentFailureErrorPatterns } from '../../api/agents'

const { Text } = Typography

interface AgentErrorPatternsCardProps {
  agentFailureErrorPatterns: AgentFailureErrorPatterns | null
}

const AgentErrorPatternsCard: FC<AgentErrorPatternsCardProps> = ({ agentFailureErrorPatterns }) => (
  <Card title={<Space><ClusterOutlined /> Agent 错误模式聚类</Space>} style={{ marginBottom: 24 }}>
    {agentFailureErrorPatterns && agentFailureErrorPatterns.patterns.length > 0 ? (() => {
      const patterns = agentFailureErrorPatterns.patterns
      const maxCount = Math.max(1, ...patterns.map((p) => p.count))
      return (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            近 {agentFailureErrorPatterns.days} 天错误模式聚类（共 {patterns.length} 个模式）
          </Text>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {patterns.map((p, idx) => (
              <div key={idx} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <Text code style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.pattern}>{p.pattern}</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: `${(p.count / maxCount) * 100}%`, height: '100%', background: '#fa8c16', borderRadius: 3 }} />
                  </div>
                  <span style={{ color: '#8c8c8c', fontSize: 11, minWidth: 50, textAlign: 'right' }}>{p.count}次</span>
                  <Tooltip title={p.affected_agents.map((a) => a.name).join(', ') || '无'}>
                    <span style={{ color: '#595959', fontSize: 11, minWidth: 70, textAlign: 'right' }}>{p.affected_agents.length} Agent</span>
                  </Tooltip>
                  {p.peak_hour !== null && p.peak_hour !== undefined && (
                    <Tooltip title={`时段分布: ${Object.entries(p.hour_distribution || {}).map(([h, v]) => h + ':00 → ' + v).join(', ')}`}>
                      <span style={{ color: '#1890ff', fontSize: 11 }}>峰值 {p.peak_hour}:00</span>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    })() : (
      <Empty description="暂无错误模式数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    )}
  </Card>
)

export default AgentErrorPatternsCard