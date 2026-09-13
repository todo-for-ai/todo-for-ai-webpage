import { describe, expect, it, vi, beforeEach } from 'vitest'

const apiClient = vi.hoisted(() => ({
  get: vi.fn(async () => ({})),
  post: vi.fn(async () => ({})),
  put: vi.fn(async () => ({})),
  delete: vi.fn(async () => ({})),
  upload: vi.fn(async () => ({})),
}))
vi.mock('../../../src/api/client/index.js', () => ({ apiClient }))

import { agentsApi, type AgentsApi } from '../../../src/api/agents'
import { agentsApi as agentsApiAgain } from '../../../src/api/agents/agents-client'

describe('agents-client 聚合客户端', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('单例身份：两种导入路径拿到同一实例', () => {
    expect(agentsApiAgain).toBe(agentsApi)
  })

  it('七组方法域的代表性方法全部挂载', () => {
    const required: Array<keyof AgentsApi> = [
      'getAgents',
      'getWorkingSchedule',
      'getConflictsDashboard',
      'getSecurityEvents',
      'listOrchestratorHistory',
      'getCollaborationGraph',
      'listAgentExperiences',
    ] as never
    for (const m of required) {
      expect(typeof agentsApi[m]).toBe('function')
    }
  })

  it.each([
    ['getAgents', []] as const,
    ['getAgent', [1]] as const,
    ['getWorkingSchedule', [1]] as const,
    ['heartbeatAgent', [1]] as const,
    ['getConflictsDashboard', []] as const,
    ['getSecurityEvents', [{}]] as const,
    ['listOrchestratorHistory', [{}]] as const,
    ['getCollaborationGraph', [undefined]] as const,
  ])('%s 委派到 apiClient（真实工厂链路）', async (method, args) => {
    const before = (apiClient.get.mock.calls.length +
      apiClient.post.mock.calls.length +
      apiClient.put.mock.calls.length +
      apiClient.delete.mock.calls.length)
    await (agentsApi as never as Record<string, (...a: unknown[]) => Promise<unknown>>)[method](...args)
    const after = (apiClient.get.mock.calls.length +
      apiClient.post.mock.calls.length +
      apiClient.put.mock.calls.length +
      apiClient.delete.mock.calls.length)
    expect(after).toBeGreaterThan(before)
  })
})
