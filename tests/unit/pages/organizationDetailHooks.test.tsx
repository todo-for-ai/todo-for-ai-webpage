import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { message } from 'antd'

const navigate = vi.hoisted(() => vi.fn())
const setSearchParams = vi.hoisted(() => vi.fn())
const tp = vi.hoisted(() => vi.fn((k: string) => k))

const routerState = vi.hoisted(() => ({ tab: 'members', orgId: '55' }))
vi.mock('react-router-dom', () => ({
  useParams: () => ({ organizationId: routerState.orgId }),
  useSearchParams: () => [new URLSearchParams('tab=' + routerState.tab), setSearchParams],
  useNavigate: () => navigate,
}))
vi.mock('../../../src/i18n/hooks/useTranslation', () => ({
  usePageTranslation: () => ({ tp, tc: tp, language: 'zh-CN' }),
}))

const organizationsApi = vi.hoisted(() => ({
  getOrganization: vi.fn(async () => ({
    id: 55,
    name: 'org-a',
    status: 'active',
    current_user_role: 'owner',
    description: 'desc',
    created_at: '2026-01-01T00:00:00Z',
  })),
  getOrganizationMembers: vi.fn(async () => ({
    items: [
      { id: 1, user_id: 10, name: 'alice', role_ids: [1], status: 'active', created_at: '2026-01-02T00:00:00Z', last_activity_at: '2026-02-01T00:00:00Z' },
      { id: 2, user_id: 11, name: 'bob', role_ids: [], status: 'invited' },
      { id: 4, user_id: 12, name: 'carol', role_ids: [2], status: 'deleted' },
    ],
  })),
  getOrganizationRoles: vi.fn(async () => ({
    items: [
      { id: 1, name: 'admin', label: 'Admin', key: 'admin', is_active: true },
      { id: 2, name: 'dev', label: 'Dev', key: 'dev', is_active: true },
      { id: 3, name: 'legacy', label: 'Legacy', key: 'legacy', is_active: false },
    ],
  })),
  inviteOrganizationMember: vi.fn(async () => ({ ok: true })),
  updateOrganizationMember: vi.fn(async () => ({ ok: true })),
  removeOrganizationMember: vi.fn(async () => ({ ok: true })),
}))
vi.mock('../../../src/api/organizations', () => ({ organizationsApi }))

const organizationAgentsApi = vi.hoisted(() => ({
  getOrganizationAgentMembers: vi.fn(async () => ({
    items: [{ id: 3, agent_id: 5, name: 'bot', status: 'active' }],
  })),
  createOrganizationAgent: vi.fn(async () => ({ id: 9 })),
  inviteOrganizationAgentMember: vi.fn(async () => ({ ok: true })),
  removeOrganizationAgentMember: vi.fn(async () => ({ ok: true })),
}))
vi.mock('../../../src/api/organizationAgents', () => ({ organizationAgentsApi }))

const organizationEventsApi = vi.hoisted(() => ({
  getOrganizationEvents: vi.fn(async () => ({
    items: [
      { id: 1, event_type: 'task.created', actor_name: 'alice', created_at: '2026-03-01T00:00:00Z', project_id: 7, task_id: 3, payload: { project_name: 'proj', task_title: 't1' } },
      { id: 2, event_type: 'member.invited', actor_name: 'bob', created_at: '2026-03-02T00:00:00Z', message: 'welcome!', project_id: 7 },
      { id: 3, event_type: 'unknown.kind', task_id: 9, created_at: '2026-03-03T00:00:00Z' },
      { id: 4, event_type: 'task.updated', actor_name: 'zoe', payload: { changed_fields: ['status', '', 'assignees'] }, created_at: '2026-03-04T00:00:00Z' },
    ],
    pagination: { page: 1, per_page: 20, total: 4 },
  })),
}))
vi.mock('../../../src/api/organizationEvents', () => ({ organizationEventsApi }))

const projectsApi = vi.hoisted(() => ({
  getProjects: vi.fn(async () => ({
    items: [
      { id: 7, name: 'proj', status: 'active', total_tasks: 4, updated_at: '2026-03-02T00:00:00Z', created_at: '2026-02-02T00:00:00Z' },
      { id: 8, name: 'old', status: 'archived', stats: { total_tasks: 2 }, updated_at: '2026-01-02T00:00:00Z', description: 'old project' },
      { id: 9, name: 'dead', status: 'deleted', total_tasks: 0, updated_at: '2025-09-01T00:00:00Z' },
      { id: 10, name: 'fresh', status: 'active', updated_at: new Date().toISOString() },
    ],
  })),
}))
vi.mock('../../../src/api/projects', () => ({ projectsApi }))

