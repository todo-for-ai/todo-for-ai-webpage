import React from 'react'
import { Empty, Typography } from 'antd'
import type { ConflictsTrendBucket } from '../api/agents'

const { Text } = Typography

interface ConflictsTrendChartProps {
  buckets: ConflictsTrendBucket[]
  width?: number
  height?: number
}

/**
 * 冲突检测 vs 解决趋势双折线图（纯 SVG）。
 *
 * 横轴为按日顺序，纵轴按最大计数值自适应。蓝线 = 检测，绿线 = 解决。
 * 末端标注各自累计数。无第三方图表库。
 */
const ConflictsTrendChart: React.FC<ConflictsTrendChartProps> = ({
  buckets,
  width = 320,
  height = 80,
}) => {
  if (!buckets || buckets.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无冲突趋势数据" style={{ margin: '4px 0' }} />
  }

  const padX = 6
  const padTop = 6
  const padBottom = 14
  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom
  const n = buckets.length
  const maxVal = Math.max(1, ...buckets.map((b) => Math.max(b.detected, b.resolved)))

  const xAt = (i: number) => padX + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
  const yAt = (v: number) => padTop + innerH * (1 - v / maxVal)

  const linePath = (key: 'detected' | 'resolved') =>
    buckets
      .map((b, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(b[key]).toFixed(1)}`)
      .join(' ')

  const totalDetected = buckets.reduce((s, b) => s + (b.detected || 0), 0)
  const totalResolved = buckets.reduce((s, b) => s + (b.resolved || 0), 0)

  // 仅画少量 x 轴日期标签避免拥挤
  const labelStep = Math.max(1, Math.ceil(n / 5))

  return (
    <div>
      <svg width={width} height={height} style={{ maxWidth: '100%' }} xmlns="http://www.w3.org/2000/svg">
        {/* y=0 基准线 */}
        <line x1={padX} y1={padTop + innerH} x2={width - padX} y2={padTop + innerH} stroke="#f0f0f0" strokeWidth={1} />
        {/* 检测线（蓝） */}
        <path d={linePath('detected')} fill="none" stroke="#1890ff" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* 解决线（绿） */}
        <path d={linePath('resolved')} fill="none" stroke="#52c41a" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* 数据点 + 日期标签 */}
        {buckets.map((b, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(b.detected)} r={2} fill="#1890ff" />
            <circle cx={xAt(i)} cy={yAt(b.resolved)} r={2} fill="#52c41a" />
            {i % labelStep === 0 && (
              <text x={xAt(i)} y={height - 3} fontSize={8} fill="#8c8c8c" textAnchor="middle">
                {String(b.date).slice(5)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          <span style={{ color: '#1890ff' }}>●</span> 检测 {totalDetected}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          <span style={{ color: '#52c41a' }}>●</span> 解决 {totalResolved}
        </Text>
      </div>
    </div>
  )
}

export default ConflictsTrendChart
