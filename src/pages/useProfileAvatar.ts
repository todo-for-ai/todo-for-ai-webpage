import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  clearStoredAvatarToken,
  getBuiltinAvatarOptions,
  getStoredAvatarToken,
  pickRandomBuiltinAvatar,
  resolveUserAvatarSrc,
  setStoredAvatarToken,
} from '../utils/defaultAvatars'

const AVATAR_PAGE_SIZE = 60

/**
 * 头像选择域：本地/偏好头像解析、内置头像分页、选择/随机/更新动作（含失败回滚）。
 * 由 Profile 页面原样拆出。
 */
export function useProfileAvatar(
  user: any,
  updateUser: (values: any) => Promise<void> | void,
  messageApi: { success: (k: string) => void; error: (k: string) => void },
  tp: (k: string) => string,
) {
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false)
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false)
  const [avatarPage, setAvatarPage] = useState(1)
  const [localAvatarToken, setLocalAvatarToken] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLocalAvatarToken(null)
      return
    }
    setLocalAvatarToken(getStoredAvatarToken(user.id))
  }, [user?.id])

  const avatarIdentitySeed = user
    ? `${user.id}-${user.username || user.email || 'user'}`
    : 'guest-user'
  const preferenceAvatarToken = typeof user?.preferences?.avatar_token === 'string'
    ? user.preferences.avatar_token
    : null
  const currentAvatarValue = localAvatarToken || preferenceAvatarToken || user?.avatar_url
  const builtinAvatarOptions = useMemo(
    () => getBuiltinAvatarOptions(avatarIdentitySeed),
    [avatarIdentitySeed]
  )
  const avatarSrc = useMemo(
    () => resolveUserAvatarSrc(currentAvatarValue, avatarIdentitySeed),
    [currentAvatarValue, avatarIdentitySeed]
  )
  const avatarPageCount = Math.max(1, Math.ceil(builtinAvatarOptions.length / AVATAR_PAGE_SIZE))
  const avatarPreviewOptions = useMemo(
    () => builtinAvatarOptions.slice(0, 12),
    [builtinAvatarOptions]
  )
  const pagedAvatarOptions = useMemo(() => {
    const start = (avatarPage - 1) * AVATAR_PAGE_SIZE
    return builtinAvatarOptions.slice(start, start + AVATAR_PAGE_SIZE)
  }, [avatarPage, builtinAvatarOptions])

  useEffect(() => {
    if (avatarPage > avatarPageCount) {
      setAvatarPage(avatarPageCount)
    }
  }, [avatarPage, avatarPageCount])

  useEffect(() => {
    if (!isAvatarPickerOpen) {
      return
    }

    const selectedIndex = builtinAvatarOptions.findIndex((option) => option.token === currentAvatarValue)
    if (selectedIndex < 0) {
      return
    }

    const selectedPage = Math.floor(selectedIndex / AVATAR_PAGE_SIZE) + 1
    if (selectedPage !== avatarPage) {
      setAvatarPage(selectedPage)
    }
  }, [avatarPage, builtinAvatarOptions, currentAvatarValue, isAvatarPickerOpen])

  const updateAvatarToken = useCallback(async (
    token: string,
    successMessageKey: string,
    failureMessageKey: string
  ): Promise<boolean> => {
    if (!user) {
      return false
    }

    const previousLocalToken = localAvatarToken

    try {
      setIsAvatarUpdating(true)
      if (user.id) {
        setStoredAvatarToken(user.id, token)
      }
      setLocalAvatarToken(token)

      await updateUser({
        preferences: {
          avatar_token: token,
        },
      })

      messageApi.success(tp(successMessageKey))
      return true
    } catch (error) {
      console.error('Failed to update avatar:', error)

      if (user.id) {
        if (previousLocalToken) {
          setStoredAvatarToken(user.id, previousLocalToken)
        } else {
          clearStoredAvatarToken(user.id)
        }
      }
      setLocalAvatarToken(previousLocalToken)

      messageApi.error(tp(failureMessageKey))
      return false
    } finally {
      setIsAvatarUpdating(false)
    }
  }, [localAvatarToken, messageApi, tp, updateUser, user])

  const handleRandomAvatar = useCallback(async () => {
    if (!user) {
      return
    }

    const selected = pickRandomBuiltinAvatar(builtinAvatarOptions, currentAvatarValue)
    if (!selected) {
      return
    }

    await updateAvatarToken(
      selected.token,
      'avatar.messages.randomSuccess',
      'avatar.messages.randomFailed'
    )
  }, [builtinAvatarOptions, currentAvatarValue, updateAvatarToken, user])

  const handleSelectAvatar = useCallback(async (token: string) => {
    if (token === currentAvatarValue) {
      setIsAvatarPickerOpen(false)
      return
    }

    const updated = await updateAvatarToken(
      token,
      'avatar.messages.selectSuccess',
      'avatar.messages.selectFailed'
    )
    if (updated) {
      setIsAvatarPickerOpen(false)
    }
  }, [currentAvatarValue, updateAvatarToken])

  return {
    isAvatarUpdating,
    setIsAvatarUpdating,
    isAvatarPickerOpen,
    setIsAvatarPickerOpen,
    avatarPage,
    setAvatarPage,
    localAvatarToken,
    setLocalAvatarToken,
    avatarIdentitySeed,
    currentAvatarValue,
    avatarPageCount,
    builtinAvatarOptions,
    avatarSrc,
    avatarPreviewOptions,
    pagedAvatarOptions,
    updateAvatarToken,
    handleRandomAvatar,
    handleSelectAvatar,
  }
}
