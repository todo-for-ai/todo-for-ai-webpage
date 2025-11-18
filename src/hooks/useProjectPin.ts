import { useState, useCallback } from 'react'
import { message } from 'antd'
import { pinsApi } from '../api/pins'
import { useTranslation } from '../i18n/hooks/useTranslation'

export const useProjectPin = (projectId?: string) => {
  const [isPinned, setIsPinned] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const { t } = useTranslation('pinManager')

  // 检查项目Pin状态
  const checkPinStatus = useCallback(async () => {
    if (!projectId) return
    try {
      const response = await pinsApi.checkPinStatus(parseInt(projectId))
      console.log('Pin status check response:', response)

      // 更宽松的响应检查，支持多种响应格式
      let isPinnedValue = false

      if (response) {
        // 直接响应格式：{is_pinned: true, project_id: 24}
        if (typeof response.is_pinned === 'boolean') {
          isPinnedValue = response.is_pinned
        }
        // 包装响应格式：{data: {is_pinned: true, project_id: 24}, ...}
        else if ((response as any).data && typeof (response as any).data.is_pinned === 'boolean') {
          isPinnedValue = (response as any).data.is_pinned
        }
        // 其他可能的格式
        else if (typeof response === 'boolean') {
          isPinnedValue = response
        }
      }

      console.log('Setting isPinned to:', isPinnedValue)
      setIsPinned(isPinnedValue)
    } catch (error) {
      console.error('Failed to check pin status:', error)
      // 出错时不改变当前状态，避免错误的状态重置
      console.log('Keeping current pin status due to error')
    }
  }, [projectId])

  // 切换Pin状态
  const handleTogglePin = useCallback(async () => {
    if (!projectId) return

    setPinLoading(true)
    try {
      if (isPinned) {
        await pinsApi.unpinProject(parseInt(projectId))
        setIsPinned(false)
        message.success(t('messages.unpinSuccess'))
      } else {
        // 检查Pin数量限制
        const pinsResponse = await pinsApi.getUserPins()
        if (pinsResponse && pinsResponse.pins && pinsResponse.pins.length >= 10) {
          message.warning(t('messages.pinLimitReached'))
          return
        }

        await pinsApi.pinProject(parseInt(projectId))
        setIsPinned(true)
        message.success(t('messages.pinSuccess'))
      }
      // 通知导航栏更新（通过自定义事件）
      window.dispatchEvent(new CustomEvent('pinUpdated'))
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || t('messages.pinFailed')
      message.error(errorMessage)
    } finally {
      setPinLoading(false)
    }
  }, [projectId, isPinned, t])

  return {
    isPinned,
    pinLoading,
    checkPinStatus,
    handleTogglePin
  }
}
