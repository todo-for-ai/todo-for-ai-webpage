import { useCallback, useEffect, useState } from 'react'
import { Card } from 'antd'
import LlmMetricsPanel from '../../components/LlmMetricsPanel'
import { llmMetricsApi, type LlmMetricsSummary } from '../../api/llmMetrics'
import { usePageTranslation } from '../../i18n/hooks/useTranslation'

/** 仪表板「LLM API 用量」区块：当前用户名下 Agent 的调用指标 */
export default function LlmUsageSection() {
  const { tp } = usePageTranslation('dashboard')
  const [summary, setSummary] = useState<LlmMetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setSummary(await llmMetricsApi.mine(168))
    } catch {
      // 指标区块失败不阻断仪表板其余部分
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card
      className="flat-card"
      title={tp('llmUsage.sectionTitle', { defaultValue: 'LLM API 用量' })}
      extra={tp('llmUsage.window', { defaultValue: '近 7 天' })}
      style={{ marginBottom: 16 }}
    >
      <LlmMetricsPanel summary={summary} loading={loading} />
    </Card>
  )
}
