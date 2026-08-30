/**
 * 步骤共失败热力矩阵卡片
 *
 * 展示步骤间共失败关系的 SVG 热力矩阵。
 */
import { Card, Space, Typography } from 'antd'
import { HeatMapOutlined } from '@ant-design/icons'
import type { WorkflowStepCofailureMatrix } from '../../api/agents'

const { Text } = Typography

interface StepCofailureMatrixCardProps {
  stepCofailureMatrix: WorkflowStepCofailureMatrix | null
}

const StepCofailureMatrixCard: React.FC<StepCofailureMatrixCardProps> = ({ stepCofailureMatrix }) => {
  if (!stepCofailureMatrix || stepCofailureMatrix.step_keys.length < 2) return null

  const keys = stepCofailureMatrix.step_keys
  const n = keys.length
  const matrix = stepCofailureMatrix.matrix
  const maxCo = Math.max(stepCofailureMatrix.max_cofailure, 1)
  const cellSize = 32
  const labelW = 80
  const totalW = labelW + n * cellSize + 4
  const totalH = labelW + n * cellSize + 4
  const cofColor = (v: number) => {
    if (v === 0) return '#fafafa'
    const t = v / maxCo
    return t < 0.33 ? '#fff1f0' : t < 0.66 ? '#ffa39e' : '#ff4d4f'
  }

  return (
    <Card
      title={<Space><HeatMapOutlined /> 步骤共失败热力矩阵</Space>}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>{stepCofailureMatrix.total_runs_with_multi_failure} 次多步失败</Text>}
      style={{ marginBottom: 24 }}
    >
      <svg width={totalW} height={totalH} style={{ overflow: 'visible' }}>
        {/* Column headers */}
        {keys.map((k, j) => (
          <text key={`ch-${j}`} x={labelW + j * cellSize + cellSize / 2} y={labelW - 4} fontSize={8} fill="#8c8c8c" textAnchor="middle" transform={`rotate(-45, ${labelW + j * cellSize + cellSize / 2}, ${labelW - 4})`}>{k.step_key.length > 8 ? k.step_key.slice(0, 8) + '…' : k.step_key}</text>
        ))}
        {/* Rows */}
        {keys.map((rowK, i) => {
          const row = matrix[rowK.step_key] || {}
          return (
            <g key={`row-${i}`}>
              {/* Row header */}
              <text x={labelW - 4} y={labelW + i * cellSize + cellSize / 2 + 3} fontSize={8} fill="#595959" textAnchor="end">{rowK.step_key.length > 10 ? rowK.step_key.slice(0, 10) + '…' : rowK.step_key}</text>
              {/* Cells */}
              {keys.map((colK, j) => {
                const v = row[colK.step_key] ?? (i === j ? rowK.failures : 0)
                const isDiag = i === j
                const fill = isDiag ? '#f0f0f0' : cofColor(v)
                const textFill = isDiag ? '#8c8c8c' : v >= maxCo * 0.66 ? '#fff' : '#595959'
                return (
                  <g key={`cell-${i}-${j}`}>
                    <rect x={labelW + j * cellSize} y={labelW + i * cellSize} width={cellSize - 1} height={cellSize - 1} rx={2} fill={fill} stroke="#fff" strokeWidth={0.5} />
                    <text x={labelW + j * cellSize + cellSize / 2} y={labelW + i * cellSize + cellSize / 2 + 3} fontSize={9} fill={textFill} textAnchor="middle" fontWeight={v > 0 && !isDiag ? 600 : 400}>{v > 0 ? v : ''}</text>
                  </g>
                )
              })}
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
        <Text type="secondary" style={{ fontSize: 10 }}>共现强度:</Text>
        <div style={{ display: 'flex', gap: 2 }}>
          {['#fafafa', '#fff1f0', '#ffa39e', '#ff4d4f'].map((c, i) => (
            <div key={i} style={{ width: 16, height: 10, background: c, border: '1px solid #f0f0f0', borderRadius: 1 }} />
          ))}
        </div>
        <Text type="secondary" style={{ fontSize: 9 }}>低 → 高</Text>
      </div>
    </Card>
  )
}

export default StepCofailureMatrixCard
