/* eslint-disable @typescript-eslint/no-explicit-any */
// 占位文件 - HeatmapLegend
import React from 'react'

interface HeatmapLegendProps {
  colorScale?: any
  getColorForValue?: (value: number) => string
}

export const HeatmapLegend: React.FC<HeatmapLegendProps> = () => {
  return <div>Heatmap Legend</div>
}

export default HeatmapLegend
