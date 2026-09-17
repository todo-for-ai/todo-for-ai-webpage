import { useCallback, useEffect, useState } from 'react'
import LlmMetricsPanel from '../../../components/LlmMetricsPanel'
import { llmMetricsApi, type LlmMetricsSummary } from '../../../api/llmMetrics'
import { usePageTranslation } from '../../../i18n/hooks/useTranslation'

interface OrgLlmMetricsTabProps {
  organizationId: number
  canManage?: boolean
}

/** 组织详情「模型用量」Tab：组织内全部 Agent 的 LLM 调用指标 */
export function OrgLlmMetricsTab({ organizationId }: OrgLlmMetricsTabProps) {
  const { tp } = usePageTranslation('organizations')
  const [summary, setSummary] = useState<LlmMetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    try {
      setSummary(await llmMetricsApi.workspace(organizationId, 168))
    } catch (e) {
      console.error('Failed to load workspace LLM metrics', e)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <div style={{ marginBottom: 12, color: '#8c8c8c' }}>
        {tp('detail.llmMetrics.window', { defaultValue: '统计窗口：近 7 天' })}
      </div>
      <LlmMetricsPanel summary={summary} loading={loading} />
    </div>
  )
}

export default OrgLlmMetricsTab
