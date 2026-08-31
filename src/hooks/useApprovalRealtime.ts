/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useCallback } from 'react'
import { wsService } from '../services/websocketService'

interface ApprovalRealtimeOptions {
  onNewApproval?: (data: any) => void
}

export function useApprovalRealtime({ onNewApproval }: ApprovalRealtimeOptions) {
  const stableOnNew = useCallback((data: any) => { onNewApproval?.(data) }, [onNewApproval])

  useEffect(() => {
    const unsubApproval = wsService.on('approval_request', (data: any) => {
      stableOnNew(data)
    })

    return () => {
      unsubApproval()
    }
  }, [stableOnNew])
}
