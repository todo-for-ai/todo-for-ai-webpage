import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const updateUser = vi.fn(async () => {})
const messageApi = { success: vi.fn(), error: vi.fn() }
const tp = vi.fn((k: string) => k)

const mockUser: any = {
  id: 42,
  username: 'alice',
  email: 'alice@x.io',
  nickname: 'Alice',
  full_name: 'Alice',
  bio: '',
  timezone: 'Asia/Shanghai',
  locale: 'zh-CN',
  avatar_url: '',
  preferences: {},
}

const { clearStoredAvatarToken, getBuiltinAvatarOptions, getStoredAvatarToken, pickRandomBuiltinAvatar, resolveUserAvatarSrc, setStoredAvatarToken } = vi.hoisted(() => ({
  clearStoredAvatarToken: vi.fn(),
  getBuiltinAvatarOptions: vi.fn((seed: string) => [{ label: 'a', token: `tok-a-${seed}` }, { label: 'b', token: 'tok-b' }]),
  getStoredAvatarToken: vi.fn(() => 'stored-token'),
  pickRandomBuiltinAvatar: vi.fn(() => ({ label: 'b', token: 'tok-b' })),
  resolveUserAvatarSrc: vi.fn(() => 'data:image/png;base64,x'),
  setStoredAvatarToken: vi.fn(),
}))
vi.mock('../../../src/utils/defaultAvatars', () => ({
  clearStoredAvatarToken,
  getBuiltinAvatarOptions,
  getStoredAvatarToken,
  pickRandomBuiltinAvatar,
  resolveUserAvatarSrc,
  setStoredAvatarToken,
}))

import { useProfileAvatar } from '../../../src/pages/useProfileAvatar'

describe('useProfileAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateUser.mockClear()
    getStoredAvatarToken.mockReturnValue('stored-token')
  })

  it('登录用户装载本地 token 与内置头像分页', async () => {
    const { result } = renderHook(() => useProfileAvatar(mockUser, updateUser, messageApi, tp))
    await waitFor(() => expect(result.current.builtinAvatarOptions).toHaveLength(2))
    expect(result.current.currentAvatarValue).toBe('stored-token')
    expect(result.current.avatarPageCount).toBe(1)
    expect(result.current.avatarPreviewOptions).toHaveLength(2)
    expect(result.current.pagedAvatarOptions).toHaveLength(2)
  })

  it('updateAvatarToken 成功：写本地 token 并同步偏好', async () => {
    const successSpy = vi.spyOn(messageApi, 'success')
    const { result } = renderHook(() => useProfileAvatar(mockUser, updateUser, messageApi, tp))
    await waitFor(() => expect(result.current.builtinAvatarOptions).toBeTruthy())
    let ok = false
    await act(async () => {
      ok = await result.current.updateAvatarToken('tok-new', 'avatar.ok', 'avatar.fail')
    })
    expect(ok).toBe(true)
    expect(setStoredAvatarToken).toHaveBeenCalledWith(42, 'tok-new')
    expect(updateUser).toHaveBeenCalledWith({ preferences: { avatar_token: 'tok-new' } })
    expect(messageApi.success).toHaveBeenCalledWith('avatar.ok')
    expect(result.current.isAvatarUpdating).toBe(false)
  })

  it('updateAvatarToken 失败：回滚本地 token', async () => {
    updateUser.mockRejectedValueOnce(new Error('boom'))
    const errorSpy = vi.spyOn(messageApi, 'error').mockImplementation(() => undefined)
    const { result } = renderHook(() => useProfileAvatar(mockUser, updateUser, messageApi, tp))
    await waitFor(() => expect(result.current.localAvatarToken).toBe('stored-token'))
    let ok = false
    await act(async () => {
      ok = await result.current.updateAvatarToken('tok-x', 'ok.key', 'fail.key')
    })
    expect(ok).toBe(false)
    // 本地此前已有 token → 回滚为该 token 而非清除
    expect(setStoredAvatarToken).toHaveBeenCalledWith(42, 'stored-token')
    expect(clearStoredAvatarToken).not.toHaveBeenCalled()
    expect(result.current.localAvatarToken).toBe('stored-token')
    expect(messageApi.error).toHaveBeenCalledWith('fail.key')
    errorSpy.mockRestore()
  })

  it('handleRandomAvatar 随机选择并复用更新链路', async () => {
    const { result } = renderHook(() => useProfileAvatar(mockUser, updateUser, messageApi, tp))
    await waitFor(() => expect(result.current.builtinAvatarOptions).toBeTruthy())
    await act(async () => {
      await result.current.handleRandomAvatar()
    })
    expect(pickRandomBuiltinAvatar).toHaveBeenCalled()
    expect(updateUser).toHaveBeenCalledWith({ preferences: { avatar_token: 'tok-b' } })
  })

  it('handleSelectAvatar 同 token 仅关闭选择器', async () => {
    const { result } = renderHook(() => useProfileAvatar(mockUser, updateUser, messageApi, tp))
    await waitFor(() => expect(result.current.currentAvatarValue).toBe('stored-token'))
    act(() => {
      result.current.setIsAvatarPickerOpen(true)
    })
    await act(async () => {
      await result.current.handleSelectAvatar('stored-token')
    })
    expect(result.current.isAvatarPickerOpen).toBe(false)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('未登录时更新动作直接返回 false', async () => {
    let ok = false
    const { result } = renderHook(() => useProfileAvatar(null as never, updateUser, messageApi, tp))
    await act(async () => {
      ok = await result.current.updateAvatarToken('tok', 'ok', 'fail')
    })
    expect(ok).toBe(false)
  })
})

