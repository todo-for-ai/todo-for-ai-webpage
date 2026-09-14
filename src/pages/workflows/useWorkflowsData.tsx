import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Button, Card, Col, Row, Modal, Form, Input, InputNumber, Select, Space, Tag, Steps, Spin,
  message, Popconfirm, Descriptions, Empty, Tooltip, Badge, Table, List, Typography,
  Drawer, Progress, Timeline, Alert,
} from 'antd'
const { Text } = Typography
import {
  PlusOutlined, DeleteOutlined, PlayCircleOutlined, StopOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  ApartmentOutlined, ReloadOutlined, PauseCircleOutlined,
  HistoryOutlined, MonitorOutlined, SafetyOutlined, WarningOutlined,
  SettingOutlined, LineChartOutlined, PieChartOutlined, RetweetOutlined, DotChartOutlined,
  HeatMapOutlined, BarChartOutlined,
} from '@ant-design/icons'
import {
  agentsApi, type WorkflowItem, type WorkflowRunItem, type CreateWorkflowStepData, type Agent,
  type WorkflowRunConsoleResult, type WorkflowStepStats, type WorkflowRunTrend,
  type WorkflowFailureCorrelation, type WorkflowFailureCorrelationByStep,
  type WorkflowFailedStepsByDuration, type WorkflowStepDurationHistogram,
  type WorkflowRunDurationPercentiles, type WorkflowStepFailureRate,
  type WorkflowStepCofailureMatrix, type WorkflowSuccessRateByWorkflow,
  type WorkflowStepRetryTopology, type WorkflowStepHourlyDistribution,
  type WorkflowStepDependencyBottleneck, type WorkflowSimilarityMatrix,
  type WorkflowStepBottleneckTimeline, type WorkflowStructuralComplexity,
} from '../../api/agents'
import WorkflowDagViewer, { type DagStepData } from '../../components/Workflow/WorkflowDagViewer'
import SortableStepCard from '../../components/Workflow/SortableStepCard'
import WorkflowRunTrendChart from '../../components/WorkflowRunTrendChart'
import { useCollaborationSSE } from '../../hooks/useCollaborationSSE'

// Extracted components
import WorkflowFormModal from './WorkflowFormModal'
import WorkflowRunConsole from './WorkflowRunConsole'
import WorkflowDefinitionsCard from './WorkflowDefinitionsCard'
import TriggerCreationModal from './TriggerCreationModal'
import LaunchWorkflowModal from './LaunchWorkflowModal'
import WorkflowRunsTriggers from './WorkflowRunsTriggers'
import WorkflowAnalyticsCards from './WorkflowAnalyticsCards'
import ScheduledTriggersCard from './ScheduledTriggersCard'
import WorkflowRunsCard from './WorkflowRunsCard'
import WorkflowTemplatesCard from './WorkflowTemplatesCard'

const { Option } = Select
const { TextArea } = Input

// Step status icon/color mapping
const STEP_STATUS_MAP: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: 'default', icon: <ClockCircleOutlined /> },
  waiting: { color: 'warning', icon: <ClockCircleOutlined /> },
  running: { color: 'processing', icon: <ReloadOutlined spin /> },
  succeeded: { color: 'success', icon: <CheckCircleOutlined /> },
  failed: { color: 'error', icon: <CloseCircleOutlined /> },
  skipped: { color: 'default', icon: <StopOutlined /> },
  cancelled: { color: 'default', icon: <StopOutlined /> },
}

const WORKFLOW_STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  paused: 'warning',
  succeeded: 'success',
  failed: 'error',
  cancelled: 'default',
}


/**
 * 工作流页数据层：工作流/运行/触发器/版本/模板状态与全部处理器、 Effects。
 * 由 Workflows 页面原样拆出。
 */
