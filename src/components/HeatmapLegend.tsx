// 占位文件 - HeatmapLegend
import React from 'react'

interface HeatmapLegendProps {
  colorScale?: any
  getColorForValue?: (value: number) => string
}

export const HeatmapLegend: React.FC<HeatmapLegendProps> = ({ colorScale, getColorForValue }) => {
  return <div>Heatmap Legend</div>
}

export default HeatmapLegend
