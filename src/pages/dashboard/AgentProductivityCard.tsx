/**
 * Agent 产出效率卡片
 *
 * 展示 Agent 分配/完成/失败统计，产出趋势图。
 */
import { Card, Space, Tag, Typography, Empty } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import type { FC } from 'react'
import type { AgentProductivity, AgentProductivityTrend } from '../../api/agents'
import WorkflowRunTrendChart from '../../components/WorkflowRunTrendChart'

const { Text } = Typography

interface AgentProductivityCardProps {
  agentProductivity: AgentProductivity | null
  productivityTrend: AgentProductivityTrend | null
}

const AgentProductivityCard: FC<AgentProductivityCardProps> = ({ agentProductivity, productivityTrend }) => (
  <Card title={<Space><ThunderboltOutlined /> Agent 产出效率</Space>} style={{ marginBottom: 24 }}>
    {agentProductivity && agentProductivity.items.length > 0 ? (() => {
      const items = agentProductivity.items
      const maxDone = Math.max(1, ...items.map((a) => a.done))
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>近 {agentProductivity.days} 天（按完成数降序）</Text>
          {items.map((a) => {
            const rate = a.completion_rate
            const rateColor = rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f'
            return (
              <div key={a.agent_id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={`${a.name} #${a.agent_id}`}>{a.name}</span>
                <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 3, height: 12, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: `${(a.done / maxDone) * 100}%`, height: '100%', background: rateColor, borderRadius: 3 }} />
                </div>
                <Tag style={{ fontSize: 10 }}>分配 {a.total}</Tag>
                <Tag color="green" style={{ fontSize: 10 }}>完成 {a.done}</Tag>
                {a.failed > 0 && <Tag color="red" style={{ fontSize: 10 }}>失败 {a.failed}</Tag>}
                {a.in_progress > 0 && <Tag color="blue" style={{ fontSize: 10 }}>进行 {a.in_progress}</Tag>}
                <span style={{ color: rateColor, minWidth: 56, textAlign: 'right' }}>率 {rate}%</span>
                <span style={{ color: '#8c8c8c', minWidth: 60, textAlign: 'right' }}>{a.avg_completion_hours != null ? `${a.avg_completion_hours}h` : '—'}</span>
              </div>
            )
          })}
          <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>完成率色阶 ≥80% 绿 / ≥50% 橙 / &lt;50% 红；右侧为平均完成时长</Text>
        </div>
      )
    })() : (
      <Empty description="暂无分配数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    )}
    {productivityTrend && productivityTrend.trend.length > 0 && (
      <div style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          近 {productivityTrend.days} 天产出趋势（累计完成 {productivityTrend.total_done} / 失败 {productivityTrend.total_failed}）
        </Text>
        <div style={{ marginTop: 4 }}>
          <WorkflowRunTrendChart
            buckets={productivityTrend.trend.map((b) => ({ date: b.date, succeeded: b.done, failed: b.failed, failed_steps: b.failed }))}
            width={520}
            height={84}
          />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
          <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#52c41a' }}>●</span> 完成</Text>
          <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#ff4d4f' }}>●</span> 失败</Text>
        </div>
      </div>
    )}
  </Card>
)

export default AgentProductivityCard