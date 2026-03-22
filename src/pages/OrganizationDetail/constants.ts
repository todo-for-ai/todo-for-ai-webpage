/**
 * Organization Detail 常量定义
 */

export const ORG_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  invited: 'blue',
  removed: 'default',
}

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: 'green',
  archived: 'orange',
  deleted: 'default',
}

export const EVENT_LABEL_KEY_MAP: Record<string, string> = {
  'task.created': 'taskCreated',
  'task.updated': 'taskUpdated',
  'task.status_changed': 'taskStatusChanged',
  'task.deleted': 'taskDeleted',
  'task.log.appended': 'taskLogAppended',
  'project.created': 'projectCreated',
  'project.updated': 'projectUpdated',
  'project.archived': 'projectArchived',
  'project.restored': 'projectRestored',
  'project.deleted': 'projectDeleted',
  'member.invited': 'memberInvited',
  'member.updated': 'memberUpdated',
  'member.removed': 'memberRemoved',
  'agent.created': 'agentCreated',
  'agent.invited': 'agentInvited',
  'agent.removed': 'agentRemoved',
  'agent.accepted': 'agentAccepted',
  'agent.rejected': 'agentRejected',
  'org.created': 'orgCreated',
  'org.updated': 'orgUpdated',
  'org.archived': 'orgArchived',
}
