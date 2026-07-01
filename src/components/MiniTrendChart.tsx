import React, { useMemo } from 'react'
import { Space, Tag, Empty } from 'antd'

/**
 * 纯 SVG 迷你趋势折线图，无第三方图表依赖。
 * 用于在 Modal 等紧凑空间内展示多条数值序列随时间的变化。
 *
 * props:
 *  - series: [{ key, label, color, values: number[] }]，每条序列长度相同
 *  - labels: 每个数据点的横轴标签（如时间），长度与 values 一致
 *  - height: 画布高度（默认 120）
 */
export interface MiniTrendSeries {
  key: string
  label: string
  color: string
  values: number[]
}

interface MiniTrendChartProps {
  series: MiniTrendSeries[]
  labels?: string[]
  height?: number
}

const MiniTrendChart: React.FC<MiniTrendChartProps> = ({ series, labels, height = 120 }) => {
  const width = 680
  const padLeft = 36
  const padRight = 12
  const padTop = 12
  const padBottom = 24
  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const points = series.reduce((m, s) => Math.max(m, s.values.length), 0)

  const geometry = useMemo(() => {
    if (points === 0) return null
    // 全局最大值（跨所有序列，含 0）
    const maxVal = Math.max(1, ...series.flatMap((s) => s.values))
    const xFor = (i: number) => {
      if (points <= 1) return padLeft + plotW / 2
      return padLeft + (plotW * i) / (points - 1)
    }
    const yFor = (v: number) => padTop + plotH - (plotH * v) / maxVal
    // 每条序列的折线路径
    const paths = series.map((s) => {
      const d = s.values
        .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`)
        .join(' ')
      return { key: s.key, label: s.label, color: s.color, d }
    })
    // Y 轴刻度（0 / mid / max）
    const yTicks = [0, Math.round(maxVal / 2), Math.round(maxVal)]
    return { paths, xFor, yFor, maxVal, yTicks }
  }, [series, points, plotW, plotH, padLeft, padTop])

  if (!geometry || points === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无趋势数据" style={{ margin: '8px 0' }} />
  }

  const { paths, yTicks, maxVal } = geometry

  return (
    <div>
      <Space wrap size={[8, 4]} style={{ marginBottom: 4 }}>
        {series.map((s) => (
          <Tag key={s.key} style={{ color: s.color, borderColor: s.color }}>
            <span style={{ display: 'inline-block', width: 10, height: 2, background: s.color, marginRight: 4, verticalAlign: 'middle' }} />
            {s.label}
          </Tag>
        ))}
      </Space>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        {/* Y 网格线 + 刻度 */}
        {yTicks.map((t, i) => {
          const y = padTop + plotH - (plotH * t) / maxVal
          return (
            <g key={`y-${i}`}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#f0f0f0" strokeWidth={1} />
              <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#999">{t}</text>
            </g>
          )
        })}
        {/* X 轴标签（首/中/末，避免拥挤） */}
        {labels && labels.length > 0 && [0, Math.floor((points - 1) / 2), points - 1]
          .filter((idx, i, arr) => arr.indexOf(idx) === i)
          .map((idx, i) => (
            <text key={`x-${i}`} x={geometry.xFor(idx)} y={height - 6} textAnchor="middle" fontSize={9} fill="#999">
              {labels[idx] || ''}
            </text>
          ))}
        {/* 折线 */}
        {paths.map((p) => (
          <path key={p.key} d={p.d} fill="none" stroke={p.color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
    </div>
  )
}

export default MiniTrendChart
