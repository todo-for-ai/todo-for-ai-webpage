import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, render, fireEvent, cleanup } from '@testing-library/react'

const { agentsApi, message } = vi.hoisted(() => ({
  agentsApi: {
    getStepEffectiveParams: vi.fn(async () => ({ effective_params: { agent_id: 7, required_capabilities: ['a', 'b'], timeout_seconds: 60, retry_count: 2, on_failure: 'skip', condition: { k: 1 }, task_template_id: 5, sub_workflow_id: 9 }, overrides: {} })),
    setStepRuntimeOverride: vi.fn(async () => ({ applied: true })),
    clearStepRuntimeOverride: vi.fn(async () => ({ cleared: true })),
    listConflicts: vi.fn(async () => ({ items: [{ id: 1 }] })),
    scanConflicts: vi.fn(async () => ({ detected: 2 })),
    getConflict: vi.fn(async () => ({ conflict: { id: 1 } })),
    acknowledgeConflict: vi.fn(async () => ({})),
    ignoreConflict: vi.fn(async () => ({})),
    resolveConflict: vi.fn(async () => ({ actions: ['a', 'b'] })),
    autoResolveConflicts: vi.fn(async () => ({ auto_resolved: 3, skipped: 1 })),
  },
  message: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))

vi.mock('../../../src/api/agents', () => ({ agentsApi }))
// antd 透传真实组件（columns 用例需真实渲染），仅 mock message
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  return { ...actual, message }
})

import { useAgentStepOverrides } from '../../../src/pages/agents/hooks/useAgentStepOverrides'
import { useAgentConflicts } from '../../../src/pages/agents/hooks/useAgentConflicts'
import { buildAgentsTableColumns } from '../../../src/pages/agents/agentsTableColumns'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAgentStepOverrides', () => {
  it('初始状态与 openStepOverride 重置', async () => {
    const { result } = renderHook(() => useAgentStepOverrides())
    expect(result.current.stepOverrideOpen).toBe(false)
    expect(result.current.stepEffective).toBeNull()
    await act(async () => {
      await result.current.openStepOverride(3, 'step-a')
    })
    expect(result.current.stepOverrideOpen).toBe(true)
    expect(result.current.stepOverrideForm.run_id).toBe(3)
    expect(result.current.stepOverrideForm.step_key).toBe('step-a')
    expect(agentsApi.getStepEffectiveParams).toHaveBeenCalledWith(3, 'step-a')
    // 无 runId 时不拉有效参数
    await act(async () => {
      await result.current.openStepOverride()
    })
    expect(agentsApi.getStepEffectiveParams).toHaveBeenCalledTimes(1)
    expect(result.current.stepOverrideForm.step_key).toBe('')
  })

  it('loadStepEffective：overrides 优先于 effective_params', async () => {
    agentsApi.getStepEffectiveParams.mockResolvedValueOnce({
      effective_params: { agent_id: 7, required_capabilities: ['a', 'b'], timeout_seconds: 60, retry_count: 2, on_failure: 'skip', condition: { k: 1 }, task_template_id: 5, sub_workflow_id: 9 },
      overrides: { agent_id: 99 },
    })
    const { result } = renderHook(() => useAgentStepOverrides())
    await act(async () => {
      await result.current.loadStepEffective(1, 's')
    })
    expect(result.current.stepOverrideForm.agent_id).toBe(99)
    expect(result.current.stepOverrideForm.required_capabilities).toBe('a, b')
    expect(result.current.stepOverrideForm.condition).toBe('{"k":1}')
    agentsApi.getStepEffectiveParams.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.loadStepEffective(1, 's')
    })
    expect(message.error).toHaveBeenCalledWith('加载有效参数失败')
  })

  it('submitStepOverride：缺参警告 / condition 非法 JSON / 空覆盖警告', async () => {
    const { result } = renderHook(() => useAgentStepOverrides())
    act(() => {
      result.current.setStepOverrideForm({ ...result.current.stepOverrideForm, run_id: undefined, step_key: '' })
    })
    await act(async () => {
      await result.current.submitStepOverride()
    })
    expect(message.warning).toHaveBeenCalledWith('请填写运行 ID 和步骤 key')
    act(() => {
      result.current.setStepOverrideForm({ ...result.current.stepOverrideForm, run_id: 1, step_key: 's', condition: '{bad' })
    })
    await act(async () => {
      await result.current.submitStepOverride()
    })
    expect(message.error).toHaveBeenCalledWith('condition 必须是合法 JSON')
    act(() => {
      result.current.setStepOverrideForm({ ...result.current.stepOverrideForm, condition: '' })
    })
    await act(async () => {
      await result.current.submitStepOverride()
    })
    expect(message.warning).toHaveBeenCalledWith('请至少填写一项覆盖参数')
  })

  it('submitStepOverride：全字段归一化并成功应用', async () => {
    const { result } = renderHook(() => useAgentStepOverrides())
    act(() => {
      result.current.setStepOverrideForm({
        run_id: '12', step_key: 'step', agent_id: null, required_capabilities: ' a , b , ',
        timeout_seconds: '30', retry_count: 1, on_failure: 'skip',
        condition: '{"x":1}', task_template_id: '5', sub_workflow_id: 9,
      })
    })
    await act(async () => {
      await result.current.submitStepOverride()
    })
    expect(agentsApi.setStepRuntimeOverride).toHaveBeenCalledWith(12, 'step', {
      overrides: {
        agent_id: undefined, // null 被排除后不写入（undefined 不参与）
        required_capabilities: ['a', 'b'],
        timeout_seconds: 30,
        retry_count: 1,
        on_failure: 'skip',
        condition: { x: 1 },
        task_template_id: 5,
        sub_workflow_id: 9,
      },
      merge: true,
    })
    expect(message.success).toHaveBeenCalledWith('步骤运行时覆盖已应用')
    expect(result.current.stepEffective).toEqual({ applied: true })
    agentsApi.setStepRuntimeOverride.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.submitStepOverride()
    })
    expect(message.error).toHaveBeenCalledWith('应用覆盖失败')
  })

  it('clearStepOverride：缺参早退 / 成功 / 失败', async () => {
    const { result } = renderHook(() => useAgentStepOverrides())
    await act(async () => {
      await result.current.clearStepOverride()
    })
    expect(agentsApi.clearStepRuntimeOverride).not.toHaveBeenCalled()
    act(() => {
      result.current.setStepOverrideForm({ ...result.current.stepOverrideForm, run_id: 3, step_key: 's' })
    })
    await act(async () => {
      await result.current.clearStepOverride()
    })
    expect(agentsApi.clearStepRuntimeOverride).toHaveBeenCalledWith(3, 's')
    expect(message.success).toHaveBeenCalledWith('运行时覆盖已清除')
    agentsApi.clearStepRuntimeOverride.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.clearStepOverride()
    })
    expect(message.error).toHaveBeenCalledWith('清除覆盖失败')
  })
})

