import type { ActivityHeatmapData } from '../../../api/dashboard'

// 获取颜色等级对应的颜色
export const getColorByLevel = (level: number): string => {
  const colors = [
    '#ebedf0', // level 0 - 无活动
    '#9be9a8', // level 1 - 低活动
    '#40c463', // level 2 - 中等活动
    '#30a14e', // level 3 - 高活动
    '#216e39'  // level 4 - 非常高活动
  ]
  return colors[level] || colors[0]
}

// 格式化日期显示
export const formatDate = (dateStr: string, language: string): string => {
  const date = new Date(dateStr)
  const locale = language === 'zh-CN' ? 'zh-CN' : 'en-US'
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 创建网格数据结构：行代表星期几，列代表周
export const createHeatmapGrid = (data: ActivityHeatmapData[]): (ActivityHeatmapData | null)[][] => {
  if (!data || data.length === 0) return []

  // 创建日期到数据的映射
  const dataMap = new Map<string, ActivityHeatmapData>()
  data.forEach(item => {
    dataMap.set(item.date, item)
  })

  // 找到第一个和最后一个日期
  const firstDate = new Date(data[0].date)
  const lastDate = new Date(data[data.length - 1].date)

  // 找到第一个周日（作为第一周的开始）
  const startDate = new Date(firstDate)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  // 找到最后一个周六（作为最后一周的结束）
  const endDate = new Date(lastDate)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  // 计算总周数
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const totalWeeks = Math.ceil(totalDays / 7)

  // 创建7行（星期）x N列（周）的网格
  const grid: (ActivityHeatmapData | null)[][] = []
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    grid[dayOfWeek] = []
    for (let week = 0; week < totalWeeks; week++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + week * 7 + dayOfWeek)

      const dateStr = currentDate.toISOString().split('T')[0]
      const dayData = dataMap.get(dateStr)

      // 只有在数据范围内的日期才显示，否则为null
      if (currentDate >= firstDate && currentDate <= lastDate) {
        grid[dayOfWeek][week] = dayData || {
          date: dateStr,
          count: 0,
          level: 0,
          task_created_count: 0,
          task_updated_count: 0,
          task_status_changed_count: 0,
          task_completed_count: 0,
          first_activity_at: null,
          last_activity_at: null
        }
      } else {
        grid[dayOfWeek][week] = null
      }
    }
  }

  return grid
}

// 计算单元格大小
export const calculateCellSize = (
  totalWeeks: number,
  windowWidth: number
): number => {
  const gap = 2
  const weekLabelWidth = 120 // 星期标签宽度，增加到120px以适应中文字符
  const cardPadding = 48 // Card内边距
  const sidebarWidth = 250 // 侧边栏宽度
  const extraMargin = 40 // 额外边距

  // 可用宽度 = 窗口宽度 - 侧边栏 - 星期标签 - 各种边距
  const availableWidth = windowWidth - sidebarWidth - weekLabelWidth - cardPadding - extraMargin

  // 方块大小 = (可用宽度 - 所有间隙) ÷ 周数，但要确保每个方块至少8px
  return totalWeeks > 0
    ? Math.max(Math.floor((availableWidth - (totalWeeks - 1) * gap) / totalWeeks), 8)
    : 12
}