import { useOrganizationDetailData, extractProjectItems, getProjectTaskCount } from '../../../src/pages/OrganizationDetailData'
import { useOrganizationDetailDerived } from '../../../src/pages/OrganizationDetailDerived'

describe('useOrganizationDetailData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('挂载并发拉取组织/成员/Agent 成员/角色/项目/事件', async () => {
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.pageLoading).toBe(false))
    expect(organizationsApi.getOrganization).toHaveBeenCalledWith(55)
    expect(organizationsApi.getOrganizationMembers).toHaveBeenCalledWith(55)
    expect(organizationAgentsApi.getOrganizationAgentMembers).toHaveBeenCalledWith(55)
    expect(organizationsApi.getOrganizationRoles).toHaveBeenCalledWith(55)
    expect(projectsApi.getProjects).toHaveBeenCalled()
    expect(organizationEventsApi.getOrganizationEvents).toHaveBeenCalled()
    expect(result.current.organization?.name).toBe('org-a')
    expect(result.current.members).toHaveLength(3)
    expect(result.current.agentMembers).toHaveLength(1)
    expect(result.current.projects).toHaveLength(4)
    expect(result.current.canManageMembers).toBe(true)
    expect(result.current.activeTab).toBe('members')
  })

  it('loadEvents 支持分页参数并写入 pagination', async () => {
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.pageLoading).toBe(false))
    await act(async () => {
      await result.current.loadEvents(3, 5)
    })
    expect(organizationEventsApi.getOrganizationEvents).toHaveBeenLastCalledWith(55, expect.objectContaining({ page: 3, per_page: 5 }))
    expect(result.current.eventsPagination).toEqual({ page: 1, per_page: 20, total: 4 })
  })

  it('邀请成员：无邮箱告警、成功后刷新成员与活动', async () => {
    const warnSpy = vi.spyOn(message, 'warning').mockImplementation(() => undefined as never)
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.pageLoading).toBe(false))
    const membersCalls = organizationsApi.getOrganizationMembers.mock.calls.length
    act(() => {
      result.current.setInviteEmail('  ')
    })
    await act(async () => {
      await result.current.inviteMember()
    })
    expect(warnSpy).toHaveBeenCalled()
    act(() => {
      result.current.setInviteEmail(' new@x.io ')
      result.current.setInviteRoleIds([1])
    })
    await act(async () => {
      await result.current.inviteMember()
    })
    expect(organizationsApi.inviteOrganizationMember).toHaveBeenCalledWith(55, { email: 'new@x.io', role_ids: [1] })
    expect(organizationsApi.getOrganizationMembers.mock.calls.length).toBeGreaterThan(membersCalls)
    expect(result.current.inviteEmail).toBe('')
    successSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('updateMemberRoles / removeMember 成功路径', async () => {
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.members).toHaveLength(3))
    await act(async () => {
      await result.current.updateMemberRoles({ id: 1, user_id: 10 } as never, [2])
    })
    expect(organizationsApi.updateOrganizationMember).toHaveBeenCalledWith(55, 10, { role_ids: [2] })
    await act(async () => {
      await result.current.removeMember({ id: 1, user_id: 10 } as never)
    })
    expect(organizationsApi.removeOrganizationMember).toHaveBeenCalledWith(55, 10)
    expect(successSpy).toHaveBeenCalled()
    successSpy.mockRestore()
  })

  it('createAgent：表单成功后关闭弹窗并刷新 Agent 成员', async () => {
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.agentMembers).toHaveLength(1))
    const agentCalls = organizationAgentsApi.getOrganizationAgentMembers.mock.calls.length
    await act(async () => {
      await result.current.createAgent()
    })
    expect(organizationAgentsApi.createOrganizationAgent).toHaveBeenCalledWith(55, expect.anything())
    expect(result.current.createAgentVisible).toBe(false)
    expect(organizationAgentsApi.getOrganizationAgentMembers.mock.calls.length).toBeGreaterThan(agentCalls)
    successSpy.mockRestore()
  })

  it('createAgent 表单校验失败（errorFields）静默返回', async () => {
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.createAgentForm).toBeTruthy())
    const validateSpy = vi.spyOn(result.current.createAgentForm, 'validateFields').mockRejectedValue({ errorFields: [{ name: 'name' }] })
    await act(async () => {
      await result.current.createAgent()
    })
    expect(organizationAgentsApi.createOrganizationAgent).not.toHaveBeenCalled()
    expect(result.current.actionLoading).toBe(false)
    validateSpy.mockRestore()
  })

  it('inviteAgentMember / removeAgentMember', async () => {
    const warnSpy = vi.spyOn(message, 'warning').mockImplementation(() => undefined as never)
    const successSpy = vi.spyOn(message, 'success').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.agentMembers).toHaveLength(1))
    act(() => {
      result.current.setInviteAgentId('abc')
    })
    await act(async () => {
      await result.current.inviteAgentMember()
    })
    expect(warnSpy).toHaveBeenCalled()
    act(() => {
      result.current.setInviteAgentId('5')
    })
    await act(async () => {
      await result.current.inviteAgentMember()
    })
    expect(organizationAgentsApi.inviteOrganizationAgentMember).toHaveBeenCalledWith(55, 5)
    await act(async () => {
      await result.current.removeAgentMember({ id: 3, agent_id: 5 } as never)
    })
    expect(organizationAgentsApi.removeOrganizationAgentMember).toHaveBeenCalledWith(55, 3)
    expect(successSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
    successSpy.mockRestore()
  })

  it('动作失败路径给出错误提示', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.pageLoading).toBe(false))
    organizationsApi.inviteOrganizationMember.mockRejectedValueOnce({}) // 无 message → 走 tp 兜底
    act(() => {
      result.current.setInviteEmail('x@x.io')
    })
    await act(async () => {
      await result.current.inviteMember()
    })
    organizationsApi.updateOrganizationMember.mockRejectedValueOnce(new Error('u'))
    await act(async () => {
      await result.current.updateMemberRoles({ id: 1, user_id: 10 } as never, [1])
    })
    organizationsApi.removeOrganizationMember.mockRejectedValueOnce(new Error('r'))
    await act(async () => {
      await result.current.removeMember({ id: 1, user_id: 10 } as never)
    })
    organizationAgentsApi.createOrganizationAgent.mockRejectedValueOnce(new Error('c'))
    await act(async () => {
      await result.current.createAgent()
    })
    organizationAgentsApi.inviteOrganizationAgentMember.mockRejectedValueOnce(new Error('ia'))
    act(() => {
      result.current.setInviteAgentId('5')
    })
    await act(async () => {
      await result.current.inviteAgentMember()
    })
    organizationAgentsApi.removeOrganizationAgentMember.mockRejectedValueOnce(new Error('ra'))
    await act(async () => {
      await result.current.removeAgentMember({ id: 3, agent_id: 5 } as never)
    })
    expect(errorSpy).toHaveBeenCalled()
    expect(errorSpy.mock.calls.some((c) => c[0] === 'messages.inviteFailed')).toBe(true)
    expect(result.current.actionLoading).toBe(false)
    errorSpy.mockRestore()
  })

  it('activity tab 挂载后按完整页拉取事件', async () => {
    routerState.tab = 'activity'
    try {
      const { result } = renderHook(() => useOrganizationDetailData())
      await waitFor(() => expect(result.current.pageLoading).toBe(false))
      await waitFor(() => expect(organizationEventsApi.getOrganizationEvents).toHaveBeenLastCalledWith(
        55,
        expect.objectContaining({ page: 1, per_page: 20 }),
      ))
    } finally {
      routerState.tab = 'members'
    }
  })

  it('无效 organizationId 时全部守卫早退（防御分支）', async () => {
    routerState.orgId = 'not-a-number'
    try {
      const { result } = renderHook(() => useOrganizationDetailData())
      await act(async () => {
        await result.current.loadOrganization()
        await result.current.loadMembers()
        await result.current.loadAgentMembers()
        await result.current.loadOrganizationRoles()
        await result.current.loadProjects()
        await result.current.loadEvents()
        await result.current.inviteMember()
        await result.current.updateMemberRoles({ id: 1, user_id: 1 } as never, [1])
        await result.current.removeMember({ id: 1, user_id: 1 } as never)
        await result.current.createAgent()
        await result.current.inviteAgentMember()
        await result.current.removeAgentMember({ id: 1, agent_id: 1 } as never)
        result.current.openRoleManagerPage()
      })
      expect(organizationsApi.getOrganization).not.toHaveBeenCalled()
      expect(result.current.organization).toBeNull()
    } finally {
      routerState.orgId = '55'
    }
  })

  it('格式化助手空值与非法日期分支', async () => {
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.pageLoading).toBe(false))
    expect(result.current.formatDateTime('')).toBe('-')
    expect(result.current.formatDateTime('not-a-date')).toBe('-')
    expect(result.current.formatDateTime('2026-01-01T00:00:00Z')).not.toBe('-')
    expect(result.current.formatNumber(undefined)).toBe('-')
    expect(result.current.formatNumber(NaN)).toBe('-')
    expect(result.current.formatNumber(1234)).toBe('1,234')
    expect(result.current.formatEventType('unknown.kind')).toBe('unknown.kind')
  })

  it('openRoleManagerPage 跳转角色管理页', async () => {
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.pageLoading).toBe(false))
    await act(async () => {
      result.current.openRoleManagerPage()
    })
    expect(navigate).toHaveBeenCalledWith('/todo-for-ai/pages/organizations/55/roles')
  })

  it('加载失败路径给出错误提示', async () => {
    const errorSpy = vi.spyOn(message, 'error').mockImplementation(() => undefined as never)
    organizationsApi.getOrganization.mockRejectedValueOnce(new Error('boom'))
    organizationsApi.getOrganizationMembers.mockRejectedValueOnce(new Error('m'))
    organizationAgentsApi.getOrganizationAgentMembers.mockRejectedValueOnce(new Error('a'))
    organizationsApi.getOrganizationRoles.mockRejectedValueOnce(new Error('r'))
    projectsApi.getProjects.mockRejectedValueOnce(new Error('p'))
    organizationEventsApi.getOrganizationEvents.mockRejectedValueOnce(new Error('e'))
    const { result } = renderHook(() => useOrganizationDetailData())
    await waitFor(() => expect(result.current.pageLoading).toBe(false))
    await waitFor(() => expect(result.current.eventsLoading).toBe(false))
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})

