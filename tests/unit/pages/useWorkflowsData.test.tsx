import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const { agentsApi, form, message } = vi.hoisted(() => {
  const form = {
    resetFields: vi.fn(),
    validateFields: vi.fn(async () => ({})),
  }
  const message = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }
  return {
    form,
    message,
    agentsApi: {
      getWorkflows: vi.fn(async () => ({ items: [{ id: 1, name: 'wf' }] })),
      getAgents: vi.fn(async () => ({ items: [{ id: 9 }] })),
      getWorkflowRuns: vi.fn(async () => ({ items: [{ id: 5 }] })),
      getWorkflowStepStats: vi.fn(async () => ({ total: 1 })),
      getWorkflowStepDurationHistogram: vi.fn(async () => ({ buckets: [] })),
      getWorkflowRunDurationPercentiles: vi.fn(async () => ({})),
      getWorkflowStepFailureRate: vi.fn(async () => ({})),
      getWorkflowStepCofailureMatrix: vi.fn(async () => ({})),
      getWorkflowSuccessRateByWorkflow: vi.fn(async () => ({})),
      getWorkflowStepRetryTopology: vi.fn(async () => ({})),
      getWorkflowStepHourlyDistribution: vi.fn(async () => ({})),
      getWorkflowStepDependencyBottleneck: vi.fn(async () => ({})),
      getWorkflowSimilarityMatrix: vi.fn(async () => ({})),
      getWorkflowStepBottleneckTimeline: vi.fn(async () => ({})),
      getWorkflowStructuralComplexity: vi.fn(async () => ({})),
      getWorkflowRunTrend: vi.fn(async () => ({})),
      getWorkflowFailureCorrelation: vi.fn(async () => ({})),
      getWorkflowFailureCorrelationByStep: vi.fn(async () => ({})),
      getWorkflowFailedStepsByDuration: vi.fn(async () => ({})),
      deleteWorkflow: vi.fn(async () => ({})),
      launchWorkflow: vi.fn(async () => ({ id: 77 })),
      getWorkflowRun: vi.fn(async () => ({ id: 5, status: 'running' })),
      getWorkflowRunConsole: vi.fn(async () => ({ steps: [] })),
      cancelWorkflowRun: vi.fn(async () => ({})),
      pauseWorkflowRun: vi.fn(async () => ({ id: 5, status: 'paused' })),
      resumeWorkflowRun: vi.fn(async () => ({ id: 5, status: 'running' })),
      retryWorkflowRun: vi.fn(async () => ({ id: 5, status: 'pending' })),
      getWorkflowTriggers: vi.fn(async () => ({ items: [{ id: 3 }] })),
      createWorkflowTrigger: vi.fn(async () => ({})),
      updateWorkflowTrigger: vi.fn(async () => ({})),
      deleteWorkflowTrigger: vi.fn(async () => ({})),
      listWorkflowVersions: vi.fn(async () => ({ versions: [1, 2], current_version: 2 })),
      rollbackWorkflow: vi.fn(async () => ({})),
      diffWorkflowVersions: vi.fn(async () => ({ diff: true })),
      getWorkflowTemplates: vi.fn(async () => ({ templates: [] })),
      instantiateWorkflowTemplate: vi.fn(async () => ({})),
    },
  }
})

vi.mock('../../../src/api/agents', () => ({ agentsApi }))
vi.mock('antd', () => ({
  Form: { useForm: () => [form] },
  message,
}))

import { useWorkflowsData } from '../../../src/pages/workflows/useWorkflowsData'

const setup = (initialEntries?: string[]) =>
  renderHook(() => useWorkflowsData(), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={initialEntries || ['/']}>{children}</MemoryRouter>,
  })

beforeEach(() => {
  vi.clearAllMocks()
})

