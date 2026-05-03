/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useCallback } from 'react'
import { wsService } from '../services/websocketService'

interface TaskRealtimeOptions {
  taskId: number
  onTaskUpdate?: () => void
  onComment?: () => void
  onApprovalRequest?: () => void
  onHelpRequest?: () => void
}

export function useTaskRealtime({
  taskId,
  onTaskUpdate,
  onComment,
  onApprovalRequest,
  onHelpRequest,
}: TaskRealtimeOptions) {
  const stableOnUpdate = useCallback(() => { onTaskUpdate?.() }, [onTaskUpdate])
  const stableOnComment = useCallback(() => { onComment?.() }, [onComment])
  const stableOnApproval = useCallback(() => { onApprovalRequest?.() }, [onApprovalRequest])
  const stableOnHelp = useCallback(() => { onHelpRequest?.() }, [onHelpRequest])

  useEffect(() => {
    if (!taskId) return
    wsService.joinTaskRoom(taskId)

    const unsubUpdate = wsService.on('task_updated', (data: any) => {
      if (data.task_id === taskId) stableOnUpdate()
    })
    const unsubComment = wsService.on('task_comment', (data: any) => {
      if (data.task_id === taskId) stableOnComment()
    })
    const unsubApproval = wsService.on('approval_request', (data: any) => {
      if (data.task_id === taskId) stableOnApproval()
    })
    const unsubHelp = wsService.on('help_request', (data: any) => {
      if (data.task_id === taskId) stableOnHelp()
    })

    return () => {
      wsService.leaveTaskRoom(taskId)
      unsubUpdate()
      unsubComment()
      unsubApproval()
      unsubHelp()
    }
  }, [taskId, stableOnUpdate, stableOnComment, stableOnApproval, stableOnHelp])
}
