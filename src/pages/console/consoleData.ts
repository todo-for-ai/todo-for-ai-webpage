/**
 * Console 工作台纯逻辑层：任务流分组/过滤、相对时间、状态元数据、
 * 会话按执行轮次（attempt）分代。均无副作用，便于单测。
 */
import type { TerminalLine } from '../components/TaskDetail/agentTerminalCore'

export interface ConsoleTaskLike {
  id: number
  title: string
  status: string
  project_id: number
  updated_at: string
  is_ai_task?: boolean
  parent_task_id?: number | null
  project?: { id: number; name: string; color?: string } | null
}

export interface ConsoleGroup {
  projectId: number
  projectName: string
  tasks: ConsoleTaskLike[]
}

/** 相对时间标签：刚刚 / n分钟前 / n小时前 / n天前 / 具体日期 */
export function relativeTime(iso: string | undefined, now = Date.now()): string {
  if (!iso) return ''
  const ts = Date.parse(iso)
  if (Number.isNaN(ts)) return ''
  const diff = now - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}天前`
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export const CONSOLE_STATUSES: Record<string, { label: string; color: string }> = {
  todo: { label: '待执行', color: '#8c8c8c' },
  in_progress: { label: '执行中', color: '#00b96b' },
  review: { label: '待审核', color: '#fa8c16' },
  done: { label: '已完成', color: '#52c41a' },
  blocked: { label: '受阻', color: '#ff7875' },
  cancelled: { label: '已取消', color: '#595959' },
}

export function consoleStatusMeta(status: string): { label: string; color: string } {
  return CONSOLE_STATUSES[status] || { label: status, color: '#8c8c8c' }
}

/** 过滤：标题包含关键词（忽略大小写）或 id 完全匹配 */
export function filterConsoleTasks<T extends ConsoleTaskLike>(tasks: T[], query: string): T[] {
  const q = (query || '').trim().toLowerCase()
  if (!q) return tasks
  return tasks.filter(t =>
    t.title.toLowerCase().includes(q) || String(t.id) === q.replace(/^#/, '')
  )
}

/**
 * 按项目分组，组间按组内最新 updated_at 降序，组内同理。
 */
export function groupConsoleTasks(tasks: ConsoleTaskLike[]): ConsoleGroup[] {
  const byProject = new Map<number, ConsoleGroup>()
  for (const task of tasks) {
    const pid = task.project_id
    let group = byProject.get(pid)
    if (!group) {
      group = {
        projectId: pid,
        projectName: task.project?.name || `项目 #${pid}`,
        tasks: [],
      }
      byProject.set(pid, group)
    }
    group.tasks.push(task)
  }
  const groups = Array.from(byProject.values())
  for (const group of groups) {
    group.tasks.sort((a, b) => Date.parse(b.updated_at || '') - Date.parse(a.updated_at || ''))
  }
  groups.sort((a, b) =>
    Date.parse(b.tasks[0]?.updated_at || '') - Date.parse(a.tasks[0]?.updated_at || '')
  )
  return groups
}

export interface AttemptSegment {
  key: string
  /** 轮次标题；null = 首个 started 之前的历史段 */
  label: string | null
  /** 该轮开始时间（epoch ms，取 started 行 ts），供分隔条渲染时刻 */
  startedTs?: number
  lines: TerminalLine[]
}

/**
 * 把合并时间线按「▶ 开始执行」切段，每段是一轮执行（Iteration N）。
 * started 之前的历史（更早的对话/事件）归入 label=null 的开头段。
 */
export function splitAttemptSegments(lines: TerminalLine[]): AttemptSegment[] {
  const segments: AttemptSegment[] = [{ key: 'history', label: null, lines: [] }]
  let attemptNo = 0
  for (const line of lines) {
    const isStart = line.kind === 'status' && line.text === '开始执行'
    if (isStart) {
      attemptNo += 1
      segments.push({
        key: `attempt-${line.key}`,
        label: `Iteration ${attemptNo}`,
        startedTs: line.ts || undefined,
        lines: [],
      })
    }
    segments[segments.length - 1].lines.push(line)
  }
  return segments.filter(seg => seg.label !== null || seg.lines.length > 0)
}

/** 任务流顶部摘要：总数与执行中数量 */
export function summarizeConsoleTasks(tasks: ConsoleTaskLike[]): { total: number; running: number } {
  return {
    total: tasks.length,
    running: (tasks || []).filter(t => t.status === 'in_progress').length,
  }
}

/** 任务对 Agent 是否可派发（非执行中/审核中的 AI 任务且绑定了 Agent） */
export function canDispatchTask(task: { status: string; is_ai_task?: boolean; assignees?: Array<{ type: string; id: number }> } | null): boolean {
  if (!task?.is_ai_task) return false
  if (task.status === 'in_progress' || task.status === 'review') return false
  return (task.assignees || []).some(a => a.type === 'agent' && a.id)
}

export function firstAgentId(task: { assignees?: Array<{ type: string; id: number }> } | null | undefined): number | null {
  const hit = (task?.assignees || []).find(a => a.type === 'agent' && a.id)
  return hit ? hit.id : null
}
