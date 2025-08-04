import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../utils/analytics'

/**
 * 自动追踪页面浏览的Hook
 * 在路由变化时自动发送页面浏览事件到Google Analytics
 */
export const usePageTracking = () => {
  const location = useLocation()

  useEffect(() => {
    // 获取页面标题
    const pageTitle = document.title

    // 发送页面浏览事件
    trackPageView(location.pathname + location.search, pageTitle)
  }, [location])
}

/**
 * 手动追踪页面浏览的Hook
 * 返回一个函数，可以手动调用来追踪页面浏览
 */
export const useManualPageTracking = () => {
  const trackPage = (path?: string, title?: string) => {
    const currentPath = path || (window.location.pathname + window.location.search)
    const currentTitle = title || document.title
    trackPageView(currentPath, currentTitle)
  }

  return { trackPage }
}
