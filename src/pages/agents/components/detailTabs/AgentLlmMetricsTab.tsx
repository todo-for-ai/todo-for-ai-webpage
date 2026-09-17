import { useCallback, useEffect, useState } from 'react'
import LlmMetricsPanel from '../../../../components/LlmMetricsPanel'
import { llmMetricsApi, type LlmMetricsSummary } from '../../../../api/llmMetrics'
import type { Agent } from '../../../../api/agents'

interface AgentLlmMetricsTabProps {
  workspaceId: number | null
  agent: Agent
  active?: boolean
}

/** Agent 详情「LLM 用量」Tab：该 Agent 的引擎调用指标 */
export function AgentLlmMetricsTab({ agent, active = false }: AgentLlmMetricsTabProps) {
  const [summary, setSummary] = useState<LlmMetricsSummary | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!agent?.id) return
    setLoading(true)
    try {
      setSummary(await llmMetricsApi.agent(agent.id, 168))
    } catch (e) {
      console.error('Failed to load agent LLM metrics', e)
    } finally {
      setLoading(false)
    }
  }, [agent?.id])

  useEffect(() => {
    if (active) load()
  }, [active, load])

  return <LlmMetricsPanel summary={summary} loading={loading} showByAgent={false} />
}

export default AgentLlmMetricsTab
