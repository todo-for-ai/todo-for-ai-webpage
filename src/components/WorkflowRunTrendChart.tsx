import React from 'react'
import { Empty, Typography } from 'antd'
import type { WorkflowRunTrendBucket } from '../api/agents'

const { Text } = Typography

interface WorkflowRunTrendChartProps {
  buckets: WorkflowRunTrendBucket[]
  width?: number
  height?: number
}

/**
 * 工作流运行结果趋势双折线图（纯 SVG）。
 * 绿线 = 成功，红线 = 失败。纵轴按最大计数值自适应。
 */
const WorkflowRunTrendChart: React.FC<WorkflowRunTrendChartProps> = ({
  buckets,
  width = 480,
  height = 80,
}) => {
  if (!buckets || buckets.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无运行趋势数据" style={{ margin: '4px 0' }} />
  }

  const padX = 6
  const padTop = 6
  const padBottom = 14
  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom
  const n = buckets.length
  const maxVal = Math.max(1, ...buckets.map((b) => Math.max(b.succeeded, b.failed)))
  const maxSteps = Math.max(1, ...buckets.map((b) => b.failed_steps ?? 0))

  const xAt = (i: number) => padX + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
  const yAt = (v: number) => padTop + innerH * (1 - v / maxVal)
  const yAtSteps = (v: number) => padTop + innerH * (1 - v / maxSteps)

  const linePath = (key: 'succeeded' | 'failed') =>
    buckets
      .map((b, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(b[key]).toFixed(1)}`)
      .join(' ')

  const stepLinePath = buckets
    .map((b, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAtSteps(b.failed_steps ?? 0).toFixed(1)}`)
    .join(' ')

  const labelStep = Math.max(1, Math.ceil(n / 6))

  return (
    <svg width={width} height={height} style={{ maxWidth: '100%' }} xmlns="http://www.w3.org/2000/svg">
      <line x1={padX} y1={padTop + innerH} x2={width - padX} y2={padTop + innerH} stroke="#f0f0f0" strokeWidth={1} />
      <path d={linePath('succeeded')} fill="none" stroke="#52c41a" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <path d={linePath('failed')} fill="none" stroke="#ff4d4f" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* 失败步骤曲线（独立 y 比例，橙色虚线）叠加显示伴随失败步骤分布 */}
      <path d={stepLinePath} fill="none" stroke="#fa8c16" strokeWidth={1.2} strokeDasharray="3 2" strokeLinejoin="round" strokeLinecap="round" />
      {buckets.map((b, i) => (
        <g key={i}>
          <circle cx={xAt(i)} cy={yAt(b.succeeded)} r={2} fill="#52c41a" />
          <circle cx={xAt(i)} cy={yAt(b.failed)} r={2} fill="#ff4d4f" />
          {(b.failed_steps ?? 0) > 0 && <circle cx={xAt(i)} cy={yAtSteps(b.failed_steps ?? 0)} r={1.8} fill="#fa8c16" />}
          {i % labelStep === 0 && (
            <text x={xAt(i)} y={height - 3} fontSize={8} fill="#8c8c8c" textAnchor="middle">
              {String(b.date).slice(5)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

export default WorkflowRunTrendChart
