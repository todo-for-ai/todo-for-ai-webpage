import { getColorByLevel } from '../utils/heatmapHelpers'
import './HeatmapLegend.css'

interface HeatmapLegendProps {
  cellSize: number
  gap: number
}

export function HeatmapLegend({ cellSize, gap }: HeatmapLegendProps) {
  const levels = [0, 1, 2, 3, 4]

  return (
    <div className="heatmap-legend">
      <span className="heatmap-legend__label heatmap-legend__label--less">Less</span>
      {levels.map(level => (
        <div
          key={level}
          className="heatmap-legend__item"
          style={{
            width: `${Math.max(cellSize - 2, 10)}px`,
            height: `${Math.max(cellSize - 2, 10)}px`,
            backgroundColor: getColorByLevel(level),
            borderRadius: `${Math.max(Math.floor(cellSize / 4), 2)}px`,
            marginRight: `${gap}px`
          }}
        />
      ))}
      <span className="heatmap-legend__label heatmap-legend__label--more">More</span>
    </div>
  )
}
