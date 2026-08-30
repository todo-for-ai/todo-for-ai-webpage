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
} from '../api/agents'
import WorkflowDagViewer, { type DagStepData } from '../components/Workflow/WorkflowDagViewer'
import SortableStepCard from '../components/Workflow/SortableStepCard'
import WorkflowRunTrendChart from '../components/WorkflowRunTrendChart'
import { useCollaborationSSE } from '../hooks/useCollaborationSSE'

// Extracted components
import WorkflowFormModal from './workflows/WorkflowFormModal'
import WorkflowRunConsole from './workflows/WorkflowRunConsole'
import WorkflowAnalyticsCards from './workflows/WorkflowAnalyticsCards'
import ScheduledTriggersCard from './workflows/ScheduledTriggersCard'
import WorkflowRunsCard from './workflows/WorkflowRunsCard'
import WorkflowTemplatesCard from './workflows/WorkflowTemplatesCard'

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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>
          <ApartmentOutlined style={{ marginRight: 8 }} />
          工作流编排
        </h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          创建工作流
        </Button>
      </div>

      {/* Template marketplace */}
      <WorkflowTemplatesCard
        templates={templates}
        templateLoading={templateLoading}
        onInstantiate={instantiateTemplate}
      />

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

      {/* Analytics Cards (extracted) */}
      <WorkflowAnalyticsCards
        stepStats={stepStats}
        stepDurationHistogram={stepDurationHistogram}
        runDurationPercentiles={runDurationPercentiles}
        stepFailureRate={stepFailureRate}
        stepCofailureMatrix={stepCofailureMatrix}
        successRateByWorkflow={successRateByWorkflow}
        stepRetryTopology={stepRetryTopology}
        stepHourlyDistribution={stepHourlyDistribution}
        stepDependencyBottleneck={stepDependencyBottleneck}
        similarityMatrix={similarityMatrix}
        stepDurationHist={stepDurationHist}
        stepBottleneckTl={stepBottleneckTl}
        structuralComplexity={structuralComplexity}
        runTrend={runTrend}
        failureCorrelation={failureCorrelation}
        failureCorrelationByStep={failureCorrelationByStep}
        failedStepsByDuration={failedStepsByDuration}
      />

      {/* Workflow runs */}
      <WorkflowRunsCard
        runs={runs}
        runsLoading={runsLoading}
        onRefresh={loadRuns}
        onViewRun={viewRun}
        onPauseRun={handlePauseRun}
        onResumeRun={handleResumeRun}
        onRetryRun={handleRetryRun}
        onCancelRun={handleCancelRun}
      />

      {/* Scheduled Triggers */}
      <ScheduledTriggersCard
        triggers={triggers}
        triggerLoading={triggerLoading}
        workflows={workflows}
        onRefresh={loadTriggers}
        onAddTrigger={() => {
          if (workflows.length === 0) {
            message.warning('请先创建工作流')
            return
          }
          openTriggerModal(workflows[0].id)
        }}
        onToggleTrigger={handleToggleTrigger}
        onDeleteTrigger={handleDeleteTrigger}
      />

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

      {/* Create workflow modal (extracted) */}
      <WorkflowFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={loadData}
        agents={agents}
        workflows={workflows}
      />

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

      {/* Real-time step console Drawer (extracted) */}
      <WorkflowRunConsole
        open={consoleOpen}
        onClose={() => setConsoleOpen(false)}
        selectedRun={selectedRun}
        consoleData={consoleData}
        consoleLoading={consoleLoading}
        onRefreshConsole={refreshConsole}
        onSetConsoleData={setConsoleData}
        onPauseRun={handlePauseRun}
        onResumeRun={handleResumeRun}
        onRetryRun={handleRetryRun}
        onCancelRun={handleCancelRun}
        onLoadRuns={loadRuns}
      />

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
