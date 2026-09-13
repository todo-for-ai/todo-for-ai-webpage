import { apiClient } from '../client/index.js'
import type {
  TaskStats,
  TaskOverdueTrend,
  TaskOverdueByAssignee,
  TaskOverdueClustering,
  TaskCompletionByPriority,
  TaskCompletionRateByProject,
  TaskCompletionByProject,
  TaskCompletionByAssignee,
  TaskPriorityTrend,
  TaskCompletionForecast,
  TaskDependencyChainAnalysis,
  TaskCommentSentimentTrend,
  TaskReworkAnalysis,
} from './analytics-types'

/**
 * 任务分析统计 API：总览统计、逾期/完成度/优先级趋势、依赖链/情感/返工分析。
 * 由 tasks.ts 的 TasksApi 方法组原样拆出（URL 与参数保持不变）。
 */
export class TasksAnalyticsApi {
  // 获取任务生命周期统计
  async getStats() {
    return apiClient.get<TaskStats>('/tasks/stats')
  }

  // 获取任务逾期趋势（按 due_date 分日）
  async getOverdueTrend(days = 30): Promise<TaskOverdueTrend> {
    return apiClient.get<TaskOverdueTrend>(`/tasks/overdue-trend?days=${days}`)
  }

  // 获取任务逾期按负责人分布
  async getOverdueByAssignee(limit = 10): Promise<TaskOverdueByAssignee> {
    return apiClient.get<TaskOverdueByAssignee>(`/tasks/overdue-by-assignee?limit=${limit}`)
  }

  // 获取任务逾期聚类分析
  async getOverdueClustering(limit = 15): Promise<TaskOverdueClustering> {
    return apiClient.get<TaskOverdueClustering>(`/tasks/overdue-clustering?limit=${limit}`)
  }

  // 获取任务按优先级完成率
  async getCompletionByPriority(days = 30): Promise<TaskCompletionByPriority> {
    return apiClient.get<TaskCompletionByPriority>(`/tasks/completion-by-priority?days=${days}`)
  }

  // 获取任务按项目完成率对比
  async getCompletionRateByProject(days = 30, limit = 10): Promise<TaskCompletionRateByProject> {
    return apiClient.get<TaskCompletionRateByProject>(`/tasks/completion-rate-by-project?days=${days}&limit=${limit}`)
  }

  // 获取任务按项目完成趋势
  async getCompletionByProject(days = 30, limit = 8): Promise<TaskCompletionByProject> {
    return apiClient.get<TaskCompletionByProject>(`/tasks/completion-by-project?days=${days}&limit=${limit}`)
  }

  // 获取任务按负责人完成趋势
  async getCompletionByAssignee(days = 30, limit = 8): Promise<TaskCompletionByAssignee> {
    return apiClient.get<TaskCompletionByAssignee>(`/tasks/completion-by-assignee?days=${days}&limit=${limit}`)
  }

  // 获取任务优先级分布趋势
  async getPriorityTrend(days = 30): Promise<TaskPriorityTrend> {
    return apiClient.get<TaskPriorityTrend>(`/tasks/priority-trend?days=${days}`)
  }

  // 获取任务完成预测
  async getCompletionForecast(days = 30): Promise<TaskCompletionForecast> {
    return apiClient.get<TaskCompletionForecast>(`/tasks/completion-forecast?days=${days}`)
  }

  // 获取任务依赖链分析
  async getDependencyChain(limit = 10, projectId?: number): Promise<TaskDependencyChainAnalysis> {
    const params = new URLSearchParams({ limit: String(limit) })
    if (projectId) params.append('project_id', String(projectId))
    return apiClient.get<TaskDependencyChainAnalysis>(`/tasks/dependency-chain?${params}`)
  }

  // 获取任务评论情感趋势
  async getCommentSentimentTrend(days = 30): Promise<TaskCommentSentimentTrend> {
    return apiClient.get<TaskCommentSentimentTrend>(`/tasks/comment-sentiment-trend?days=${days}`)
  }

  // 获取任务返工分析
  async getReworkAnalysis(days = 30, limit = 15): Promise<TaskReworkAnalysis> {
    return apiClient.get<TaskReworkAnalysis>(`/tasks/rework-analysis?days=${days}&limit=${limit}`)
  }
}
