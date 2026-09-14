import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { agentsApi, message, formMock } = vi.hoisted(() => ({
  formMock: {
    setFieldsValue: vi.fn(),
    validateFields: vi.fn(async () => ({
      name: 'a', description: 'd', kind: 'assistant', status: 'active',
      provider: 'p', model: 'm', capabilitiesText: 'x\ny', configText: '{"k":1}',
    })),
  },
  message: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  agentsApi: {
    getAgents: vi.fn(async () => ({ items: [{ id: 1 }] })),
    getReviewQueue: vi.fn(async () => ({ items: [{ id: 2 }] })),
    updateAgent: vi.fn(async () => ({})),
    createAgent: vi.fn(async () => ({})),
    heartbeatAgent: vi.fn(async () => ({})),
    broadcastMessage: vi.fn(async () => ({ recipient_count: 3 })),
    getAgentReputation: vi.fn(async () => ({ score: 90 })),
    getAgentReputationHistory: vi.fn(async () => ({ points: [] })),
    getAgentSandbox: vi.fn(async () => ({ sandbox: { id: 4 } })),
    recalculateReputation: vi.fn(async () => ({ score: 95 })),
  },
}))

vi.mock('../../../src/api/agents', () => ({ agentsApi }))
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  return { ...actual, message, Form: { ...actual.Form, useForm: () => [formMock] } }
})

