import { useCallback, useEffect, useState } from 'react'
import { message } from 'antd'
import { agentsApi, type SandboxTemplateUsage, type SandboxViolationTrend, type SandboxViolationsByAgent, type SecurityByAgent, type SecurityDailyTrend } from '../../../api/agents'

/**
 * 沙箱监控 + 安全事件面板：事件列表/按天趋势/按 Agent 聚合、筛选参数、CSV/JSON 导出。
 * collabTimeline 历史上由 loadSandboxData 顺带刷新，以 setter 注入保持行为不变。
 * 从 useDashboardData 原样拆出。
 */
export function useSecurityPanel(deps: { setCollabTimeline: (t: unknown) => void }) {
  const { setCollabTimeline } = deps

  // Sandbox monitor state
  const [sandboxData, setSandboxData] = useState<any>(null)
  const [sandboxLoading, setSandboxLoading] = useState(false)
  const [sandboxViolationTrend, setSandboxViolationTrend] = useState<SandboxViolationTrend | null>(null)
  const [sandboxViolationsByAgent, setSandboxViolationsByAgent] = useState<SandboxViolationsByAgent | null>(null)
  const [sandboxTemplateUsage, setSandboxTemplateUsage] = useState<SandboxTemplateUsage | null>(null)
  const [securityEvents, setSecurityEvents] = useState<any[]>([])
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityTrend, setSecurityTrend] = useState<SecurityDailyTrend | null>(null)
  const [securityByAgent, setSecurityByAgent] = useState<SecurityByAgent | null>(null)
  const [securityFilter, setSecurityFilter] = useState<string>('')
  const [securitySeverity, setSecuritySeverity] = useState<string>('')
  const [securitySearch, setSecuritySearch] = useState<string>('')
  const [securitySince, setSecuritySince] = useState<string>('')
  const [securityUntil, setSecurityUntil] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  const loadSandboxData = useCallback(async () => {
    setSandboxLoading(true)
    try {
      const result = await agentsApi.getSandboxDashboard()
      setSandboxData(result)
      agentsApi.getSandboxViolationTrend(30).then(setSandboxViolationTrend).catch(() => {})
      agentsApi.getSandboxViolationsByAgent(30, 8).then(setSandboxViolationsByAgent).catch(() => {})
      agentsApi.getSandboxTemplateUsage().then(setSandboxTemplateUsage).catch(() => {})
      agentsApi.getCollaborationGraphTimeline(14, 'day', 30).then(setCollabTimeline).catch(() => {})
    } catch {
      // silent
    } finally {
      setSandboxLoading(false)
    }
  }, [setCollabTimeline])

  useEffect(() => {
    loadSandboxData()
  }, [loadSandboxData])

  const buildSecurityParams = useCallback((filter?: string) => ({
    per_page: 50,
    event_type: filter || undefined,
    severity: securitySeverity || undefined,
    search: securitySearch || undefined,
    since: securitySince || undefined,
    until: securityUntil || undefined,
  }), [securitySeverity, securitySearch, securitySince, securityUntil])

  const loadSecurityEvents = useCallback(async (filter?: string) => {
    setSecurityLoading(true)
    try {
      const params = buildSecurityParams(filter)
      const [result, trend, byAgent] = await Promise.all([
        agentsApi.getSecurityEvents(params),
        agentsApi.getSecurityEventsDailyTrend(params).catch(() => null),
        agentsApi.getSecurityEventsByAgent(params).catch(() => null),
      ])
      setSecurityEvents(result.items)
      setSecurityTrend(trend)
      setSecurityByAgent(byAgent)
    } catch {
      // silent
    } finally {
      setSecurityLoading(false)
    }
  }, [buildSecurityParams])

  useEffect(() => {
    loadSecurityEvents()
  }, [loadSecurityEvents])

  // 导出当前筛选条件下的安全事件为 CSV/JSON
  const exportSecurityEvents = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    setExporting(true)
    try {
      const params = buildSecurityParams(securityFilter || undefined)
      const text = await agentsApi.exportSecurityEvents({ ...params, format })
      const mime = format === 'json' ? 'application/json;charset=utf-8;' : 'text/csv;charset=utf-8;'
      const blob = new Blob([text], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security_events_${new Date().toISOString().slice(0, 10)}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success(`安全事件已导出为 ${format.toUpperCase()}`)
    } catch {
      message.error('导出安全事件失败')
    } finally {
      setExporting(false)
    }
  }, [buildSecurityParams, securityFilter])

  return {
    sandboxData,
    setSandboxData,
    sandboxLoading,
    setSandboxLoading,
    sandboxViolationTrend,
    setSandboxViolationTrend,
    sandboxViolationsByAgent,
    setSandboxViolationsByAgent,
    sandboxTemplateUsage,
    setSandboxTemplateUsage,
    securityEvents,
    setSecurityEvents,
    securityLoading,
    setSecurityLoading,
    securityTrend,
    setSecurityTrend,
    securityByAgent,
    setSecurityByAgent,
    securityFilter,
    setSecurityFilter,
    securitySeverity,
    setSecuritySeverity,
    securitySearch,
    setSecuritySearch,
    securitySince,
    setSecuritySince,
    securityUntil,
    setSecurityUntil,
    exporting,
    setExporting,
    loadSandboxData,
    buildSecurityParams,
    loadSecurityEvents,
    exportSecurityEvents,
  }
}
