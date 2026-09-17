import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { tasksApi } from '../api/tasks'
import { useTaskRealtime } from './useTaskRealtime'
import type { ConsoleTaskLike } from '../pages/console/consoleData'

/** 列表兜底轮询间隔（选中任务的房间推送另有 WS 即时刷新） */
const LIST_POLL_MS = 15000

/**
 * Console 工作台数据装配：AI 任务流（轮询兜底）+ 选中任务详情 +
 * URL ?task= 深链同步 + 进房 WS 刷新。ConsoleWorkspace 只管布局。
 */
export function useConsoleTasks() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState<ConsoleTaskLike[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<any>(null)

  const selectedId = useMemo(() => {
    const raw = searchParams.get('task')
    return raw ? Number(raw) : null
  }, [searchParams])

  const loadTasks = useCallback(async () => {
    try {
      const res = await tasksApi.getTasks({ per_page: 100, sort_by: 'updated_at', sort_order: 'desc' } as any)
      const items: any[] = (res as any)?.items || (Array.isArray(res) ? res : [])
      // 工作台聚焦可交给 Agent 的任务：AI 任务且非子任务
      const ai = items.filter(t => t.is_ai_task && !t.parent_task_id)
      setTasks(ai.length > 0 || items.length === 0 ? ai : items)
    } catch {
      // 静默：保留上一次列表
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (id: number) => {
    try {
      const t = await tasksApi.getTask(id)
      setDetail(t)
    } catch {
      setDetail(null)
    }
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
    else setDetail(null)
  }, [selectedId, loadDetail])

  // 选中任务的房间推送（状态变化/留言）→ 刷新详情与列表
  const onSelectedEvent = useCallback(() => {
    if (selectedId) loadDetail(selectedId)
    loadTasks()
  }, [selectedId, loadDetail, loadTasks])
  useTaskRealtime({ taskId: selectedId || 0, onTaskUpdate: onSelectedEvent, onComment: onSelectedEvent })

  useEffect(() => {
    const timer = setInterval(loadTasks, LIST_POLL_MS)
    return () => clearInterval(timer)
  }, [loadTasks])

  const handleSelect = useCallback((id: number) => {
    setSearchParams({ task: String(id) })
  }, [setSearchParams])

  const handleCreated = useCallback((id: number) => {
    loadTasks().then(() => setSearchParams({ task: String(id) }))
  }, [loadTasks, setSearchParams])

  const refresh = useCallback(() => {
    loadTasks()
    if (selectedId) loadDetail(selectedId)
  }, [loadTasks, loadDetail, selectedId])

  // 首次进入且 URL 无 task：自动选最新的执行中任务，否则第一条
  useEffect(() => {
    if (selectedId || tasks.length === 0) return
    const preferred = tasks.find(t => t.status === 'in_progress') || tasks[0]
    setSearchParams({ task: String(preferred.id) }, { replace: true })
  }, [tasks, selectedId, setSearchParams])

  return {
    tasks, detail, loading, selectedId,
    handleSelect, handleCreated, onSelectedEvent, refresh,
  }
}
