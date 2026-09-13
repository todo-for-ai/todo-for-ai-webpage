import { describe, expect, it, vi, beforeEach } from 'vitest'

const apiClient = vi.hoisted(() => ({
  get: vi.fn(async () => ({ ok: true })),
  post: vi.fn(async () => ({ ok: true })),
  put: vi.fn(async () => ({ ok: true })),
  delete: vi.fn(async () => ({ ok: true })),
  upload: vi.fn(async () => ({ ok: true })),
}))
vi.mock('../../../src/api/client/index.js', () => ({ apiClient }))
const getApiBaseUrl = vi.hoisted(() => vi.fn(() => 'http://api.test/base'))
vi.mock('../../../src/utils/apiConfig', () => ({ getApiBaseUrl }))

import { tasksApi, TasksApi, TasksAnalyticsApi } from '../../../src/api/tasks'
import type { Task } from '../../../src/api/tasks'

describe('tasksApi 核心 CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getTasks 无参数请求 /tasks，有参数时过滤空值并拼查询串', async () => {
    await tasksApi.getTasks()
    expect(apiClient.get).toHaveBeenCalledWith('/tasks')
    await tasksApi.getTasks({ status: 'todo', page: 2, search: undefined, project_id: null } as never)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks?status=todo&page=2')
  })

  it('getTask/createTask/updateTask/deleteTask 走标准 REST', async () => {
    await tasksApi.getTask(7)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/7')
    await tasksApi.createTask({ title: 't', project_id: 1 } as never)
    expect(apiClient.post).toHaveBeenLastCalledWith('/tasks', { title: 't', project_id: 1 })
    await tasksApi.updateTask(7, { status: 'done' })
    expect(apiClient.put).toHaveBeenLastCalledWith('/tasks/7', { status: 'done' })
    await tasksApi.deleteTask(7)
    expect(apiClient.delete).toHaveBeenLastCalledWith('/tasks/7')
  })

  it('状态与进度快捷更新复用 PUT /tasks/:id', async () => {
    await tasksApi.updateTaskStatus(3, 'in_progress')
    expect(apiClient.put).toHaveBeenLastCalledWith('/tasks/3', { status: 'in_progress' })
    await tasksApi.updateTaskProgress(3, 0.5)
    expect(apiClient.put).toHaveBeenLastCalledWith('/tasks/3', { completion_rate: 0.5 })
  })

  it('历史与证据端点', async () => {
    await tasksApi.getTaskHistory(9)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/9/history')
    await tasksApi.getTaskEvidence(9)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/9/evidence')
  })

  it('PR 审批队列：待审列表与审批决定', async () => {
    await tasksApi.getPendingPrApprovals()
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/pull-request/approvals/pending')
    const decision = { action: 'approve' } as never
    await tasksApi.approvePrInteraction(5, decision)
    expect(apiClient.post).toHaveBeenLastCalledWith('/tasks/5/pull-request/approve', decision)
  })

  it('附件：列表/上传（FormData）/删除/下载地址', async () => {
    await tasksApi.getTaskAttachments(4)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/4/attachments')

    const file = new File(['x'], 'a.txt')
    await tasksApi.uploadTaskAttachment(4, file)
    expect(apiClient.upload).toHaveBeenCalledTimes(1)
    const [url, formData] = apiClient.upload.mock.calls[0]
    expect(url).toBe('/tasks/4/attachments')
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('file')).toBe(file)

    await tasksApi.deleteTaskAttachment(4, 11)
    expect(apiClient.delete).toHaveBeenLastCalledWith('/tasks/4/attachments/11')

    expect(tasksApi.getTaskAttachmentDownloadUrl(4, 11)).toBe('http://api.test/base/tasks/4/attachments/11/download')
  })

  it('日志：分页参数与追加默认 markdown', async () => {
    await tasksApi.getTaskLogs(6)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/6/logs')
    await tasksApi.getTaskLogs(6, { page: 2, per_page: 50 })
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/6/logs?page=2&per_page=50')
    await tasksApi.appendTaskLog(6, '内容')
    expect(apiClient.post).toHaveBeenLastCalledWith('/tasks/6/logs', { content: '内容', content_type: 'text/markdown' })
    await tasksApi.appendTaskLog(6, '纯文本', 'text/plain')
    expect(apiClient.post).toHaveBeenLastCalledWith('/tasks/6/logs', { content: '纯文本', content_type: 'text/plain' })
  })

  it('批量操作四端点', async () => {
    await tasksApi.batchDeleteTasks([1, 2])
    expect(apiClient.post).toHaveBeenLastCalledWith('/tasks/batch/delete', { task_ids: [1, 2] })
    await tasksApi.batchUpdateTaskStatus([1], 'done')
    expect(apiClient.post).toHaveBeenLastCalledWith('/tasks/batch/update-status', { task_ids: [1], status: 'done' })
    await tasksApi.batchUpdateTaskPriority([1], 'high')
    expect(apiClient.post).toHaveBeenLastCalledWith('/tasks/batch/update-priority', { task_ids: [1], priority: 'high' })
    const assignees = [{ type: 'agent', id: 9 }] as never
    await tasksApi.batchAssignTasks([1, 3], assignees)
    expect(apiClient.post).toHaveBeenLastCalledWith('/tasks/batch/assign', { task_ids: [1, 3], assignees })
  })

  it('子任务列表', async () => {
    await tasksApi.getSubtasks(42)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/42/subtasks')
  })

  it('单例与继承关系保持，类型重导出可用', () => {
    expect(tasksApi).toBeInstanceOf(TasksApi)
    expect(tasksApi).toBeInstanceOf(TasksAnalyticsApi)
    const task: Partial<Task> = { id: 1, title: 'x' }
    expect(task.id).toBe(1)
  })
})

