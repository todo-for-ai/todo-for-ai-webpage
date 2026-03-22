/**
 * Organization Detail 类型定义
 */

import type { OrganizationMember, OrganizationRoleDefinition } from '../../api/organizations'
import type { OrganizationAgentMember } from '../../api/organizationAgents'
import type { OrganizationEvent } from '../../api/organizationEvents'
import type { Project } from '../../api/projects'

/** 合并后的成员行数据 */
export interface MergedMemberRow {
  row_id: string
  entity_type: 'human' | 'agent'
  member: OrganizationMember | null
  agentMember: OrganizationAgentMember | null
  status: string
}

/** 成员统计数据 */
export interface MemberStats {
  total: number
  humanActive: number
  aiActive: number
  invited: number
}

/** 角色统计数据 */
export interface RoleStats {
  total: number
  active: number
}

/** 项目统计数据 */
export interface ProjectStats {
  total: number
  active: number
  archived: number
  deleted: number
}

/** 活动统计数据 */
export interface ActivityStats {
  activeProjects7d: number
  latestActivityAt: string | undefined
}

/** 条形图段 */
export interface BarSegment {
  key: string
  width: string
  color: string
}

/** 组织信号 */
export interface OrgSignal {
  key: string
  color: string
  text: string
}

/** 资料事实 */
export interface ProfileFact {
  key: string
  label: string
  value: string
}

/** 事件分页 */
export interface EventsPagination {
  page: number
  per_page: number
  total: number
}

/** 钩子返回的基础状态 */
export interface HookState<T> {
  data: T
  loading: boolean
  error: Error | null
}
