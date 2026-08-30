/**
 * Agent 技能覆盖雷达卡片
 *
 * 展示各 Agent 在不同技能维度的覆盖度雷达图。
 */
import { Card, Space, Typography } from 'antd'
import { RadarChartOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { ExperiencesSkillCoverageRadar } from '../../api/agents'

const { Text } = Typography

interface SkillCoverageRadarCardProps {
  skillCoverageRadar: ExperiencesSkillCoverageRadar | null
}

const SkillCoverageRadarCard: FC<SkillCoverageRadarCardProps> = ({ skillCoverageRadar }) => {
  if (!skillCoverageRadar || skillCoverageRadar.agents.length === 0 || skillCoverageRadar.domain_labels.length < 3) return null

  const agents = skillCoverageRadar.agents
  const labels = skillCoverageRadar.domain_labels
  const n = labels.length
  const cx = 140
  const cy = 140
  const r = 110
  const angleStep = (2 * Math.PI) / n
  const colors = ['#1890ff', '#722ed1', '#fa8c16', '#52c41a', '#eb2f96', '#13c2c2']

  return (
    <Card
      title={<Space><RadarChartOutlined /> Agent 技能覆盖雷达</Space>}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>{n} 个技能维度 · {agents.length} 个 Agent</Text>}
      style={{ marginBottom: 24 }}
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <svg width={280} height={280} style={{ flexShrink: 0 }}>
          {/* Grid rings */}
          {[20, 40, 60, 80, 100].map(pct => {
            const rr = r * pct / 100
            const pts = Array.from({ length: n }, (_, i) => {
              const a = -Math.PI / 2 + i * angleStep
              return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`
            }).join(' ')
            return <polygon key={`ring-${pct}`} points={pts} fill="none" stroke="#f0f0f0" strokeWidth={0.5} />
          })}
          {/* Axis lines + labels */}
          {labels.map((l, i) => {
            const a = -Math.PI / 2 + i * angleStep
            const ex = cx + r * Math.cos(a)
            const ey = cy + r * Math.sin(a)
            const lx = cx + (r + 16) * Math.cos(a)
            const ly = cy + (r + 16) * Math.sin(a)
            return (
              <g key={`ax-${i}`}>
                <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="#e8e8e8" strokeWidth={0.5} />
                <text x={lx} y={ly + 3} fontSize={9} fill="#8c8c8c" textAnchor="middle">{l.length > 6 ? l.slice(0, 5) + '…' : l}</text>
              </g>
            )
          })}
          {/* Agent polygons */}
          {agents.map((ag, ai) => {
            const color = colors[ai % colors.length]
            const pts = ag.scores.map((s, i) => {
              const a = -Math.PI / 2 + i * angleStep
              const rr = r * s / 100
              return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`
            }).join(' ')
            return <polygon key={`ag-${ag.agent_id}`} points={pts} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={1.5} />
          })}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          {agents.map((ag, ai) => (
            <Text key={ag.agent_id} style={{ fontSize: 11 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, background: colors[ai % colors.length], borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} />
              {ag.name} ({ag.total_experiences}条)
            </Text>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default SkillCoverageRadarCard