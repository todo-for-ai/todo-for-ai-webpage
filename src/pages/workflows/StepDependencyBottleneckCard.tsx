/**
 * 步骤依赖瓶颈分析卡片
 *
 * 展示工作流关键路径和步骤依赖瓶颈。
 */
import { Card, Space, Tag, Tooltip, Typography } from 'antd'
import { ApartmentOutlined } from '@ant-design/icons'
import type { WorkflowStepDependencyBottleneck } from '../../api/agents'

const { Text } = Typography

interface StepDependencyBottleneckCardProps {
  stepDependencyBottleneck: WorkflowStepDependencyBottleneck | null
}

const StepDependencyBottleneckCard: React.FC<StepDependencyBottleneckCardProps> = ({ stepDependencyBottleneck }) => {
  if (!stepDependencyBottleneck || stepDependencyBottleneck.workflows.length === 0) return null

  return (
    <Card
      title={<Space><ApartmentOutlined /> 步骤依赖瓶颈分析</Space>}
      style={{ marginBottom: 24 }}
    >
      {stepDependencyBottleneck.workflows.map((wf, wfi) => {
        const maxDur = Math.max(1, ...wf.all_steps.map(s => s.avg_duration))
        return (
          <div key={wfi} style={{ marginBottom: wfi < stepDependencyBottleneck.workflows.length - 1 ? 16 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <Text strong>{wf.workflow_name}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>关键路径耗时 {wf.critical_path_duration}s · {wf.active_steps}/{wf.total_steps} 活跃步骤</Text>
            </div>
            {/* Critical path chain */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', marginBottom: 6 }}>
              {wf.critical_path.map((cs, ci) => (
                <span key={ci} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  {ci > 0 && <span style={{ color: '#bfbfbf' }}>→</span>}
                  <Tooltip title={`${cs.name}: ${cs.avg_duration}s (瓶颈 ${cs.bottleneck_score}%)`}>
                    <Tag color={cs.bottleneck_score >= 40 ? 'red' : cs.bottleneck_score >= 25 ? 'orange' : 'blue'} style={{ fontSize: 10, margin: 0 }}>
                      {cs.step_key} {cs.avg_duration}s
                    </Tag>
                  </Tooltip>
                </span>
              ))}
            </div>
            {/* All steps bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {wf.all_steps.map((s, si) => (
                <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                  <span style={{ width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: s.is_on_critical_path ? '#cf1322' : '#595959', fontWeight: s.is_on_critical_path ? 600 : 400 }} title={s.name}>{s.step_key}</span>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 2, height: 10, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: `${(s.avg_duration / maxDur) * 100}%`, height: '100%', background: s.is_on_critical_path ? '#ff4d4f' : '#1890ff', borderRadius: 2 }} />
                  </div>
                  <span style={{ color: '#8c8c8c', minWidth: 40, textAlign: 'right' }}>{s.avg_duration}s</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </Card>
  )
}

export default StepDependencyBottleneckCard
