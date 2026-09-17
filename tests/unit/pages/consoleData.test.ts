import { describe, expect, it } from 'vitest'
import {
  canDispatchTask,
  consoleStatusMeta,
  filterConsoleTasks,
  firstAgentId,
  groupConsoleTasks,
  relativeTime,
  splitAttemptSegments,
} from '../../../src/pages/console/consoleData'
import type { TerminalLine } from '../../../src/pages/components/TaskDetail/agentTerminalCore'

const task = (over: any) => ({
  id: 1, title: '任务', status: 'todo', project_id: 10,
  updated_at: '2026-09-18T10:00:00', is_ai_task: true,
  project: { id: 10, name: 'demo' },
  ...over,
})

describe('relativeTime', () => {
  const now = Date.parse('2026-09-18T12:00:00')
  it('renders granular labels', () => {
    expect(relativeTime('2026-09-18T11:59:30', now)).toBe('刚刚')
    expect(relativeTime('2026-09-18T11:40:00', now)).toBe('20分钟前')
    expect(relativeTime('2026-09-18T09:00:00', now)).toBe('3小时前')
    expect(relativeTime('2026-09-16T09:00:00', now)).toBe('2天前')
    expect(relativeTime('2026-08-30T09:00:00', now)).toBe('8/30')
  })
  it('tolerates missing/invalid input', () => {
    expect(relativeTime(undefined)).toBe('')
    expect(relativeTime('not-a-date')).toBe('')
  })
})

describe('filterConsoleTasks / groupConsoleTasks', () => {
  const tasks = [
    task({ id: 2, title: 'Fix Login Bug', project_id: 10, updated_at: '2026-09-18T11:00:00' }),
    task({ id: 1, title: '优化首页', project_id: 11, project: { id: 11, name: 'web' }, updated_at: '2026-09-18T12:00:00' }),
    task({ id: 3, title: '写文档', project_id: 10, updated_at: '2026-09-18T09:00:00' }),
  ]

  it('filters by title case-insensitively and by #id', () => {
    expect(filterConsoleTasks(tasks, 'login').map(t => t.id)).toEqual([2])
    expect(filterConsoleTasks(tasks, '#1').map(t => t.id)).toEqual([1])
    expect(filterConsoleTasks(tasks, '').length).toBe(3)
  })

  it('groups by project, newest group first, newest task first', () => {
    const groups = groupConsoleTasks(tasks)
    expect(groups.map(g => g.projectName)).toEqual(['web', 'demo'])
    expect(groups[1].tasks.map(t => t.id)).toEqual([2, 3])
    expect(groups[1].projectName).toBe('demo')
  })
})

describe('consoleStatusMeta', () => {
  it('maps known statuses and falls back', () => {
    expect(consoleStatusMeta('in_progress').label).toBe('执行中')
    expect(consoleStatusMeta('weird')).toEqual({ label: 'weird', color: '#8c8c8c' })
  })
})

describe('splitAttemptSegments', () => {
  it('splits timeline into history + iterations at started markers', () => {
    const mk = (key: string, kind: TerminalLine['kind'], text: string, ts: number): TerminalLine =>
      ({ key, kind, text, ts })
    const lines = [
      mk('c1', 'user', '先做这个', 1),
      mk('e1', 'status', '开始执行', 2),
      mk('e2', 'agent', 'working', 3),
      mk('e3', 'status', '执行完成', 4),
      mk('e4', 'status', '开始执行', 5),
      mk('e5', 'error', 'boom', 6),
    ]
    const segs = splitAttemptSegments(lines)
    expect(segs.map(s => s.label)).toEqual([null, 'Iteration 1', 'Iteration 2'])
    expect(segs[0].lines.map(l => l.key)).toEqual(['c1'])
    expect(segs[1].lines.map(l => l.key)).toEqual(['e1', 'e2', 'e3'])
    expect(segs[2].lines.map(l => l.key)).toEqual(['e4', 'e5'])
  })

  it('returns empty history segment untouched when no attempts', () => {
    const segs = splitAttemptSegments([{ key: 'c1', kind: 'user', text: 'hi', ts: 1 }])
    expect(segs.length).toBe(1)
    expect(segs[0].label).toBeNull()
    expect(segs[0].lines.length).toBe(1)
  })
})

describe('dispatch eligibility', () => {
  it('requires ai task, non-running status and an agent assignee', () => {
    expect(canDispatchTask(task({ status: 'todo', assignees: [{ type: 'agent', id: 5 }] }))).toBe(true)
    expect(canDispatchTask(task({ status: 'in_progress', assignees: [{ type: 'agent', id: 5 }] }))).toBe(false)
    expect(canDispatchTask(task({ status: 'review', assignees: [{ type: 'agent', id: 5 }] }))).toBe(false)
    expect(canDispatchTask(task({ is_ai_task: false, assignees: [{ type: 'agent', id: 5 }] }))).toBe(false)
    expect(canDispatchTask(task({ assignees: [{ type: 'human', id: 5 }] }))).toBe(false)
    expect(firstAgentId({ assignees: [{ type: 'human', id: 1 }, { type: 'agent', id: 7 }] })).toBe(7)
    expect(firstAgentId({ assignees: [] })).toBeNull()
  })
})