describe('useAgentConflicts', () => {
  it('loadConflicts 两种过滤与失败；openConflicts 打开并加载', async () => {
    const { result } = renderHook(() => useAgentConflicts())
    await act(async () => {
      await result.current.loadConflicts()
    })
    expect(agentsApi.listConflicts).toHaveBeenCalledWith({ active_only: 'true' })
    await act(async () => {
      await result.current.loadConflicts(false)
    })
    expect(agentsApi.listConflicts).toHaveBeenLastCalledWith({})
    agentsApi.listConflicts.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.loadConflicts()
    })
    expect(message.error).toHaveBeenCalledWith('加载冲突列表失败')
    agentsApi.listConflicts.mockResolvedValueOnce({ items: undefined })
    await act(async () => {
      await result.current.loadConflicts()
    })
    expect(result.current.conflicts).toEqual([])
    await act(async () => {
      await result.current.openConflicts()
    })
    expect(result.current.conflictOpen).toBe(true)
  })

  it('scanConflicts：有新冲突 / 无新冲突 / 失败', async () => {
    const { result } = renderHook(() => useAgentConflicts())
    await act(async () => {
      await result.current.scanConflicts()
    })
    expect(message.success).toHaveBeenCalledWith('检测到 2 个新冲突')
    agentsApi.scanConflicts.mockResolvedValueOnce({ detected: 0 })
    await act(async () => {
      await result.current.scanConflicts()
    })
    expect(message.success).toHaveBeenCalledWith('无新冲突')
    agentsApi.scanConflicts.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.scanConflicts()
    })
    expect(message.error).toHaveBeenCalledWith('扫描失败')
  })

  it('openConflictDetail / acknowledge / ignore 成败', async () => {
    const { result } = renderHook(() => useAgentConflicts())
    await act(async () => {
      await result.current.openConflictDetail(1)
    })
    expect(result.current.conflictDetail).toEqual({ id: 1 })
    expect(result.current.conflictDetailOpen).toBe(true)
    agentsApi.getConflict.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.openConflictDetail(2)
    })
    expect(message.error).toHaveBeenCalledWith('加载冲突详情失败')
    await act(async () => {
      await result.current.acknowledgeConflict(1)
    })
    expect(message.success).toHaveBeenCalledWith('已确认')
    agentsApi.acknowledgeConflict.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.acknowledgeConflict(1)
    })
    expect(message.error).toHaveBeenCalledWith('确认失败')
    await act(async () => {
      await result.current.ignoreConflict(1)
    })
    expect(message.success).toHaveBeenCalledWith('已忽略')
    agentsApi.ignoreConflict.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.ignoreConflict(1)
    })
    expect(message.error).toHaveBeenCalledWith('忽略失败')
  })

  it('openResolveConflict 预填表单（建议策略缺省 manual）；submitResolveConflict 成败与动作提示', async () => {
    const { result } = renderHook(() => useAgentConflicts())
    act(() => {
      result.current.openResolveConflict({ id: 7, suggested_strategy: 'reassign' })
    })
    expect(result.current.conflictResolveForm).toEqual({ conflict_id: 7, strategy: 'reassign', description: '' })
    act(() => {
      result.current.openResolveConflict({ id: 8 })
    })
    expect(result.current.conflictResolveForm.strategy).toBe('manual')
    await act(async () => {
      await result.current.submitResolveConflict()
    })
    expect(agentsApi.resolveConflict).toHaveBeenCalledWith(8, 'manual', '')
    expect(message.success).toHaveBeenCalledWith('冲突已解决')
    expect(result.current.conflictResolveOpen).toBe(false)
    expect(message.info).toHaveBeenCalledWith('执行 2 项动作', 4)
    agentsApi.resolveConflict.mockResolvedValueOnce({ actions: [] })
    await act(async () => {
      await result.current.submitResolveConflict()
    })
    expect(message.info).toHaveBeenCalledTimes(1)
    agentsApi.resolveConflict.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.submitResolveConflict()
    })
    expect(message.error).toHaveBeenCalledWith('解决失败')
  })

  it('autoResolveConflicts 成败（缺省值 0）', async () => {
    const { result } = renderHook(() => useAgentConflicts())
    await act(async () => {
      await result.current.autoResolveConflicts()
    })
    expect(message.success).toHaveBeenCalledWith('自动解决 3 个, 跳过 1 个')
    agentsApi.autoResolveConflicts.mockResolvedValueOnce({})
    await act(async () => {
      await result.current.autoResolveConflicts()
    })
    expect(message.success).toHaveBeenLastCalledWith('自动解决 0 个, 跳过 0 个')
    agentsApi.autoResolveConflicts.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.autoResolveConflicts()
    })
    expect(message.error).toHaveBeenCalledWith('自动解决失败')
  })
})

