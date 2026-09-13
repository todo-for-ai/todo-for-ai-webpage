/*
 * 任务分析统计类型（overdue/completion/趋势/依赖链/情感/返工）。
 * 由 tasks.ts 按行原样迁移，勿手改接口内容。
 */

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

/** 返工任务条目 */
export interface ReworkTaskItem {
  task_id: number
  title: string
  project_name: string
  rework_count: number
}

/** 按项目返工统计 */
export interface ReworkProjectItem {
  project_name: string
  rework_count: number
}

/** 任务返工分析 */
export interface TaskReworkAnalysis {
  tasks: ReworkTaskItem[]
  by_project: ReworkProjectItem[]
  days: number
  total_reworked: number
  total_rework_events: number
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