describe('useOrganizationDetailDerived', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const withFixture = () => renderHook(() => {
    const data = useOrganizationDetailData()
    const derived = useOrganizationDetailDerived(data)
    return { ...data, ...derived }
  })

  it('派生层：合并成员行/角色选项/统计/徽标段/项目列全部有值', async () => {
    const { result } = withFixture()
    await waitFor(() => expect(result.current.organization).toBeTruthy())

    expect(result.current.mergedMemberRows.length).toBeGreaterThanOrEqual(3)
    expect(result.current.roleOptions.length).toBe(2)
    expect(result.current.memberStats).toBeTruthy()
    expect(result.current.roleStats).toBeTruthy()
    expect(result.current.projectStats).toBeTruthy()
    expect(result.current.memberBarSegments.length).toBeGreaterThan(0)
    expect(result.current.projectBarSegments.length).toBeGreaterThan(0)
    expect(result.current.activityStats).toBeTruthy()
    expect(result.current.currentRoleKeys).toBeTruthy()
    expect(result.current.recentProjects.length).toBeGreaterThan(0)
    expect(result.current.activityPreviewItems).toBeTruthy()
    expect(result.current.organizationSignals).toBeTruthy()
    expect(result.current.profileFacts.length).toBeGreaterThan(0)
  })

  it('无已删项目时展示归档项目信号', async () => {
    projectsApi.getProjects.mockResolvedValueOnce({
      items: [{ id: 8, name: 'old', status: 'archived', stats: { total_tasks: 2 }, updated_at: '2026-01-02T00:00:00Z' }],
    })
    const { result } = withFixture()
    await waitFor(() => expect(result.current.projects).toHaveLength(1))
    const archivedSignal = result.current.organizationSignals.find((sig: any) => sig.key === 'archivedProjects')
    expect(archivedSignal).toBeTruthy()
  })

  it('事件汇总与时间戳助手', async () => {
    const { result } = withFixture()
    await waitFor(() => expect(result.current.events).toHaveLength(4))
    result.current.events.forEach((ev: any) => {
      expect(typeof result.current.getEventSummary(ev)).toBe('string')
      expect(result.current.getEventTimestamp(ev)).toBeTruthy()
    })
    expect(result.current.eventColumns.length).toBeGreaterThan(0)
    expect(result.current.projectColumns.length).toBeGreaterThan(0)

    // 逐格调用列 render：覆盖 JSX 单元格分支（有/无 project_id/task_id、payload 详情、状态色）
    const projectRecords = result.current.projects
    result.current.projectColumns.forEach((col: any) => {
      if (typeof col.render !== 'function') return
      projectRecords.forEach((r: any) => col.render(r[col.dataIndex ?? 'id'], r, 0))
    })
    result.current.eventColumns.forEach((col: any) => {
      if (typeof col.render !== 'function') return
      result.current.events.forEach((r: any) => col.render(r[col.dataIndex ?? 'id'], r, 0))
    })
    // 汇总口径：deleted 项目/成员、活跃项目、非活跃角色信号
    expect(result.current.projectStats).toBeTruthy()
    expect(result.current.organizationSignals.length).toBeGreaterThan(0)
  })
})