// 原 useWorkflowsData 拆分前的返回键集契约：拆分不得增删任何键
const ORIGINAL_KEYS = [
  'workflows', 'setWorkflows', 'runs', 'setRuns', 'stepStats', 'setStepStats',
  'stepDurationHistogram', 'setStepDurationHistogram', 'runDurationPercentiles', 'setRunDurationPercentiles',
  'stepFailureRate', 'setStepFailureRate', 'stepCofailureMatrix', 'setStepCofailureMatrix',
  'successRateByWorkflow', 'setSuccessRateByWorkflow', 'stepRetryTopology', 'setStepRetryTopology',
  'stepHourlyDistribution', 'setStepHourlyDistribution', 'stepDependencyBottleneck', 'setStepDependencyBottleneck',
  'similarityMatrix', 'setSimilarityMatrix', 'stepDurationHist', 'setStepDurationHist',
  'stepBottleneckTl', 'setStepBottleneckTl', 'structuralComplexity', 'setStructuralComplexity',
  'runTrend', 'setRunTrend', 'failureCorrelation', 'setFailureCorrelation',
  'failureCorrelationByStep', 'setFailureCorrelationByStep', 'failedStepsByDuration', 'setFailedStepsByDuration',
  'agents', 'setAgents', 'loading', 'setLoading', 'runsLoading', 'setRunsLoading',
  'createOpen', 'setCreateOpen', 'runDetailOpen', 'setRunDetailOpen', 'selectedRun', 'setSelectedRun',
  'searchParams', 'setSearchParams', 'autoOpenedRun', 'setAutoOpenedRun',
  'consoleOpen', 'setConsoleOpen', 'consoleData', 'setConsoleData', 'consoleLoading', 'setConsoleLoading',
  'launchOpen', 'setLaunchOpen', 'launchWorkflowId', 'setLaunchWorkflowId', 'launching', 'setLaunching',
  'launchForm', 'triggers', 'setTriggers', 'triggerLoading', 'setTriggerLoading',
  'triggerModalOpen', 'setTriggerModalOpen', 'triggerForm', 'triggerTargetWfId', 'setTriggerTargetWfId',
  'templates', 'setTemplates', 'templateLoading', 'setTemplateLoading',
  'versionModalOpen', 'setVersionModalOpen', 'versionWfId', 'setVersionWfId',
  'versions', 'setVersions', 'currentVersion', 'setCurrentVersion', 'versionLoading', 'setVersionLoading',
  'diffModalOpen', 'setDiffModalOpen', 'diffData', 'setDiffData', 'diffV1', 'setDiffV1', 'diffV2', 'setDiffV2',
  'loadData', 'loadRuns', 'handleDelete', 'openLaunch', 'handleLaunch', 'viewRun', 'openConsole',
  'refreshConsole', 'handleCancelRun', 'handlePauseRun', 'handleResumeRun', 'handleRetryRun',
  'loadTriggers', 'openTriggerModal', 'handleCreateTrigger', 'handleToggleTrigger', 'handleDeleteTrigger',
  'openVersionModal', 'handleRollback', 'handleDiffVersions', 'loadTemplates', 'instantiateTemplate',
]

describe('useWorkflowsData（组合根 + 四域 hook 契约）', () => {
  it('拆分后返回键集与原版完全一致', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    for (const key of ORIGINAL_KEYS) {
      expect(result.current, `缺失键: ${key}`).toHaveProperty(key)
    }
  })

  it('挂载自动加载工作流/Agent/运行，并扇出 17 项分析与触发器/模板加载', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toEqual([{ id: 1, name: 'wf' }]))
    expect(result.current.agents).toEqual([{ id: 9 }])
    expect(result.current.runs).toEqual([{ id: 5 }])
    expect(agentsApi.getWorkflowRuns).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(agentsApi.getWorkflowStepStats).toHaveBeenCalledWith(30))
    expect(agentsApi.getWorkflowRunTrend).toHaveBeenCalledWith(30)
    expect(agentsApi.getWorkflowFailedStepsByDuration).toHaveBeenCalledWith(30, 20)
    expect(agentsApi.getWorkflowStructuralComplexity).toHaveBeenCalledWith(20)
    expect(agentsApi.getWorkflowTriggers).toHaveBeenCalledTimes(1)
    expect(agentsApi.getWorkflowTemplates).toHaveBeenCalledTimes(1)
    expect(result.current.triggers).toEqual([{ id: 3 }])
    expect(result.current.templates).toEqual({ templates: [] })
  })

  it('loadData 失败提示且 loading 复位', async () => {
    agentsApi.getWorkflows.mockRejectedValueOnce(new Error('net'))
    const { result } = setup()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('加载工作流失败'))
    expect(result.current.loading).toBe(false)
  })

  it('loadRuns 失败提示且不扇出分析', async () => {
    agentsApi.getWorkflowRuns.mockRejectedValueOnce(new Error('net'))
    const { result } = setup()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('加载工作流运行记录失败'))
    expect(result.current.runsLoading).toBe(false)
    expect(agentsApi.getWorkflowStepStats).not.toHaveBeenCalled()
  })

  it('URL ?run_id= 自动打开运行控制台并清理参数', async () => {
    const { result } = setup(['/?run_id=42'])
    await waitFor(() => expect(agentsApi.getWorkflowRunConsole).toHaveBeenCalledWith(42, { log_limit: 8 }))
    expect(result.current.consoleOpen).toBe(true)
    expect(result.current.searchParams.get('run_id')).toBeNull()
  })
})

