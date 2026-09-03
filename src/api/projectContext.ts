/**
 * 项目上下文集成 API
 *
 * 项目详情页需要把后来新增的能力（repo 绑定 / 工作区 Agent / 审计事件 /
 * PR 审批队列）聚合呈现；这些端点分散在多个后端蓝图里，这里按项目视角
 * 统一封装。全部走 apiClient（返回已剥壳的 data），不改既有 WIP 模块。
 */
import { apiClient } from './client/index.js'

// ── 项目 repo 绑定（GET /projects/{id}/repo，api/project_repo.py）──
export interface ProjectRepoBinding {
  id: number
  project_id: number
  provider: string
  repo_owner: string
  repo_name: string
  default_branch: string
  /** 0=全审批, 1=自动PR人工合并, 2=证据全通过自动合并 */
  autonomy_level: number
  require_agent_review: boolean
  reviewer_agent_id?: number | null
  repo_full_name: string
  has_binding_token: boolean
  created_at: string
  updated_at: string
}

// ── 工作区 Agent（GET /workspaces/{ws}/agents，api/agent_workspace_agents.py）──
export interface WorkspaceAgentSummary {
  id: number
  name: string
  display_name?: string
  status?: string
  kind?: string
  description?: string
  avatar_url?: string
  collaboration_role?: string
  execution_mode?: string
  sandbox_profile?: string
  runner_enabled?: boolean
  /** null/空 = 不限制（继承全工作区）；否则为显式授权的项目 ID 列表 */
  allowed_project_ids?: number[] | null
  last_seen_at?: string
  workspace_id?: number
}

export interface WorkspaceAgentListResponse {
  items: WorkspaceAgentSummary[]
  pagination: {
    page: number
    per_page: number
    total: number
    has_prev: boolean
    has_next: boolean
  }
}

// ── 审计事件（GET /workspaces/{ws}/audit-events，api/agent_audit.py）──
export interface WorkspaceAuditEvent {
  id: number
  workspace_id: number
  event_type: string
  actor_type: string
  actor_id?: number | null
  target_type?: string | null
  target_id?: number | null
  source?: string | null
  level?: string | null
  risk_score?: number | null
  task_id?: number | null
  project_id?: number | null
  actor_agent_id?: number | null
  target_agent_id?: number | null
  duration_ms?: number | null
  error_code?: string | null
  occurred_at: string
}

export interface WorkspaceAuditEventsResponse {
  items: WorkspaceAuditEvent[]
  total: number
  page: number
  per_page: number
}

// ── 待审批 PR 合并请求（GET /tasks/pull-request/approvals/pending）──
export interface PendingPRApproval {
  interaction_id: number
  interaction_type?: string | null
  task_id?: number | null
  task_title?: string | null
  project_id?: number | null
  pr_number?: number | null
  repo_full_name?: string | null
  head_branch?: string | null
  requested_at?: string | null
}

export interface PendingPRApprovalsResponse {
  items: PendingPRApproval[]
  pagination: { page: number; per_page: number; total: number; has_next: boolean }
}

function isHttpStatus(error: unknown, status: number): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { status?: number }).status === status
  )
}

export const projectContextApi = {
  /**
   * 项目 repo 绑定；未绑定时后端 404（NO_REPO_BOUND），归一为 null，
   * 让调用方不必逐个 try/catch。
   */
  async getRepoBinding(projectId: number): Promise<ProjectRepoBinding | null> {
    try {
      return await apiClient.get<ProjectRepoBinding>(`/projects/${projectId}/repo`)
    } catch (error) {
      if (isHttpStatus(error, 404)) {
        return null
      }
      throw error
    }
  },

  async getWorkspaceAgents(
    workspaceId: number,
    params?: { search?: string; page?: number; per_page?: number }
  ): Promise<WorkspaceAgentListResponse> {
    const query = new URLSearchParams()
    query.set('page', String(params?.page ?? 1))
    query.set('per_page', String(params?.per_page ?? 200))
    if (params?.search) {
      query.set('search', params.search)
    }
    return apiClient.get<WorkspaceAgentListResponse>(
      `/workspaces/${workspaceId}/agents?${query.toString()}`
    )
  },

  async getWorkspaceAuditEvents(
    workspaceId: number,
    params?: { page?: number; per_page?: number }
  ): Promise<WorkspaceAuditEventsResponse> {
    const query = new URLSearchParams()
    query.set('page', String(params?.page ?? 1))
    query.set('per_page', String(params?.per_page ?? 100))
    return apiClient.get<WorkspaceAuditEventsResponse>(
      `/workspaces/${workspaceId}/audit-events?${query.toString()}`
    )
  },

  async getPendingPRApprovals(params?: {
    page?: number
    per_page?: number
  }): Promise<PendingPRApprovalsResponse> {
    const query = new URLSearchParams()
    query.set('page', String(params?.page ?? 1))
    query.set('per_page', String(params?.per_page ?? 100))
    return apiClient.get<PendingPRApprovalsResponse>(
      `/tasks/pull-request/approvals/pending?${query.toString()}`
    )
  },
}
