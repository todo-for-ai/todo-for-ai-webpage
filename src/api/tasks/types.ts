/*
 * 任务 API 类型定义：核心类型（由 tasks.ts 拆分，行为不变）。
 * 拆分时按行原样迁移，勿手改接口内容。
 */

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pages: number
    per_page: number
    total: number
    has_next: boolean
    has_prev: boolean
    next_num?: number
    prev_num?: number
  }
  message: string
  success: boolean
  timestamp: string
}

// 任务相关类型定义
export interface Task {
  id: number
  project_id: number
  title: string
  content: string
  description?: string  // 添加缺失的description属性
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  estimated_hours?: number
  completion_rate: number
  completed_at?: string
  tags: string[]
  assignees?: Array<{ type: 'human' | 'agent'; id: number }>
  mentions?: Array<{ type: 'human' | 'agent'; id: number }>
  revision?: number
  created_at: string
  updated_at: string
  created_by: string
  feedback_content?: string
  feedback_at?: string
  is_ai_task?: boolean  // 添加缺失的is_ai_task属性
  related_files?: string[]  // 添加缺失的related_files属性
  creator_type?: string  // 添加缺失的creator_type属性
  creator_identifier?: string  // 添加缺失的creator_identifier属性
  interaction_session_id?: string  // 交互式任务会话ID
  is_interactive?: boolean  // 是否为交互式任务
  ai_waiting_feedback?: boolean  // AI是否等待人类反馈
  parent_task_id?: number  // 父任务ID（子任务指向父任务）
  required_capabilities?: string[]  // Agent 能力要求
  subtask_count?: number  // 子任务总数
  subtask_done_count?: number  // 已完成子任务数
  project?: {
    id: number
    name: string
    color: string
  }
  stats?: {
    attachments_count: number
    history_count: number
    is_overdue: boolean
    days_until_due?: number
  }
}

export interface CreateTaskData {
  project_id: number
  title?: string
  content?: string
  description?: string  // 添加description属性
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  tags?: string[]
  assignees?: Array<{ type: 'human' | 'agent'; id: number }>
  mentions?: Array<{ type: 'human' | 'agent'; id: number }>
  is_ai_task?: boolean
  related_files?: string[]  // 添加related_files属性
  creator_type?: string  // 添加creator_type属性
  creator_identifier?: string  // 添加creator_identifier属性
  parent_task_id?: number  // 父任务ID（创建子任务时传入）
  required_capabilities?: string[]  // Agent能力要求
}

export interface UpdateTaskData {
  title?: string
  content?: string
  description?: string  // 添加description属性
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | 'blocked'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  completion_rate?: number
  tags?: string[]
  assignees?: Array<{ type: 'human' | 'agent'; id: number }>
  mentions?: Array<{ type: 'human' | 'agent'; id: number }>
  expected_revision?: number
  is_ai_task?: boolean  // 添加is_ai_task属性
  related_files?: string[]  // 添加related_files属性
  created_by?: string  // 添加created_by属性
  required_capabilities?: string[]  // Agent能力要求
}

export interface TaskQueryParams {
  page?: number
  per_page?: number
  search?: string
  project_id?: number
  parent_task_id?: number
  status?: string
  priority?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface TaskLog {
  id: number
  task_id: number
  actor_type: 'human' | 'agent' | 'system'
  actor_user_id?: number | null
  actor_agent_id?: number | null
  content: string
  content_type: string
  created_at: string
  updated_at: string
  created_by?: string
}

// DoD 验证门相关类型（P1.2）
export interface TaskDodCriterion {
  type: 'test' | 'build' | 'lint' | 'command' | 'pr' | 'manual'
  value: string
}

export interface TaskEvidenceItem {
  id: number
  task_id: number
  attempt_id?: string | null
  agent_id?: number | null
  evidence_type: 'test' | 'build' | 'lint' | 'command' | 'pr' | 'manual'
  status: 'passed' | 'failed' | 'unknown'
  summary?: string | null
  detail?: Record<string, any> | null
  url?: string | null
  verified_at?: string | null
  created_at?: string
}

export interface TaskEvidenceResult {
  dod: TaskDodCriterion[]
  evidence: TaskEvidenceItem[]
}

// L0/L1 PR 审批（Phase 2 事件化审批队列）
export interface PendingPrApproval {
  interaction_id: string
  interaction_type: 'pr_create' | 'pr_merge'
  task_id: number
  task_title?: string | null
  project_id?: number | null
  pr_number?: number | null
  repo_full_name?: string | null
  head_branch?: string | null
  requested_at?: string | null
}

export interface PrApprovalDecision {
  interaction_id: string
  decision: 'approved' | 'rejected'
  reason?: string
  merge_method?: 'merge' | 'squash' | 'rebase'
}

export interface TaskAttachment {
  id: number
  task_id: number
  filename: string
  original_filename: string
  file_size: number
  mime_type?: string
  is_image?: boolean
  uploaded_at?: string
  uploaded_by?: string
  file_size_human?: string
}
