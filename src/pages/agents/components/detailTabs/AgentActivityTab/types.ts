import type { AgentActivityItem } from '../../../../../api/agents'

export interface AgentActivityTabProps {
  workspaceId: number | null
  agentId: number
  active: boolean
}

export interface ActivityFilters {
  source: string | undefined
  level: string | undefined
  eventType: string
  eventTypeInput: string
  query: string
  queryInput: string
  taskId: number | undefined
  projectId: number | undefined
  runId: string
  runIdInput: string
  attemptId: string
  attemptIdInput: string
  riskMin: number | undefined
  riskMax: number | undefined
  from: string
  to: string
}

export interface ActivitySummary {
  sourceSummary: Record<string, number>
  levelSummary: Record<string, number>
}

export interface ActivityState extends ActivityFilters, ActivitySummary {
  loading: boolean
  items: AgentActivityItem[]
  pagination: {
    page: number
    per_page: number
    total: number
  }
  detailItem: AgentActivityItem | null
}
