import type { ActivityHeatmapData } from '../../api/dashboard'

export interface ActivityHeatmapProps {
  className?: string
  style?: React.CSSProperties
  autoRefresh?: boolean // 是否自动刷新，默认true
  refreshInterval?: number // 刷新间隔（毫秒），默认5分钟
}

export interface HeatmapGridData {
  grid: (ActivityHeatmapData | null)[][]
  totalWeeks: number
}
