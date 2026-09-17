import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { tasksApi, taskChatApi, runtimeEventsApi, agentsApi, wsHandlers } = vi.hoisted(() => ({
  tasksApi: {
    getTasks: vi.fn(async () => ({ items: [
      { id: 201, title: '执行中任务', status: 'in_progress', project_id: 10, updated_at: '2026-09-18T11:00:00', is_ai_task: true, project: { id: 10, name: 'demo' } },
      { id: 202, title: '已完成任务', status: 'done', project_id: 10, updated_at: '2026-09-18T10:00:00', is_ai_task: true, project: { id: 10, name: 'demo' } },
    ] })),
    getTask: vi.fn(async (id: number) => ({
      id, title: '执行中任务', status: 'in_progress', project_id: 10, priority: 'high',
      created_at: '2026-09-18T09:00:00', updated_at: '2026-09-18T11:00:00',
      is_ai_task: true, assignees: [{ type: 'agent', id: 5 }],
      subtask_count: 4, subtask_done_count: 2,
      project: { id: 10, name: 'demo' },
    })),
    createTask: vi.fn(async (data: any) => ({ id: 999, ...data })),
  },
  taskChatApi: {
    getMessages: vi.fn(async () => ({
      items: [
        { id: 11, task_id: 201, actor_type: 'HUMAN', content: '请开始', content_type: 'text', created_at: '2026-09-18T09:59:00' },
        { id: 12, task_id: 201, actor_type: 'AGENT', content: '**已完成** 第一步', content_type: 'text', created_at: '2026-09-18T10:05:00' },
      ],
      total: 2, page: 1,
    })),
    sendMessage: vi.fn(async () => ({ id: 13 })),
  },
  runtimeEventsApi: {
    list: vi.fn(async () => ({
      task_id: 201,
      items: [
        { id: 1, attempt_id: 'a1', event_type: 'started', seq: 1, message: '开始执行', event_timestamp: '2026-09-18T10:00:00' },
        { id: 2, attempt_id: 'a1', event_type: 'output', seq: 2, message: 'line-1', event_timestamp: '2026-09-18T10:00:30' },
        { id: 3, attempt_id: 'a1', event_type: 'completed', seq: 3, message: '执行完成', event_timestamp: '2026-09-18T10:10:00' },
      ],
      last_id: 3,
    })),
    stopAgent: vi.fn(async () => ({ task_id: 201, attempt_id: 'a1', agent_id: 5, transport: 'ws_command' })),
  },
  agentsApi: {
    getSharedContext: vi.fn(async () => [
      { id: 1, key: 'research_summary', value: '结论：一切正常', author_agent_name: 'alpha', updated_at: '2026-09-18T10:00:00' },
    ]),
    dispatchTasks: vi.fn(async () => ({ dispatched: 1 })),
  },
  wsHandlers: new Map<string, (data: any) => void>(),
}))

vi.mock('../../../src/api/tasks', () => ({ tasksApi }))
vi.mock('../../../src/api/taskChat.js', () => ({ taskChatApi }))
vi.mock('../../../src/api/runtimeEvents.js', () => ({ runtimeEventsApi }))
vi.mock('../../../src/api/agents', () => ({ agentsApi }))
// milkdown 依赖 ThemeProvider 且在 jsdom 中极重，用桩替代（真实渲染由浏览器验收覆盖）
vi.mock('../../../src/components/MarkdownEditor', () => ({
  MarkdownEditor: ({ value }: { value?: string }) => <div data-testid="console-markdown">{value}</div>,
}))
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

import { ConsoleWorkspace } from '../../../src/pages/console/ConsoleWorkspace'

const renderConsole = (initial = '/todo-for-ai/pages/console?task=201') =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[initial]}>
        <ConsoleWorkspace />
      </MemoryRouter>
    </StrictMode>
  )

describe('ConsoleWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wsHandlers.clear()
  })

  it('renders sidebar task stream grouped by project and selects via URL', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-task-201')).toBeInTheDocument())
    expect(screen.getByTestId('console-task-202')).toBeInTheDocument()
    expect(screen.getAllByText('demo').length).toBeGreaterThan(0)
    // URL 指定 task=201 → 详情加载 + 会话渲染
    await waitFor(() => expect(tasksApi.getTask).toHaveBeenCalledWith(201))
    await waitFor(() => expect(screen.getByText('请开始')).toBeInTheDocument())
    expect(screen.getByTestId('console-transcript')).toBeInTheDocument()
  })

  it('renders merged timeline: user line, agent markdown message, raw output and iteration divider', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-user-line')).toBeInTheDocument())
    expect(screen.getByTestId('console-agent-message')).toBeInTheDocument()
    expect(screen.getByText('line-1')).toBeInTheDocument()
    expect(screen.getByTestId('console-iteration')).toBeInTheDocument()
    expect(screen.getByText('✓ 执行完成')).toBeInTheDocument()
  })

  it('shows info panel with subtask progress and shared context', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-info-panel')).toBeInTheDocument())
    expect(screen.getByText('2/4')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('research_summary')).toBeInTheDocument())
  })

  it('running task shows 停止 button and no dispatch toggle', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-composer')).toBeInTheDocument())
    expect(screen.getByText('停止')).toBeInTheDocument()
    expect(screen.queryByTestId('console-dispatch-toggle')).not.toBeInTheDocument()
  })

  it('idle dispatchable task shows dispatch toggle; sending dispatches after message', async () => {
    tasksApi.getTask.mockResolvedValue({
      id: 202, title: '已完成任务', status: 'done', project_id: 10, priority: 'medium',
      created_at: '2026-09-18T09:00:00', updated_at: '2026-09-18T10:00:00',
      is_ai_task: true, assignees: [{ type: 'agent', id: 5 }],
    })
    renderConsole('/todo-for-ai/pages/console?task=202')
    await waitFor(() => expect(screen.getByTestId('console-dispatch-toggle')).toBeInTheDocument())

    const input = screen.getByTestId('console-input')
    fireEvent.change(input, { target: { value: '再跑一轮回归' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => expect(taskChatApi.sendMessage).toHaveBeenCalledWith(202, '再跑一轮回归'))
    await waitFor(() => expect(agentsApi.dispatchTasks).toHaveBeenCalledWith(5, { project_id: 10 }))
  })

  it('sidebar search filters the task stream', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-task-201')).toBeInTheDocument())
    const search = screen.getByTestId('console-search')
    fireEvent.change(search, { target: { value: '已完成' } })
    await waitFor(() => expect(screen.queryByTestId('console-task-201')).not.toBeInTheDocument())
    expect(screen.getByTestId('console-task-202')).toBeInTheDocument()
  })

  afterEach(cleanup)
})
