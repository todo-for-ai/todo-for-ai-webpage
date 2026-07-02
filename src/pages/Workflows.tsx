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
  SettingOutlined,
} from '@ant-design/icons'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { agentsApi, type WorkflowItem, type WorkflowRunItem, type CreateWorkflowStepData, type Agent, type WorkflowRunConsoleResult, type WorkflowRunConsoleStep, type WorkflowStepStats, type WorkflowRunTrend } from '../api/agents'
import WorkflowDagViewer, { type DagStepData } from '../components/Workflow/WorkflowDagViewer'
import SortableStepCard from '../components/Workflow/SortableStepCard'
import WorkflowRunTrendChart from '../components/WorkflowRunTrendChart'
import { useCollaborationSSE } from '../hooks/useCollaborationSSE'

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

const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([])
  const [runs, setRuns] = useState<WorkflowRunItem[]>([])
  const [stepStats, setStepStats] = useState<WorkflowStepStats | null>(null)
  const [runTrend, setRunTrend] = useState<WorkflowRunTrend | null>(null)
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
  // Step runtime override (intervention from console)
  const [stepOverrideOpen, setStepOverrideOpen] = useState(false)
  const [stepOverrideTarget, setStepOverrideTarget] = useState<{ runId: number; stepKey: string } | null>(null)
  const [stepOverrideEffective, setStepOverrideEffective] = useState<Record<string, any> | null>(null)
  const [stepOverrideSubmitting, setStepOverrideSubmitting] = useState(false)
  const [launchOpen, setLaunchOpen] = useState(false)
  const [launchWorkflowId, setLaunchWorkflowId] = useState<number | null>(null)
  const [launching, setLaunching] = useState(false)
  const [form] = Form.useForm()
  const [launchForm] = Form.useForm()
  const [stepOverrideForm] = Form.useForm()

  // Step editor state
  const [steps, setSteps] = useState<CreateWorkflowStepData[]>([])
  const [selectedStepKey, setSelectedStepKey] = useState<string | null>(null)

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
      agentsApi.getWorkflowRunTrend(30).then(setRunTrend).catch(() => {})
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
    // 等 runs 首次加载完成后再触发，避免与初始加载竞态
    if (runsLoading) return
    setAutoOpenedRun(true)
    openConsole(Number(runId))
    const next = new URLSearchParams(searchParams)
    next.delete('run_id')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, runsLoading, autoOpenedRun])

  // --- Create workflow ---
  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      if (steps.length === 0) {
        message.warning('至少需要一个步骤')
        return
      }
      await agentsApi.createWorkflow({
        name: values.name,
        description: values.description || '',
        max_parallel_steps: values.max_parallel_steps || 0,
        steps,
      })
      message.success('工作流创建成功')
      setCreateOpen(false)
      form.resetFields()
      setSteps([])
      loadData()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('创建失败: ' + (e?.message || '未知错误'))
    }
  }

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

  // --- Console intervention: runtime override on a step ---
  const openStepOverride = async (runId: number, stepKey: string) => {
    setStepOverrideTarget({ runId, stepKey })
    setStepOverrideOpen(true)
    setStepOverrideEffective(null)
    try {
      const result = await agentsApi.getStepEffectiveParams(runId, stepKey)
      setStepOverrideEffective(result?.effective_params || {})
    } catch {
      // effective params are informational; ignore load failure
    }
  }

  const submitStepOverride = async (values: any) => {
    if (!stepOverrideTarget) return
    setStepOverrideSubmitting(true)
    try {
      // Build overrides only from non-empty fields
      const overrides: Record<string, any> = {}
      const raw = values || {}
      for (const k of ['agent_id', 'required_capabilities', 'timeout_seconds', 'retry_count', 'on_failure', 'condition', 'task_template_id', 'sub_workflow_id']) {
        if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') {
          overrides[k] = raw[k]
        }
      }
      if (Object.keys(overrides).length === 0) {
        message.warning('请至少填写一项覆盖参数')
        setStepOverrideSubmitting(false)
        return
      }
      await agentsApi.setStepRuntimeOverride(stepOverrideTarget.runId, stepOverrideTarget.stepKey, overrides)
      message.success('步骤覆盖已应用')
      setStepOverrideOpen(false)
      setStepOverrideTarget(null)
      // Refresh console so the override tag appears
      if (selectedRun) {
        agentsApi.getWorkflowRunConsole(selectedRun.id, { log_limit: 8 }).then(setConsoleData).catch(() => {})
      }
    } catch {
      message.error('应用覆盖失败')
    } finally {
      setStepOverrideSubmitting(false)
    }
  }

  const clearStepOverride = async (runId: number, stepKey: string) => {
    try {
      await agentsApi.clearStepRuntimeOverride(runId, stepKey)
      message.success('已清除步骤覆盖')
      if (selectedRun) {
        agentsApi.getWorkflowRunConsole(selectedRun.id, { log_limit: 8 }).then(setConsoleData).catch(() => {})
      }
    } catch {
      message.error('清除覆盖失败')
    }
  }

  // --- Console intervention: run-level control (delegates to existing handlers, then refreshes console) ---
  const consoleRunControl = async (action: 'pause' | 'resume' | 'retry' | 'cancel') => {
    if (!selectedRun) return
    if (action === 'pause') await handlePauseRun(selectedRun.id)
    else if (action === 'resume') await handleResumeRun(selectedRun.id)
    else if (action === 'retry') await handleRetryRun(selectedRun.id)
    else if (action === 'cancel') await handleCancelRun(selectedRun.id)
    // Refresh console to reflect new state (handlers already reload runs)
    agentsApi.getWorkflowRunConsole(selectedRun.id, { log_limit: 8 }).then(setConsoleData).catch(() => {})
  }

  // SSE-driven live refresh: when the console is open, any run-relevant event
  // for the currently selected run triggers an automatic refresh.
  const RUN_RELEVANT_EVENTS = new Set([
    'workflow_step_started', 'workflow_step_finished', 'workflow_step_auto_retry',
    'workflow_step_overridden', 'sandbox_execution_started', 'sandbox_execution_completed',
    'sandbox_execution_revoked', 'sandbox_step_violation', 'sandbox_violation',
    'conflicts_detected', 'conflict_resolved', 'conflicts_auto_resolved',
  ])
  useCollaborationSSE({
    enabled: consoleOpen,
    onEvent: useCallback((event: any) => {
      if (!selectedRun) return
      const et = event.event_type || ''
      if (!RUN_RELEVANT_EVENTS.has(et)) return
      const payload = event.payload || {}
      // Only refresh if the event is scoped to the run we're viewing (when known)
      if (payload.run_id != null && payload.run_id !== selectedRun.id) return
      // Best-effort refresh; don't surface loading spinner on SSE-driven refreshes
      agentsApi.getWorkflowRunConsole(selectedRun.id, { log_limit: 8 })
        .then(setConsoleData)
        .catch(() => { /* silent: SSE refresh is best-effort */ })
    }, [selectedRun]),
  })

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

  // --- Step editor helpers ---
  const addStep = () => {
    setSteps([...steps, {
      step_key: `step_${steps.length + 1}`,
      name: `步骤 ${steps.length + 1}`,
      order: steps.length,
      depends_on: [],
      required_capabilities: [],
      condition: null,
      on_failure: 'abort',
      timeout_seconds: 0,
      retry_count: 0,
    }])
  }

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  // Available step keys for depends_on
  const stepKeys = steps.map(s => s.step_key)

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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>
          <ApartmentOutlined style={{ marginRight: 8 }} />
          工作流编排
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreateOpen(true); setSteps([]); form.resetFields() }}>
          创建工作流
        </Button>
      </div>

      {/* Template marketplace */}
      {templates.length > 0 && (
        <Card title="工作流模板" style={{ marginBottom: 24 }} size="small" extra={<Spin spinning={templateLoading} size="small" />}>
          <Row gutter={[12, 12]}>
            {templates.map(tpl => (
              <Col key={tpl.key} xs={24} sm={12} md={8} lg={6}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => instantiateTemplate(tpl.key, tpl.name)}
                  style={{ height: '100%' }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{tpl.name}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 11, marginBottom: 4 }}>
                    {tpl.description.length > 60 ? tpl.description.slice(0, 60) + '…' : tpl.description}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tag color="blue" style={{ fontSize: 10 }}>{tpl.category}</Tag>
                    <Tag style={{ fontSize: 10 }}>{tpl.step_count} 步骤</Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Workflow definitions */}
      <Card title="工作流定义" style={{ marginBottom: 24 }} extra={<Button size="small" onClick={loadData}>刷新</Button>}>
        <Spin spinning={loading}>
          {workflows.length === 0 ? (
            <Empty description="暂无工作流，点击「创建工作流」开始" />
          ) : (
            <Row gutter={[16, 16]}>
              {workflows.map(wf => (
                <Col key={wf.id} xs={24} sm={12} lg={8}>
                  <Card
                    size="small"
                    title={
                      <Space>
                        <ApartmentOutlined />
                        {wf.name}
                        <Tag color={wf.is_active ? 'green' : 'default'}>{wf.is_active ? '活跃' : '停用'}</Tag>
                        {wf.max_parallel_steps > 0 && <Tag color="purple">最多 {wf.max_parallel_steps} 并行</Tag>}
                        {wf.version > 1 && <Tag color="blue">v{wf.version}</Tag>}
                      </Space>
                    }
                    extra={
                      <Space>
                        <Tooltip title="启动运行">
                          <Button
                            size="small"
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            disabled={!wf.is_active}
                            onClick={() => openLaunch(wf.id)}
                          />
                        </Tooltip>
                        <Tooltip title="添加定时触发器">
                          <Button
                            size="small"
                            icon={<ClockCircleOutlined />}
                            onClick={() => openTriggerModal(wf.id)}
                          />
                        </Tooltip>
                        <Tooltip title="版本历史">
                          <Button
                            size="small"
                            icon={<HistoryOutlined />}
                            onClick={() => openVersionModal(wf.id)}
                          />
                        </Tooltip>
                        <Popconfirm title="确定删除此工作流？" onConfirm={() => handleDelete(wf.id)}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    }
                  >
                    {wf.description && (
                      <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
                        {wf.description.length > 80 ? wf.description.substring(0, 80) + '...' : wf.description}
                      </div>
                    )}
                    <WorkflowDagViewer
                      steps={wf.steps.map(s => ({
                        step_key: s.step_key,
                        name: s.name,
                        depends_on: s.depends_on || [],
                        agent_id: s.agent_id,
                        required_capabilities: s.required_capabilities,
                      }))}
                      width={280}
                      height={160}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Card>

      {/* Step execution stats */}
      {stepStats && stepStats.items.length > 0 && (
        <Card title="步骤执行统计" size="small" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {stepStats.items.slice(0, 10).map((s) => {
              const rate = Math.round((s.success_rate || 0) * 100)
              const rateColor = rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f'
              const dur = s.avg_duration_seconds != null ? `${s.avg_duration_seconds}s` : '-'
              return (
                <div key={s.step_key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#595959' }} title={s.step_key}>{s.step_key}</span>
                  <Tag color="blue" style={{ fontSize: 10 }}>{s.total}次</Tag>
                  <span style={{ color: rateColor, minWidth: 80 }}>成功率 {rate}%</span>
                  <Tag color={s.failed > 0 ? 'red' : 'default'} style={{ fontSize: 10 }}>失败 {s.failed}</Tag>
                  {s.skipped > 0 && <Tag style={{ fontSize: 10 }}>跳过 {s.skipped}</Tag>}
                  <span style={{ color: '#8c8c8c' }}>均耗时 {dur}</span>
                </div>
              )
            })}
          </div>
          {runTrend && runTrend.trend.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                近 {runTrend.days} 天运行趋势（累计成功 {runTrend.total_succeeded} / 失败 {runTrend.total_failed}）
              </Text>
              <div style={{ marginTop: 4 }}>
                <WorkflowRunTrendChart buckets={runTrend.trend} width={520} height={84} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#52c41a' }}>●</span> 成功</Text>
                <Text type="secondary" style={{ fontSize: 11 }}><span style={{ color: '#ff4d4f' }}>●</span> 失败</Text>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Workflow runs */}
      <Card title="运行记录" style={{ marginBottom: 24 }} extra={<Button size="small" onClick={loadRuns}>刷新</Button>}>
        <Spin spinning={runsLoading}>
          {runs.length === 0 ? (
            <Empty description="暂无运行记录" />
          ) : (
            <div>
              {runs.map(run => {
                const done = (run.step_runs || []).filter(sr => sr.status === 'succeeded').length
                const total = (run.step_runs || []).length
                return (
                  <Card
                    key={run.id}
                    size="small"
                    style={{ marginBottom: 8, cursor: 'pointer' }}
                    onClick={() => viewRun(run.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Tag color={WORKFLOW_STATUS_COLORS[run.status] || 'default'}>{run.status}</Tag>
                        <span>运行 #{run.id}</span>
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                          步骤 {done}/{total}
                        </span>
                      </Space>
                      <Space>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {new Date(run.created_at).toLocaleString()}
                        </span>
                        {run.status === 'running' && (
                          <Button size="small" icon={<PauseCircleOutlined />} onClick={(e) => { e.stopPropagation(); handlePauseRun(run.id) }}>
                            暂停
                          </Button>
                        )}
                        {run.status === 'paused' && (
                          <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={(e) => { e.stopPropagation(); handleResumeRun(run.id) }}>
                            恢复
                          </Button>
                        )}
                        {run.status === 'failed' && (
                          <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={(e) => { e.stopPropagation(); handleRetryRun(run.id) }}>
                            重试
                          </Button>
                        )}
                        {['running', 'paused', 'pending'].includes(run.status) && (
                          <Popconfirm title="确定取消此运行？" onConfirm={(e) => { e?.stopPropagation(); handleCancelRun(run.id) }} onCancel={(e) => e?.stopPropagation()}>
                            <Button size="small" danger icon={<StopOutlined />} onClick={(e) => e.stopPropagation()}>
                              取消
                            </Button>
                          </Popconfirm>
                        )}
                      </Space>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Spin>
      </Card>

      {/* Scheduled Triggers */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            定时触发器
          </Space>
        }
        extra={
          <Space>
            <Button size="small" onClick={loadTriggers}>刷新</Button>
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                if (workflows.length === 0) {
                  message.warning('请先创建工作流')
                  return
                }
                openTriggerModal(workflows[0].id)
              }}
            >
              添加触发器
            </Button>
          </Space>
        }
      >
        <Spin spinning={triggerLoading}>
          {triggers.length === 0 ? (
            <Empty description="暂无触发器。添加一个 Cron 或一次性触发器来自动执行工作流" />
          ) : (
            <Table
              size="small"
              dataSource={triggers}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: '名称',
                  dataIndex: 'name',
                  render: (name: string, r: any) => (
                    <Space>
                      <span>{name}</span>
                      <Tag color={r.is_active ? 'green' : 'default'}>{r.is_active ? '启用' : '停用'}</Tag>
                    </Space>
                  ),
                },
                {
                  title: '工作流',
                  dataIndex: 'workflow_id',
                  render: (id: number) => {
                    const wf = workflows.find(w => w.id === id)
                    return wf ? wf.name : `#${id}`
                  },
                },
                {
                  title: '调度',
                  render: (_: any, r: any) => (
                    r.cron_expr
                      ? <Tooltip title="Cron 表达式"><Tag color="blue">{r.cron_expr}</Tag></Tooltip>
                      : r.one_shot_at
                        ? <Tooltip title="一次性触发"><Tag color="orange">{new Date(r.one_shot_at).toLocaleString()}</Tag></Tooltip>
                        : <Tag>未设置</Tag>
                  ),
                },
                {
                  title: '下次触发',
                  dataIndex: 'next_fire_at',
                  render: (v: string) => v ? new Date(v).toLocaleString() : '-',
                },
                {
                  title: '已触发',
                  dataIndex: 'fire_count',
                  render: (v: number) => v ?? 0,
                },
                {
                  title: '操作',
                  render: (_: any, r: any) => (
                    <Space>
                      <Button size="small" onClick={() => handleToggleTrigger(r)}>
                        {r.is_active ? '停用' : '启用'}
                      </Button>
                      <Popconfirm title="确定删除此触发器？" onConfirm={() => handleDeleteTrigger(r.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          )}
        </Spin>
      </Card>

      {/* Trigger creation modal */}
      <Modal
        title="创建定时触发器"
        open={triggerModalOpen}
        onCancel={() => setTriggerModalOpen(false)}
        onOk={handleCreateTrigger}
        okText="创建"
      >
        <Form form={triggerForm} layout="vertical">
          <Form.Item name="name" label="触发器名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：每日构建" />
          </Form.Item>
          <Form.Item name="workflow_id" label="目标工作流" initialValue={triggerTargetWfId} rules={[{ required: true }]}>
            <Select>
              {workflows.map(wf => (
                <Option key={wf.id} value={wf.id}>{wf.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="cron_expr" label="Cron 表达式（可选）" extra="5 字段格式：分 时 日 月 星期，例如 0 9 * * 1-5 = 工作日 9:00">
            <Input placeholder="0 9 * * 1-5" />
          </Form.Item>
          <Form.Item name="one_shot_at" label="一次性触发时间（可选）" extra="ISO 格式，例如 2026-07-01T09:00:00。触发后自动停用。">
            <Input placeholder="2026-07-01T09:00:00" />
          </Form.Item>
          <Form.Item name="project_id" label="项目 ID（可选）">
            <Input type="number" placeholder="运行时创建在此项目中" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create workflow modal */}
      <Modal
        title="创建工作流"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); setSteps([]) }}
        onOk={handleCreate}
        width={720}
        okText="创建"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="工作流名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：代码审查 → 测试 → 部署" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="工作流用途说明" />
          </Form.Item>
          <Form.Item name="max_parallel_steps" label="最大并行步骤" tooltip="0 表示不限制并行数量">
            <InputNumber min={0} max={20} placeholder="0 = 不限" style={{ width: '100%' }} />
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>步骤定义</strong>
          <Button size="small" icon={<PlusOutlined />} onClick={addStep}>添加步骤</Button>
        </div>

        {/* Live DAG preview */}
        {steps.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>DAG 预览（依赖方向：左 → 右）</div>
            <WorkflowDagViewer
              steps={steps.map(s => ({
                step_key: s.step_key,
                name: s.name,
                depends_on: s.depends_on || [],
                agent_id: s.agent_id,
                required_capabilities: s.required_capabilities,
              }))}
              width={660}
              height={200}
              interactive
              selectedStepKey={selectedStepKey}
              onSelectStep={setSelectedStepKey}
            />
          </div>
        )}

        {/* Draggable step editor */}
        <DndContext
          sensors={useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))}
          collisionDetection={closestCenter}
          onDragEnd={event => {
            const { active, over } = event
            if (over && active.id !== over.id) {
              const oldIndex = steps.findIndex(s => s.step_key === active.id)
              const newIndex = steps.findIndex(s => s.step_key === over.id)
              const reordered = arrayMove(steps, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }))
              setSteps(reordered)
            }
          }}
        >
          <SortableContext items={steps.map(s => s.step_key)} strategy={verticalListSortingStrategy}>
            {steps.map((step, idx) => (
              <SortableStepCard
                key={step.step_key}
                step={step}
                index={idx}
                stepKeys={stepKeys}
                agents={agents}
                workflows={workflows.map(w => ({ id: w.id, name: w.name }))}
                onUpdate={updateStep}
                onRemove={removeStep}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Modal>

      {/* Launch workflow modal */}
      <Modal
        title="启动工作流"
        open={launchOpen}
        onCancel={() => setLaunchOpen(false)}
        onOk={handleLaunch}
        confirmLoading={launching}
        okText="启动"
      >
        <Form form={launchForm} layout="vertical">
          <Form.Item name="project_id" label="项目 ID" rules={[{ required: true, message: '请输入项目 ID' }]}>
            <Input type="number" placeholder="任务将创建在此项目中" />
          </Form.Item>
          <Form.Item name="root_task_id" label="根任务 ID（可选）">
            <Input type="number" placeholder="工作流任务将作为此任务的子任务" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Run detail modal */}
      <Modal
        title={`工作流运行 #${selectedRun?.id || ''}`}
        open={runDetailOpen}
        onCancel={() => { setRunDetailOpen(false); setSelectedRun(null) }}
        footer={null}
        width={640}
      >
        {selectedRun && (
          <div>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="状态">
                <Tag color={WORKFLOW_STATUS_COLORS[selectedRun.status] || 'default'}>{selectedRun.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="项目 ID">{selectedRun.project_id}</Descriptions.Item>
              {selectedRun.root_task_id && (
                <Descriptions.Item label="根任务">#{selectedRun.root_task_id}</Descriptions.Item>
              )}
              {selectedRun.error && (
                <Descriptions.Item label="错误" span={2}>
                  <span style={{ color: '#ff4d4f' }}>{selectedRun.error}</span>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Runtime control buttons */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
              <Button size="small" icon={<MonitorOutlined />} onClick={() => openConsole(selectedRun.id)}>
                实时控制台
              </Button>
              {selectedRun.status === 'running' && (
                <Button size="small" icon={<PauseCircleOutlined />} onClick={() => handlePauseRun(selectedRun.id)}>
                  暂停
                </Button>
              )}
              {selectedRun.status === 'paused' && (
                <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleResumeRun(selectedRun.id)}>
                  恢复
                </Button>
              )}
              {selectedRun.status === 'failed' && (
                <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={() => handleRetryRun(selectedRun.id)}>
                  重试
                </Button>
              )}
              {['running', 'paused', 'pending'].includes(selectedRun.status) && (
                <Popconfirm title="确定取消此工作流运行？" onConfirm={() => handleCancelRun(selectedRun.id)}>
                  <Button size="small" danger icon={<StopOutlined />}>取消</Button>
                </Popconfirm>
              )}
            </div>

            {/* Run DAG visualization */}
            {(selectedRun.step_runs || []).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>运行 DAG</div>
                <WorkflowDagViewer
                  steps={(selectedRun.step_runs || []).map(sr => ({
                    step_key: sr.step_key,
                    name: sr.name || sr.step_key,
                    depends_on: sr.depends_on || [],
                    status: sr.status,
                    agent_id: sr.agent_id,
                    task_id: sr.task_id,
                  }))}
                  width={580}
                  height={200}
                />
              </div>
            )}

            <Steps
              direction="vertical"
              size="small"
              items={(selectedRun.step_runs || []).map(sr => {
                const statusInfo = STEP_STATUS_MAP[sr.status] || STEP_STATUS_MAP.pending
                return {
                  title: (
                    <Space>
                      <span>{sr.step_key}</span>
                      <Tag color={statusInfo.color} icon={statusInfo.icon} style={{ fontSize: 11 }}>
                        {sr.status}
                      </Tag>
                      {sr.agent_id && (
                        <Tag style={{ fontSize: 11 }}>Agent #{sr.agent_id}</Tag>
                      )}
                    </Space>
                  ),
                  description: (
                    <div>
                      {sr.task_id && <div style={{ fontSize: 12, color: '#8c8c8c' }}>任务 #{sr.task_id}</div>}
                      {sr.error && <div style={{ fontSize: 12, color: '#ff4d4f' }}>{sr.error}</div>}
                      {sr.started_at && (
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                          开始: {new Date(sr.started_at).toLocaleString()}
                          {sr.finished_at && ` → 结束: ${new Date(sr.finished_at).toLocaleString()}`}
                        </div>
                      )}
                    </div>
                  ),
                }
              })}
            />
          </div>
        )}
      </Modal>

      {/* Real-time step console Drawer */}
      <Drawer
        title={
          <Space>
            <MonitorOutlined />
            <span>实时控制台 — 工作流运行 #{selectedRun?.id}</span>
            <Button size="small" icon={<ReloadOutlined />} loading={consoleLoading} onClick={refreshConsole}>刷新</Button>
          </Space>
        }
        open={consoleOpen}
        onClose={() => { setConsoleOpen(false); setConsoleData(null) }}
        width={720}
        styles={{ body: { paddingTop: 12 } }}
      >
        {consoleLoading && !consoleData ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : consoleData ? (
          <div>
            {/* Summary */}
            <Card size="small" style={{ marginBottom: 12 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>总体进度</div>
                  <Progress
                    percent={consoleData.summary.progress_percent}
                    status={consoleData.summary.failed_count > 0 ? 'exception' : (consoleData.summary.running_count > 0 ? 'active' : 'success')}
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Space wrap size={[4, 4]}>
                    <Tag>步骤 {consoleData.summary.total_steps}</Tag>
                    <Tag color="processing">运行中 {consoleData.summary.running_count}</Tag>
                    <Tag color="error">失败 {consoleData.summary.failed_count}</Tag>
                    <Tag color="default">待处理 {consoleData.summary.pending_count}</Tag>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Run-level intervention controls */}
            {selectedRun && (
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedRun.status === 'running' && (
                  <Button size="small" icon={<PauseCircleOutlined />} onClick={() => consoleRunControl('pause')}>暂停运行</Button>
                )}
                {selectedRun.status === 'paused' && (
                  <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => consoleRunControl('resume')}>恢复运行</Button>
                )}
                {selectedRun.status === 'failed' && (
                  <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={() => consoleRunControl('retry')}>重试运行</Button>
                )}
                {['running', 'paused', 'pending'].includes(selectedRun.status) && (
                  <Popconfirm title="确定取消此工作流运行？" onConfirm={() => consoleRunControl('cancel')}>
                    <Button size="small" danger icon={<StopOutlined />}>取消运行</Button>
                  </Popconfirm>
                )}
              </div>
            )}

            {/* Conflicts */}
            {consoleData.conflicts.length > 0 && (
              <Alert
                style={{ marginBottom: 12 }}
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message={`${consoleData.conflicts.length} 个关联冲突`}
                description={
                  <Space wrap size={[4, 4]}>
                    {consoleData.conflicts.map(c => (
                      <Tag key={c.id} color={c.severity === 'CRITICAL' ? 'error' : 'warning'}>
                        {c.title || c.conflict_type} · {c.status}
                      </Tag>
                    ))}
                  </Space>
                }
              />
            )}

            {/* Steps timeline */}
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>步骤执行</div>
            <Timeline
              items={consoleData.steps.map((s: WorkflowRunConsoleStep) => {
                const sr = s.step_run
                const statusInfo = STEP_STATUS_MAP[sr.status] || STEP_STATUS_MAP.pending
                const overrides = Object.keys(sr.runtime_overrides || {})
                const sb = s.sandbox_execution
                const sbViolations = (sb?.violations || []).length
                const effKeys = Object.entries(s.effective_params || {}).filter(([, v]) => v != null)
                const logs = s.recent_logs || []
                return {
                  dot: statusInfo.icon,
                  color: statusInfo.color === 'success' ? 'green'
                    : statusInfo.color === 'error' ? 'red'
                    : statusInfo.color === 'processing' ? 'blue'
                    : statusInfo.color === 'warning' ? 'orange' : 'gray',
                  children: (
                    <div style={{ paddingBottom: 4 }}>
                      <Space wrap size={[4, 4]}>
                        <Text strong>{sr.step_key}</Text>
                        <Tag color={statusInfo.color} icon={statusInfo.icon} style={{ fontSize: 11 }}>{sr.status}</Tag>
                        {sr.agent_id && <Tag style={{ fontSize: 11 }}>Agent #{sr.agent_id}</Tag>}
                        {sr.task_id && <Tag style={{ fontSize: 11 }}>Task #{sr.task_id}</Tag>}
                        {sr.attempt > 1 && <Tag color="orange" style={{ fontSize: 11 }}>尝试 {sr.attempt}</Tag>}
                        {s.duration_seconds != null && (
                          <Tag style={{ fontSize: 11 }}>{s.duration_seconds.toFixed(0)}s</Tag>
                        )}
                        {overrides.length > 0 && (
                          <Tooltip title={`覆盖: ${overrides.join(', ')}`}>
                            <Tag color="purple" style={{ fontSize: 11 }}>覆盖 {overrides.length}</Tag>
                          </Tooltip>
                        )}
                        {sb && (
                          <Tooltip title={`沙盒执行 #${sb.id} · 策略快照已冻结${sb.violations?.length ? ` · ${sbViolations} 违规` : ''}`}>
                            <Tag color={sb.status === 'VIOLATED' || sb.status === 'REVOKED' ? 'error' : 'blue'} style={{ fontSize: 11 }} icon={<SafetyOutlined />}>
                              沙盒:{sb.status}
                            </Tag>
                          </Tooltip>
                        )}
                      </Space>

                      {/* Effective params */}
                      {effKeys.length > 0 && (
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                          有效参数: {effKeys.map(([k, v]) => `${k}=${String(v)}`).join(' · ')}
                        </div>
                      )}

                      {sr.error && (
                        <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2 }}>错误: {sr.error}</div>
                      )}

                      {/* Recent logs */}
                      {logs.length > 0 && (
                        <div style={{ marginTop: 4, background: '#fafafa', borderRadius: 4, padding: '4px 8px', fontFamily: 'monospace', fontSize: 11, maxHeight: 120, overflow: 'auto' }}>
                          {logs.map(l => (
                            <div key={l.id}>
                              <Tag color={l.level === 'ERROR' ? 'error' : l.level === 'WARN' ? 'warning' : 'default'} style={{ fontSize: 10, marginRight: 4 }}>{l.level}</Tag>
                              {l.message}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Step-level intervention */}
                      <div style={{ marginTop: 4 }}>
                        <Space size={[6, 4]} wrap>
                          {(sr.status === 'pending' || sr.status === 'waiting' || sr.status === 'running') && (
                            <Button
                              size="small"
                              type="link"
                              icon={<SettingOutlined />}
                              style={{ fontSize: 12, padding: 0 }}
                              onClick={() => openStepOverride(sr.run_id, sr.step_key)}
                            >
                              {overrides.length > 0 ? '修改覆盖' : '覆盖参数'}
                            </Button>
                          )}
                          {overrides.length > 0 && (
                            <Popconfirm
                              title="清除该步骤的所有运行时覆盖？"
                              onConfirm={() => clearStepOverride(sr.run_id, sr.step_key)}
                            >
                              <Button size="small" type="link" danger icon={<CloseCircleOutlined />} style={{ fontSize: 12, padding: 0 }}>
                                清除覆盖
                              </Button>
                            </Popconfirm>
                          )}
                        </Space>
                      </div>
                    </div>
                  ),
                }
              })}
            />
          </div>
        ) : (
          <Empty description="无数据" />
        )}
      </Drawer>

      {/* Step runtime override Modal (intervention from console) */}
      <Modal
        title={stepOverrideTarget ? `步骤覆盖 — ${stepOverrideTarget.stepKey}` : '步骤覆盖'}
        open={stepOverrideOpen}
        onCancel={() => { setStepOverrideOpen(false); setStepOverrideTarget(null); setStepOverrideEffective(null) }}
        onOk={() => stepOverrideForm.submit()}
        confirmLoading={stepOverrideSubmitting}
        width={560}
      >
        {stepOverrideEffective && (
          <Alert
            style={{ marginBottom: 12 }}
            type="info"
            showIcon
            message="当前有效参数（合并定义与已有覆盖）"
            description={
              <div style={{ fontSize: 12 }}>
                {Object.entries(stepOverrideEffective).filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={k}><Text type="secondary">{k}:</Text> {String(v)}</div>
                ))}
              </div>
            }
          />
        )}
        <Form form={stepOverrideForm} layout="vertical" onFinish={submitStepOverride}>
          <Alert style={{ marginBottom: 12 }} type="warning" message="仅填写需覆盖的字段；留空表示不修改。运行中步骤仅可覆盖 timeout_seconds / retry_count。" />
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="agent_id" label="指定 Agent ID"><Input type="number" placeholder="留空不修改" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="timeout_seconds" label="超时秒数"><Input type="number" placeholder="留空不修改" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="retry_count" label="重试次数"><Input type="number" placeholder="留空不修改" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="on_failure" label="失败策略">
                <Select allowClear placeholder="留空不修改" options={[
                  { value: 'abort', label: 'abort 中止' },
                  { value: 'skip', label: 'skip 跳过' },
                  { value: 'continue', label: 'continue 继续' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Version History Modal */}
      <Modal
        title={`版本历史 (当前: v${currentVersion})`}
        open={versionModalOpen}
        onCancel={() => setVersionModalOpen(false)}
        footer={null}
        width={700}
      >
        <Spin spinning={versionLoading}>
          {versions.length === 0 && !versionLoading ? (
            <Empty description="暂无版本记录" />
          ) : (
            <List
              size="small"
              dataSource={versions}
              renderItem={(v: any) => (
                <List.Item
                  actions={[
                    v.version_number !== currentVersion && (
                      <Button key="diff" size="small" onClick={() => handleDiffVersions(v.version_number, currentVersion)}>
                        对比当前
                      </Button>
                    ),
                    v.version_number !== currentVersion && (
                      <Popconfirm key="rollback" title={`确定回滚到 v${v.version_number}？`} onConfirm={() => handleRollback(v.version_number)}>
                        <Button size="small" type="primary">回滚</Button>
                      </Popconfirm>
                    ),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={<Space><Tag color={v.version_number === currentVersion ? 'green' : 'default'}>v{v.version_number}</Tag> {v.version_number === currentVersion && <Tag color="green">当前</Tag>}</Space>}
                    description={
                      <div>
                        <div>{v.change_summary || '无变更说明'}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{v.created_at ? new Date(v.created_at).toLocaleString() : ''} {v.created_by ? `by ${v.created_by}` : ''}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Modal>

      {/* Version Diff Modal */}
      <Modal
        title={`版本差异: v${diffV1} → v${diffV2}`}
        open={diffModalOpen}
        onCancel={() => setDiffModalOpen(false)}
        footer={null}
        width={600}
      >
        {diffData && (
          <div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="新增步骤">
                {diffData.added_steps?.length > 0 ? diffData.added_steps.map((s: string) => <Tag key={s} color="green">{s}</Tag>) : '无'}
              </Descriptions.Item>
              <Descriptions.Item label="删除步骤">
                {diffData.removed_steps?.length > 0 ? diffData.removed_steps.map((s: string) => <Tag key={s} color="red">{s}</Tag>) : '无'}
              </Descriptions.Item>
              <Descriptions.Item label="修改步骤">
                {diffData.modified_steps?.length > 0 ? diffData.modified_steps.map((s: string) => <Tag key={s} color="orange">{s}</Tag>) : '无'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Workflows
