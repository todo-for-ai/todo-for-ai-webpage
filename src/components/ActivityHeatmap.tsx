import React, { useEffect, useState, useCallback } from 'react'
import { Card, Tooltip, Spin, message, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { dashboardApi, type ActivityHeatmapData } from '../api/dashboard'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { getErrorMessage } from '../utils/errorUtils'
import { useLanguage } from '../contexts/LanguageContext'

interface ActivityHeatmapProps {
  className?: string
  style?: React.CSSProperties
  autoRefresh?: boolean // 是否自动刷新，默认true
  refreshInterval?: number // 刷新间隔（毫秒），默认5分钟
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  className,
  style,
}) => {
  const { tp } = usePageTranslation('dashboard')
  const { language } = useLanguage()
  const [heatmapData, setHeatmapData] = useState<ActivityHeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  const loadHeatmapData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await dashboardApi.getActivityHeatmap()
      setHeatmapData(response.heatmap_data)
    } catch (error) {
      console.error('加载活跃度热力图失败:', error)
      message.error(getErrorMessage(error, tp('heatmap.loadError')))
    } finally {
      setLoading(false)
    }
  }, [tp])

  useEffect(() => {
    loadHeatmapData()
  }, [loadHeatmapData])

  // 自动刷新功能 - 暂时禁用以调试
  // useEffect(() => {
  //   if (!autoRefresh) return

  //   const interval = setInterval(() => {
  //     loadHeatmapData()
  //   }, refreshInterval)

  //   return () => clearInterval(interval)
  // }, [autoRefresh, refreshInterval, loadHeatmapData])

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 获取颜色等级对应的颜色
  const getColorByLevel = (level: number): string => {
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
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const locale = language === 'zh-CN' ? 'zh-CN' : 'en-US'
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 生成详细的tooltip内容
  const getDetailedTooltipContent = (day: ActivityHeatmapData): React.ReactNode => {
    const date = formatDate(day.date)

    if (day.count === 0) {
      return (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{date}</div>
          <div style={{ color: '#999' }}>{tp('heatmap.tooltip.noActivity')}</div>
        </div>
      )
    }

    return (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{date}</div>
        <div style={{ fontSize: '12px' }}>
          <div style={{ marginBottom: '2px' }}>
            📝 {tp('heatmap.tooltip.taskCreated')}: <span style={{ fontWeight: 'bold' }}>{day.task_created_count}</span>
          </div>
          <div style={{ marginBottom: '2px' }}>
            ✏️ {tp('heatmap.tooltip.taskUpdated')}: <span style={{ fontWeight: 'bold' }}>{day.task_updated_count}</span>
          </div>
          <div style={{ marginBottom: '2px' }}>
            🔄 {tp('heatmap.tooltip.taskStatusChanged')}: <span style={{ fontWeight: 'bold' }}>{day.task_status_changed_count}</span>
          </div>
          <div style={{ marginBottom: '2px' }}>
            ✅ {tp('heatmap.tooltip.taskCompleted')}: <span style={{ fontWeight: 'bold' }}>{day.task_completed_count}</span>
          </div>
          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #eee' }}>
            {tp('heatmap.tooltip.totalActivity')}: <span style={{ fontWeight: 'bold', color: '#00b96b' }}>{day.count}</span>
          </div>
          {day.first_activity_at && (
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
              {tp('heatmap.tooltip.activeTime')}: {new Date(day.first_activity_at).toLocaleTimeString(language === 'zh-CN' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              {day.last_activity_at && day.first_activity_at !== day.last_activity_at && (
                <> - {new Date(day.last_activity_at).toLocaleTimeString(language === 'zh-CN' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // 创建网格数据结构：行代表星期几，列代表周
  const createHeatmapGrid = (data: ActivityHeatmapData[]): (ActivityHeatmapData | null)[][] => {
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

  const heatmapGrid = createHeatmapGrid(heatmapData)
  const gridTotalWeeks = heatmapGrid.length > 0 ? heatmapGrid[0].length : 0

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
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
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
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          No activity data available
        </div>
      </Card>
    )
  }

  // 动态方块大小计算 - 考虑星期标签空间
  const totalWeeks = gridTotalWeeks
  const gap = 2
  const weekLabelWidth = 120 // 星期标签宽度，增加到120px以适应中文字符
  const cardPadding = 48 // Card内边距
  const sidebarWidth = 250 // 侧边栏宽度
  const extraMargin = 40 // 额外边距

  // 可用宽度 = 窗口宽度 - 侧边栏 - 星期标签 - 各种边距
  const availableWidth = windowWidth - sidebarWidth - weekLabelWidth - cardPadding - extraMargin

  // 方块大小 = (可用宽度 - 所有间隙) ÷ 周数，但要确保每个方块至少8px
  const cellSize = totalWeeks > 0
    ? Math.max(Math.floor((availableWidth - (totalWeeks - 1) * gap) / totalWeeks), 8)
    : 12

  // cellSize和gap已经在useMemo中定义了

  return (
    <Card
      title={tp('heatmap.title')}
      extra={refreshButton}
      className={className}
      style={style}
    >
      <div style={{ padding: '20px 0' }}>
        {/* 标题 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          fontSize: '16px',
          color: '#666',
          fontWeight: 500
        }}>
          {tp('heatmap.subtitle')}
        </div>

        {/* 热力图容器 - 真正的100%宽度填充 */}
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
              {[
                tp('heatmap.weekdays.sunday'),
                tp('heatmap.weekdays.monday'),
                tp('heatmap.weekdays.tuesday'),
                tp('heatmap.weekdays.wednesday'),
                tp('heatmap.weekdays.thursday'),
                tp('heatmap.weekdays.friday'),
                tp('heatmap.weekdays.saturday')
              ].map((dayLabel, index) => (
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
                  {dayLabel}
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
              {heatmapGrid.map((dayRow, dayOfWeek) => (
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
                          title={getDetailedTooltipContent(dayData)}
                        >
                          <div
                            style={{
                              width: `${cellSize}px`,
                              height: `${cellSize}px`,
                              backgroundColor: getColorByLevel(dayData.level),
                              border: '1px solid #e1e4e8',
                              borderRadius: `${Math.max(Math.floor(cellSize / 4), 2)}px`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)'
                              e.currentTarget.style.borderColor = '#00b96b'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.borderColor = '#e1e4e8'
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

        {/* 图例 - 居中显示 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '24px',
          fontSize: '12px',
          color: '#666'
        }}>
          <span style={{ marginRight: '12px' }}>{tp('heatmap.legend.less')}</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              style={{
                width: `${Math.max(cellSize - 2, 10)}px`,
                height: `${Math.max(cellSize - 2, 10)}px`,
                backgroundColor: getColorByLevel(level),
                border: '1px solid #e1e4e8',
                borderRadius: `${Math.max(Math.floor(cellSize / 4), 2)}px`,
                marginRight: `${gap}px`
              }}
            />
          ))}
          <span style={{ marginLeft: '12px' }}>{tp('heatmap.legend.more')}</span>
        </div>
        </div> {/* 闭合热力图容器 div */}
      </div> {/* 闭合 padding div */}
    </Card>
  )
}

export default ActivityHeatmap
