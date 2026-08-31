/**
 * 头像管理 Hook
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  getBuiltinAvatarOptions,
  getStoredAvatarToken,
  pickRandomBuiltinAvatar,
  resolveUserAvatarSrc,
  setStoredAvatarToken,
  clearStoredAvatarToken,
} from '../../../utils/defaultAvatars'
import type { User } from '../../../stores/useAuthStore'

const AVATAR_PAGE_SIZE = 60

interface UseAvatarReturn {
  localAvatarToken: string | null
  avatarSrc: string
  avatarPage: number
  avatarPageCount: number
  pagedAvatarOptions: ReturnType<typeof getBuiltinAvatarOptions>
  avatarPreviewOptions: ReturnType<typeof getBuiltinAvatarOptions>
  builtinAvatarOptions: ReturnType<typeof getBuiltinAvatarOptions>
  avatarIdentitySeed: string
  isAvatarUpdating: boolean
  setAvatarPage: (page: number) => void
  setIsAvatarUpdating: (updating: boolean) => void
  handleSelectAvatar: (token: string) => Promise<boolean>
  handleRandomAvatar: () => Promise<void>
  updateAvatarToken: (
    token: string,
    successMessageKey: string,
    failureMessageKey: string
  ) => Promise<boolean>
}

export const useAvatar = (
  user: User | null,
  currentAvatarValue: string | null | undefined,
  messageApi: { success: (msg: string) => void; error: (msg: string) => void },
  tp: (key: string) => string,
  updateUser: (data: { preferences?: { avatar_token?: string } }) => Promise<void>
): UseAvatarReturn => {
  const [localAvatarToken, setLocalAvatarToken] = useState<string | null>(null)
  const [avatarPage, setAvatarPage] = useState(1)
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false)

  const avatarIdentitySeed = useMemo(
    () => (user ? `${user.id}-${user.username || user.email || 'user'}` : 'guest-user'),
    [user]
  )

  const builtinAvatarOptions = useMemo(
    () => getBuiltinAvatarOptions(avatarIdentitySeed),
    [avatarIdentitySeed]
  )

  const avatarSrc = useMemo(
    () => resolveUserAvatarSrc(currentAvatarValue, avatarIdentitySeed),
    [currentAvatarValue, avatarIdentitySeed]
  )

  const avatarPageCount = useMemo(
    () => Math.max(1, Math.ceil(builtinAvatarOptions.length / AVATAR_PAGE_SIZE)),
    [builtinAvatarOptions.length]
  )

  const avatarPreviewOptions = useMemo(
    () => builtinAvatarOptions.slice(0, 12),
    [builtinAvatarOptions]
  )

  const pagedAvatarOptions = useMemo(() => {
    const start = (avatarPage - 1) * AVATAR_PAGE_SIZE
    return builtinAvatarOptions.slice(start, start + AVATAR_PAGE_SIZE)
  }, [avatarPage, builtinAvatarOptions])

  // 同步本地头像 token
  useEffect(() => {
    if (!user?.id) {
      setLocalAvatarToken(null)
      return
    }
    setLocalAvatarToken(getStoredAvatarToken(user.id))
  }, [user?.id])

  // 页码边界检查
  useEffect(() => {
    if (avatarPage > avatarPageCount) {
      setAvatarPage(avatarPageCount)
    }
  }, [avatarPage, avatarPageCount])

  const updateAvatarToken = useCallback(
    async (
      token: string,
      successMessageKey: string,
      failureMessageKey: string
    ): Promise<boolean> => {
      if (!user) return false

      const previousLocalToken = localAvatarToken

      try {
        setIsAvatarUpdating(true)
        if (user.id) {
          setStoredAvatarToken(user.id, token)
        }
        setLocalAvatarToken(token)

        await updateUser({
          preferences: { avatar_token: token },
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
    },
    [localAvatarToken, messageApi, tp, updateUser, user]
  )

  const handleRandomAvatar = useCallback(async () => {
    if (!user) return

    const selected = pickRandomBuiltinAvatar(builtinAvatarOptions, currentAvatarValue)
    if (!selected) return

    await updateAvatarToken(
      selected.token,
      'avatar.messages.randomSuccess',
      'avatar.messages.randomFailed'
    )
  }, [builtinAvatarOptions, currentAvatarValue, updateAvatarToken, user])

  const handleSelectAvatar = useCallback(
    async (token: string): Promise<boolean> => {
      if (token === currentAvatarValue) return true

      return await updateAvatarToken(
        token,
        'avatar.messages.selectSuccess',
        'avatar.messages.selectFailed'
      )
    },
    [currentAvatarValue, updateAvatarToken]
  )

  return {
    localAvatarToken,
    avatarSrc,
    avatarPage,
    avatarPageCount,
    pagedAvatarOptions,
    avatarPreviewOptions,
    builtinAvatarOptions,
    avatarIdentitySeed,
    isAvatarUpdating,
    setAvatarPage,
    setIsAvatarUpdating,
    handleSelectAvatar,
    handleRandomAvatar,
    updateAvatarToken,
  }
}
