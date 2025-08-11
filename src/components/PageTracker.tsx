import { usePageTracking } from '../hooks/usePageTracking'

/**
 * 页面追踪组件
 * 必须在Router内部使用，用于自动追踪页面浏览
 */
const PageTracker: React.FC = () => {
  usePageTracking()
  return null
}

export default PageTracker
