// 仪表盘展示格式化助手：从 useDashboardData 沉淀的纯函数（无 React 依赖，可单测）。

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
  return `${(seconds / 3600).toFixed(1)}小时`
}

export const KIND_LABELS: Record<string, string> = {
  assistant: '助手',
  autonomous: '自主',
  coordinator: '协调者',
  external: '外部',
}

export const IDLE_STAGE_COLOR: Record<string, string> = { active: '#52c41a', idle: '#1890ff', stale: '#faad14', dormant: '#ff4d4f', never: '#8c8c8c' }
export const IDLE_STAGE_ZH: Record<string, string> = { active: '活跃', idle: '空闲', stale: '陈旧', dormant: '休眠', never: '从未' }
export const stageColor = (s: string) => IDLE_STAGE_COLOR[s] || '#8c8c8c'
export const stageZh = (s: string) => IDLE_STAGE_ZH[s] || s

// 任务状态 → antd Tag 语义色
export const TASK_STATUS_COLORS: Record<string, string> = {
  todo: 'default',
  in_progress: 'processing',
  review: 'warning',
  done: 'success',
  cancelled: 'error',
}
export const getStatusColor = (status: string) => TASK_STATUS_COLORS[status] || 'default'

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