describe('useProfileAvatar 分支补全', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStoredAvatarToken.mockReturnValue(null)
  })

  const setup = () => renderHook(() => useProfileAvatar(mockUser, updateUser, messageApi, tp))

  it('无本地 token 时更新失败走 clearStoredAvatarToken', async () => {
    updateUser.mockRejectedValueOnce(new Error('boom'))
    const errorSpy = vi.spyOn(messageApi, 'error').mockImplementation(() => undefined)
    const { result } = setup()
    await waitFor(() => expect(result.current.builtinAvatarOptions).toBeTruthy())
    let ok = false
    await act(async () => {
      ok = await result.current.updateAvatarToken('tok-x', 'ok.k', 'fail.k')
    })
    expect(ok).toBe(false)
    // 无先前本地 token → 回滚走 clear 而非 set
    expect(clearStoredAvatarToken).toHaveBeenCalledWith(42)
    expect(result.current.localAvatarToken).toBeNull()
    errorSpy.mockRestore()
  })

  it('handleSelectAvatar 选择不同 token 成功后关闭选择器', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.builtinAvatarOptions).toBeTruthy())
    act(() => {
      result.current.setIsAvatarPickerOpen(true)
    })
    await act(async () => {
      await result.current.handleSelectAvatar('tok-a-42-alice')
    })
    expect(result.current.isAvatarPickerOpen).toBe(false)
    expect(result.current.localAvatarToken).toBe('tok-a-42-alice')
  })

  it('handleRandomAvatar 无可选头像时早退', async () => {
    getBuiltinAvatarOptions.mockReturnValueOnce([])
    const { result } = setup()
    await waitFor(() => expect(result.current.builtinAvatarOptions).toBeTruthy())
    await act(async () => {
      await result.current.handleRandomAvatar()
    })
    expect(result.current.isAvatarUpdating).toBe(false)
  })
})

describe('useProfileAvatar 守卫分支', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getStoredAvatarToken.mockReturnValue('tok-1')
  })

  it('handleSelectAvatar 同 token 早退（仅关闭选择器）', async () => {
    const { result } = renderHook(() => useProfileAvatar(mockUser, updateUser, messageApi, tp))
    await waitFor(() => expect(result.current.localAvatarToken).toBe('tok-1'))
    act(() => {
      result.current.setIsAvatarPickerOpen(true)
    })
    await act(async () => {
      await result.current.handleSelectAvatar('tok-1')
    })
    expect(result.current.isAvatarPickerOpen).toBe(false)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('未登录时 updateAvatarToken 守卫直接返回 false', async () => {
    const { result } = renderHook(() => useProfileAvatar(null as never, updateUser, messageApi, tp))
    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.updateAvatarToken('tok', 'ok.k', 'fail.k')
    })
    expect(ok).toBe(false)
  })
})
