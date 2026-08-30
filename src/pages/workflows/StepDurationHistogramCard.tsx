/**
 * 步骤耗时分布卡片
 *
 * 展示各步骤的耗时分布直方图。
 */
import { Card, Tooltip, Typography } from 'antd'
import type { WorkflowStepDurationHistogram } from '../../api/agents'

const { Text } = Typography

interface StepDurationHistogramCardProps {
  stepDurationHistogram: WorkflowStepDurationHistogram | null
}

const StepDurationHistogramCard: React.FC<StepDurationHistogramCardProps> = ({ stepDurationHistogram }) => {
  if (!stepDurationHistogram || stepDurationHistogram.items.length === 0) return null

  return (
    <Card title="步骤耗时分布" size="small" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stepDurationHistogram.items.slice(0, 8).map((item) => {
          const bins = stepDurationHistogram.bin_labels
          const maxBin = Math.max(1, ...Object.values(item.bins))
          return (
            <div key={item.step_key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <Tooltip title={`n=${item.sample_size} 中位=${item.median_seconds}s P95=${item.p95_seconds}s 范围=${item.min_seconds}-${item.max_seconds}s`}>
                  <span style={{ width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={item.step_key}>{item.step_key}</span>
                </Tooltip>
                <div style={{ flex: 1, display: 'flex', gap: 1, height: 14, alignItems: 'flex-end' }}>
                  {bins.map((label) => {
                    const v = item.bins[label] ?? 0
                    const h = maxBin > 0 ? (v / maxBin) * 14 : 0
                    const colorMap: Record<string, string> = { '0-30s': '#52c41a', '30-120s': '#a0d911', '2-5m': '#faad14', '5-15m': '#fa8c16', '15-30m': '#fa541c', '30m+': '#ff4d4f' }
                    return (
                      <Tooltip key={label} title={`${label}: ${v}次`}>
                        <div style={{ flex: 1, height: Math.max(1, h), background: colorMap[label] || '#bfbfbf', borderRadius: 1, opacity: v > 0 ? 0.85 : 0.2 }} />
                      </Tooltip>
                    )
                  })}
                </div>
                <Text type="secondary" style={{ fontSize: 10, minWidth: 80, textAlign: 'right' }}>
                  中位{item.median_seconds}s P95={item.p95_seconds}s
                </Text>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        {stepDurationHistogram.bin_labels.map((label) => {
          const colorMap: Record<string, string> = { '0-30s': '#52c41a', '30-120s': '#a0d911', '2-5m': '#faad14', '5-15m': '#fa8c16', '15-30m': '#fa541c', '30m+': '#ff4d4f' }
          return (
            <Text key={label} type="secondary" style={{ fontSize: 10 }}>
              <span style={{ display: 'inline-block', width: 10, height: 8, background: colorMap[label] || '#bfbfbf', borderRadius: 1, verticalAlign: 'middle' }} /> {label}
            </Text>
          )
        })}
      </div>
    </Card>
  )
}

export default StepDurationHistogramCard
