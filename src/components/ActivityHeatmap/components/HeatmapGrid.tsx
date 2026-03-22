import { Tooltip } from 'antd'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import { getColorByLevel } from '../utils/heatmapHelpers'
import { HeatmapTooltipContent } from './HeatmapTooltip'
import type { ActivityHeatmapData } from '../../../api/dashboard'
import './HeatmapGrid.css'

interface HeatmapGridProps {
  grid: (ActivityHeatmapData | null)[][]
  cellSize: number
  gap: number
}

const WEEKDAY_LABELS = [
  'heatmap.weekdays.sunday',
  'heatmap.weekdays.monday',
  'heatmap.weekdays.tuesday',
  'heatmap.weekdays.wednesday',
  'heatmap.weekdays.thursday',
  'heatmap.weekdays.friday',
  'heatmap.weekdays.saturday'
] as const

export function HeatmapGrid({ grid, cellSize, gap }: HeatmapGridProps) {
  const { tp } = usePageTranslation('dashboard')
  const weekLabelWidth = 120

  return (
    <div
      data-heatmap-container
      style={{
        width: '100%',
        overflowX: 'auto',
        padding: '0',
        margin: '0'
      }}>
      {/* 热力图网格 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${gap}px`,
        width: '100%',
        minWidth: '100%' // 确保至少占满100%宽度
      }}>
        {/* 热力图主体 - 星期标签和方块并排显示 */}
        <div style={{ display: 'flex', gap: `${gap}px`, width: '100%' }}>
          {/* 左侧星期标签列 */}
          <div style={{
            width: `${weekLabelWidth}px`,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: `${gap}px`
          }}>
            {/* 星期标签 - 与热力图方块行完全对应 */}
            {WEEKDAY_LABELS.map((dayLabelKey, index) => (
              <div
                key={index}
                style={{
                  height: `${cellSize}px`,
                  fontSize: `${Math.max(Math.min(cellSize * 0.7, 16), 10)}px`,
                  color: '#666',
                  textAlign: 'right',
                  paddingRight: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  lineHeight: 1
                }}
              >
                {tp(dayLabelKey)}
              </div>
            ))}
          </div>

          {/* 右侧热力图方块 - 使用网格结构 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${gap}px`,
            flex: 1
          }}>
            {grid.map((dayRow, dayOfWeek) => (
              <div key={dayOfWeek} style={{
                display: 'flex',
                gap: `${gap}px`,
                height: `${cellSize}px`,
                alignItems: 'center'
              }}>
                {dayRow.map((dayData, weekIndex) => (
                  <div key={weekIndex} style={{ width: `${cellSize}px`, height: `${cellSize}px` }}>
                    {dayData ? (
                      <Tooltip
                        title={<HeatmapTooltipContent day={dayData} />}
                      >
                        <div
                          className="heatmap-cell"
                          style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            backgroundColor: getColorByLevel(dayData.level),
                            borderRadius: `${Math.max(Math.floor(cellSize / 4), 2)}px`
                          }}
                        />
                      </Tooltip>
                    ) : (
                      // 空白占位符，用于对齐
                      <div style={{ width: `${cellSize}px`, height: `${cellSize}px` }} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
