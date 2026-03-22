/**
 * 个人资料表单 Hook
 */

import { useState, useEffect, useCallback } from 'react'
import type { FormInstance } from 'antd'
import type { User } from '../../../stores/useAuthStore'
import type { ProfileFormValues } from '../types'

interface UseProfileFormReturn {
  isEditing: boolean
  isProfileSaving: boolean
  setIsEditing: (editing: boolean) => void
  handleUpdateProfile: (values: ProfileFormValues) => Promise<void>
}

export const useProfileForm = (
  user: User | null,
  form: FormInstance,
  updateUser: (data: Partial<User>) => Promise<void>,
  messageApi: { success: (msg: string) => void; error: (msg: string) => void },
  tp: (key: string) => string
): UseProfileFormReturn => {
  const [isEditing, setIsEditing] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  // 同步表单值
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        full_name: user.full_name,
        nickname: user.nickname,
        bio: user.bio,
        timezone: user.timezone,
        locale: user.locale,
      })
    }
  }, [user, form])

  const handleUpdateProfile = useCallback(
    async (values: ProfileFormValues) => {
      try {
        setIsProfileSaving(true)
        await updateUser(values)
        messageApi.success(tp('messages.updateSuccess'))
        setIsEditing(false)
      } catch (error: unknown) {
        const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
        messageApi.error(errorMessage || tp('messages.updateFailed'))
      } finally {
        setIsProfileSaving(false)
      }
    },
    [messageApi, tp, updateUser]
  )

  return {
    isEditing,
    isProfileSaving,
    setIsEditing,
    handleUpdateProfile,
  }
}
