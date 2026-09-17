import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'

const { runtimeEventsApi, taskChatApi, wsHandlers } = vi.hoisted(() => ({
  runtimeEventsApi: {
    list: vi.fn(async () => ({
      task_id: 1,
      items: [
        { id: 1, attempt_id: 'att-1', event_type: 'started', seq: 1, message: '开始执行', event_timestamp: '2026-09-17T10:00:00' },
        { id: 2, attempt_id: 'att-1', event_type: 'output', seq: 2, message: 'line-1', event_timestamp: '2026-09-17T10:00:01' },
      ],
      last_id: 2,
    })),
    stopAgent: vi.fn(async () => ({
      task_id: 1, attempt_id: 'att-1', agent_id: 5, transport: 'ws_command',
    })),
  },
  taskChatApi: {
    getMessages: vi.fn(async () => ({
      items: [
        { id: 10, task_id: 1, actor_type: 'HUMAN', content: '请开始', content_type: 'text', created_at: '2026-09-17T09:59:00' },
      ],
      total: 1,
      page: 1,
    })),
    sendMessage: vi.fn(async () => ({ id: 11 })),
  },
  wsHandlers: new Map<string, (data: any) => void>(),
}))

vi.mock('../../../src/api/runtimeEvents.js', () => ({ runtimeEventsApi }))
vi.mock('../../../src/api/taskChat.js', () => ({ taskChatApi }))
vi.mock('../../../src/services/websocketService', () => ({
  wsService: {
    on: (event: string, handler: (data: any) => void) => {
      wsHandlers.set(event, handler)
      return () => wsHandlers.delete(event)
    },
    joinTaskRoom: vi.fn(),
    leaveTaskRoom: vi.fn(),
  },
}))

import { AgentTerminal } from '../../../src/pages/components/TaskDetail/AgentTerminal'

// 两个时间源（对话 09:59 + 事件 10:00）应按时间升序合并
describe('AgentTerminal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsHandlers.clear()
  })

  it('renders merged chat + runtime timeline chronologically', async () => {
    render(<AgentTerminal taskId={1} running={false} />)
    await waitFor(() => {
      expect(screen.getByText('请开始')).toBeInTheDocument()
      expect(screen.getByText('line-1')).toBeInTheDocument()
    })
    const body = screen.getByTestId('terminal-body')
    expect(body.textContent!.indexOf('请开始')).toBeLessThan(body.textContent!.indexOf('开始执行'))
    expect(runtimeEventsApi.list).toHaveBeenCalledWith(1, 0)
    // 对话在执行事件之前
  })

  it('appends WS runtime events and dedupes by id', async () => {
    render(<AgentTerminal taskId={1} running={false} />)
    await waitFor(() => expect(screen.getByText('line-1')).toBeInTheDocument())

    const handler = wsHandlers.get('task_runtime_event')!
    handler({ task_id: 1, id: 3, event_type: 'output', message: 'ws-line', event_timestamp: '2026-09-17T10:00:02' })
    handler({ task_id: 1, id: 2, event_type: 'output', message: 'line-1', event_timestamp: '2026-09-17T10:00:01' })
    handler({ task_id: 999, id: 4, event_type: 'output', message: 'other-task', event_timestamp: '' })

    await waitFor(() => expect(screen.getByText('ws-line')).toBeInTheDocument())
    expect(screen.queryByText('other-task')).not.toBeInTheDocument()
    expect(screen.getAllByText('line-1').length).toBe(1)
  })

  it('StrictMode 下事件流不丢失（updater 必须是纯函数，回归：副作用写进 setEvents 导致 dev 白屏事件）', async () => {
    render(<StrictMode><AgentTerminal taskId={1} running={false} /></StrictMode>)
    await waitFor(() => {
      expect(screen.getByText('line-1')).toBeInTheDocument()
      expect(screen.getByText('开始执行')).toBeInTheDocument()
    })
  })

  it('sends typed messages, echoes locally and reconciles with server record', async () => {
    render(<AgentTerminal taskId={1} running={false} />)
    await waitFor(() => expect(screen.getByText('请开始')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText(/输入消息/), { target: { value: '继续第三步' } })
    fireEvent.keyDown(screen.getByPlaceholderText(/输入消息/), { key: 'Enter', shiftKey: false })

    await waitFor(() => {
      expect(taskChatApi.sendMessage).toHaveBeenCalledWith(1, '继续第三步')
      // 乐观回声立即上屏
      expect(screen.getByText('继续第三步')).toBeInTheDocument()
    })

    // 服务端记录回来后（同文 HUMAN 消息），本地回声被顶替，只剩一条
    taskChatApi.getMessages.mockResolvedValueOnce({
      items: [
        { id: 10, task_id: 1, actor_type: 'HUMAN', content: '请开始', content_type: 'text', created_at: '2026-09-17T09:59:00' },
        { id: 11, task_id: 1, actor_type: 'HUMAN', content: '继续第三步', content_type: 'text', created_at: '2026-09-17T10:05:00' },
      ],
      total: 2,
      page: 1,
    })
    await waitFor(() => {
      expect(screen.getAllByText('继续第三步').length).toBe(1)
    })
  })

  it('handles slash commands: help lists without sending, unknown hints, /stop calls API', async () => {
    render(<AgentTerminal taskId={1} running />)
    await waitFor(() => expect(screen.getByText('line-1')).toBeInTheDocument())

    const input = screen.getByPlaceholderText(/输入消息/)

    fireEvent.change(input, { target: { value: '/help' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(await screen.findByText(/中断当前执行/)).toBeInTheDocument()
    expect(taskChatApi.sendMessage).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '/wat' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(await screen.findByText(/未知命令 \/wat/)).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '/stop' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(runtimeEventsApi.stopAgent).toHaveBeenCalledWith(1))
  })

  it('interrupts via two-step Esc when running', async () => {
    render(<AgentTerminal taskId={1} running />)
    await waitFor(() => expect(screen.getByText('line-1')).toBeInTheDocument())

    fireEvent.keyDown(screen.getByTestId('terminal-body'), { key: 'Escape' })
    expect(await screen.findByText('再按 Esc 确认中断执行')).toBeInTheDocument()
    expect(runtimeEventsApi.stopAgent).not.toHaveBeenCalled()

    fireEvent.keyDown(screen.getByTestId('terminal-body'), { key: 'Escape' })
    await waitFor(() => expect(runtimeEventsApi.stopAgent).toHaveBeenCalledWith(1))
  })

  it('stop button uses inline two-step confirm', async () => {
    render(<AgentTerminal taskId={1} running />)
    await waitFor(() => expect(screen.getByText('停止执行')).toBeInTheDocument())

    fireEvent.click(screen.getByText('停止执行'))
    fireEvent.click(await screen.findByText('确认停止'))

    await waitFor(() => expect(runtimeEventsApi.stopAgent).toHaveBeenCalledWith(1))
  })

  it('clear view empties the timeline', async () => {
    render(<AgentTerminal taskId={1} running={false} />)
    await waitFor(() => expect(screen.getByText('line-1')).toBeInTheDocument())

    fireEvent.click(screen.getByTitle('清空视图'))
    await waitFor(() => {
      expect(screen.queryByText('line-1')).not.toBeInTheDocument()
      expect(screen.getByText(/欢迎使用交互终端/)).toBeInTheDocument()
    })
  })

  afterEach(cleanup)
})
