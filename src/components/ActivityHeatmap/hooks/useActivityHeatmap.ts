import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { dashboardApi, type ActivityHeatmapData } from '../../../api/dashboard'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'
import { getErrorMessage } from '../../../utils/errorUtils'

export function useActivityHeatmap() {
  const { tp } = usePageTranslation('dashboard')
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
  //
  //   const interval = setInterval(() => {
  //     loadHeatmapData()
  //   }, refreshInterval)
  //
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

  return {
    heatmapData,
    loading,
    windowWidth,
    loadHeatmapData,
  }
}
