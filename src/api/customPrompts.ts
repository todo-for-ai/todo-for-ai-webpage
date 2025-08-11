/**
 * 自定义提示词API接口 - 使用新的独立API
 */

import { apiClient } from './client'

export interface CustomPrompt {
  id: number
  user_id: number
  prompt_type: 'project' | 'task_button'
  name: string
  content: string
  description?: string
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface CreateCustomPromptRequest {
  prompt_type: 'project' | 'task_button'
  name: string
  content: string
  description?: string
  order_index?: number
}

export interface UpdateCustomPromptRequest {
  name?: string
  content?: string
  description?: string
  is_active?: boolean
  order_index?: number
}

export interface ReorderRequest {
  prompt_orders: Array<{
    id: number
    order_index: number
  }>
}

// 为了向后兼容保留的接口
export interface TaskPromptButton {
  id: string
  name: string
  content: string
  order: number
}

export interface CustomPromptsConfig {
  projectPromptTemplate: string
  taskPromptButtons: TaskPromptButton[]
}

export interface CustomPromptsResponse {
  success: boolean
  data: CustomPromptsConfig
  message?: string
}

// ===== 新的API函数 =====

/**
 * 获取自定义提示词列表
 */
export const getCustomPrompts = async (params?: {
  prompt_type?: 'project' | 'task_button'
  is_active?: boolean
  page?: number
  per_page?: number
}): Promise<{ items: CustomPrompt[]; total: number; page: number; per_page: number }> => {
  return await apiClient.get<{ items: CustomPrompt[]; total: number; page: number; per_page: number }>('/custom-prompts')
}

/**
 * 获取单个自定义提示词
 */
export const getCustomPrompt = async (id: number): Promise<CustomPrompt> => {
  return await apiClient.get<CustomPrompt>(`/custom-prompts/${id}`)
}

/**
 * 创建自定义提示词
 */
export const createCustomPrompt = async (data: CreateCustomPromptRequest): Promise<CustomPrompt> => {
  return await apiClient.post<CustomPrompt>('/custom-prompts', data)
}

/**
 * 更新自定义提示词
 */
export const updateCustomPrompt = async (id: number, data: UpdateCustomPromptRequest): Promise<CustomPrompt> => {
  return await apiClient.put<CustomPrompt>(`/custom-prompts/${id}`, data)
}

/**
 * 删除自定义提示词
 */
export const deleteCustomPrompt = async (id: number): Promise<void> => {
  await apiClient.delete<void>(`/custom-prompts/${id}`)
}

/**
 * 获取项目提示词列表
 */
export const getProjectPrompts = async (isActive = true): Promise<CustomPrompt[]> => {
  const url = `/custom-prompts/project-prompts?is_active=${isActive}`
  return await apiClient.get<CustomPrompt[]>(url)
}

/**
 * 获取任务按钮提示词列表
 */
export const getTaskButtonPrompts = async (isActive = true): Promise<CustomPrompt[]> => {
  const url = `/custom-prompts/task-button-prompts?is_active=${isActive}`
  return await apiClient.get<CustomPrompt[]>(url)
}

/**
 * 重新排序任务按钮提示词
 */
export const reorderTaskButtonPrompts = async (promptOrders: ReorderRequest['prompt_orders']): Promise<void> => {
  await apiClient.put('/custom-prompts/task-buttons/reorder', { prompt_orders: promptOrders })
}

/**
 * 预览项目提示词
 */
export const previewProjectPrompt = async (id: number, projectId?: number): Promise<{
  prompt_id: number
  prompt_name: string
  raw_content: string
  rendered_content: string
  project_id?: number
}> => {
  return await apiClient.post<{
    prompt_id: number
    prompt_name: string
    raw_content: string
    rendered_content: string
    project_id?: number
  }>(`/custom-prompts/project-prompts/${id}/preview`, {
    project_id: projectId
  })
}

/**
 * 初始化用户默认提示词
 */
export const initializeUserDefaults = async (): Promise<void> => {
  await apiClient.post('/custom-prompts/initialize-defaults')
}

/**
 * 重置为默认配置
 */
export const resetToDefaults = async (): Promise<void> => {
  await apiClient.post('/custom-prompts/reset-to-defaults')
}

/**
 * 导出自定义提示词
 */
export const exportCustomPrompts = async (): Promise<{
  user_id: number
  export_time: string
  prompts: CustomPrompt[]
}> => {
  return await apiClient.get<{
    user_id: number
    export_time: string
    prompts: CustomPrompt[]
  }>('/custom-prompts/export')
}

/**
 * 导入自定义提示词
 */
export const importCustomPrompts = async (prompts: Partial<CustomPrompt>[]): Promise<{
  imported_count: number
  skipped_count: number
  total_count: number
}> => {
  return await apiClient.post<{
    imported_count: number
    skipped_count: number
    total_count: number
  }>('/custom-prompts/import', { prompts })
}

// ===== 向后兼容的API函数 =====

/**
 * 获取用户的自定义提示词配置（向后兼容）
 */
export const getUserCustomPrompts = async (): Promise<CustomPromptsResponse> => {
  try {
    const [projectPrompts, taskButtonPrompts] = await Promise.all([
      getProjectPrompts(true),
      getTaskButtonPrompts(true)
    ])

    // 转换为旧格式
    const projectTemplate = projectPrompts.length > 0 ? projectPrompts[0].content : ''
    const taskButtons: TaskPromptButton[] = taskButtonPrompts.map(prompt => ({
      id: prompt.id.toString(),
      name: prompt.name,
      content: prompt.content,
      order: prompt.order_index
    }))

    return {
      success: true,
      data: {
        projectPromptTemplate: projectTemplate,
        taskPromptButtons: taskButtons
      }
    }
  } catch (error: any) {
    console.error('Failed to get custom prompts:', error)
    throw new Error(error.response?.data?.message || '获取自定义提示词配置失败')
  }
}

/**
 * 保存用户的自定义提示词配置（向后兼容）
 */
export const saveUserCustomPrompts = async (config: {
  projectPromptTemplate?: string
  taskPromptButtons?: TaskPromptButton[]
}): Promise<CustomPromptsResponse> => {
  try {
    // 这个函数现在需要更复杂的逻辑来处理新的API结构
    // 暂时抛出错误，建议使用新的API
    throw new Error('This function is deprecated. Please use the new custom prompts API.')
  } catch (error: any) {
    console.error('Failed to save custom prompts:', error)
    throw new Error(error.response?.data?.message || '保存自定义提示词配置失败')
  }
}

/**
 * 重置为默认配置（向后兼容）
 */
export const resetCustomPromptsToDefault = async (): Promise<CustomPromptsResponse> => {
  try {
    await resetToDefaults()

    return {
      success: true,
      data: {
        projectPromptTemplate: '',
        taskPromptButtons: []
      }
    }
  } catch (error: any) {
    console.error('Failed to reset custom prompts:', error)
    throw new Error(error.response?.data?.message || '重置自定义提示词配置失败')
  }
}

/**
 * 获取项目提示词模板（向后兼容）
 */
export const getProjectPromptTemplate = async (): Promise<{ template: string }> => {
  try {
    const prompts = await getProjectPrompts(true)
    const template = prompts.length > 0 ? prompts[0].content : ''
    return { template }
  } catch (error: any) {
    console.error('Failed to get project prompt template:', error)
    throw new Error(error.response?.data?.message || '获取项目提示词模板失败')
  }
}

/**
 * 保存项目提示词模板（向后兼容）
 */
export const saveProjectPromptTemplate = async (template: string): Promise<{ success: boolean }> => {
  try {
    // 这个函数现在需要更复杂的逻辑来处理新的API结构
    // 暂时抛出错误，建议使用新的API
    throw new Error('This function is deprecated. Please use createCustomPrompt or updateCustomPrompt.')
  } catch (error: any) {
    console.error('Failed to save project prompt template:', error)
    throw new Error(error.response?.data?.message || '保存项目提示词模板失败')
  }
}

/**
 * 获取任务提示词按钮配置（向后兼容）
 */
export const getTaskPromptButtons = async (): Promise<{ buttons: TaskPromptButton[] }> => {
  try {
    const prompts = await getTaskButtonPrompts(true)
    const buttons: TaskPromptButton[] = prompts.map(prompt => ({
      id: prompt.id.toString(),
      name: prompt.name,
      content: prompt.content,
      order: prompt.order_index
    }))
    return { buttons }
  } catch (error: any) {
    console.error('Failed to get task prompt buttons:', error)
    throw new Error(error.response?.data?.message || '获取任务提示词按钮配置失败')
  }
}

/**
 * 保存任务提示词按钮配置（向后兼容）
 */
export const saveTaskPromptButtons = async (buttons: TaskPromptButton[]): Promise<{ success: boolean }> => {
  try {
    // 这个函数现在需要更复杂的逻辑来处理新的API结构
    // 暂时抛出错误，建议使用新的API
    throw new Error('This function is deprecated. Please use createCustomPrompt, updateCustomPrompt, or reorderTaskButtonPrompts.')
  } catch (error: any) {
    console.error('Failed to save task prompt buttons:', error)
    throw new Error(error.response?.data?.message || '保存任务提示词按钮配置失败')
  }
}

// 新的API对象
export const customPromptsApi = {
  // 新的API函数
  getCustomPrompts,
  getCustomPrompt,
  createCustomPrompt,
  updateCustomPrompt,
  deleteCustomPrompt,
  getProjectPrompts,
  getTaskButtonPrompts,
  reorderTaskButtonPrompts,
  previewProjectPrompt,
  initializeUserDefaults,
  resetToDefaults,
  exportCustomPrompts,
  importCustomPrompts,

  // 向后兼容的API函数
  getUserCustomPrompts,
  saveUserCustomPrompts,
  resetCustomPromptsToDefault,
  getProjectPromptTemplate,
  saveProjectPromptTemplate,
  getTaskPromptButtons,
  saveTaskPromptButtons
}
