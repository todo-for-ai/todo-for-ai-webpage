import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Form, message } from 'antd'
import {
  agentsApi, type WorkflowItem, type WorkflowRunItem, type Agent,
  type WorkflowRunConsoleResult,
} from '../../api/agents'
import { useWorkflowAnalytics } from './useWorkflowAnalytics'
import { useWorkflowTriggers } from './useWorkflowTriggers'
import { useWorkflowVersions } from './useWorkflowVersions'
import { useWorkflowTemplates } from './useWorkflowTemplates'

/**
 * 工作流页数据层组合根：工作流/运行核心状态、加载与运行控制台/启动等处理器。
 * 分析扇出、触发器、版本、模板各域拆至同名域 hook，本文件负责组装并保持
 * 原 useWorkflowsData 的返回键集不变（消费方仅 Workflows.tsx）。
 */
export function useWorkflowsData() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [runs, setRuns] = useState<WorkflowRunItem[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [runsLoading, setRunsLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [runDetailOpen, setRunDetailOpen] = useState(false)
  const [selectedRun, setSelectedRun] = useState<WorkflowRunItem | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [autoOpenedRun, setAutoOpenedRun] = useState(false)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [consoleData, setConsoleData] = useState<WorkflowRunConsoleResult | null>(null)
  const [consoleLoading, setConsoleLoading] = useState(false)
  const [launchOpen, setLaunchOpen] = useState(false)
  const [launchWorkflowId, setLaunchWorkflowId] = useState<number | null>(null)
  const [launching, setLaunching] = useState(false)
  const [launchForm] = Form.useForm()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [wfResult, agentResult] = await Promise.all([
        agentsApi.getWorkflows({ per_page: 100 }),
        agentsApi.getAgents({ per_page: 100 }),
      ])
      setWorkflows(wfResult.items)
      setAgents(agentResult.items)
    } catch {
      message.error('加载工作流失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const analytics = useWorkflowAnalytics()
  const triggerDomain = useWorkflowTriggers()
  const versionDomain = useWorkflowVersions({ loadData })
  const templateDomain = useWorkflowTemplates({ loadData })

  const loadRuns = useCallback(async () => {
    setRunsLoading(true)
    try {
      const result = await agentsApi.getWorkflowRuns({ per_page: 50 })
      setRuns(result.items)
      analytics.fetchAnalytics()
    } catch {
      message.error('加载工作流运行记录失败')
    } finally {
      setRunsLoading(false)
    }
  }, [analytics.fetchAnalytics])

  useEffect(() => {
    loadData()
    loadRuns()
  }, [loadData, loadRuns])

  // 从 URL ?run_id= 自动打开运行控制台（指挥中心安全事件/冲突跳转入口）
  useEffect(() => {
    const runId = searchParams.get('run_id')
    if (!runId || autoOpenedRun) return
    if (runsLoading) return
    setAutoOpenedRun(true)
    openConsole(Number(runId))
    const next = new URLSearchParams(searchParams)
    next.delete('run_id')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, runsLoading, autoOpenedRun])

  // --- Delete workflow ---
  const handleDelete = async (id: number) => {
    try {
      await agentsApi.deleteWorkflow(id)
      message.success('已删除')
      loadData()
    } catch {
      message.error('删除失败')
    }
  }

  // --- Launch workflow ---
  const openLaunch = (workflowId: number) => {
    setLaunchWorkflowId(workflowId)
    setLaunchOpen(true)
    launchForm.resetFields()
  }

  const handleLaunch = async () => {
    if (!launchWorkflowId) return
    try {
      const values = await launchForm.validateFields()
      setLaunching(true)
      const result = await agentsApi.launchWorkflow(launchWorkflowId, {
        project_id: values.project_id,
        root_task_id: values.root_task_id,
      })
      message.success(`工作流运行 #${result.id} 已启动`)
      setLaunchOpen(false)
      loadRuns()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('启动失败: ' + (e?.message || '未知错误'))
    } finally {
      setLaunching(false)
    }
  }

  // --- View run detail ---
  const viewRun = async (runId: number) => {
    try {
      const result = await agentsApi.getWorkflowRun(runId)
      setSelectedRun(result)
      setRunDetailOpen(true)
    } catch {
      message.error('加载运行详情失败')
    }
  }

  // --- Real-time step console ---
  const openConsole = async (runId: number) => {
    setConsoleOpen(true)
    setConsoleLoading(true)
    try {
      const result = await agentsApi.getWorkflowRunConsole(runId, { log_limit: 8 })
      setConsoleData(result)
    } catch {
      message.error('加载控制台数据失败')
    } finally {
      setConsoleLoading(false)
    }
  }

  const refreshConsole = async () => {
    if (!selectedRun) return
    setConsoleLoading(true)
    try {
      const result = await agentsApi.getWorkflowRunConsole(selectedRun.id, { log_limit: 8 })
      setConsoleData(result)
    } catch {
      message.error('刷新控制台失败')
    } finally {
      setConsoleLoading(false)
    }
  }

  // --- Cancel run ---
  const handleCancelRun = async (runId: number) => {
    try {
      await agentsApi.cancelWorkflowRun(runId)
      message.success('已取消')
      loadRuns()
      if (selectedRun?.id === runId) {
        setSelectedRun(null)
        setRunDetailOpen(false)
      }
    } catch {
      message.error('取消失败')
    }
  }

  // --- Pause run ---
  const handlePauseRun = async (runId: number) => {
    try {
      const result = await agentsApi.pauseWorkflowRun(runId)
      message.success('已暂停')
      loadRuns()
      if (selectedRun?.id === runId) {
        setSelectedRun(result)
      }
    } catch {
      message.error('暂停失败')
    }
  }

  // --- Resume run ---
  const handleResumeRun = async (runId: number) => {
    try {
      const result = await agentsApi.resumeWorkflowRun(runId)
      message.success('已恢复')
      loadRuns()
      if (selectedRun?.id === runId) {
        setSelectedRun(result)
      }
    } catch {
      message.error('恢复失败')
    }
  }

  // --- Retry run ---
  const handleRetryRun = async (runId: number) => {
    try {
      const result = await agentsApi.retryWorkflowRun(runId)
      message.success('已重试')
      loadRuns()
      if (selectedRun?.id === runId) {
        setSelectedRun(result)
      }
    } catch {
      message.error('重试失败')
    }
  }

  return {
    workflows,
    setWorkflows,
    runs,
    setRuns,
    agents,
    setAgents,
    loading,
    setLoading,
    runsLoading,
    setRunsLoading,
    createOpen,
    setCreateOpen,
    runDetailOpen,
    setRunDetailOpen,
    selectedRun,
    setSelectedRun,
    searchParams,
    setSearchParams,
    autoOpenedRun,
    setAutoOpenedRun,
    consoleOpen,
    setConsoleOpen,
    consoleData,
    setConsoleData,
    consoleLoading,
    setConsoleLoading,
    launchOpen,
    setLaunchOpen,
    launchWorkflowId,
    setLaunchWorkflowId,
    launching,
    setLaunching,
    launchForm,
    loadData,
    loadRuns,
    handleDelete,
    openLaunch,
    handleLaunch,
    viewRun,
    openConsole,
    refreshConsole,
    handleCancelRun,
    handlePauseRun,
    handleResumeRun,
    handleRetryRun,
    ...triggerDomain,
    ...versionDomain,
    ...templateDomain,
    ...analytics,
  }
}
