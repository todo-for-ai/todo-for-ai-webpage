import React, { useMemo } from 'react'
import { Card, Tooltip } from 'antd'
import { useActivityData } from '../hooks/useActivityData'
import { HeatmapGrid } from './HeatmapGrid'
import { HeatmapLegend } from './HeatmapLegend'
import { HeatmapStats } from './HeatmapStats'

interface ActivityHeatmapProps {
  data?: any[]
  loading?: boolean
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ 
  data: externalData, 
  loading: externalLoading 
}) => {
  const {
    data,
    loading,
    stats,
    heatmapData,
    colorScale,
    getColorForValue
  } = useActivityData(externalData, externalLoading)

  const renderCell = (value: number, date: string) => {
    const color = getColorForValue(value)
    const intensity = value === 0 ? 0 : Math.log(value + 1) / Math.log(stats.max + 1)
    
    return (
      <Tooltip
        key={date}
        title={`${date}: ${value} 活动`}
      >
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            backgroundColor: color,
            opacity: value === 0 ? 0.2 : 0.4 + intensity * 0.6,
          }}
        />
      </Tooltip>
    )
  }

  return (
    <Card>
      <div style={{ marginBottom: '16px' }}>
        <HeatmapStats stats={stats} />
      </div>

      <HeatmapGrid
        data={heatmapData}
        renderCell={renderCell}
        loading={loading}
      />

      <HeatmapLegend
        colorScale={colorScale}
        getColorForValue={getColorForValue}
      />
    </Card>
  )
}

export default ActivityHeatmap
