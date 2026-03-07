export const activitySourceValues = ['agent_run', 'agent_task_attempt', 'agent_task_event', 'task_log', 'agent_audit']
export const activityLevelValues = ['info', 'warn', 'error']
export const taskStatusValues = ['todo', 'in_progress', 'review', 'done', 'cancelled']
export const runStateValues = ['queued', 'leased', 'running', 'succeeded', 'failed', 'cancelled', 'expired']

export const runStateColorMap: Record<string, 'success' | 'warning' | 'error' | 'default' | 'processing'> = {
  queued: 'default',
  leased: 'processing',
  running: 'processing',
  succeeded: 'success',
  failed: 'error',
  cancelled: 'warning',
  expired: 'error',
}

export const taskStatusColorMap: Record<string, string> = {
  todo: 'default',
  in_progress: 'processing',
  review: 'warning',
  done: 'success',
  cancelled: 'default',
}

export const activityLevelStatus: Record<string, 'success' | 'warning' | 'error' | 'default' | 'processing'> = {
  info: 'default',
  warn: 'warning',
  error: 'error',
}

export const emptyPagination = { page: 1, per_page: 20, total: 0, has_prev: false, has_next: false }

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export function normalizeDateTimeFilterValue(value: string) {
  const text = value.trim()
  if (!text) {
    return undefined
  }
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }
  return parsed.toISOString()
}
