import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'

const { runtimeEventsApi, wsHandlers } = vi.hoisted(() => ({
  runtimeEventsApi: {
    list: vi.fn(async () => ({
      task_id: 1,
      items: [
        { id: 1, attempt_id: 'att-1', event_type: 'started', seq: 1, message: 'Task execution started', event_timestamp: '2026-09-17T10:00:00' },
        { id: 2, attempt_id: 'att-1', event_type: 'output', seq: 2, message: 'line-1', event_timestamp: '2026-09-17T10:00:01' },
      ],
      last_id: 2,
    })),
    stopAgent: vi.fn(async () => ({
      task_id: 1, attempt_id: 'att-1', agent_id: 5, transport: 'ws_command',
    })),
  },
  wsHandlers: new Map<string, (data: any) => void>(),
}))

vi.mock('../../../src/api/runtimeEvents.js', () => ({ runtimeEventsApi }))
vi.mock('../../../src/services/websocketService', () => ({
  wsService: {
    on: (event: string, handler: (data: any) => void) => {
      wsHandlers.set(event, handler)
      return () => wsHandlers.delete(event)
    },
  },
}))

import { AgentRunConsole } from '../../../src/pages/components/TaskDetail/AgentRunConsole'

describe('AgentRunConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsHandlers.clear()
  })

  it('renders initial runtime events from REST', async () => {
    render(<AgentRunConsole taskId={1} running={false} />)
    await waitFor(() => {
      expect(screen.getByText('line-1')).toBeInTheDocument()
      expect(screen.getByText('Task execution started')).toBeInTheDocument()
    })
    expect(runtimeEventsApi.list).toHaveBeenCalledWith(1, 0)
  })

  it('appends WS runtime events and dedupes by id', async () => {
    render(<AgentRunConsole taskId={1} running={false} />)
    await waitFor(() => expect(screen.getByText('line-1')).toBeInTheDocument())

    const handler = wsHandlers.get('task_runtime_event')!
    handler({ task_id: 1, id: 3, event_type: 'output', message: 'ws-line', event_timestamp: '2026-09-17T10:00:02' })
    handler({ task_id: 1, id: 2, event_type: 'output', message: 'line-1', event_timestamp: '2026-09-17T10:00:01' })
    handler({ task_id: 999, id: 4, event_type: 'output', message: 'other-task', event_timestamp: '' })

    await waitFor(() => expect(screen.getByText('ws-line')).toBeInTheDocument())
    expect(screen.queryByText('other-task')).not.toBeInTheDocument()
    // 去重：id=2 只出现一次
    expect(screen.getAllByText('line-1').length).toBe(1)
  })

  it('shows stop button when running and calls stop API', async () => {
    const onStopped = vi.fn()
    render(<AgentRunConsole taskId={1} running onStopped={onStopped} />)
    await waitFor(() => expect(screen.getByText('停止执行')).toBeInTheDocument())

    // 内联两步确认：停止执行 → 确认停止
    fireEvent.click(screen.getByText('停止执行'))
    const confirmButton = await screen.findByText('确认停止')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(runtimeEventsApi.stopAgent).toHaveBeenCalledWith(1)
      expect(onStopped).toHaveBeenCalled()
    })
  })

  it('hides stop button when not running', async () => {
    render(<AgentRunConsole taskId={1} running={false} />)
    await waitFor(() => expect(screen.getByText('line-1')).toBeInTheDocument())
    expect(screen.queryByText('停止执行')).not.toBeInTheDocument()
  })

  it('shows empty hint when no events', async () => {
    runtimeEventsApi.list.mockResolvedValueOnce({ task_id: 1, items: [], last_id: 0 })
    render(<AgentRunConsole taskId={1} running={false} />)
    await waitFor(() => {
      expect(screen.getByText(/暂无运行输出/)).toBeInTheDocument()
    })
  })

  afterEach(cleanup)
})