describe('useWorkflowsData 核心处理器', () => {
  it('handleDelete 成功后刷新列表；失败提示', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    await act(async () => {
      await result.current.handleDelete(1)
    })
    expect(agentsApi.deleteWorkflow).toHaveBeenCalledWith(1)
    expect(message.success).toHaveBeenCalledWith('已删除')
    expect(agentsApi.getWorkflows).toHaveBeenCalledTimes(2)
    agentsApi.deleteWorkflow.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.handleDelete(2)
    })
    expect(message.error).toHaveBeenCalledWith('删除失败')
  })

  it('handleLaunch：无目标早退；成功启动并刷新运行；表单校验失败静默；异常提示', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    // 无 launchWorkflowId 早退
    await act(async () => {
      await result.current.handleLaunch()
    })
    expect(agentsApi.launchWorkflow).not.toHaveBeenCalled()
    form.validateFields.mockResolvedValueOnce({ project_id: 2, root_task_id: 3 })
    act(() => {
      result.current.openLaunch(1)
    })
    expect(result.current.launchOpen).toBe(true)
    await act(async () => {
      await result.current.handleLaunch()
    })
    expect(agentsApi.launchWorkflow).toHaveBeenCalledWith(1, { project_id: 2, root_task_id: 3 })
    expect(message.success).toHaveBeenCalledWith('工作流运行 #77 已启动')
    expect(result.current.launchOpen).toBe(false)
    expect(result.current.launching).toBe(false)
    expect(agentsApi.getWorkflowRuns).toHaveBeenCalledTimes(2)
    // 表单校验失败（errorFields）静默
    form.validateFields.mockRejectedValueOnce({ errorFields: true })
    act(() => {
      result.current.openLaunch(1)
    })
    await act(async () => {
      await result.current.handleLaunch()
    })
    expect(agentsApi.launchWorkflow).toHaveBeenCalledTimes(1)
    // 其他异常提示
    form.validateFields.mockRejectedValueOnce(new Error('boom'))
    act(() => {
      result.current.openLaunch(1)
    })
    await act(async () => {
      await result.current.handleLaunch()
    })
    expect(message.error).toHaveBeenCalledWith('启动失败: boom')
  })

  it('viewRun 加载运行详情；失败提示', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    await act(async () => {
      await result.current.viewRun(5)
    })
    expect(result.current.selectedRun).toEqual({ id: 5, status: 'running' })
    expect(result.current.runDetailOpen).toBe(true)
    agentsApi.getWorkflowRun.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.viewRun(6)
    })
    expect(message.error).toHaveBeenCalledWith('加载运行详情失败')
  })

  it('openConsole 成功/失败；refreshConsole 无选中早退、有选中刷新', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    await act(async () => {
      await result.current.openConsole(7)
    })
    expect(result.current.consoleData).toEqual({ steps: [] })
    expect(result.current.consoleLoading).toBe(false)
    agentsApi.getWorkflowRunConsole.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.openConsole(8)
    })
    expect(message.error).toHaveBeenCalledWith('加载控制台数据失败')
    // 无 selectedRun 早退：调用数不增长（openConsole(7)、openConsole(8) 共 2 次）
    await act(async () => {
      await result.current.refreshConsole()
    })
    expect(agentsApi.getWorkflowRunConsole).toHaveBeenCalledTimes(2)
    await act(async () => {
      await result.current.viewRun(5)
    })
    await act(async () => {
      await result.current.refreshConsole()
    })
    expect(agentsApi.getWorkflowRunConsole).toHaveBeenLastCalledWith(5, { log_limit: 8 })
    agentsApi.getWorkflowRunConsole.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.refreshConsole()
    })
    expect(message.error).toHaveBeenCalledWith('刷新控制台失败')
  })

  it('handleCancelRun 成功且命中选中运行时关闭详情；失败提示', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    await act(async () => {
      await result.current.viewRun(5)
    })
    await act(async () => {
      await result.current.handleCancelRun(5)
    })
    expect(message.success).toHaveBeenCalledWith('已取消')
    expect(result.current.selectedRun).toBeNull()
    expect(result.current.runDetailOpen).toBe(false)
    agentsApi.cancelWorkflowRun.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.handleCancelRun(9)
    })
    expect(message.error).toHaveBeenCalledWith('取消失败')
  })

  it.each([
    ['handlePauseRun', 'pauseWorkflowRun', '已暂停', '暂停失败', { id: 5, status: 'paused' }],
    ['handleResumeRun', 'resumeWorkflowRun', '已恢复', '恢复失败', { id: 5, status: 'running' }],
    ['handleRetryRun', 'retryWorkflowRun', '已重试', '重试失败', { id: 5, status: 'pending' }],
  ] as const)('%s 成功更新选中运行、失败提示', async (handler, api, okMsg, failMsg, updated) => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    await act(async () => {
      await result.current.viewRun(5)
    })
    await act(async () => {
      await result.current[handler](5)
    })
    expect(message.success).toHaveBeenCalledWith(okMsg)
    expect(result.current.selectedRun).toEqual(updated)
    agentsApi[api].mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current[handler](5)
    })
    expect(message.error).toHaveBeenCalledWith(failMsg)
  })
})

