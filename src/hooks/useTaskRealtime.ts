import { useEffect, useCallback } from 'react'
import { wsService } from '../services/websocketService'

interface TaskRealtimeOptions {
  taskId: number
  onTaskUpdate?: () => void
  onComment?: () => void
}

export function useTaskRealtime({ taskId, onTaskUpdate, onComment }: TaskRealtimeOptions) {
  const stableOnUpdate = useCallback(() => { onTaskUpdate?.() }, [onTaskUpdate])
  const stableOnComment = useCallback(() => { onComment?.() }, [onComment])

  useEffect(() => {
    if (!taskId) return
    wsService.joinTaskRoom(taskId)

    const unsubUpdate = wsService.on('task_updated', (data: any) => {
      if (data.task_id === taskId) stableOnUpdate()
    })
    const unsubComment = wsService.on('task_comment', (data: any) => {
      if (data.task_id === taskId) stableOnComment()
    })

    return () => {
      wsService.leaveTaskRoom(taskId)
      unsubUpdate()
      unsubComment()
    }
  }, [taskId, stableOnUpdate, stableOnComment])
}
