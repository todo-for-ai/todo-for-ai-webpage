import { apiClient } from './client/index.js'

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pages: number
    per_page: number
    total: number
    has_next: boolean
    has_prev: boolean
    next_num?: number
    prev_num?: number
  }
  message: string
  success: boolean
  timestamp: string
}

// 任务相关类型定义
export interface Task {
  id: number
  project_id: number
  title: string
  content: string
  description?: string  // 添加缺失的description属性
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  estimated_hours?: number
  completion_rate: number
  completed_at?: string
  tags: string[]
  created_at: string
  updated_at: string
  created_by: string
  feedback_content?: string
  feedback_at?: string
  is_ai_task?: boolean  // 添加缺失的is_ai_task属性
  related_files?: string[]  // 添加缺失的related_files属性
  creator_type?: string  // 添加缺失的creator_type属性
  creator_identifier?: string  // 添加缺失的creator_identifier属性
  interaction_session_id?: string  // 交互式任务会话ID
  is_interactive?: boolean  // 是否为交互式任务
  ai_waiting_feedback?: boolean  // AI是否等待人类反馈
  parent_task_id?: number  // 父任务ID（子任务指向父任务）
  required_capabilities?: string[]  // Agent 能力要求
  subtask_count?: number  // 子任务总数
  subtask_done_count?: number  // 已完成子任务数
  project?: {
    id: number
    name: string
    color: string
  }
  stats?: {
    attachments_count: number
    history_count: number
    is_overdue: boolean
    days_until_due?: number
  }
}

export interface TaskProjectCount {
  project_id: number
  name: string
  count: number
}

export interface TaskStats {
  total: number
  by_status: Record<string, number>
  by_priority: Record<string, number>
  completion_rate: number
  cancellation_rate: number
  done_count: number
  cancelled_count: number
  avg_lifecycle_hours: number | null
  lifecycle_buckets: Record<string, number>
  avg_completion_rate: number
  by_project: TaskProjectCount[]
  overdue_count: number
  with_due_date: number
  overdue_rate: number
  by_priority_status: Record<string, Record<string, number>>
}

export interface TaskOverdueTrendBucket {
  date: string
  overdue: number
  by_priority: Record<string, number>
}

export interface TaskOverdueTrend {
  days: number
  trend: TaskOverdueTrendBucket[]
  total_overdue: number
  by_priority_totals: Record<string, number>
}

export interface TaskOverdueByAssigneeItem {
  agent_id: number
  name: string
  overdue: number
  by_priority: Record<string, number>
  earliest_due: string | null
}

export interface TaskOverdueByAssignee {
  items: TaskOverdueByAssigneeItem[]
  total_overdue: number
}

/** 任务逾期聚类条目 */
export interface TaskOverdueClusterItem {
  project_id: number
  project_name: string
  priority: string
  count: number
  avg_days_overdue: number
  titles: string[]
}

/** 任务逾期聚类分析 */
export interface TaskOverdueClustering {
  clusters: TaskOverdueClusterItem[]
  total_overdue: number
}

export interface TaskPriorityTrendBucket {
  date: string
  critical: number
  high: number
  medium: number
  low: number
}

export interface TaskPriorityTrend {
  days: number
  trend: TaskPriorityTrendBucket[]
  totals: Record<string, number>
}

export interface TaskCompletionForecastPriority {
  priority: string
  remaining: number
  estimated_days: number
  estimated_date: string | null
}

export interface TaskCompletionForecast {
  days: number
  velocity: number
  total_done_in_window: number
  total_remaining: number
  days_to_complete: number | null
  estimated_completion_date: string | null
  priority_forecast: TaskCompletionForecastPriority[]
}

/** 任务依赖链 */
export interface TaskDependencyChain {
  root_id: number
  root_title: string
  depth: number
  total_tasks: number
  completed: number
  in_progress: number
  progress_pct: number
}

/** 任务依赖链分析 */
export interface TaskDependencyChainAnalysis {
  chains: TaskDependencyChain[]
}

/** 评论情感趋势每日统计 */
export interface CommentSentimentDay {
  date: string
  positive: number
  negative: number
  neutral: number
}

/** 任务评论情感趋势 */
export interface TaskCommentSentimentTrend {
  days: number
  trend: CommentSentimentDay[]
}

/** 任务按优先级完成率项 */
export interface TaskCompletionByPriorityItem {
  priority: string
  total: number
  done: number
  cancelled: number
  in_progress: number
  completion_rate: number
}

/** 任务按优先级完成率 */
export interface TaskCompletionByPriority {
  priorities: TaskCompletionByPriorityItem[]
  total: number
}

