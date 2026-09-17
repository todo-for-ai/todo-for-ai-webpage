/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useCallback } from 'react'
import { wsService } from '../services/websocketService'

interface TaskRealtimeOptions {
  taskId: number
  onTaskUpdate?: () => void
  onComment?: () => void
  onApprovalRequest?: () => void
  onHelpRequest?: () => void
  onRuntimeEvent?: (data: any) => void
}

export function useTaskRealtime({
  taskId,
  onTaskUpdate,
  onComment,
  onApprovalRequest,
  onHelpRequest,
  onRuntimeEvent,
}: TaskRealtimeOptions) {
  const stableOnUpdate = useCallback(() => { onTaskUpdate?.() }, [onTaskUpdate])
  const stableOnComment = useCallback(() => { onComment?.() }, [onComment])
  const stableOnApproval = useCallback(() => { onApprovalRequest?.() }, [onApprovalRequest])
  const stableOnHelp = useCallback(() => { onHelpRequest?.() }, [onHelpRequest])
  const stableOnRuntimeEvent = useCallback((data: any) => { onRuntimeEvent?.(data) }, [onRuntimeEvent])

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
    const unsubRuntime = wsService.on('task_runtime_event', (data: any) => {
      if (data.task_id === taskId) stableOnRuntimeEvent(data)
    })

    return () => {
      wsService.leaveTaskRoom(taskId)
      unsubUpdate()
      unsubComment()
      unsubApproval()
      unsubHelp()
      unsubRuntime()
    }
  }, [taskId, stableOnUpdate, stableOnComment, stableOnApproval, stableOnHelp, stableOnRuntimeEvent])
}
