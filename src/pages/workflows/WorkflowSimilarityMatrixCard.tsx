/**
 * 运行相似度矩阵卡片
 *
 * 展示工作流运行间的 Jaccard 相似度 SVG 矩阵。
 */
import { Card, Space, Tag, Tooltip, Typography } from 'antd'
import { DotChartOutlined } from '@ant-design/icons'
import type { WorkflowSimilarityMatrix } from '../../api/agents'

const { Text } = Typography

interface WorkflowSimilarityMatrixCardProps {
  similarityMatrix: WorkflowSimilarityMatrix | null
}

const WorkflowSimilarityMatrixCard: React.FC<WorkflowSimilarityMatrixCardProps> = ({ similarityMatrix }) => {
  if (!similarityMatrix || similarityMatrix.workflows.length === 0) return null

  const simColor = (v: number) => {
    if (v >= 0.8) return '#52c41a'
    if (v >= 0.6) return '#73d13d'
    if (v >= 0.4) return '#faad14'
    if (v >= 0.2) return '#fa8c16'
    return '#ff4d4f'
  }

  return (
    <Card
      title={<Space><DotChartOutlined /> 运行相似度矩阵</Space>}
      style={{ marginBottom: 24 }}
      extra={<Text type="secondary" style={{ fontSize: 12 }}>近 {similarityMatrix.days} 天 · Jaccard 相似度</Text>}
    >
      {similarityMatrix.workflows.map((wf, wfi) => {
        const n = wf.matrix.length
        if (n < 2) return null
        const cellSize = Math.min(28, Math.max(14, Math.floor(240 / n)))
        const svgW = 40 + n * cellSize
        const svgH = 30 + n * cellSize
        return (
          <div key={wfi} style={{ marginBottom: wfi < similarityMatrix.workflows.length - 1 ? 16 : 0 }}>
            <Text strong style={{ fontSize: 12 }}>{wf.workflow_name}</Text>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{wf.run_count} 次运行</Text>
            <div style={{ overflowX: 'auto', marginTop: 4 }}>
              <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
                {/* Column labels */}
                {wf.run_ids.map((_, ci) => (
                  <text key={`cl-${ci}`} x={40 + ci * cellSize + cellSize / 2} y={10} fontSize={7} fill="#8c8c8c" textAnchor="middle">#{wf.run_ids[ci]}</text>
                ))}
                {/* Row labels + cells */}
                {wf.matrix.map((row, ri) => (
                  <g key={`row-${ri}`}>
                    <text x={36} y={30 + ri * cellSize + cellSize / 2 + 3} fontSize={7} fill="#8c8c8c" textAnchor="end">#{wf.run_ids[ri]}</text>
                    {row.map((v, ci) => (
                      <Tooltip key={`c-${ri}-${ci}`} title={`#${wf.run_ids[ri]} ↔ #${wf.run_ids[ci]}: ${(v * 100).toFixed(0)}%`}>
                        <rect x={40 + ci * cellSize} y={30 + ri * cellSize} width={cellSize - 1} height={cellSize - 1} rx={2} fill={ri === ci ? '#e6f7ff' : simColor(v)} />
                      </Tooltip>
                    ))}
                  </g>
                ))}
              </svg>
            </div>
            {/* Most / least similar */}
            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 10 }}>
              {wf.most_similar.length > 0 && (
                <div>
                  <Text type="secondary">最相似: </Text>
                  {wf.most_similar.map((p, pi) => (
                    <Tag key={pi} color="green" style={{ fontSize: 9, margin: '0 2px' }}>#{p.run_a}↔#{p.run_b} {(p.similarity * 100).toFixed(0)}%</Tag>
                  ))}
                </div>
              )}
              {wf.least_similar.length > 0 && (
                <div>
                  <Text type="secondary">最不相似: </Text>
                  {wf.least_similar.map((p, pi) => (
                    <Tag key={pi} color="red" style={{ fontSize: 9, margin: '0 2px' }}>#{p.run_a}↔#{p.run_b} {(p.similarity * 100).toFixed(0)}%</Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </Card>
  )
}

export default WorkflowSimilarityMatrixCard
