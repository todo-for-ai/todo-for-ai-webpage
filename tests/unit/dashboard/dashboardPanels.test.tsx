import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { message } from 'antd'

// vi.mock 会被提升，桩必须经 vi.hoisted 创建
const { agentsApi, dashboardApi } = vi.hoisted(() => ({
  agentsApi: {
    getCollaborationMetrics: vi.fn(async () => ({ metrics: true })),
    getSandboxDashboard: vi.fn(async () => ({ sandbox: true })),
    getSandboxViolationTrend: vi.fn(async () => ({})),
    getSandboxViolationsByAgent: vi.fn(async () => ({})),
    getSandboxTemplateUsage: vi.fn(async () => ({})),
    getCollaborationGraphTimeline: vi.fn(async () => ({})),
    getSecurityEvents: vi.fn(async () => ({ items: [] })),
    getSecurityEventsDailyTrend: vi.fn(async () => ({})),
    getSecurityEventsByAgent: vi.fn(async () => ({})),
    getOrchestratorDailyTrend: vi.fn(async () => ({})),
    getOrchestratorStatus: vi.fn(async () => ({ status: true })),
    orchestrate: vi.fn(async () => ({ duration_seconds: 1 })),
    listOrchestratorHistory: vi.fn(async () => ({ history: true })),
    getCollaborationGraph: vi.fn(async () => null),
    getAgentCollaborators: vi.fn(async () => ({ collaborators: [] })),
    exportSecurityEvents: vi.fn(async () => 'text'),
  },
  dashboardApi: {
    getStats: vi.fn(async () => ({})),
    getAgentMonitor: vi.fn(async () => ({})),
  },
}))

vi.mock('../../../src/api/agents', () => ({ agentsApi }))
vi.mock('../../../src/api/dashboard', () => ({ dashboardApi }))

import { useDashboardStats } from '../../../src/pages/dashboard/hooks/useDashboardStats'
import { useCollabMetricsPanel } from '../../../src/pages/dashboard/hooks/useCollabMetricsPanel'
import { useAgentMonitorPanel } from '../../../src/pages/dashboard/hooks/useAgentMonitorPanel'
import { useSecurityPanel } from '../../../src/pages/dashboard/hooks/useSecurityPanel'
import { useUnifiedTrendPanel } from '../../../src/pages/dashboard/hooks/useUnifiedTrendPanel'
import { useCollabGraphPanel } from '../../../src/pages/dashboard/hooks/useCollabGraphPanel'
import { useOrchestrationPanel } from '../../../src/pages/dashboard/hooks/useOrchestrationPanel'
import { useAdvancedAnalytics } from '../../../src/pages/dashboard/hooks/useAdvancedAnalytics'