/** 任务按项目完成率条目 */
export interface TaskCompletionRateByProjectItem {
  project_id: number
  name: string
  total: number
  done: number
  cancelled: number
  in_progress: number
  completion_rate: number
}

/** 任务按项目完成率对比 */
export interface TaskCompletionRateByProject {
  projects: TaskCompletionRateByProjectItem[]
  total_tasks: number
  total_done: number
}

export interface TaskCompletionByProjectItem {
  project_id: number
  name: string
  total: number
  daily: { date: string; done: number }[]
}

export interface TaskCompletionByProject {
  days: number
  total_done: number
  all_days: string[]
  series: TaskCompletionByProjectItem[]
}

export interface TaskCompletionByAssigneeItem {
  agent_id: number
  name: string
  total: number
  daily: { date: string; done: number }[]
}

export interface TaskCompletionByAssignee {
  days: number
  total_done: number
  all_days: string[]
  series: TaskCompletionByAssigneeItem[]
}

export interface CreateTaskData {
  project_id: number
  title?: string
  content?: string
  description?: string  // 添加description属性
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  tags?: string[]
  is_ai_task?: boolean
  related_files?: string[]  // 添加related_files属性
  creator_type?: string  // 添加creator_type属性
  creator_identifier?: string  // 添加creator_identifier属性
  parent_task_id?: number  // 父任务ID（创建子任务时传入）
  required_capabilities?: string[]  // Agent能力要求
}

export interface UpdateTaskData {
  title?: string
  content?: string
  description?: string  // 添加description属性
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  completion_rate?: number
  tags?: string[]
  is_ai_task?: boolean  // 添加is_ai_task属性
  related_files?: string[]  // 添加related_files属性
  created_by?: string  // 添加created_by属性
  required_capabilities?: string[]  // Agent能力要求
}

export interface TaskQueryParams {
  page?: number
  per_page?: number
  search?: string
  project_id?: number
  parent_task_id?: number
  status?: string
  priority?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// 任务API服务
export class TasksApi {
  // 获取任务列表
  async getTasks(params?: TaskQueryParams) {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value))
        }
      })
    }

    const url = `/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<PaginatedResponse<Task>>(url)
  }

  // 获取单个任务
  async getTask(id: number) {
    return apiClient.get<Task>(`/tasks/${id}`)
  }

  // 创建任务
  async createTask(data: CreateTaskData) {
    return apiClient.post<Task>('/tasks', data)
  }

  // 更新任务
  async updateTask(id: number, data: UpdateTaskData) {
    return apiClient.put<Task>(`/tasks/${id}`, data)
  }

  // 删除任务
  async deleteTask(id: number) {
    return apiClient.delete(`/tasks/${id}`)
  }

  // 更新任务状态
  async updateTaskStatus(id: number, status: Task['status']) {
    return apiClient.put<Task>(`/tasks/${id}`, { status })
  }

  // 更新任务进度
  async updateTaskProgress(id: number, completion_rate: number) {
    return apiClient.put<Task>(`/tasks/${id}`, { completion_rate })
  }

  // 获取任务历史
  async getTaskHistory(id: number) {
    return apiClient.get(`/tasks/${id}/history`)
  }

  // 获取任务附件
  async getTaskAttachments(id: number) {
    return apiClient.get(`/tasks/${id}/attachments`)
  }

  // 上传任务附件
  async uploadTaskAttachment(id: number, file: File, onProgress?: (progress: number) => void) {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.upload<{ file_path: string; original_filename: string; file_size: number }>(`/tasks/${id}/attachments`, formData)
  }

  // 删除任务附件
  async deleteTaskAttachment(taskId: number, attachmentId: number) {
    return apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`)
  }

  // 批量删除任务
  async batchDeleteTasks(taskIds: number[]) {
    return apiClient.post('/tasks/batch/delete', { task_ids: taskIds })
  }

  // 批量更新任务状态
  async batchUpdateTaskStatus(taskIds: number[], status: Task['status']) {
    return apiClient.post('/tasks/batch/update-status', { 
      task_ids: taskIds, 
      status 
    })
  }

  // 批量更新任务优先级
  async batchUpdateTaskPriority(taskIds: number[], priority: Task['priority']) {
    return apiClient.post('/tasks/batch/update-priority', {
      task_ids: taskIds,
      priority
    })
  }

  // 获取子任务列表
  async getSubtasks(parentTaskId: number) {
    return apiClient.get<Task[]>(`/tasks/${parentTaskId}/subtasks`)
  }

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
}

// 导出单例实例
export const tasksApi = new TasksApi()