import { useAgentCrudActions } from '../../../src/pages/agents/hooks/useAgentCrudActions'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAgentCrudActions', () => {
  it('loadAgents：携带过滤参数、静默模式不触 loading、失败提示', async () => {
    const { result } = renderHook(() => useAgentCrudActions({ selectedAgent: null }))
    act(() => {
      result.current.setStatusFilter('active')
      result.current.setSearchText('bot')
    })
    await act(async () => {
      await result.current.loadAgents()
    })
    expect(agentsApi.getAgents).toHaveBeenCalledWith({
      status: 'active', search: 'bot', sort_by: 'last_seen_at', sort_order: 'desc', per_page: 50,
    })
    expect(result.current.agents).toEqual([{ id: 1 }])
    expect(result.current.loading).toBe(false)
    agentsApi.getAgents.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.loadAgents()
    })
    expect(message.error).toHaveBeenCalledWith('加载 Agent 失败')
    // 静默：失败不提示、不触 loading
    agentsApi.getAgents.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.loadAgents({ silent: true })
    })
    expect(message.error).toHaveBeenCalledTimes(1)
  })

  it('loadReviewQueue：成功/静默/两类失败', async () => {
    const { result } = renderHook(() => useAgentCrudActions({ selectedAgent: null }))
    act(() => {
      result.current.setReviewActionFilter('approve')
    })
    await act(async () => {
      await result.current.loadReviewQueue()
    })
    expect(agentsApi.getReviewQueue).toHaveBeenCalledWith({ action: 'approve', per_page: 20 })
    expect(result.current.reviewQueue).toEqual([{ id: 2 }])
    agentsApi.getReviewQueue.mockRejectedValueOnce(new Error('boom'))
    await act(async () => {
      await result.current.loadReviewQueue()
    })
    expect(message.error).toHaveBeenCalledWith('boom')
    agentsApi.getReviewQueue.mockRejectedValueOnce('raw')
    await act(async () => {
      await result.current.loadReviewQueue()
    })
    expect(message.error).toHaveBeenCalledWith('加载人工审核队列失败')
    agentsApi.getReviewQueue.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.loadReviewQueue({ silent: true })
    })
    expect(message.error).toHaveBeenCalledTimes(2)
  })

  it('openCreateModal / openEditModal 预填表单', () => {
    const { result } = renderHook(() => useAgentCrudActions({ selectedAgent: null }))
    act(() => {
      result.current.openCreateModal()
    })
    expect(result.current.editingAgent).toBeNull()
    expect(formMock.setFieldsValue).toHaveBeenCalledWith(expect.objectContaining({ name: '', kind: 'assistant', configText: '{}' }))
    const agent = { id: 1, name: 'a', description: 'd', kind: 'worker', status: 'active', provider: 'p', model: 'm', capabilities: ['x', 'y'], config: { k: 1 } } as any
    act(() => {
      result.current.openEditModal(agent)
    })
    expect(result.current.editingAgent).toEqual(agent)
    expect(formMock.setFieldsValue).toHaveBeenLastCalledWith(expect.objectContaining({ capabilitiesText: 'x\ny' }))
    expect(result.current.modalOpen).toBe(true)
  })

  it('saveAgent：配置非 JSON 拒绝；更新/创建两路；校验异常提示', async () => {
    const { result } = renderHook(() => useAgentCrudActions({ selectedAgent: null }))
    formMock.validateFields.mockResolvedValueOnce({ name: 'a', configText: '{bad' })
    await act(async () => {
      await result.current.saveAgent()
    })
    expect(message.error).toHaveBeenCalledWith('运行配置必须是合法 JSON')
    // 更新路径
    const agent = { id: 7 } as any
    act(() => {
      result.current.setEditingAgent(agent)
      result.current.setModalOpen(true)
    })
    await act(async () => {
      await result.current.saveAgent()
    })
    expect(agentsApi.updateAgent).toHaveBeenCalledWith(7, expect.objectContaining({ name: 'a', capabilities: ['x', 'y'], config: { k: 1 } }))
    expect(message.success).toHaveBeenCalledWith('Agent 已更新')
    expect(result.current.modalOpen).toBe(false)
    // 创建路径（先清空 editingAgent）
    act(() => {
      result.current.setEditingAgent(null)
    })
    await act(async () => {
      await result.current.saveAgent()
    })
    expect(agentsApi.createAgent).toHaveBeenCalled()
    expect(message.success).toHaveBeenLastCalledWith('Agent 已创建')
    // 校验异常
    formMock.validateFields.mockRejectedValueOnce(new Error('validate fail'))
    await act(async () => {
      await result.current.saveAgent()
    })
    expect(message.error).toHaveBeenLastCalledWith('validate fail')
  })

  it('heartbeat 成败；sendBroadcast 校验/成功/失败', async () => {
    const { result } = renderHook(() => useAgentCrudActions({ selectedAgent: null }))
    const agent = { id: 1 } as any
    await act(async () => {
      await result.current.heartbeat(agent)
    })
    expect(agentsApi.heartbeatAgent).toHaveBeenCalledWith(1, 'active')
    expect(message.success).toHaveBeenCalledWith('心跳已记录')
    agentsApi.heartbeatAgent.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.heartbeat(agent)
    })
    expect(message.error).toHaveBeenCalledWith('心跳失败')
    // 广播：空内容
    await act(async () => {
      await result.current.sendBroadcast()
    })
    expect(message.warning).toHaveBeenCalledWith('请输入广播内容')
    act(() => {
      result.current.setBroadcastAgent(agent)
      result.current.setBroadcastContent('  hello  ')
    })
    await act(async () => {
      await result.current.sendBroadcast()
    })
    expect(agentsApi.broadcastMessage).toHaveBeenCalledWith(1, 'hello')
    expect(message.success).toHaveBeenCalledWith('广播已发送给 3 个活跃 Agent')
    expect(result.current.broadcastOpen).toBe(false)
    expect(result.current.broadcastAgent).toBeNull()
    expect(result.current.broadcastContent).toBe('')
    expect(result.current.broadcasting).toBe(false)
    // 成功后状态已重置，重新注入再走失败分支
    act(() => {
      result.current.setBroadcastAgent(agent)
      result.current.setBroadcastContent('retry')
    })
    agentsApi.broadcastMessage.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.sendBroadcast()
    })
    expect(message.error).toHaveBeenCalledWith('广播发送失败')
  })

  it('loadAgentReputation：声誉与历史独立容错', async () => {
    const { result } = renderHook(() => useAgentCrudActions({ selectedAgent: null }))
    const agent = { id: 1 } as any
    await act(async () => {
      await result.current.loadAgentReputation(agent)
    })
    expect(result.current.agentReputation).toEqual({ score: 90 })
    expect(result.current.reputationHistory).toEqual({ points: [] })
    agentsApi.getAgentReputation.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.loadAgentReputation(agent)
    })
    expect(result.current.agentReputation).toBeNull()
    agentsApi.getAgentReputationHistory.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.loadAgentReputation(agent)
    })
    expect(result.current.reputationHistory).toBeNull()
  })

  it('loadAgentSandbox：取 sandbox 字段、失败置空', async () => {
    const { result } = renderHook(() => useAgentCrudActions({ selectedAgent: null }))
    const agent = { id: 1 } as any
    await act(async () => {
      await result.current.loadAgentSandbox(agent)
    })
    expect(result.current.agentSandbox).toEqual({ id: 4 })
    agentsApi.getAgentSandbox.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await result.current.loadAgentSandbox(agent)
    })
    expect(result.current.agentSandbox).toBeNull()
  })

  it('recalculateReputation：无选中早退、成功/失败', async () => {
    const { result } = renderHook(() => useAgentCrudActions({ selectedAgent: null }))
    await act(async () => {
      await result.current.recalculateReputation()
    })
    expect(agentsApi.recalculateReputation).not.toHaveBeenCalled()
    const { result: r2 } = renderHook(() => useAgentCrudActions({ selectedAgent: { id: 5 } as any }))
    await act(async () => {
      await r2.current.recalculateReputation()
    })
    expect(agentsApi.recalculateReputation).toHaveBeenCalledWith(5)
    expect(r2.current.agentReputation).toEqual({ score: 95 })
    expect(message.success).toHaveBeenCalledWith('声誉已重新计算')
    agentsApi.recalculateReputation.mockRejectedValueOnce(new Error('x'))
    await act(async () => {
      await r2.current.recalculateReputation()
    })
    expect(message.error).toHaveBeenCalledWith('重新计算失败')
  })
})
