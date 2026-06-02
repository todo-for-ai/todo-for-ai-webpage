/* eslint-disable @typescript-eslint/no-explicit-any */
// 占位文件 - HeatmapGrid
import React from 'react'

interface HeatmapGridProps {
  data?: any
  renderCell?: (value: number, date: string) => React.ReactElement
  loading?: boolean
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = () => {
  return <div>Heatmap Grid</div>
}

export default HeatmapGrid
