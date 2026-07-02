import React from 'react'
import { Empty, Tooltip } from 'antd'
import type { ReputationHistoryPoint } from '../api/agents'

interface ReputationSparklineProps {
  /** 时间升序的声誉变化点 */
  points: ReputationHistoryPoint[]
  /** 当前最新声誉分（作为末端参考点） */
  currentScore?: number
  width?: number
  height?: number
}

// 按声誉分取颜色（红<40 黄40-70 绿>70），与 CollaborationGraphView 保持一致
const scoreColor = (s: number) => (s < 40 ? '#ff4d4f' : s < 70 ? '#faad14' : '#52c41a')

/**
 * 声誉趋势迷你折线图（纯 SVG，无第三方图表库）。
 *
 * 横轴为时间顺序，纵轴固定 0-100。折线连接各变化点的 new_score，
 * 末端补一个当前分参考点。每个点带 tooltip 显示时间/增量/结果。
 * 折线渐变按分值区间着色（末端颜色）。
 */
const ReputationSparkline: React.FC<ReputationSparklineProps> = ({
  points,
  currentScore,
  width = 240,
  height = 56,
}) => {
  // 收集有效分值点（new_score 非空）
  const series: { score: number; p?: ReputationHistoryPoint }[] = []
  points.forEach((p) => {
    if (typeof p.new_score === 'number') series.push({ score: p.new_score, p })
  })
  // 末端补当前分（若与最后一点不同）
  if (typeof currentScore === 'number') {
    const last = series[series.length - 1]
    if (!last || last.score !== currentScore) series.push({ score: currentScore })
  }

  if (series.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无声誉变化" style={{ margin: '4px 0' }} />
  }

  const padX = 6
  const padY = 6
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const n = series.length
  const xAt = (i: number) => padX + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
  // 纵轴固定 0-100，分越高越靠上
  const yAt = (s: number) => padY + innerH * (1 - Math.max(0, Math.min(100, s)) / 100)

  const linePath = series
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(d.score).toFixed(1)}`)
    .join(' ')
  const endColor = scoreColor(series[series.length - 1].score)

  // 50 分基准线
  const baseY = yAt(50)

  return (
    <svg width={width} height={height} style={{ maxWidth: '100%' }} xmlns="http://www.w3.org/2000/svg">
      {/* 50 分基准虚线 */}
      <line x1={padX} y1={baseY} x2={width - padX} y2={baseY} stroke="#f0f0f0" strokeWidth={1} strokeDasharray="3 3" />
      {/* 折线 */}
      <path d={linePath} fill="none" stroke={endColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* 数据点 */}
      {series.map((d, i) => {
        const isEnd = i === series.length - 1
        const p = d.p
        const parts: string[] = []
        if (p) {
          if (p.at) parts.push(String(p.at).slice(0, 19).replace('T', ' '))
          parts.push(p.success ? '成功' : '失败')
          if (typeof p.score_delta === 'number') {
            parts.push(`(${p.score_delta >= 0 ? '+' : ''}${p.score_delta})`)
          }
          parts.push(`→ ${d.score.toFixed(1)}`)
          if (typeof p.duration_sec === 'number') parts.push(`耗时 ${p.duration_sec}s`)
          if (p.step_key) parts.push(`步骤 ${p.step_key}`)
          if (p.task_id) parts.push(`任务 #${p.task_id}`)
          if (p.workflow_run_id) parts.push(`工作流运行 #${p.workflow_run_id}`)
          else if (p.parent_workflow_run_id) parts.push(`父工作流 #${p.parent_workflow_run_id}`)
        } else {
          parts.push('当前')
          parts.push(`→ ${d.score.toFixed(1)}`)
        }
        const label = parts.join(' · ')
        return (
          <Tooltip key={i} title={label}>
            <circle
              cx={xAt(i)}
              cy={yAt(d.score)}
              r={isEnd ? 3.5 : 2.5}
              fill={scoreColor(d.score)}
              stroke="#fff"
              strokeWidth={1}
              style={{ cursor: 'pointer' }}
            />
          </Tooltip>
        )
      })}
    </svg>
  )
}

export default ReputationSparkline
