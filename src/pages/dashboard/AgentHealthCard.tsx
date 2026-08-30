/**
 * Agent 健康度概览卡片
 *
 * 展示 Agent 综合健康度列表，包含健康分条形图、子分数标签。
 * 内嵌 Top3 雷达图和热力矩阵。
 */
import { Card, Space, Tag, Tooltip, Typography, Empty } from 'antd'
import { FundOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { AgentHealth } from '../../api/agents'

const { Text } = Typography

const healthColor = (s: number) => s >= 80 ? '#52c41a' : s >= 60 ? '#faad14' : s >= 40 ? '#fa8c16' : '#ff4d4f'

interface AgentHealthCardProps {
  agentHealth: AgentHealth | null
}

const AgentHealthCard: FC<AgentHealthCardProps> = ({ agentHealth }) => {
  if (!agentHealth || agentHealth.items.length === 0) {
    return (
      <Card title={<Space><FundOutlined /> Agent 综合健康度</Space>} style={{ marginBottom: 24 }}>
        <Empty description="暂无健康度数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    )
  }

  const items = agentHealth.items

  return (
    <Card title={<Space><FundOutlined /> Agent 综合健康度</Space>} style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          近 {agentHealth.days} 天（声誉 0.4 + 完成 0.3 + 冲突 0.15 + 违规 0.15，按健康分降序）
        </Text>
        {items.map((a) => (
          <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, flexWrap: 'wrap' }}>
            <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name}</span>
            <div style={{ flex: '0 1 120px', background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: `${a.health_score}%`, height: '100%', background: healthColor(a.health_score), borderRadius: 3 }} />
            </div>
            <span style={{ color: healthColor(a.health_score), minWidth: 44, textAlign: 'right', fontWeight: 500 }}>{a.health_score}</span>
            <Tooltip title={`声誉 ${a.sub_scores.reputation} · 完成 ${a.sub_scores.completion} · 冲突 ${a.sub_scores.conflict} · 违规 ${a.sub_scores.violation}`}>
              <Tag style={{ fontSize: 10, cursor: 'default' }}>声誉 {a.sub_scores.reputation}</Tag>
            </Tooltip>
            <Tag color={a.sub_scores.completion >= 80 ? 'green' : a.sub_scores.completion >= 50 ? 'orange' : 'red'} style={{ fontSize: 10 }}>
              完成 {a.completion_rate != null ? `${a.completion_rate}%` : '—'}
            </Tag>
            <Tag color={a.conflicts > 0 ? 'orange' : 'default'} style={{ fontSize: 10 }}>冲突 {a.conflicts}</Tag>
            <Tag color={a.sandbox_violations > 0 ? 'red' : 'default'} style={{ fontSize: 10 }}>违规 {a.sandbox_violations}</Tag>
          </div>
        ))}
        <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>健康分色阶 ≥80 绿 / ≥60 橙 / ≥40 浅橙 / &lt;40 红</Text>
      </div>
    </Card>
  )
}

export default AgentHealthCard
