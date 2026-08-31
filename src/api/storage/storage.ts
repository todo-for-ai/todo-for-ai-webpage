import { apiClient } from '../client/index.js'
import type {
  StorageConfig,
  StorageConfigListResponse,
  CreateStorageConfigRequest,
  UpdateStorageConfigRequest,
  UploadFileResponse,
} from './types'

export class StorageConfigApi {
  async getStorageConfigs(workspaceId: number, params?: { page?: number; per_page?: number }) {
    const query = new URLSearchParams()
    if (params?.page) {
      query.set('page', String(params.page))
    }
    if (params?.per_page) {
      query.set('per_page', String(params.per_page))
    }

    const qs = query.toString()
    const url = `/workspaces/${workspaceId}/storage-configs${qs ? `?${qs}` : ''}`
    return apiClient.get<StorageConfigListResponse>(url)
  }

  async getStorageConfig(workspaceId: number, configId: number) {
    return apiClient.get<StorageConfig>(`/workspaces/${workspaceId}/storage-configs/${configId}`)
  }

  async createStorageConfig(workspaceId: number, data: CreateStorageConfigRequest) {
    return apiClient.post<StorageConfig>(`/workspaces/${workspaceId}/storage-configs`, data)
  }

  async updateStorageConfig(workspaceId: number, configId: number, data: UpdateStorageConfigRequest) {
    return apiClient.request<StorageConfig>(`/workspaces/${workspaceId}/storage-configs/${configId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async deleteStorageConfig(workspaceId: number, configId: number) {
    return apiClient.delete(`/workspaces/${workspaceId}/storage-configs/${configId}`)
  }

  async setActiveStorageConfig(workspaceId: number, configId: number) {
    return apiClient.post<StorageConfig>(`/workspaces/${workspaceId}/storage-configs/${configId}/activate`, {})
  }

  // 上传文件到存储
  async uploadFile(
    workspaceId: number,
    file: File,
    folder: string = 'agents/avatars',
    onProgress?: (progress: number) => void
  ): Promise<UploadFileResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    return apiClient.upload<UploadFileResponse>(
      `/workspaces/${workspaceId}/storage/upload`,
      formData,
      onProgress
    )
  }

  // 获取当前激活的存储配置
  async getActiveStorageConfig(workspaceId: number): Promise<StorageConfig | null> {
    try {
      const configs = await this.getStorageConfigs(workspaceId, { page: 1, per_page: 100 })
      const activeConfig = configs.items.find((c) => c.is_active)
      return activeConfig || null
    } catch {
      return null
    }
  }
}

export const storageConfigApi = new StorageConfigApi()
