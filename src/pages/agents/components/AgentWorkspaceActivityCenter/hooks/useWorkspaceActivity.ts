import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AgentActivityItem } from '../../../../../api/agents'
import { agentInsightsApi, agentsApi } from '../../../../../api/agents'
import { usePageTranslation } from '../../../../../i18n/hooks/useTranslation'
import {
  activityLevelValues,
  activitySourceValues,
  emptyPagination,
  normalizeDateTimeFilterValue,
} from '../../detailTabs/shared'
import type { AgentWorkspaceActivityCenterProps } from '../types'

export function useWorkspaceActivity({ workspaceId }: AgentWorkspaceActivityCenterProps) {
  const { tp } = usePageTranslation('agents')

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AgentActivityItem[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [agentOptions, setAgentOptions] = useState<Array<{ label: string; value: number }>>([])

  const [agentId, setAgentId] = useState<number | undefined>(undefined)
  const [source, setSource] = useState<string | undefined>(undefined)
  const [level, setLevel] = useState<string | undefined>(undefined)
  const [eventType, setEventType] = useState('')
  const [eventTypeInput, setEventTypeInput] = useState('')
  const [query, setQuery] = useState('')
  const [queryInput, setQueryInput] = useState('')
  const [taskId, setTaskId] = useState<number | undefined>(undefined)
  const [projectId, setProjectId] = useState<number | undefined>(undefined)
  const [runId, setRunId] = useState('')
  const [runIdInput, setRunIdInput] = useState('')
  const [attemptId, setAttemptId] = useState('')
  const [attemptIdInput, setAttemptIdInput] = useState('')
  const [riskMin, setRiskMin] = useState<number | undefined>(undefined)
  const [riskMax, setRiskMax] = useState<number | undefined>(undefined)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sourceSummary, setSourceSummary] = useState<Record<string, number>>({})
  const [levelSummary, setLevelSummary] = useState<Record<string, number>>({})
  const [detailItem, setDetailItem] = useState<AgentActivityItem | null>(null)

  const activitySourceOptions = useMemo(
    () =>
      activitySourceValues.map((value) => ({
        value,
        label: tp(`detail.activity.sources.${value}`, { defaultValue: value }),
      })),
    [tp]
  )

  const activityLevelOptions = useMemo(
    () =>
      activityLevelValues.map((value) => ({
        value,
        label: tp(`detail.activity.levels.${value}`, { defaultValue: value }),
      })),
    [tp]
  )

  const getActivitySourceLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return tp(`detail.activity.sources.${key}`, { defaultValue: key })
    },
    [tp]
  )

  const getActivityLevelLabel = useCallback(
    (value?: string | null) => {
      const key = String(value || '').trim().toLowerCase()
      if (!key) return '-'
      return tp(`detail.activity.levels.${key}`, { defaultValue: key })
    },
    [tp]
  )

  const loadAgentOptions = useCallback(async () => {
    if (!workspaceId) {
      setAgentOptions([])
      return
    }

    try {
      const data = await agentsApi.getAgents(workspaceId, { page: 1, per_page: 500 })
      const options = (data.items || []).map((item) => ({
        label: `${item.display_name || item.name} (#${item.id})`,
        value: item.id,
      }))
      setAgentOptions(options)
    } catch {
      setAgentOptions([])
    }
  }, [workspaceId])

  const loadActivities = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      setPagination(emptyPagination)
      setSourceSummary({})
      setLevelSummary({})
      return
    }

    try {
      setLoading(true)
      const data = await agentInsightsApi.getWorkspaceActivity(workspaceId, {
        page: pagination.page,
        per_page: pagination.per_page,
        agent_id: agentId,
        source,
        level,
        event_type: eventType || undefined,
        q: query || undefined,
        task_id: taskId,
        project_id: projectId,
        run_id: runId || undefined,
        attempt_id: attemptId || undefined,
        min_risk_score: riskMin,
        max_risk_score: riskMax,
        from: normalizeDateTimeFilterValue(from),
        to: normalizeDateTimeFilterValue(to),
      })
      setItems(data.items || [])
      setPagination(data.pagination || emptyPagination)
      setSourceSummary(data.summary?.sources || {})
      setLevelSummary(data.summary?.levels || {})
    } finally {
      setLoading(false)
    }
  }, [
    workspaceId,
    pagination.page,
    pagination.per_page,
    agentId,
    source,
    level,
    eventType,
    query,
    taskId,
    projectId,
    runId,
    attemptId,
    riskMin,
    riskMax,
    from,
    to,
  ])

  // Reset filters when workspace changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    setAgentId(undefined)
    setSource(undefined)
    setLevel(undefined)
    setEventType('')
    setEventTypeInput('')
    setQuery('')
    setQueryInput('')
    setTaskId(undefined)
    setProjectId(undefined)
    setRunId('')
    setRunIdInput('')
    setAttemptId('')
    setAttemptIdInput('')
    setRiskMin(undefined)
    setRiskMax(undefined)
    setFrom('')
    setTo('')
    setSourceSummary({})
    setLevelSummary({})
    setDetailItem(null)
  }, [workspaceId])

  useEffect(() => {
    void loadAgentOptions()
  }, [loadAgentOptions])

  useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  const resetPagination = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  return {
    // Loading and data
    loading,
    items,
    pagination,
    setPagination,
    agentOptions,
    sourceSummary,
    levelSummary,
    detailItem,
    setDetailItem,

    // Filters
    agentId,
    setAgentId,
    source,
    setSource,
    level,
    setLevel,
    eventType,
    setEventType,
    eventTypeInput,
    setEventTypeInput,
    query,
    setQuery,
    queryInput,
    setQueryInput,
    taskId,
    setTaskId,
    projectId,
    setProjectId,
    runId,
    setRunId,
    runIdInput,
    setRunIdInput,
    attemptId,
    setAttemptId,
    attemptIdInput,
    setAttemptIdInput,
    riskMin,
    setRiskMin,
    riskMax,
    setRiskMax,
    from,
    setFrom,
    to,
    setTo,

    // Options and labels
    activitySourceOptions,
    activityLevelOptions,
    getActivitySourceLabel,
    getActivityLevelLabel,

    // Actions
    resetPagination,
    tp,
  }
}
