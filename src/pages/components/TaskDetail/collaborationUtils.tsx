/**
 * 协作时间线常量和工具函数
 *
 * 提取自 TaskCollaborationTimeline 组件。
 */
import { ApiOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import type { TaskAssignmentState, TaskEvent } from '../../../api/agents'

export const eventColor: Record<string, string> = {
  task_claimed: 'blue',
  task_dispatched: 'geekblue',
  subtask_created: 'cyan',
  assignment_updated: 'green',
  assignment_expired: 'red',
  message: 'gray',
  note: 'gray',
  question: 'gold',
  answer: 'cyan',
  handoff: 'purple',
  blocker: 'red',
  decision: 'green',
  info: 'blue',
}

export const lineageColor: Record<string, string> = {
  claim: 'blue',
  manual_dispatch: 'purple',
  dispatch: 'geekblue',
  handoff: 'purple',
}

export const stateColor: Record<TaskAssignmentState, string> = {
  assigned: 'blue',
  claimed: 'cyan',
  running: 'processing',
  waiting_human: 'gold',
  review: 'purple',
  done: 'green',
  failed: 'red',
  cancelled: 'default',
  expired: 'default',
}

export const actorIcon = (event: TaskEvent) => {
  if (event.actor_type === 'agent') {
    return <RobotOutlined />
  }
  if (event.actor_type === 'human') {
    return <UserOutlined />
  }
  return <ApiOutlined />
}

export const toDisplayValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

export const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

export const toStringList = (value: unknown) => (
  Array.isArray(value)
    ? value.filter(item => item !== undefined && item !== null && item !== '').map(item => String(item))
    : []
)
