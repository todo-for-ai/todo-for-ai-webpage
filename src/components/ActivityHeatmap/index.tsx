import { Card, Spin, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'
import { useActivityHeatmap } from './hooks/useActivityHeatmap'
import { createHeatmapGrid, calculateCellSize } from './utils/heatmapHelpers'
import { HeatmapGrid } from './components/HeatmapGrid'
import { HeatmapLegend } from './components/HeatmapLegend'
import type { ActivityHeatmapProps } from './types'
import './ActivityHeatmap.css'

export function ActivityHeatmap({
  className,
  style,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 默认5分钟
}: ActivityHeatmapProps) {
  const { tp } = usePageTranslation('dashboard')
  const { heatmapData, loading, windowWidth, loadHeatmapData } = useActivityHeatmap({
    autoRefresh,
    refreshInterval
  })

  const heatmapGrid = createHeatmapGrid(heatmapData)
  const gridTotalWeeks = heatmapGrid.length > 0 ? heatmapGrid[0].length : 0

  const gap = 2
  const cellSize = calculateCellSize(gridTotalWeeks, windowWidth)

  const refreshButton = (
    <Button
      type="text"
      icon={<ReloadOutlined />}
      onClick={loadHeatmapData}
      loading={loading}
      size="small"
    />
  )

  if (loading) {
    return (
      <Card
        title={tp('heatmap.title')}
        extra={refreshButton}
        className={className}
        style={style}
      >
        <div className="activity-heatmap__loading">
          <Spin size="large" />
        </div>
      </Card>
    )
  }

  // 如果没有数据，显示空状态
  if (!heatmapData || heatmapData.length === 0) {
    return (
      <Card
        title={tp('heatmap.title')}
        extra={refreshButton}
        className={className}
        style={style}
      >
        <div className="activity-heatmap__empty">
          No activity data available
        </div>
      </Card>
    )
  }

  return (
    <Card
      title={tp('heatmap.title')}
      extra={refreshButton}
      className={className}
      style={style}
    >
      <div className="activity-heatmap__content">
        {/* 标题 */}
        <div className="activity-heatmap__subtitle">
          {tp('heatmap.subtitle')}
        </div>

        <HeatmapGrid grid={heatmapGrid} cellSize={cellSize} gap={gap} />
        <HeatmapLegend cellSize={cellSize} gap={gap} />
      </div>
    </Card>
  )
}

export default ActivityHeatmap
