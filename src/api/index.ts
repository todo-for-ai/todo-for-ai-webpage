/**
 * API模块统一入口
 */

// API客户端 - 唯一的请求客户端
export { apiClient } from './client'

// 类型定义
export type { ApiResponse, ApiClientConfig, PerformanceStats } from './client'

// API服务
export { projectsApi, type Project } from './projects'
export { tasksApi, type Task } from './tasks'
export { contextRulesApi, type ContextRule } from './contextRules'
export { AuthAPI } from './auth'
