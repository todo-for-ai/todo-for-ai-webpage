import { useCallback, useEffect, useRef } from 'react'
import { wsService } from '../services/websocketService'

/**
 * 订阅项目房间的任务图刷新事件（task_graph_changed）。
 *
 * 后端在任务状态/依赖变化的 choke point（人工更新、批量状态、Agent commit、
 * MCP 状态工具、依赖编辑）推送；同一事件风暴（如批量操作）按 debounceMs
 * 合并为一次回调。
 */
export function useProjectGraphRealtime(
  projectId: number,
  onGraphChange: () => void,
  debounceMs = 300
) {
  const stableOnGraphChange = useCallback(onGraphChange, [onGraphChange])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!projectId) return
    wsService.joinProjectRoom(projectId)

    const unsub = wsService.on('task_graph_changed', (data: any) => {
      if (data?.project_id !== projectId) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => stableOnGraphChange(), debounceMs)
    })

    return () => {
      wsService.leaveProjectRoom(projectId)
      unsub()
      if (timer.current) {
        clearTimeout(timer.current)
        timer.current = null
      }
    }
  }, [projectId, stableOnGraphChange, debounceMs])
}
