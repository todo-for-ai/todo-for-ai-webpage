/**
 * Profile 类型定义
 */

export interface ProfileFormValues {
  username: string
  full_name: string
  nickname: string
  bio: string
  timezone: string
  locale: string
}

export interface AvatarOption {
  token: string
  label: string
  src: string
}
