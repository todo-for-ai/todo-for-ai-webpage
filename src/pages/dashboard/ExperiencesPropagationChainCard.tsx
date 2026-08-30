/**
 * 经验共享传播链卡片
 *
 * 展示 Agent 间经验共享传播拓扑。
 */
import { Card, Space, Typography } from 'antd'
import { ApartmentOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { ExperiencesPropagationChain } from '../../api/agents'

const { Text } = Typography

interface ExperiencesPropagationChainCardProps {
  experiencesPropagationChain: ExperiencesPropagationChain | null
}

const ExperiencesPropagationChainCard: FC<ExperiencesPropagationChainCardProps> = ({ experiencesPropagationChain }) => {
  if (!experiencesPropagationChain || experiencesPropagationChain.chains.length === 0) return null

  const chains = experiencesPropagationChain.chains
  const maxReuses = Math.max(...chains.map(c => c.total_reuses), 1)
  const barMaxW = 180

  return (
    <Card
      title={<Space><ApartmentOutlined /> 经验共享传播链</Space>}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>{experiencesPropagationChain.total_shared} 条共享 · {experiencesPropagationChain.total_propagated} 次传播</Text>}
      style={{ marginBottom: 24 }}
    >
      {chains.map((c) => {
        const barW = Math.max(2, (c.total_reuses / maxReuses) * barMaxW)
        const domains = c.top_domains.slice(0, 3).join('/')
        return (
          <div key={c.source_agent_id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Text style={{ fontSize: 12, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.source_agent_name}>{c.source_agent_name}</Text>
              <svg width={barMaxW + 4} height={12} style={{ flexShrink: 0 }}>
                <rect x={0} y={1} width={barMaxW} height={10} rx={2} fill="#f5f5f5" />
                <rect x={0} y={1} width={barW} height={10} rx={2} fill="#722ed1" opacity={0.7} />
              </svg>
              <Text style={{ fontSize: 11, color: '#722ed1', minWidth: 30 }}>{c.total_reuses}</Text>
              <Text type="secondary" style={{ fontSize: 10 }}>{c.shared_count}条共享</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 10, marginLeft: 108 }}>
              {domains ? `[${domains}]` : ''} {c.top_experiences.slice(0, 2).map(e => `${e.domain || '?'}(${e.times_reused})`).join(', ')}
            </Text>
          </div>
        )
      })}
    </Card>
  )
}

export default ExperiencesPropagationChainCard