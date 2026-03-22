export type StorageProvider = 'local' | 'oss' | 'cos' | 's3'

export interface StorageConfig {
  id: number
  workspace_id: number
  provider: StorageProvider
  is_active: boolean
  // 本地存储配置
  local_base_path?: string
  local_base_url?: string
  // OSS/COS/S3 通用配置
  access_key_id?: string
  access_key_secret?: string
  bucket_name?: string
  region?: string
  endpoint?: string
  // 仅用于 S3/COS
  custom_domain?: string
  // 额外配置
  additional_config?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateStorageConfigRequest {
  provider: StorageProvider
  is_active?: boolean
  local_base_path?: string
  local_base_url?: string
  access_key_id?: string
  access_key_secret?: string
  bucket_name?: string
  region?: string
  endpoint?: string
  custom_domain?: string
  additional_config?: Record<string, any>
}

export interface UpdateStorageConfigRequest {
  provider?: StorageProvider
  is_active?: boolean
  local_base_path?: string
  local_base_url?: string
  access_key_id?: string
  access_key_secret?: string
  bucket_name?: string
  region?: string
  endpoint?: string
  custom_domain?: string
  additional_config?: Record<string, any>
}

export interface StorageConfigListResponse {
  items: StorageConfig[]
  pagination: {
    page: number
    per_page: number
    total: number
    has_prev: boolean
    has_next: boolean
  }
}

export interface UploadFileResponse {
  url: string
  file_path: string
  original_filename: string
  size: number
  mime_type: string
}

export interface StorageProviderOption {
  value: StorageProvider
  label: string
  description: string
  icon?: string
}

export const STORAGE_PROVIDER_OPTIONS: StorageProviderOption[] = [
  {
    value: 'local',
    label: 'Local Storage',
    description: 'Store files on local server filesystem',
  },
  {
    value: 'oss',
    label: 'Aliyun OSS',
    description: 'Alibaba Cloud Object Storage Service',
  },
  {
    value: 'cos',
    label: 'Tencent COS',
    description: 'Tencent Cloud Object Storage',
  },
  {
    value: 's3',
    label: 'AWS S3',
    description: 'Amazon Simple Storage Service (S3 compatible)',
  },
]
