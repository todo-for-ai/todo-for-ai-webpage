/**
 * 标签页状态管理 Hook
 */

import { useState, useEffect, useCallback } from 'react'

const VALID_TABS = ['profile', 'tokens']

interface UseTabStateReturn {
  activeTab: string
  handleTabChange: (key: string) => void
}

export const useTabState = (
  searchParams: URLSearchParams,
  setSearchParams: (params: URLSearchParams, options?: { replace?: boolean }) => void
): UseTabStateReturn => {
  const getInitialTab = useCallback(() => {
    const tabParam = searchParams.get('tab')
    return VALID_TABS.includes(tabParam || '') ? tabParam! : 'profile'
  }, [searchParams])

  const [activeTab, setActiveTab] = useState(getInitialTab())

  // 监听 URL 参数变化
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    } else if (!tabParam && activeTab !== 'profile') {
      setActiveTab('profile')
    }
  }, [searchParams, activeTab])

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key)
      const newSearchParams = new URLSearchParams(searchParams)
      if (key === 'profile') {
        newSearchParams.delete('tab')
      } else {
        newSearchParams.set('tab', key)
      }
      setSearchParams(newSearchParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  return {
    activeTab,
    handleTabChange,
  }
}
