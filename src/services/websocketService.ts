/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client'
import { getApiBaseUrl } from '../utils/apiConfig'

type EventHandler = (data: any) => void

class WebSocketService {
  private socket: Socket | null = null
  private handlers: Map<string, Set<EventHandler>> = new Map()
  private _connected = false

  get connected(): boolean {
    return this._connected
  }

  connect(token: string): void {
    if (this.socket?.connected) return

    const baseUrl = getApiBaseUrl().replace('/todo-for-ai/api/v1', '')
    this.socket = io(`${baseUrl}/user/ws`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: 10,
    })

    this.socket.on('connect', () => {
      this._connected = true
      console.log('[WS] Connected to user namespace')
    })

    this.socket.on('disconnect', (reason) => {
      this._connected = false
      console.log('[WS] Disconnected:', reason)
      if (reason === 'io server disconnect') {
        this.socket?.connect()
      }
    })

    this.socket.on('auth_error', (data: any) => {
      console.error('[WS] Auth error:', data)
    })

    // Task events
    this.socket.on('notification', (data: any) => {
      this.emit('notification', data)
    })

    this.socket.on('task_updated', (data: any) => {
      this.emit('task_updated', data)
    })

    this.socket.on('task_comment', (data: any) => {
      this.emit('task_comment', data)
    })

    // Approval events
    this.socket.on('approval_request', (data: any) => {
      this.emit('approval_request', data)
    })

    // Help request events
    this.socket.on('help_request', (data: any) => {
      this.emit('help_request', data)
    })
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
    this._connected = false
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    return () => { this.handlers.get(event)?.delete(handler) }
  }

  private emit(event: string, data: any): void {
    this.handlers.get(event)?.forEach((handler) => handler(data))
  }

  joinTaskRoom(taskId: number): void {
    this.socket?.emit('join_task', { task_id: taskId })
  }

  leaveTaskRoom(taskId: number): void {
    this.socket?.emit('leave_task', { task_id: taskId })
  }
}

export const wsService = new WebSocketService()
