/**
 * 工作流成功率对比卡片
 *
 * 展示各工作流的成功率对比条形图。
 */
import { Card, Space, Typography } from 'antd'
import { PieChartOutlined } from '@ant-design/icons'
import type { WorkflowSuccessRateByWorkflow } from '../../api/agents'

const { Text } = Typography

interface WorkflowSuccessRateCardProps {
  successRateByWorkflow: WorkflowSuccessRateByWorkflow | null
}

const WorkflowSuccessRateCard: React.FC<WorkflowSuccessRateCardProps> = ({ successRateByWorkflow }) => {
  if (!successRateByWorkflow || successRateByWorkflow.workflows.length === 0) return null

  const wfs = successRateByWorkflow.workflows
  const maxTotal = Math.max(...wfs.map(w => w.total), 1)

  return (
    <Card
      title={<Space><PieChartOutlined /> 工作流成功率对比</Space>}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>近 30 天 · Top {wfs.length}</Text>}
      style={{ marginBottom: 24 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {wfs.map((w, i) => {
          const barW = Math.max(w.total / maxTotal * 100, 4)
          const succW = w.succeeded / w.total * barW
          const failW = w.failed / w.total * barW
          const cancelW = w.cancelled / w.total * barW
          const dur = w.avg_duration >= 3600 ? `${(w.avg_duration / 3600).toFixed(1)}h` : w.avg_duration >= 60 ? `${(w.avg_duration / 60).toFixed(1)}m` : `${w.avg_duration.toFixed(0)}s`
          return (
            <div key={w.workflow_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: 500, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</Text>
                <Text style={{ fontSize: 11, color: w.success_rate >= 80 ? '#52c41a' : w.success_rate >= 50 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>{w.success_rate}% 成功</Text>
              </div>
              <div style={{ display: 'flex', height: 14, borderRadius: 3, overflow: 'hidden', background: '#f5f5f5' }}>
                {w.succeeded > 0 && <div style={{ width: `${succW}%`, background: '#52c41a', minWidth: 2 }} title={`成功: ${w.succeeded}`} />}
                {w.failed > 0 && <div style={{ width: `${failW}%`, background: '#ff4d4f', minWidth: 2 }} title={`失败: ${w.failed}`} />}
                {w.cancelled > 0 && <div style={{ width: `${cancelW}%`, background: '#d9d9d9', minWidth: 2 }} title={`取消: ${w.cancelled}`} />}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 1 }}>
                <Text type="secondary" style={{ fontSize: 10 }}>共 {w.total} 次</Text>
                <Text type="secondary" style={{ fontSize: 10 }}>平均耗时 {dur}</Text>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default WorkflowSuccessRateCard
