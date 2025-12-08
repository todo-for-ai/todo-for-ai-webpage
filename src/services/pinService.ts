import { pinsApi } from '../api/pins'

export interface PinStatusResponse {
  is_pinned: boolean
  project_id: number
}

export interface UserPinsResponse {
  pins: Array<{
    id: number
    project_id: number
    pinned_at: string
  }>
  total: number
}

// 检查项目Pin状态
export const checkPinStatus = async (projectId: number): Promise<PinStatusResponse | boolean | any> => {
  const response: any = await pinsApi.checkPinStatus(projectId)

  // 处理多种响应格式
  if (response && typeof response.is_pinned === 'boolean') {
    return response
  }

  if (response && response.data && typeof response.data.is_pinned === 'boolean') {
    return response.data
  }

  if (typeof response === 'boolean') {
    return response
  }

  return { is_pinned: false, project_id: projectId }
}

// 获取用户Pin列表
export const getUserPins = async (): Promise<UserPinsResponse> => {
  const response: any = await pinsApi.getUserPins()
  return response
}

// 固定项目
export const pinProject = async (projectId: number): Promise<void> => {
  await pinsApi.pinProject(projectId)
}

// 取消固定项目
export const unpinProject = async (projectId: number): Promise<void> => {
  await pinsApi.unpinProject(projectId)
}

// 检查Pin数量限制
export const checkPinLimit = async (limit: number = 10): Promise<boolean> => {
  try {
    const response = await getUserPins()
    if (response && response.pins) {
      return response.pins.length >= limit
    }
    return false
  } catch (error) {
    console.warn('Failed to check pin limit:', error)
    return false
  }
}
