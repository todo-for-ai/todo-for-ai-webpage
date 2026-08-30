/**
 * 能力图谱卡片
 *
 * 聚合所有 Agent 的能力标签，统计每个能力有多少 Agent 具备。
 */
import { Card, Space, Tag, Typography } from 'antd'
import type { FC } from 'react'
import type { Agent } from '../../api/agents'

const { Text } = Typography

interface CapabilityMapCardProps {
  agents: Agent[]
}

const CapabilityMapCard: FC<CapabilityMapCardProps> = ({ agents }) => {
  const capMap = new Map<string, { count: number; agents: string[] }>()
  agents.forEach(agent => {
    (agent.capabilities || []).forEach(cap => {
      const key = cap.trim().toLowerCase()
      if (!key) return
      const entry = capMap.get(key) || { count: 0, agents: [] }
      entry.count++
      if (entry.agents.length < 3) entry.agents.push(agent.name)
      capMap.set(key, entry)
    })
  })
  const sorted = [...capMap.entries()].sort((a, b) => b[1].count - a[1].count)
  if (sorted.length === 0) return null

  return (
    <Card title="能力图谱" size="small" style={{ marginBottom: 16 }}>
      <Space size={[8, 8]} wrap>
        {sorted.map(([cap, info]) => (
          <Tag
            key={cap}
            color={info.count >= 3 ? 'green' : info.count >= 2 ? 'blue' : 'default'}
            style={{ fontSize: 13, padding: '2px 8px' }}
          >
            {cap} <Text type="secondary" style={{ fontSize: 11 }}>(×{info.count})</Text>
          </Tag>
        ))}
      </Space>
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          共 {sorted.length} 项能力，{agents.filter(a => (a.capabilities || []).length > 0).length}/{agents.length} 个 Agent 已标注能力
        </Text>
      </div>
    </Card>
  )
}

export default CapabilityMapCard
