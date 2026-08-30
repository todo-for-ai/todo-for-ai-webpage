/**
 * 结构复杂度卡片
 *
 * 展示工作流结构复杂度统计。
 */
import { Card, Space, Tag, Typography } from 'antd'
import { ApartmentOutlined } from '@ant-design/icons'
import type { WorkflowStructuralComplexity } from '../../api/agents'

const { Text } = Typography

interface StructuralComplexityCardProps {
  structuralComplexity: WorkflowStructuralComplexity | null
}

const StructuralComplexityCard: React.FC<StructuralComplexityCardProps> = ({ structuralComplexity }) => {
  if (!structuralComplexity || structuralComplexity.total_workflows === 0) return null

  return (
    <Card
      title={<Space><ApartmentOutlined /> 结构复杂度</Space>}
      size="small"
      style={{ marginBottom: 24 }}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>{structuralComplexity.total_workflows} 个工作流 · 均步数 {structuralComplexity.avg_steps} · 均深度 {structuralComplexity.avg_depth}</Text>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {structuralComplexity.workflows.map((w, wi) => {
          const maxDepthAll = Math.max(1, ...structuralComplexity.workflows.map(x => x.max_depth))
          return (
            <div key={wi} style={{ background: '#fafafa', borderRadius: 4, padding: '6px 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text strong style={{ fontSize: 12 }}>{w.workflow_name} <Tag style={{ fontSize: 9 }}>v{w.version}</Tag></Text>
                <Space size={4}>
                  <Tag color={w.max_depth >= 5 ? 'red' : w.max_depth >= 3 ? 'orange' : 'green'} style={{ fontSize: 10 }}>深度 {w.max_depth}</Tag>
                  <Tag style={{ fontSize: 10 }}>{w.step_count} 步</Tag>
                  <Tag style={{ fontSize: 10 }}>{w.total_edges} 边</Tag>
                </Space>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${(w.max_depth / maxDepthAll) * 100}%`, height: '100%', background: w.max_depth >= 5 ? '#ff4d4f' : w.max_depth >= 3 ? '#faad14' : '#52c41a' }} />
                </div>
                <Space size={4} style={{ fontSize: 10 }}>
                  <Tag style={{ fontSize: 9 }}>根 {w.root_count}</Tag>
                  <Tag style={{ fontSize: 9 }}>叶 {w.leaf_count}</Tag>
                  <Tag style={{ fontSize: 9 }}>扇入 {w.avg_fan_in}</Tag>
                </Space>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default StructuralComplexityCard