describe('buildAgentsTableColumns', () => {
  const noop = vi.fn()
  const ctx = {
    heartbeat: vi.fn(),
    previewDispatchTasks: vi.fn(),
    dispatchTasks: vi.fn(),
    claimTask: vi.fn(),
    loadRecommendedTasks: vi.fn(),
    loadAssignments: vi.fn(),
    openEditModal: vi.fn(),
    setBroadcastAgent: vi.fn(),
    setBroadcastOpen: vi.fn(),
    setBroadcastContent: vi.fn(),
    setDmFrom: vi.fn(),
    setDmTo: vi.fn(),
    setDmOpen: vi.fn(),
    setDmContent: vi.fn(),
    updateAssignmentState: vi.fn(),
  }

  const agentBase = { id: 1, name: 'alice', kind: 'worker', status: 'active' } as any

  afterEach(() => {
    cleanup()
  })

  const renderCell = (cell: any) => {
    const { container } = render(cell)
    return container
  }

  it('列结构完整（7 列 + 5 列）', () => {
    const { columns, assignmentColumns } = buildAgentsTableColumns(ctx)
    expect(columns).toHaveLength(7)
    expect(assignmentColumns).toHaveLength(5)
  })

  it('基础列渲染（名称/类型/角色三态/能力/派发统计）', () => {
    const { columns } = buildAgentsTableColumns(ctx)
    expect(renderCell(columns[0].render('x', { ...agentBase, stats: {} })).textContent).toContain('alice')
    expect(renderCell(columns[1].render('worker')).textContent).toContain('worker')
    expect(renderCell(columns[2].render('leader')).textContent).toContain('领导者')
    expect(renderCell(columns[2].render('follower')).textContent).toContain('跟随者')
    expect(renderCell(columns[2].render(undefined)).textContent).toContain('独立')
    expect(renderCell(columns[2].render('other')).textContent).toContain('独立')
    // 能力 ≥3 出现雷达 tooltip，<3 无
    expect(renderCell(columns[3].render(['a', 'b', 'c'], agentBase))).toBeTruthy()
    expect(renderCell(columns[3].render(['a'], agentBase))).toBeTruthy()
    expect(renderCell(columns[4].render(3, { ...agentBase, stats: { active_assignments: 2, total_runs: 5 } })).textContent).toContain('活跃')
  })

  it('在线状态列四分支', () => {
    const { columns } = buildAgentsTableColumns(ctx)
    const render = columns[5].render
    expect(renderCell(render(undefined, agentBase)).textContent).toContain('离线')
    expect(renderCell(render(new Date().toISOString(), { ...agentBase, status: 'offline' })).textContent).toContain('离线')
    expect(renderCell(render(new Date().toISOString(), agentBase)).textContent).toContain('在线')
    const stale = new Date(Date.now() - 20 * 60 * 1000).toISOString()
    expect(renderCell(render(stale, agentBase)).textContent).toContain('分钟前')
    const expired = new Date(Date.now() - 45 * 60 * 1000).toISOString()
    expect(renderCell(render(expired, agentBase)).textContent).toContain('超时')
  })

  it('操作列：coordinator 分支按钮点击', () => {
    const { columns } = buildAgentsTableColumns(ctx)
    const coord = { ...agentBase, kind: 'coordinator' }
    const { container } = render(columns[6].render(null, coord))
    const buttons = [...container.querySelectorAll('button')]
    fireEvent.click(buttons[0]) // 心跳
    fireEvent.click(buttons[1]) // 预览派活
    fireEvent.click(buttons[2]) // 自动派活
    fireEvent.click(buttons[3]) // 派发
    fireEvent.click(buttons[4]) // 编辑
    fireEvent.click(buttons[5]) // 广播
    fireEvent.click(buttons[6]) // 消息
    expect(ctx.heartbeat).toHaveBeenCalledWith(coord)
    expect(ctx.previewDispatchTasks).toHaveBeenCalledWith(coord)
    expect(ctx.dispatchTasks).toHaveBeenCalledWith(coord)
    expect(ctx.loadAssignments).toHaveBeenCalledWith(coord)
    expect(ctx.openEditModal).toHaveBeenCalledWith(coord)
    expect(ctx.setBroadcastOpen).toHaveBeenCalledWith(true)
    expect(ctx.setDmOpen).toHaveBeenCalledWith(true)
  })

  it('操作列：worker 分支按钮点击', () => {
    const { columns } = buildAgentsTableColumns(ctx)
    const worker = { ...agentBase, kind: 'worker' }
    const { container } = render(columns[6].render(null, worker))
    const buttons = [...container.querySelectorAll('button')]
    // 操作列：[心跳, 智能领取, 推荐, 优先级领取, 派发, 编辑, 广播, 消息]
    fireEvent.click(buttons[0]) // 心跳
    fireEvent.click(buttons[1]) // 智能领取
    fireEvent.click(buttons[2]) // 推荐
    fireEvent.click(buttons[3]) // 优先级领取
    expect(ctx.heartbeat).toHaveBeenCalledWith(worker)
    expect(ctx.claimTask).toHaveBeenCalledWith(worker, null, true)
    expect(ctx.loadRecommendedTasks).toHaveBeenCalledWith(worker)
    expect(ctx.claimTask).toHaveBeenLastCalledWith(worker, null, false)
  })

  it('派发记录列渲染与操作点击', () => {
    const { assignmentColumns } = buildAgentsTableColumns(ctx)
    const record = { task_id: 9, task: { title: 'T', project: { name: 'P' } }, state: 'running', progress_rate: 50, lease_expires_at: '2026-09-15T00:00:00Z' } as any
    expect(renderCell(assignmentColumns[0].render(null, record)).textContent).toContain('#9')
    expect(renderCell(assignmentColumns[1].render('running')).textContent).toContain('running')
    expect(renderCell(assignmentColumns[2].render(50))).toBeTruthy()
    expect(renderCell(assignmentColumns[3].render('2026-09-15T00:00:00Z')).textContent).toContain('2026')
    const { container } = render(assignmentColumns[4].render(null, record))
    const buttons = [...container.querySelectorAll('button')]
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[1])
    fireEvent.click(buttons[2])
    fireEvent.click(buttons[3])
    expect(ctx.updateAssignmentState).toHaveBeenNthCalledWith(1, record, 'running')
    expect(ctx.updateAssignmentState).toHaveBeenNthCalledWith(2, record, 'waiting_human')
    expect(ctx.updateAssignmentState).toHaveBeenNthCalledWith(3, record, 'done')
    expect(ctx.updateAssignmentState).toHaveBeenNthCalledWith(4, record, 'failed')
  })
})