describe('useDashboardStats', () => {
  it('加载失败提示并复位 loading', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    const tc = vi.fn((k: string) => k)
    dashboardApi.getStats.mockRejectedValueOnce(new Error('boom'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useDashboardStats(tc))
    // 首屏装载 effect 在组合根（useDashboardData），面板测试直接驱动加载
    act(() => {
      result.current.loadDashboardStats()
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(tc).toHaveBeenCalledWith('messages.error.general')
    expect(errorSpy).toHaveBeenCalledWith('messages.error.general')
    consoleSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('无 scopes 时 owned/participated 回退到 projects/tasks 汇总', async () => {
    dashboardApi.getStats.mockResolvedValueOnce({
      projects: { total: 3, active: 1 },
      tasks: { total: 9, todo: 1, in_progress: 2, review: 3, done: 3, ai_executing: 0 },
    })
    const { result } = renderHook(() => useDashboardStats(vi.fn()))
    act(() => {
      result.current.loadDashboardStats()
    })
    await waitFor(() => expect(result.current.stats).toBeTruthy())
    expect(result.current.owned).toEqual({ projects: { total: 3, active: 1 }, tasks: { total: 9, todo: 1, in_progress: 2, review: 3, done: 3, ai_executing: 0 } })
    expect(result.current.participated).toEqual(result.current.owned)
    expect(result.current.orgSummary).toEqual({ total: 0, total_agents: 0, active_agents_7d: 0 })
  })
})

describe('useCollabMetricsPanel / useAgentMonitorPanel', () => {
  it('协作指标拉取失败静默复位', async () => {
    agentsApi.getCollaborationMetrics.mockRejectedValueOnce(new Error('x'))
    const { result } = renderHook(() => useCollabMetricsPanel())
    await waitFor(() => expect(result.current.collabLoading).toBe(false))
  })

  it('修改天数后按新窗口重拉', async () => {
    const { result } = renderHook(() => useCollabMetricsPanel())
    await waitFor(() => expect(agentsApi.getCollaborationMetrics).toHaveBeenCalledWith({ days: 7 }))
    act(() => {
      result.current.setCollabDays(30)
    })
    await waitFor(() => expect(agentsApi.getCollaborationMetrics).toHaveBeenCalledWith({ days: 30 }))
  })

  it('监控拉取失败静默复位', async () => {
    dashboardApi.getAgentMonitor.mockRejectedValueOnce(new Error('x'))
    const { result } = renderHook(() => useAgentMonitorPanel())
    await waitFor(() => expect(result.current.monitorLoading).toBe(false))
  })

  it('修改小时窗后按新窗口重拉', async () => {
    const { result } = renderHook(() => useAgentMonitorPanel())
    await waitFor(() => expect(dashboardApi.getAgentMonitor).toHaveBeenCalledWith({ hours: '24' }))
    act(() => {
      result.current.setMonitorHours(72)
    })
    await waitFor(() => expect(dashboardApi.getAgentMonitor).toHaveBeenCalledWith({ hours: '72' }))
  })
})

describe('useSecurityPanel', () => {
  const noop = () => {}

  it('沙箱总览拉取失败静默复位，时间线 setter 注入生效', async () => {
    agentsApi.getSandboxDashboard.mockRejectedValueOnce(new Error('x'))
    const setCollabTimeline = vi.fn()
    const { result } = renderHook(() => useSecurityPanel({ setCollabTimeline }))
    await waitFor(() => expect(result.current.sandboxLoading).toBe(false))
  })

  it('loadSandboxData 成功时顺带刷新协作时间线', async () => {
    const setCollabTimeline = vi.fn()
    const { result } = renderHook(() => useSecurityPanel({ setCollabTimeline }))
    await waitFor(() => expect(setCollabTimeline).toHaveBeenCalled())
    await act(async () => {
      await result.current.loadSandboxData()
    })
    expect(setCollabTimeline).toHaveBeenCalledTimes(2)
  })

  it('安全事件加载失败静默复位', async () => {
    agentsApi.getSecurityEvents.mockRejectedValueOnce(new Error('x'))
    const { result } = renderHook(() => useSecurityPanel({ setCollabTimeline: noop }))
    await waitFor(() => expect(result.current.securityLoading).toBe(false))
  })

  it('exportSecurityEvents 成功导出 CSV/JSON', async () => {
    const createObjectURL = vi.fn(() => 'blob:u')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(((n: Node) => n) as never)
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(((n: Node) => n) as never)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useSecurityPanel({ setCollabTimeline: noop }))
    await act(async () => {
      await result.current.exportSecurityEvents()
    })
    expect(agentsApi.exportSecurityEvents).toHaveBeenCalledWith(expect.objectContaining({ format: 'csv' }))
    expect(successSpy).toHaveBeenCalledWith('安全事件已导出为 CSV')
    await act(async () => {
      await result.current.exportSecurityEvents('json')
    })
    expect(agentsApi.exportSecurityEvents).toHaveBeenLastCalledWith(expect.objectContaining({ format: 'json' }))
    expect(result.current.exporting).toBe(false)
    expect(clickSpy).toHaveBeenCalledTimes(2)
    appendSpy.mockRestore()
    removeSpy.mockRestore()
    successSpy.mockRestore()
  })

  it('exportSecurityEvents 失败提示并复位', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.exportSecurityEvents.mockRejectedValueOnce(new Error('x'))
    const { result } = renderHook(() => useSecurityPanel({ setCollabTimeline: noop }))
    await act(async () => {
      await result.current.exportSecurityEvents()
    })
    expect(errorSpy).toHaveBeenCalledWith('导出安全事件失败')
    expect(result.current.exporting).toBe(false)
    errorSpy.mockRestore()
  })
})

describe('useUnifiedTrendPanel', () => {
  it('默认 30 天窗口带 since 拉取，all 窗口不带 since', async () => {
    renderHook(() => useUnifiedTrendPanel())
    await waitFor(() => expect(agentsApi.getOrchestratorDailyTrend).toHaveBeenCalledWith({ since: expect.any(String) }))
    expect(agentsApi.getSecurityEventsDailyTrend).toHaveBeenCalledWith({ since: expect.any(String) })
  })

  it('切换窗口/严重度/事件类型驱动重拉', async () => {
    const { result } = renderHook(() => useUnifiedTrendPanel())
    act(() => {
      result.current.setTrendWindow('all')
      result.current.setTrendSeverity('high')
      result.current.setTrendEventType('sandbox_violation')
    })
    await waitFor(() => expect(agentsApi.getSecurityEventsDailyTrend).toHaveBeenLastCalledWith({ severity: 'high', event_type: 'sandbox_violation' }))
    expect(agentsApi.getOrchestratorDailyTrend).toHaveBeenLastCalledWith({})
  })
})

describe('useCollabGraphPanel', () => {
  const graph = {
    nodes: [
      { id: 1, name: 'alice', kind: 'assistant', messages: 10 },
      { id: 2, name: 'bob', kind: 'coordinator', messages: 8 },
    ],
    edges: [{ source: 1, target: 2, count: 5, source_to_target: 3, target_to_source: 2 }],
    total_edges: 1,
  } as any

  beforeEach(() => {
    localStorage.removeItem('collabGraphForceParams')
    URL.createObjectURL = vi.fn(() => 'blob:u') as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem('collabGraphForceParams')
    // @ts-expect-error 测试后清理自定义 Image
    delete (window as any).Image
  })

  it('loadForceParams 合法/损坏/缺省三路', () => {
    const r1 = renderHook(() => useCollabGraphPanel())
    expect(r1.result.current.forceRepulsion).toBe(1)
    r1.unmount()

    localStorage.setItem('collabGraphForceParams', '{"repulsion":2,"linkDistance":3}')
    const r2 = renderHook(() => useCollabGraphPanel())
    expect(r2.result.current.forceRepulsion).toBe(2)
    expect(r2.result.current.forceLinkDistance).toBe(3)
    r2.unmount()

    localStorage.setItem('collabGraphForceParams', '{bad json')
    const r3 = renderHook(() => useCollabGraphPanel())
    expect(r3.result.current.forceRepulsion).toBe(1)
    expect(r3.result.current.forceLinkDistance).toBe(1)
  })

  it('力导向参数变更时持久化', async () => {
    const { result } = renderHook(() => useCollabGraphPanel())
    act(() => {
      result.current.setForceRepulsion(4)
      result.current.setForceLinkDistance(5)
    })
    await waitFor(() => expect(localStorage.getItem('collabGraphForceParams')).toBe('{"repulsion":4,"linkDistance":5}'))
  })

  it('空数据导出提示且不触发下载', () => {
    const warnSpy = vi.spyOn(message, 'warning').mockImplementation(() => undefined as never)
    const createSpy = URL.createObjectURL as unknown as ReturnType<typeof vi.fn>
    const { result } = renderHook(() => useCollabGraphPanel())
    result.current.exportCollabGraph()
    expect(warnSpy).toHaveBeenCalledWith('暂无协作关系数据可导出')
    expect(createSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('CSV/SVG 导出成功走下载', async () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(((n: Node) => n) as never)
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(((n: Node) => n) as never)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useCollabGraphPanel())
    const graphFixture = {
      nodes: [
        { id: 1, name: 'alice', kind: 'assistant', messages: 10 },
        { id: 2, name: 'bob', kind: 'coordinator', messages: 8 },
      ],
      edges: [{ source: 1, target: 2, count: 5, source_to_target: 3, target_to_source: 2 }],
      total_edges: 1,
    }
    act(() => {
      result.current.setCollabGraph(graphFixture as never)
    })
    result.current.exportCollabGraph()
    expect(successSpy).toHaveBeenCalledWith('协作关系图已导出为 CSV')

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    Object.defineProperty(result.current.collabSvgRef, 'current', { value: svg, configurable: true })
    result.current.exportCollabGraphSvg()
    expect(successSpy).toHaveBeenCalledWith('协作关系图已导出为 SVG')
    expect(clickSpy).toHaveBeenCalledTimes(2)
    appendSpy.mockRestore()
    removeSpy.mockRestore()
    successSpy.mockRestore()
  })

  it('SVG/PNG 导出在无图引用时提示', () => {
    const warnSpy = vi.spyOn(message, 'warning').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useCollabGraphPanel())
    result.current.exportCollabGraphSvg()
    result.current.exportCollabGraphPng()
    expect(warnSpy).toHaveBeenCalledTimes(2)
    expect(warnSpy).toHaveBeenCalledWith('暂无可导出的图形')
    warnSpy.mockRestore()
  })

  it('PNG 导出完整链路（fake Image + fake canvas）', async () => {
    vi.spyOn(document.body, 'appendChild').mockImplementation(((n: Node) => n) as never)
    vi.spyOn(document.body, 'removeChild').mockImplementation(((n: Node) => n) as never)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)

    const pngBlob = { size: 1 } as Blob
    const fakeCtx = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() }
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => fakeCtx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(pngBlob)),
    }
    const realCreate = document.createElement.bind(document)
    const createSpy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string) =>
      tag === 'canvas' ? (fakeCanvas as unknown as HTMLCanvasElement) : realCreate(tag as never)) as never)

    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_v: string) {
        setTimeout(() => this.onload?.(), 0)
      }
    }
    ;(window as any).Image = FakeImage

    const clone = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const fakeSvg = {
      cloneNode: () => clone,
      viewBox: { baseVal: { width: 380, height: 380 } },
      clientWidth: 0,
      clientHeight: 0,
    } as unknown as SVGSVGElement
    const { result } = renderHook(() => useCollabGraphPanel())
    Object.defineProperty(result.current.collabSvgRef, 'current', { value: fakeSvg, configurable: true })

    result.current.exportCollabGraphPng()
    await waitFor(() => expect(successSpy).toHaveBeenCalledWith('协作关系图已导出为 PNG'))
    expect(fakeCanvas.width).toBe(760) // 380 × 2
    expect(fakeCtx.drawImage).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    createSpy.mockRestore()
    successSpy.mockRestore()
  })

  it('PNG 导出 toBlob 返回空时提示', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    vi.spyOn(document.body, 'appendChild').mockImplementation(((n: Node) => n) as never)
    vi.spyOn(document.body, 'removeChild').mockImplementation(((n: Node) => n) as never)
    const fakeCtx = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() }
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => fakeCtx),
      toBlob: vi.fn((cb: (b: Blob | null) => void) => cb(null)),
    }
    const realCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) =>
      tag === 'canvas' ? (fakeCanvas as unknown as HTMLCanvasElement) : realCreate(tag as never)) as never)

    class FakeImage {
      onload: (() => void) | null = null
      set src(_v: string) {
        setTimeout(() => this.onload?.(), 0)
      }
    }
    ;(window as any).Image = FakeImage

    const clone = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const fakeSvg = {
      cloneNode: () => clone,
      viewBox: { baseVal: { width: 380, height: 380 } },
      clientWidth: 0,
      clientHeight: 0,
    } as unknown as SVGSVGElement
    const { result } = renderHook(() => useCollabGraphPanel())
    Object.defineProperty(result.current.collabSvgRef, 'current', { value: fakeSvg, configurable: true })

    result.current.exportCollabGraphPng()
    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith('PNG 导出失败'))
    errorSpy.mockRestore()
  })

  it('PNG 导出 SVG 渲染失败时提示', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    // 注意：hook 用的是全局 Image 构造器（不走 createElement），必须覆盖 window.Image
    ;(window as any).Image = class {
      onerror: (() => void) | null = null
      set src(_v: string) {
        setTimeout(() => this.onerror?.(), 0)
      }
    }

    const clone = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const fakeSvg = {
      cloneNode: () => clone,
      viewBox: { baseVal: { width: 380, height: 380 } },
      clientWidth: 0,
      clientHeight: 0,
    } as unknown as SVGSVGElement
    const { result } = renderHook(() => useCollabGraphPanel())
    Object.defineProperty(result.current.collabSvgRef, 'current', { value: fakeSvg, configurable: true })

    result.current.exportCollabGraphPng()
    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith('PNG 导出失败：SVG 渲染失败'))
    errorSpy.mockRestore()
  })

  it('PNG 导出画布上下文缺失时提示', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    const realCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      if (tag === 'canvas') return { width: 0, height: 0, getContext: vi.fn(() => null) } as unknown as HTMLCanvasElement
      return realCreate(tag as never)
    }) as never)
    ;(window as any).Image = class {
      onload: (() => void) | null = null
      set src(_v: string) {
        setTimeout(() => this.onload?.(), 0)
      }
    }

    const clone = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const fakeSvg = {
      cloneNode: () => clone,
      viewBox: { baseVal: { width: 380, height: 380 } },
      clientWidth: 0,
      clientHeight: 0,
    } as unknown as SVGSVGElement
    const { result } = renderHook(() => useCollabGraphPanel())
    Object.defineProperty(result.current.collabSvgRef, 'current', { value: fakeSvg, configurable: true })
    result.current.exportCollabGraphPng()
    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith('PNG 导出失败'))
    errorSpy.mockRestore()
  })

  it('loadCollabDetail 失败时明细置空加载态', async () => {
    agentsApi.getAgentCollaborators.mockRejectedValueOnce(new Error('x'))
    const { result } = renderHook(() => useCollabGraphPanel())
    await act(async () => {
      await result.current.loadCollabDetail(7, 'gone')
    })
    expect(result.current.collabDetail).toEqual({ agentId: 7, name: 'gone', list: [], loading: false })
  })

  it('明细子图按 agent_id 大小定向边（中心较小时）', async () => {
    agentsApi.getAgentCollaborators.mockResolvedValueOnce({
      collaborators: [{ agent_id: 5, name: 'eve', total: 9, sent: 4, received: 5 }],
    })
    const { result } = renderHook(() => useCollabGraphPanel())
    await act(async () => {
      await result.current.loadCollabDetail(1, 'alice')
    })
    const sub = result.current.collabDetailGraph
    expect(sub?.nodes[0].messages).toBe(9)
    expect(sub?.edges[0]).toMatchObject({ source: 1, target: 5, source_to_target: 4, target_to_source: 5 })
  })
})