describe('useWorkflowTriggers 域', () => {
  it('loadTriggers 失败提示', async () => {
    agentsApi.getWorkflowTriggers.mockRejectedValueOnce(new Error('net'))
    const { result } = setup()
    await waitFor(() => expect(message.error).toHaveBeenCalledWith('加载触发器失败'))
    expect(result.current.triggerLoading).toBe(false)
  })

  it('openTriggerModal 记录目标并重置表单；无目标创建早退', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.triggers).toBeTruthy())
    await act(async () => {
      await result.current.handleCreateTrigger()
    })
    expect(form.validateFields).not.toHaveBeenCalled()
    act(() => {
      result.current.openTriggerModal(11)
    })
    expect(result.current.triggerTargetWfId).toBe(11)
    expect(result.current.triggerModalOpen).toBe(true)
    expect(form.resetFields).toHaveBeenCalled()
  })

  it('handleCreateTrigger 成功（空值转 undefined）并刷新；errorFields 静默；异常提示', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.triggers).toBeTruthy())
    act(() => {
      result.current.openTriggerModal(11)
    })
    form.validateFields.mockResolvedValueOnce({
      name: 'nightly', cron_expr: '', one_shot_at: '', is_active: false, project_id: '',
    })
    await act(async () => {
      await result.current.handleCreateTrigger()
    })
    expect(agentsApi.createWorkflowTrigger).toHaveBeenCalledWith({
      workflow_id: 11,
      name: 'nightly',
      cron_expr: undefined,
      one_shot_at: undefined,
      is_active: false,
      project_id: undefined,
    })
    expect(message.success).toHaveBeenCalledWith('触发器创建成功')
    expect(result.current.triggerModalOpen).toBe(false)
    expect(agentsApi.getWorkflowTriggers).toHaveBeenCalledTimes(2)
    // errorFields 静默
    act(() => {
      result.current.openTriggerModal(11)
    })
    form.validateFields.mockRejectedValueOnce({ errorFields: true })
    await act(async () => {
      await result.current.handleCreateTrigger()
    })
    expect(message.error).not.toHaveBeenCalledWith(expect.stringContaining('创建触发器失败'))
    // 其他异常
    act(() => {
      result.current.openTriggerModal(11)
    })
    form.validateFields.mockRejectedValueOnce(new Error('boom'))
    await act(async () => {
      await result.current.handleCreateTrigger()
    })
    expect(message.error).toHaveBeenCalledWith('创建触发器失败: boom')
  })

  it('handleToggleTrigger 双向与失败；handleDeleteTrigger 成败', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.triggers).toBeTruthy())
    await act(async () => {
      await result.current.handleToggleTrigger({ id: 3, is_active: true })
    })
    expect(agentsApi.updateWorkflowTrigger).toHaveBeenCalledWith(3, { is_active: false })
    expect(message.success).toHaveBeenCalledWith('已停用')
    await act(async () => {
      await result.current.handleToggleTrigger({ id: 3, is_active: false })
    })
    expect(agentsApi.updateWorkflowTrigger).toHaveBeenLastCalledWith(3, { is_active: true })
    expect(message.success).toHaveBeenCalledWith('已启用')
    agentsApi.updateWorkflowTrigger.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.handleToggleTrigger({ id: 3, is_active: true })
    })
    expect(message.error).toHaveBeenCalledWith('操作失败')
    await act(async () => {
      await result.current.handleDeleteTrigger(3)
    })
    expect(agentsApi.deleteWorkflowTrigger).toHaveBeenCalledWith(3)
    expect(message.success).toHaveBeenCalledWith('已删除')
    agentsApi.deleteWorkflowTrigger.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.handleDeleteTrigger(3)
    })
    expect(message.error).toHaveBeenCalledWith('删除失败')
  })
})

