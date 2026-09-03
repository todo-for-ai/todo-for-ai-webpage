/**
 * 项目上下文集成 API
 *
 * 项目详情页把后来新增的能力（组织归属 / repo 绑定 / Agent 运行画像 /
 * 审计事件 / PR 审批队列）聚合呈现。核心是 GET /projects/{id}/overview
 * 聚合端点（服务端按 project_id 过滤），页面级一次拉取后由头部与各 Tab
 * 共享；repo 绑定与 PR 审批队列仍走各自端点。
 */
import { apiClient } from './client/index.js'

// ── 组织归属 ──
export interface ProjectOverviewOrganization {
  id: number
  name: string
}

// ── repo 绑定（GET /projects/{id}/repo，api/project_repo.py）──
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

// ── 项目可见 Agent（overview 聚合，含本项目运行画像）──
export interface ProjectAgentOverview {
  id: number
  name: string
  display_name?: string
  status?: string
  avatar_url?: string
  execution_mode?: string
  sandbox_profile?: string
  /** true=allowed_project_ids 显式包含本项目；false=工作区继承 */
  explicitly_allowed: boolean
  has_active_lease: boolean
  runs_total: number
  runs_succeeded: number
  runs_failed: number
  active_runs: number
  last_run_state?: string | null
  last_run_at?: string | null
}

export interface ProjectRunsSummary {
  active: number
  running_tasks: number
  succeeded_window: number
  failed_window: number
  window_days: number
}

// ── 审计事件（overview 聚合，按项目匹配）──
export interface ProjectAuditEvent {
  id: number
  event_type: string
  level?: string | null
  actor_type?: string | null
  actor_agent_id?: number | null
  task_id?: number | null
  duration_ms?: number | null
  error_code?: string | null
  occurred_at?: string | null
}

// ── 聚合概览（GET /projects/{id}/overview，api/projects/routes_project_overview.py）──
export interface ProjectOverview {
  project_id: number
  organization: ProjectOverviewOrganization | null
  repo: ProjectRepoBinding | null
  agents: ProjectAgentOverview[]
  runs_summary: ProjectRunsSummary
  recent_events: ProjectAuditEvent[]
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

// overview 进程内短缓存（30s）：头部 + 概览 + Agent/治理 Tab 共享一次请求
const OVERVIEW_CACHE_TTL_MS = 30_000
const overviewCache = new Map<
  number,
  { fetchedAt: number; promise: Promise<ProjectOverview> }
>()

export const projectContextApi = {
  /**
   * 项目跨域聚合概览。带 30s 进程内缓存，页面级多处消费只发一次请求。
   */
  getProjectOverview(projectId: number): Promise<ProjectOverview> {
    const cached = overviewCache.get(projectId)
    const now = Date.now()
    if (cached && now - cached.fetchedAt < OVERVIEW_CACHE_TTL_MS) {
      return cached.promise
    }
    const promise = apiClient.get<ProjectOverview>(`/projects/${projectId}/overview`)
    overviewCache.set(projectId, { fetchedAt: now, promise })
    promise.catch(() => {
      // 失败不缓存，允许下一次重试
      const entry = overviewCache.get(projectId)
      if (entry && entry.promise === promise) {
        overviewCache.delete(projectId)
      }
    })
    return promise
  },

  /**
   * 项目 repo 绑定；未绑定时后端 404（NO_REPO_BOUND），归一为 null。
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
