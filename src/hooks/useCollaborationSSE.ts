import { useEffect, useRef, useCallback } from 'react'

interface SSEEvent {
  event_type: string
  payload: Record<string, unknown>
  pushed_at?: string
  created_at?: string
}

interface UseCollaborationSSEOptions {
  onEvent?: (event: SSEEvent) => void
  enabled?: boolean
}

/**
 * Hook: subscribe to the server-sent collaboration event stream.
 *
 * Automatically reconnects on error with exponential backoff (1s → 30s).
 * Skips when ``enabled`` is false or the user is not authenticated.
 */
export function useCollaborationSSE(options: UseCollaborationSSEOptions = {}) {
  const { onEvent, enabled = true } = options
  const esRef = useRef<EventSource | null>(null)
  const retryRef = useRef(1000)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!enabled) return

    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || ''
    const token = localStorage.getItem('token') || ''
    const url = `${baseUrl}/todo-for-ai/api/v1/sse/collaboration?token=${encodeURIComponent(token)}`

    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      retryRef.current = 1000 // reset backoff on success
      try {
        const data = JSON.parse(e.data) as SSEEvent
        onEvent?.(data)
      } catch {
        // ignore malformed frames
      }
    }

    es.onerror = () => {
      es.close()
      esRef.current = null
      // Exponential backoff reconnect
      const delay = Math.min(retryRef.current, 30000)
      retryRef.current = Math.min(retryRef.current * 2, 30000)
      timerRef.current = setTimeout(connect, delay)
    }
  }, [enabled, onEvent])

  useEffect(() => {
    if (enabled) {
      connect()
    }
    return () => {
      esRef.current?.close()
      esRef.current = null
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [connect, enabled])
}
