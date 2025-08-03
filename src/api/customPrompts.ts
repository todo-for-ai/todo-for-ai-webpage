/**
 * 自定义提示词API接口
 */

import { ApiClient } from './client'

const apiClient = new ApiClient()
import type { TaskPromptButton } from '../services/customPromptsService'

export interface CustomPromptsConfig {
  projectPromptTemplate: string
  taskPromptButtons: TaskPromptButton[]
}

export interface CustomPromptsResponse {
  success: boolean
  data: CustomPromptsConfig
  message?: string
}

export interface SaveCustomPromptsRequest {
  projectPromptTemplate?: string
  taskPromptButtons?: TaskPromptButton[]
}

/**
 * 获取用户的自定义提示词配置
 */
export const getUserCustomPrompts = async (): Promise<CustomPromptsResponse> => {
  try {
    const response = await apiClient.get('/api/custom-prompts')
    return response.data
  } catch (error: any) {
    console.error('Failed to get custom prompts:', error)
    throw new Error(error.response?.data?.message || '获取自定义提示词配置失败')
  }
}

/**
 * 保存用户的自定义提示词配置
 */
export const saveUserCustomPrompts = async (config: SaveCustomPromptsRequest): Promise<CustomPromptsResponse> => {
  try {
    const response = await apiClient.post('/api/custom-prompts', config)
    return response.data
  } catch (error: any) {
    console.error('Failed to save custom prompts:', error)
    throw new Error(error.response?.data?.message || '保存自定义提示词配置失败')
  }
}

/**
 * 重置为默认配置
 */
export const resetCustomPromptsToDefault = async (): Promise<CustomPromptsResponse> => {
  try {
    const response = await apiClient.post('/api/custom-prompts/reset')
    return response.data
  } catch (error: any) {
    console.error('Failed to reset custom prompts:', error)
    throw new Error(error.response?.data?.message || '重置自定义提示词配置失败')
  }
}

/**
 * 获取项目提示词模板
 */
export const getProjectPromptTemplate = async (): Promise<{ template: string }> => {
  try {
    const response = await apiClient.get('/api/custom-prompts/project-template')
    return response.data
  } catch (error: any) {
    console.error('Failed to get project prompt template:', error)
    throw new Error(error.response?.data?.message || '获取项目提示词模板失败')
  }
}

/**
 * 保存项目提示词模板
 */
export const saveProjectPromptTemplate = async (template: string): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.post('/api/custom-prompts/project-template', { template })
    return response.data
  } catch (error: any) {
    console.error('Failed to save project prompt template:', error)
    throw new Error(error.response?.data?.message || '保存项目提示词模板失败')
  }
}

/**
 * 获取任务提示词按钮配置
 */
export const getTaskPromptButtons = async (): Promise<{ buttons: TaskPromptButton[] }> => {
  try {
    const response = await apiClient.get('/api/custom-prompts/task-buttons')
    return response.data
  } catch (error: any) {
    console.error('Failed to get task prompt buttons:', error)
    throw new Error(error.response?.data?.message || '获取任务提示词按钮配置失败')
  }
}

/**
 * 保存任务提示词按钮配置
 */
export const saveTaskPromptButtons = async (buttons: TaskPromptButton[]): Promise<{ success: boolean }> => {
  try {
    const response = await apiClient.post('/api/custom-prompts/task-buttons', { buttons })
    return response.data
  } catch (error: any) {
    console.error('Failed to save task prompt buttons:', error)
    throw new Error(error.response?.data?.message || '保存任务提示词按钮配置失败')
  }
}

export const customPromptsApi = {
  getUserCustomPrompts,
  saveUserCustomPrompts,
  resetCustomPromptsToDefault,
  getProjectPromptTemplate,
  saveProjectPromptTemplate,
  getTaskPromptButtons,
  saveTaskPromptButtons
}