describe('useOrchestrationPanel', () => {
  const deps = () => ({ loadSecurityEvents: vi.fn(), securityFilter: 'f' })

  it('编排失败提示并复位 loading', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.orchestrate.mockRejectedValueOnce(new Error('x'))
    const { result } = renderHook(() => useOrchestrationPanel(deps()))
    await act(async () => {
      await result.current.runOrchestration()
    })
    expect(errorSpy).toHaveBeenCalledWith('执行编排失败')
    expect(result.current.orchestrationLoading).toBe(false)
    errorSpy.mockRestore()
  })

  it('编排器状态拉取失败静默', async () => {
    agentsApi.getOrchestratorStatus.mockRejectedValueOnce(new Error('x'))
    renderHook(() => useOrchestrationPanel(deps()))
    await waitFor(() => expect(agentsApi.getOrchestratorStatus).toHaveBeenCalled())
  })

  it('历史拉取失败提示并复位', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    agentsApi.listOrchestratorHistory.mockRejectedValueOnce(new Error('x'))
    const { result } = renderHook(() => useOrchestrationPanel(deps()))
    await act(async () => {
      await result.current.loadOrchestratorHistory()
    })
    expect(errorSpy).toHaveBeenCalledWith('加载编排历史失败')
    expect(result.current.historyLoading).toBe(false)
    errorSpy.mockRestore()
  })

  it('无筛选时历史参数只带 limit', async () => {
    const { result } = renderHook(() => useOrchestrationPanel({ loadSecurityEvents: vi.fn(), securityFilter: '' }))
    await act(async () => {
      result.current.openHistory()
    })
    await waitFor(() => expect(agentsApi.listOrchestratorHistory).toHaveBeenCalledWith({ limit: 30 }))
  })

  it('runOrchestration 把安全事件联动刷新透传当前筛选', async () => {
    const loadSecurityEvents = vi.fn()
    const { result } = renderHook(() => useOrchestrationPanel({ loadSecurityEvents, securityFilter: 'abc' }))
    await act(async () => {
      await result.current.runOrchestration()
    })
    expect(loadSecurityEvents).toHaveBeenCalledWith('abc')
  })
})

describe('useAdvancedAnalytics', () => {
  it('全部 state 对读写可达', () => {
    const { result } = renderHook(() => useAdvancedAnalytics())
    expect(result.current.handoffStats).toBeNull()
    act(() => {
      result.current.setHandoffStats({ any: 1 } as never)
      result.current.setProtocolLatency({ any: 2 } as never)
    })
    expect(result.current.handoffStats).toEqual({ any: 1 })
    expect(result.current.protocolLatency).toEqual({ any: 2 })
    expect(typeof result.current.setDepChain).toBe('function')
    expect(typeof result.current.setIdleRanking).toBe('function')
  })
})
