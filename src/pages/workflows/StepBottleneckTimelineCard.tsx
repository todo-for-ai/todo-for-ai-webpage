/**
 * 步骤瓶颈时序卡片
 *
 * 展示各步骤日均耗时趋势 SVG 折线图。
 */
import { Card, Space, Tag, Typography } from 'antd'
import { LineChartOutlined } from '@ant-design/icons'
import type { WorkflowStepBottleneckTimeline } from '../../api/agents'

const { Text } = Typography

interface StepBottleneckTimelineCardProps {
  stepBottleneckTl: WorkflowStepBottleneckTimeline | null
}

const StepBottleneckTimelineCard: React.FC<StepBottleneckTimelineCardProps> = ({ stepBottleneckTl }) => {
  if (!stepBottleneckTl || stepBottleneckTl.steps.length === 0) return null

  return (
    <Card
      title={<Space><LineChartOutlined /> 步骤瓶颈时序</Space>}
      size="small"
      style={{ marginBottom: 24 }}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {stepBottleneckTl.days} 天 · 日均耗时趋势</Text>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stepBottleneckTl.steps.map((s, si) => {
          const nonzero = s.series.filter(v => v > 0)
          const maxV = Math.max(1, ...nonzero)
          const w = 300
          const h = 30
          const pts = s.series.map((v, i) => `${(i / Math.max(1, s.series.length - 1)) * w},${h - (v / maxV) * (h - 2)}`).join(' ')
          const changeColor = s.change_pct > 20 ? '#ff4d4f' : s.change_pct < -20 ? '#52c41a' : '#1890ff'
          return (
            <div key={si} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Text strong style={{ fontSize: 12 }}>{s.step_key}</Text>
                <Space size={4}>
                  <Tag style={{ fontSize: 10 }}>均 {s.avg_duration}s</Tag>
                  <Tag color={s.change_pct > 20 ? 'red' : s.change_pct < -20 ? 'green' : 'blue'} style={{ fontSize: 10 }}>{s.change_pct > 0 ? '+' : ''}{s.change_pct}%</Tag>
                </Space>
              </div>
              <svg width={w} height={h} style={{ display: 'block' }}>
                {nonzero.length > 1 && <polyline points={pts} fill="none" stroke={changeColor} strokeWidth={1.5} />}
              </svg>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 6, justifyContent: 'center' }}>
        <span style={{ fontSize: 10, color: '#52c41a' }}>— 改善(&lt;-20%)</span>
        <span style={{ fontSize: 10, color: '#1890ff' }}>— 稳定</span>
        <span style={{ fontSize: 10, color: '#ff4d4f' }}>— 恶化(&gt;+20%)</span>
      </div>
    </Card>
  )
}

export default StepBottleneckTimelineCard
