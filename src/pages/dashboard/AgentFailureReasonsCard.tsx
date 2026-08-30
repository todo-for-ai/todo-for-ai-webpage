/**
 * Agent 失败原因分布卡片
 *
 * 展示 Agent 运行失败原因统计排行。
 */
import { Card, Space, Tooltip, Typography, Empty } from 'antd'
import { BugOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { AgentFailureReasons } from '../../api/agents'

const { Text } = Typography

interface AgentFailureReasonsCardProps {
  agentFailureReasons: AgentFailureReasons | null
}

const AgentFailureReasonsCard: FC<AgentFailureReasonsCardProps> = ({ agentFailureReasons }) => (
  <Card title={<Space><BugOutlined /> Agent 失败原因分布</Space>} style={{ marginBottom: 24 }}>
    {agentFailureReasons && agentFailureReasons.items.length > 0 ? (() => {
      const items = agentFailureReasons.items
      const maxCount = Math.max(1, ...items.map((i) => i.count))
      return (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            近 {agentFailureReasons.days} 天失败原因分布（共 {agentFailureReasons.total_failed_runs} 次失败，top{items.length}）
          </Text>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ width: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={it.reason}>{it.reason}</span>
                <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 14, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: `${(it.count / maxCount) * 100}%`, height: '100%', background: '#ff4d4f', borderRadius: 3 }} />
                </div>
                <Tooltip title={`涉及: ${(it.affected_agent_names || []).join(', ') || '无'}`}>
                  <span style={{ color: '#8c8c8c', minWidth: 70, textAlign: 'right' }}>{it.count}次 · {it.affected_agent_names.length} Agent</span>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      )
    })() : (
      <Empty description="暂无失败记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    )}
  </Card>
)

export default AgentFailureReasonsCard