import { Card, Space, Tooltip, Empty, Typography } from 'antd'
import { HeatMapOutlined } from '@ant-design/icons'
import type { AgentProductivityHourlyHeatmap } from '../../api/agents'

const { Text } = Typography

const AgentProductivityHourlyHeatmapCard: React.FC<{ data: AgentProductivityHourlyHeatmap | null }> = ({ data }) => {
  if (!data || data.agents.length === 0) return <Empty description="暂无完成时段数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  const agents = data.agents
  const matrix = data.matrix
  const maxCell = Math.max(1, data.max_cell)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const cellColor = (v: number) => {
    if (!v) return '#fafafa'
    const r = v / maxCell
    if (r >= 0.75) return '#722ed1'
    if (r >= 0.5) return '#1890ff'
    if (r >= 0.25) return '#69b1ff'
    return '#bae0ff'
  }
  return (
    <Card
      title={<Space><HeatMapOutlined /> Agent 产出 小时维度热力</Space>}
      style={{ marginBottom: 24 }}
    >
      <Text type="secondary" style={{ fontSize: 12 }}>
        近 {data.days} 天完成时段分布（行=Agent，列=小时 0-23，峰值 {data.peak_hour != null ? `${data.peak_hour}时` : '—'}）
      </Text>
      <div style={{ marginTop: 4, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 9 }}>
          <thead>
            <tr>
              <th style={{ padding: '2px 6px', borderBottom: '1px solid #f0f0f0', textAlign: 'left', position: 'sticky', left: 0, background: '#fff' }}>Agent</th>
              {hours.map((h) => (
                <th key={h} style={{ padding: '2px 1px', borderBottom: '1px solid #f0f0f0', color: h === data.peak_hour ? '#722ed1' : '#8c8c8c', fontWeight: h === data.peak_hour ? 'bold' : 'normal' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => {
              const row = matrix[String(a.agent_id)] || {}
              return (
                <tr key={a.agent_id}>
                  <td style={{ padding: '2px 6px', color: '#595959', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: '#fff' }} title={`${a.name} (完成${a.done})`}>{a.name.length > 10 ? a.name.slice(0, 9) + '…' : a.name}</td>
                  {hours.map((h) => {
                    const v = row[String(h)] || 0
                    return (
                      <td key={h} style={{ padding: 0 }}>
                        <Tooltip title={`${a.name} ${h}时: ${v}`}>
                          <div style={{ width: 20, height: 18, background: cellColor(v), color: v >= maxCell * 0.5 ? '#fff' : '#595959', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, margin: 0.5 }}>
                            {v || ''}
                          </div>
                        </Tooltip>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
        <Text type="secondary" style={{ fontSize: 10 }}>色阶:</Text>
        {[
          { c: '#bae0ff', l: '低' },
          { c: '#69b1ff', l: '中低' },
          { c: '#1890ff', l: '中' },
          { c: '#722ed1', l: '高' },
        ].map(({ c, l }) => (
          <Text key={l} type="secondary" style={{ fontSize: 10 }}>
            <span style={{ display: 'inline-block', width: 12, height: 10, background: c, borderRadius: 2, verticalAlign: 'middle' }} /> {l}
          </Text>
        ))}
      </div>
    </Card>
  )
}

export default AgentProductivityHourlyHeatmapCard