describe('useWorkflowVersions 域', () => {
  it('openVersionModal 成功/失败', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    await act(async () => {
      await result.current.openVersionModal(1)
    })
    expect(result.current.versionModalOpen).toBe(true)
    expect(result.current.versions).toEqual([1, 2])
    expect(result.current.currentVersion).toBe(2)
    expect(result.current.versionLoading).toBe(false)
    agentsApi.listWorkflowVersions.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.openVersionModal(1)
    })
    expect(message.error).toHaveBeenCalledWith('加载版本历史失败')
    expect(result.current.versionLoading).toBe(false)
  })

  it('handleRollback 无目标早退；成功回滚并刷新版本与列表；失败提示', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    await act(async () => {
      await result.current.handleRollback(1)
    })
    expect(agentsApi.rollbackWorkflow).not.toHaveBeenCalled()
    await act(async () => {
      await result.current.openVersionModal(1)
    })
    await act(async () => {
      await result.current.handleRollback(1)
    })
    expect(agentsApi.rollbackWorkflow).toHaveBeenCalledWith(1, 1)
    expect(message.success).toHaveBeenCalledWith('已回滚到版本 1')
    expect(agentsApi.listWorkflowVersions).toHaveBeenCalledTimes(2)
    expect(agentsApi.getWorkflows).toHaveBeenCalledTimes(2)
    agentsApi.rollbackWorkflow.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.handleRollback(1)
    })
    expect(message.error).toHaveBeenCalledWith('回滚失败')
  })

  it('handleDiffVersions 无目标早退；成功设置对比数据；失败提示', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    await act(async () => {
      await result.current.handleDiffVersions(1, 2)
    })
    expect(agentsApi.diffWorkflowVersions).not.toHaveBeenCalled()
    await act(async () => {
      await result.current.openVersionModal(1)
    })
    await act(async () => {
      await result.current.handleDiffVersions(1, 2)
    })
    expect(agentsApi.diffWorkflowVersions).toHaveBeenCalledWith(1, 1, 2)
    expect(result.current.diffData).toEqual({ diff: true })
    expect(result.current.diffV1).toBe(1)
    expect(result.current.diffV2).toBe(2)
    expect(result.current.diffModalOpen).toBe(true)
    agentsApi.diffWorkflowVersions.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.handleDiffVersions(1, 2)
    })
    expect(message.error).toHaveBeenCalledWith('比较失败')
  })
})

describe('useWorkflowTemplates 域', () => {
  it('loadTemplates 失败静默不崩溃', async () => {
    agentsApi.getWorkflowTemplates.mockRejectedValueOnce(new Error('net'))
    const { result } = setup()
    await waitFor(() => expect(result.current.templateLoading).toBe(false))
    expect(message.error).not.toHaveBeenCalled()
  })

  it('instantiateTemplate 成功后刷新列表；失败提示', async () => {
    const { result } = setup()
    await waitFor(() => expect(result.current.workflows).toBeTruthy())
    await act(async () => {
      await result.current.instantiateTemplate('etl', '我的ETL')
    })
    expect(agentsApi.instantiateWorkflowTemplate).toHaveBeenCalledWith('etl', { name: '我的ETL' })
    expect(message.success).toHaveBeenCalledWith('工作流「我的ETL」已从模板创建')
    expect(agentsApi.getWorkflows).toHaveBeenCalledTimes(2)
    agentsApi.instantiateWorkflowTemplate.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.instantiateTemplate('etl', 'x')
    })
    expect(message.error).toHaveBeenCalledWith('从模板创建失败')
  })
})
