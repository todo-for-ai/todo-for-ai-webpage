import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { storageConfigApi } from '../../../api/storage'
import type {
  StorageConfig,
  CreateStorageConfigRequest,
  UpdateStorageConfigRequest,
} from '../../../api/storage/types'
import i18n from '../../../i18n'

const emptyPagination = {
  page: 1,
  per_page: 20,
  total: 0,
  has_prev: false,
  has_next: false,
}

export function useStorageConfigs(workspaceId: number | null) {
  const [configs, setConfigs] = useState<StorageConfig[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [loading, setLoading] = useState(false)
  const [activeConfig, setActiveConfig] = useState<StorageConfig | null>(null)

  const loadConfigs = useCallback(async () => {
    if (!workspaceId) {
      setConfigs([])
      setPagination(emptyPagination)
      setActiveConfig(null)
      return
    }

    try {
      setLoading(true)
      const data = await storageConfigApi.getStorageConfigs(workspaceId, {
        page: pagination.page,
        per_page: pagination.per_page,
      })
      setConfigs(data.items || [])
      setPagination(data.pagination || emptyPagination)
      setActiveConfig(data.items?.find((c) => c.is_active) || null)
    } catch (error: any) {
      message.error(error?.message || i18n.t('storage:messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, pagination.page, pagination.per_page])

  const createConfig = useCallback(
    async (payload: CreateStorageConfigRequest) => {
      if (!workspaceId) return null

      try {
        setLoading(true)
        const created = await storageConfigApi.createStorageConfig(workspaceId, payload)
        message.success(i18n.t('storage:messages.createSuccess'))
        await loadConfigs()
        return created
      } catch (error: any) {
        message.error(error?.message || i18n.t('storage:messages.createFailed'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, loadConfigs]
  )

  const updateConfig = useCallback(
    async (configId: number, payload: UpdateStorageConfigRequest) => {
      if (!workspaceId) return null

      try {
        setLoading(true)
        const updated = await storageConfigApi.updateStorageConfig(workspaceId, configId, payload)
        message.success(i18n.t('storage:messages.updateSuccess'))
        await loadConfigs()
        return updated
      } catch (error: any) {
        message.error(error?.message || i18n.t('storage:messages.updateFailed'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, loadConfigs]
  )

  const deleteConfig = useCallback(
    async (configId: number) => {
      if (!workspaceId) return false

      try {
        setLoading(true)
        await storageConfigApi.deleteStorageConfig(workspaceId, configId)
        message.success(i18n.t('storage:messages.deleteSuccess'))
        await loadConfigs()
        return true
      } catch (error: any) {
        message.error(error?.message || i18n.t('storage:messages.deleteFailed'))
        return false
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, loadConfigs]
  )

  const setActive = useCallback(
    async (configId: number) => {
      if (!workspaceId) return null

      try {
        setLoading(true)
        const updated = await storageConfigApi.setActiveStorageConfig(workspaceId, configId)
        message.success(i18n.t('storage:messages.activateSuccess'))
        await loadConfigs()
        return updated
      } catch (error: any) {
        message.error(error?.message || i18n.t('storage:messages.activateFailed'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, loadConfigs]
  )

  const updatePage = useCallback((page: number, perPage?: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
      per_page: perPage || prev.per_page,
    }))
  }, [])

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  return {
    configs,
    pagination,
    loading,
    activeConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    setActive,
    updatePage,
    reload: loadConfigs,
  }
}
