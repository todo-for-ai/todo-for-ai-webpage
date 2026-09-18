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
      content: '## 背景\n这是任务描述正文，包含验收标准。',
      created_at: '2026-09-18T09:00:00', updated_at: '2026-09-18T11:00:00',
      is_ai_task: true, assignees: [{ type: 'agent', id: 5 }],
      subtask_count: 4, subtask_done_count: 2,
      project: { id: 10, name: 'demo' },
    })),
    createTask: vi.fn(async (data: any) => ({ id: 999, ...data })),
    getTaskAttachments: vi.fn(async () => [
      { id: 1, task_id: 201, filename: 'report_a.txt', original_filename: 'report_a.txt', file_size: 2048, file_size_human: '2KB' },
    ]),
    getSubtasks: vi.fn(async () => [
      { id: 301, title: '子任务甲', status: 'done' },
      { id: 302, title: '子任务乙', status: 'todo' },
    ]),
    getTaskAttachmentDownloadUrl: vi.fn((taskId: number, attachmentId: number) =>
      `/todo-for-ai/api/v1/tasks/${taskId}/attachments/${attachmentId}/download`),
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
    // clearAllMocks 不清除 mockResolvedValue：前一条用例把 getTask 覆盖成
    // 别的详情对象会泄漏到后续用例，这里统一恢复按 id 返回的规范实现
    tasksApi.getTask.mockImplementation(async (id: number) => ({
      id, title: '执行中任务', status: 'in_progress', project_id: 10, priority: 'high',
      content: '## 背景\n这是任务描述正文，包含验收标准。',
      created_at: '2026-09-18T09:00:00', updated_at: '2026-09-18T11:00:00',
      is_ai_task: true, assignees: [{ type: 'agent', id: 5 }],
      subtask_count: 4, subtask_done_count: 2,
      project: { id: 10, name: 'demo' },
    }))
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

  it('shows info panel with subtask progress, list, description and attachments', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-info-panel')).toBeInTheDocument())
    expect(screen.getByText('2/4')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('research_summary')).toBeInTheDocument())
    // 子任务列表
    await waitFor(() => expect(screen.getByText('子任务甲')).toBeInTheDocument())
    // 任务描述折叠展示 + 展开（在信息面板作用域内查，避免与时间线撞名）
    expect(screen.getByTestId('console-desc-toggle')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('console-desc-toggle'))
    const panel = screen.getByTestId('console-info-panel')
    await waitFor(() => expect(panel.querySelector('.console-markdown')).not.toBeNull())
    // 附件下载链接
    const link = screen.getByText('report_a.txt').closest('a')
    expect(link).toHaveAttribute('href')
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

  it('⌘K quick switcher opens, filters and selects task', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-task-201')).toBeInTheDocument())

    // Ctrl+K 打开自绘弹层
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true })
    expect(screen.getByTestId('console-switcher')).toBeInTheDocument()
    const input = screen.getByTestId('console-switcher-input')
    fireEvent.change(input, { target: { value: '已完成' } })
    fireEvent.click(screen.getByTestId('console-switcher-item-202'))

    await waitFor(() => {
      expect(tasksApi.getTask).toHaveBeenCalledWith(202)
      expect(screen.queryByTestId('console-switcher')).not.toBeInTheDocument()
    })
  })

  it('sidebar search filters the task stream', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-task-201')).toBeInTheDocument())
    const search = screen.getByTestId('console-search')
    fireEvent.change(search, { target: { value: '已完成' } })
    await waitFor(() => expect(screen.queryByTestId('console-task-201')).not.toBeInTheDocument())
    expect(screen.getByTestId('console-task-202')).toBeInTheDocument()
  })

  it('slash command menu opens on "/", picks command by click', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-input')).toBeInTheDocument())

    const input = screen.getByTestId('console-input')
    fireEvent.change(input, { target: { value: '/' } })
    const menu = await waitFor(() => screen.getByTestId('console-cmd-menu'))
    expect(menu.querySelectorAll('[data-testid^="console-cmd-menu-item-"]').length).toBe(3)

    // 点击选中 /help（命令列表直接上屏；系统行带 ○ 前缀，用正则匹配）
    fireEvent.mouseDown(screen.getByTestId('console-cmd-menu-item-help'))
    await waitFor(() => expect(screen.getByText(/clear 清空当前视图/)).toBeInTheDocument())
    // 执行后输入框清空、菜单关闭
    await waitFor(() => expect(screen.queryByTestId('console-cmd-menu')).not.toBeInTheDocument())
  })

  it('transcript toolbar copies and downloads the transcript', async () => {
    const writeText = vi.fn(async () => {})
    Object.assign(navigator, { clipboard: { writeText } })
    const createObjectURL = vi.fn(() => 'blob:mock-url')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true })

    renderConsole()
    await waitFor(() => expect(screen.getByText('请开始')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('console-transcript-copy'))
    await waitFor(() => expect(writeText).toHaveBeenCalled())
    const copied = writeText.mock.calls[0][0] as string
    expect(copied).toContain('❯ 请开始')
    expect(copied).toContain('line-1')

    fireEvent.click(screen.getByTestId('console-transcript-download'))
    expect(createObjectURL).toHaveBeenCalled()
    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toContain('text/markdown')
  })

  it('shortcuts overlay opens via header button or "?", closes via backdrop/Esc', async () => {
    renderConsole()
    await waitFor(() => expect(screen.getByTestId('console-input')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('console-shortcuts-button'))
    expect(screen.getByTestId('console-shortcuts')).toBeInTheDocument()
    expect(screen.getAllByTestId('console-shortcut-key').length).toBeGreaterThanOrEqual(10)

    fireEvent.click(screen.getByTestId('console-shortcuts-backdrop'))
    expect(screen.queryByTestId('console-shortcuts')).not.toBeInTheDocument()

    // ? 唤起（目标非输入框）
    fireEvent.keyDown(document.body, { key: '?' })
    expect(screen.getByTestId('console-shortcuts')).toBeInTheDocument()
    // Esc 关闭
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByTestId('console-shortcuts')).not.toBeInTheDocument()

    // 输入框中敲 ? 不触发
    fireEvent.change(screen.getByTestId('console-input'), { target: { value: '问号?' } })
    fireEvent.keyDown(screen.getByTestId('console-input'), { key: '?' })
    expect(screen.queryByTestId('console-shortcuts')).not.toBeInTheDocument()
  })

  it('scrolling up shows new-output badge when runtime events arrive; back to bottom clears', async () => {
    renderConsole()
    const transcript = await waitFor(() => screen.getByTestId('console-transcript'))
    await waitFor(() => expect(screen.getByText('line-1')).toBeInTheDocument())

    // jsdom 无布局：桩化滚动尺寸后触发 scroll，让 atBottom 变 false
    // （scrollTop 须可写：回到底部与自动滚底都会赋值）
    Object.defineProperty(transcript, 'scrollHeight', { value: 900, configurable: true })
    Object.defineProperty(transcript, 'scrollTop', { value: 0, writable: true, configurable: true })
    Object.defineProperty(transcript, 'clientHeight', { value: 200, configurable: true })
    fireEvent.scroll(transcript)

    // WS 推送两条新事件 → 徽标出现
    const handler = wsHandlers.get('task_runtime_event')
    expect(handler).toBeTruthy()
    await waitFor(() => {
      handler!({ id: 21, attempt_id: 'a1', event_type: 'output', seq: 4, message: '新输出甲', event_timestamp: '2026-09-18T10:11:00', task_id: 201 })
      handler!({ id: 22, attempt_id: 'a1', event_type: 'output', seq: 5, message: '新输出乙', event_timestamp: '2026-09-18T10:11:01', task_id: 201 })
    })
    expect(await screen.findByTestId('console-new-below')).toHaveTextContent('2 条新输出')

    fireEvent.click(screen.getByTestId('console-scroll-bottom'))
    await waitFor(() => expect(screen.queryByTestId('console-new-below')).not.toBeInTheDocument())
  })

  afterEach(cleanup)
})
