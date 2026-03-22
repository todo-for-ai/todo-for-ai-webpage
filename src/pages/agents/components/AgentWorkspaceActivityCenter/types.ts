import type { AgentActivityItem } from '../../../../api/agents'

export interface AgentWorkspaceActivityCenterProps {
  workspaceId: number | null
}

export interface WorkspaceActivityState {
  loading: boolean
  items: AgentActivityItem[]
  pagination: {
    page: number
    per_page: number
    total: number
  }
  agentOptions: Array<{ label: string; value: number }>
  agentId: number | undefined
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
  sourceSummary: Record<string, number>
  levelSummary: Record<string, number>
  detailItem: AgentActivityItem | null
}