export function useWorkflowsData() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [runs, setRuns] = useState<WorkflowRunItem[]>([])
  const [stepStats, setStepStats] = useState<WorkflowStepStats | null>(null)
  const [stepDurationHistogram, setStepDurationHistogram] = useState<WorkflowStepDurationHistogram | null>(null)
  const [runDurationPercentiles, setRunDurationPercentiles] = useState<WorkflowRunDurationPercentiles | null>(null)
  const [stepFailureRate, setStepFailureRate] = useState<WorkflowStepFailureRate | null>(null)
  const [stepCofailureMatrix, setStepCofailureMatrix] = useState<WorkflowStepCofailureMatrix | null>(null)
  const [successRateByWorkflow, setSuccessRateByWorkflow] = useState<WorkflowSuccessRateByWorkflow | null>(null)
  const [stepRetryTopology, setStepRetryTopology] = useState<WorkflowStepRetryTopology | null>(null)
  const [stepHourlyDistribution, setStepHourlyDistribution] = useState<WorkflowStepHourlyDistribution | null>(null)
  const [stepDependencyBottleneck, setStepDependencyBottleneck] = useState<WorkflowStepDependencyBottleneck | null>(null)
  const [similarityMatrix, setSimilarityMatrix] = useState<WorkflowSimilarityMatrix | null>(null)
  const [stepDurationHist, setStepDurationHist] = useState<WorkflowStepDurationHistogram | null>(null)
  const [stepBottleneckTl, setStepBottleneckTl] = useState<WorkflowStepBottleneckTimeline | null>(null)
  const [structuralComplexity, setStructuralComplexity] = useState<WorkflowStructuralComplexity | null>(null)
  const [runTrend, setRunTrend] = useState<WorkflowRunTrend | null>(null)
  const [failureCorrelation, setFailureCorrelation] = useState<WorkflowFailureCorrelation | null>(null)
  const [failureCorrelationByStep, setFailureCorrelationByStep] = useState<WorkflowFailureCorrelationByStep | null>(null)
  const [failedStepsByDuration, setFailedStepsByDuration] = useState<WorkflowFailedStepsByDuration | null>(null)
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

  // Trigger state
  const [triggers, setTriggers] = useState<any[]>([])
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [triggerModalOpen, setTriggerModalOpen] = useState(false)
  const [triggerForm] = Form.useForm()
  const [triggerTargetWfId, setTriggerTargetWfId] = useState<number | null>(null)

  // Template state
  const [templates, setTemplates] = useState<any[]>([])
  const [templateLoading, setTemplateLoading] = useState(false)

  // Version management state
  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [versionWfId, setVersionWfId] = useState<number | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [currentVersion, setCurrentVersion] = useState<number>(1)
  const [versionLoading, setVersionLoading] = useState(false)
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffData, setDiffData] = useState<any>(null)
  const [diffV1, setDiffV1] = useState<number>(0)
  const [diffV2, setDiffV2] = useState<number>(0)

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

  const loadRuns = useCallback(async () => {
    setRunsLoading(true)
    try {
      const result = await agentsApi.getWorkflowRuns({ per_page: 50 })
      setRuns(result.items)
      agentsApi.getWorkflowStepStats(30).then(setStepStats).catch(() => {})
      agentsApi.getWorkflowStepDurationHistogram(10).then(setStepDurationHistogram).catch(() => {})
      agentsApi.getWorkflowRunDurationPercentiles(30).then(setRunDurationPercentiles).catch(() => {})
      agentsApi.getWorkflowStepFailureRate(30, 15).then(setStepFailureRate).catch(() => {})
      agentsApi.getWorkflowStepCofailureMatrix(30, 8).then(setStepCofailureMatrix).catch(() => {})
      agentsApi.getWorkflowSuccessRateByWorkflow(30, 10).then(setSuccessRateByWorkflow).catch(() => {})
      agentsApi.getWorkflowStepRetryTopology(30, 15).then(setStepRetryTopology).catch(() => {})
      agentsApi.getWorkflowStepHourlyDistribution(30, 10).then(setStepHourlyDistribution).catch(() => {})
      agentsApi.getWorkflowStepDependencyBottleneck(30, 10).then(setStepDependencyBottleneck).catch(() => {})
      agentsApi.getWorkflowSimilarityMatrix(30, 5, 20).then(setSimilarityMatrix).catch(() => {})
      agentsApi.getWorkflowStepDurationHistogram(10).then(setStepDurationHist).catch(() => {})
      agentsApi.getWorkflowStepBottleneckTimeline(30, 8).then(setStepBottleneckTl).catch(() => {})
      agentsApi.getWorkflowStructuralComplexity(20).then(setStructuralComplexity).catch(() => {})
      agentsApi.getWorkflowRunTrend(30).then(setRunTrend).catch(() => {})
      agentsApi.getWorkflowFailureCorrelation(30, 2).then(setFailureCorrelation).catch(() => {})
      agentsApi.getWorkflowFailureCorrelationByStep(30, 2).then(setFailureCorrelationByStep).catch(() => {})
      agentsApi.getWorkflowFailedStepsByDuration(30, 20).then(setFailedStepsByDuration).catch(() => {})
    } catch {
      message.error('加载工作流运行记录失败')
    } finally {
      setRunsLoading(false)
    }
  }, [])

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

  // --- Trigger helpers ---
  const loadTriggers = useCallback(async () => {
    setTriggerLoading(true)
    try {
      const result = await agentsApi.getWorkflowTriggers({ per_page: 100 })
      setTriggers(result.items)
    } catch {
      message.error('加载触发器失败')
    } finally {
      setTriggerLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTriggers()
  }, [loadTriggers])

  const openTriggerModal = (workflowId: number) => {
    setTriggerTargetWfId(workflowId)
    setTriggerModalOpen(true)
    triggerForm.resetFields()
  }

  const handleCreateTrigger = async () => {
    if (!triggerTargetWfId) return
    try {
      const values = await triggerForm.validateFields()
      await agentsApi.createWorkflowTrigger({
        workflow_id: triggerTargetWfId,
        name: values.name,
        cron_expr: values.cron_expr || undefined,
        one_shot_at: values.one_shot_at || undefined,
        is_active: values.is_active !== false,
        project_id: values.project_id || undefined,
      })
      message.success('触发器创建成功')
      setTriggerModalOpen(false)
      loadTriggers()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('创建触发器失败: ' + (e?.message || ''))
    }
  }

  const handleToggleTrigger = async (trigger: any) => {
    try {
      await agentsApi.updateWorkflowTrigger(trigger.id, { is_active: !trigger.is_active })
      message.success(trigger.is_active ? '已停用' : '已启用')
      loadTriggers()
    } catch {
      message.error('操作失败')
    }
  }

  const handleDeleteTrigger = async (id: number) => {
    try {
      await agentsApi.deleteWorkflowTrigger(id)
      message.success('已删除')
      loadTriggers()
    } catch {
      message.error('删除失败')
    }
  }

  // --- Version management ---
  const openVersionModal = async (wfId: number) => {
    setVersionWfId(wfId)
    setVersionModalOpen(true)
    setVersionLoading(true)
    try {
      const data = await agentsApi.listWorkflowVersions(wfId)
      setVersions(data?.versions || [])
      setCurrentVersion(data?.current_version || 1)
    } catch { message.error('加载版本历史失败') }
    finally { setVersionLoading(false) }
  }

  const handleRollback = async (targetVersion: number) => {
    if (!versionWfId) return
    try {
      await agentsApi.rollbackWorkflow(versionWfId, targetVersion)
      message.success(`已回滚到版本 ${targetVersion}`)
      openVersionModal(versionWfId)
      loadData()
    } catch { message.error('回滚失败') }
  }

  const handleDiffVersions = async (v1: number, v2: number) => {
    if (!versionWfId) return
    try {
      const data = await agentsApi.diffWorkflowVersions(versionWfId, v1, v2)
      setDiffData(data)
      setDiffV1(v1)
      setDiffV2(v2)
      setDiffModalOpen(true)
    } catch { message.error('比较失败') }
  }

  // --- Template helpers ---
  const loadTemplates = useCallback(async () => {
    setTemplateLoading(true)
    try {
      const result = await agentsApi.getWorkflowTemplates()
      setTemplates(result)
    } catch {
      // silent
    } finally {
      setTemplateLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const instantiateTemplate = async (key: string, name: string) => {
    try {
      await agentsApi.instantiateWorkflowTemplate(key, { name })
      message.success(`工作流「${name}」已从模板创建`)
      loadData()
    } catch {
      message.error('从模板创建失败')
    }
  }

  return {
    workflows,
    setWorkflows,
    runs,
    setRuns,
    stepStats,
    setStepStats,
    stepDurationHistogram,
    setStepDurationHistogram,
    runDurationPercentiles,
    setRunDurationPercentiles,
    stepFailureRate,
    setStepFailureRate,
    stepCofailureMatrix,
    setStepCofailureMatrix,
    successRateByWorkflow,
    setSuccessRateByWorkflow,
    stepRetryTopology,
    setStepRetryTopology,
    stepHourlyDistribution,
    setStepHourlyDistribution,
    stepDependencyBottleneck,
    setStepDependencyBottleneck,
    similarityMatrix,
    setSimilarityMatrix,
    stepDurationHist,
    setStepDurationHist,
    stepBottleneckTl,
    setStepBottleneckTl,
    structuralComplexity,
    setStructuralComplexity,
    runTrend,
    setRunTrend,
    failureCorrelation,
    setFailureCorrelation,
    failureCorrelationByStep,
    setFailureCorrelationByStep,
    failedStepsByDuration,
    setFailedStepsByDuration,
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
    triggers,
    setTriggers,
    triggerLoading,
    setTriggerLoading,
    triggerModalOpen,
    setTriggerModalOpen,
    triggerForm,
    triggerTargetWfId,
    setTriggerTargetWfId,
    templates,
    setTemplates,
    templateLoading,
    setTemplateLoading,
    versionModalOpen,
    setVersionModalOpen,
    versionWfId,
    setVersionWfId,
    versions,
    setVersions,
    currentVersion,
    setCurrentVersion,
    versionLoading,
    setVersionLoading,
    diffModalOpen,
    setDiffModalOpen,
    diffData,
    setDiffData,
    diffV1,
    setDiffV1,
    diffV2,
    setDiffV2,
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
    loadTriggers,
    openTriggerModal,
    handleCreateTrigger,
    handleToggleTrigger,
    handleDeleteTrigger,
    openVersionModal,
    handleRollback,
    handleDiffVersions,
    loadTemplates,
    instantiateTemplate
  }
}
