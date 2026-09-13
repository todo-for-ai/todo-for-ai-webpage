import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const { agentsApi } = vi.hoisted(() => ({
  agentsApi: {
    getExperiencesStats: vi.fn(async () => ({ total: 1 })),
    getExperiencesLowConfidence: vi.fn(async () => ({})),
    getExperiencesScatter: vi.fn(async () => ({})),
    getExperiencesReuseTrend: vi.fn(async () => ({})),
    getExperiencesConfidenceDecayForecast: vi.fn(async () => ({})),
    getExperiencesDecayByDomain: vi.fn(async () => ({})),
    getExperiencesDecayByTaskType: vi.fn(async () => ({})),
    getExperiencesConfidenceDistribution: vi.fn(async () => ({})),
    getExperiencesSourceDistribution: vi.fn(async () => ({})),
    getExperiencesPropagationChain: vi.fn(async () => ({})),
    getExperiencesSkillCoverageRadar: vi.fn(async () => ({})),
  },
}))
vi.mock('../../../src/api/agents', () => ({ agentsApi }))

import { useExperiencesData } from '../../../src/pages/dashboard/useExperiencesData'

describe('useExperiencesData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('挂载时按默认窗口并发拉取 11 个经验分析端点', async () => {
    const { result } = renderHook(() => useExperiencesData())
    await waitFor(() => expect(result.current.experiencesStats).toEqual({ total: 1 }))
    expect(agentsApi.getExperiencesStats).toHaveBeenCalledTimes(1)
    expect(agentsApi.getExperiencesScatter).toHaveBeenCalledWith(200)
    expect(agentsApi.getExperiencesReuseTrend).toHaveBeenCalledWith(30)
    expect(agentsApi.getExperiencesConfidenceDecayForecast).toHaveBeenCalledWith(30)
    expect(agentsApi.getExperiencesDecayByDomain).toHaveBeenCalledWith(15)
    expect(agentsApi.getExperiencesDecayByTaskType).toHaveBeenCalledWith(15)
    expect(agentsApi.getExperiencesConfidenceDistribution).toHaveBeenCalledTimes(1)
    expect(agentsApi.getExperiencesSourceDistribution).toHaveBeenCalledTimes(1)
    expect(agentsApi.getExperiencesPropagationChain).toHaveBeenCalledWith(10)
    expect(agentsApi.getExperiencesSkillCoverageRadar).toHaveBeenCalledWith(6, 8)
  })
})
