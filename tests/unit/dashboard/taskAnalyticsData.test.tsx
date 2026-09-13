import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const { tasksApi } = vi.hoisted(() => ({
  tasksApi: {
    getStats: vi.fn(async () => ({ total: 1 })),
    getOverdueTrend: vi.fn(async () => ({})),
    getOverdueByAssignee: vi.fn(async () => ({})),
    getOverdueClustering: vi.fn(async () => ({})),
    getPriorityTrend: vi.fn(async () => ({})),
    getCompletionForecast: vi.fn(async () => ({})),
    getCompletionByProject: vi.fn(async () => ({})),
    getCompletionByAssignee: vi.fn(async () => ({})),
    getCompletionByPriority: vi.fn(async () => ({})),
    getCompletionRateByProject: vi.fn(async () => ({})),
  },
}))
vi.mock('../../../src/api/tasks', () => ({ tasksApi }))

import { useTaskAnalyticsData } from '../../../src/pages/dashboard/useTaskAnalyticsData'

describe('useTaskAnalyticsData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('挂载时按默认窗口并发拉取 10 个分析端点并落状态', async () => {
    const { result } = renderHook(() => useTaskAnalyticsData())
    await waitFor(() => expect(result.current.taskStats).toEqual({ total: 1 }))
    expect(tasksApi.getStats).toHaveBeenCalledTimes(1)
    expect(tasksApi.getOverdueTrend).toHaveBeenCalledWith(30)
    expect(tasksApi.getOverdueByAssignee).toHaveBeenCalledWith(10)
    expect(tasksApi.getOverdueClustering).toHaveBeenCalledWith(15)
    expect(tasksApi.getPriorityTrend).toHaveBeenCalledWith(30)
    expect(tasksApi.getCompletionForecast).toHaveBeenCalledWith(30)
    expect(tasksApi.getCompletionByProject).toHaveBeenCalledWith(30, 8)
    expect(tasksApi.getCompletionByAssignee).toHaveBeenCalledWith(30, 8)
    expect(tasksApi.getCompletionByPriority).toHaveBeenCalledWith(30)
    expect(tasksApi.getCompletionRateByProject).toHaveBeenCalledWith(30, 10)
    expect(result.current.taskCompletionByProject).toEqual({})
  })
})