describe('tasksApi 分析统计（原 TasksApi 方法组，URL 不变）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getStats', async () => {
    await tasksApi.getStats()
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/stats')
  })

  it.each([
    ['getOverdueTrend', '/tasks/overdue-trend'],
    ['getCompletionByPriority', '/tasks/completion-by-priority'],
    ['getPriorityTrend', '/tasks/priority-trend'],
    ['getCompletionForecast', '/tasks/completion-forecast'],
    ['getCommentSentimentTrend', '/tasks/comment-sentiment-trend'],
  ] as const)('%s 默认 30 天', async (method, url) => {
    await (tasksApi as never as Record<string, (days?: number) => Promise<unknown>>)[method]()
    expect(apiClient.get).toHaveBeenLastCalledWith(`${url}?days=30`)
    await (tasksApi as never as Record<string, (days?: number) => Promise<unknown>>)[method](7)
    expect(apiClient.get).toHaveBeenLastCalledWith(`${url}?days=7`)
  })

  it('逾期维度：按人/聚类支持 limit', async () => {
    await tasksApi.getOverdueByAssignee()
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/overdue-by-assignee?limit=10')
    await tasksApi.getOverdueByAssignee(3)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/overdue-by-assignee?limit=3')
    await tasksApi.getOverdueClustering()
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/overdue-clustering?limit=15')
    await tasksApi.getOverdueClustering(5)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/overdue-clustering?limit=5')
  })

  it('完成度按项目双口径（rate 版带 limit）', async () => {
    await tasksApi.getCompletionRateByProject()
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/completion-rate-by-project?days=30&limit=10')
    await tasksApi.getCompletionRateByProject(14, 2)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/completion-rate-by-project?days=14&limit=2')
    await tasksApi.getCompletionByProject()
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/completion-by-project?days=30&limit=8')
    await tasksApi.getCompletionByProject(7, 4)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/completion-by-project?days=7&limit=4')
  })

  it('按人完成度', async () => {
    await tasksApi.getCompletionByAssignee()
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/completion-by-assignee?days=30&limit=8')
    await tasksApi.getCompletionByAssignee(60, 5)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/completion-by-assignee?days=60&limit=5')
  })

  it('依赖链：limit 必带，projectId 可选追加', async () => {
    await tasksApi.getDependencyChain()
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/dependency-chain?limit=10')
    await tasksApi.getDependencyChain(5, 88)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/dependency-chain?limit=5&project_id=88')
  })

  it('返工分析默认 30 天 15 条', async () => {
    await tasksApi.getReworkAnalysis()
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/rework-analysis?days=30&limit=15')
    await tasksApi.getReworkAnalysis(10, 3)
    expect(apiClient.get).toHaveBeenLastCalledWith('/tasks/rework-analysis?days=10&limit=3')
  })
})
