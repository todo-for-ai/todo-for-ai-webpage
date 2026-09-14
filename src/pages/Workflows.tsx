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
import WorkflowDefinitionsCard from './workflows/WorkflowDefinitionsCard'
import TriggerCreationModal from './workflows/TriggerCreationModal'
import LaunchWorkflowModal from './workflows/LaunchWorkflowModal'
import WorkflowRunsTriggers from './workflows/WorkflowRunsTriggers'
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

import { useWorkflowsData } from './workflows/useWorkflowsData'

const Workflows: React.FC = () => {

  const {
    agents,
    consoleData,
    consoleLoading,
    consoleOpen,
    createOpen,
    currentVersion,
    diffData,
    diffModalOpen,
    diffV1,
    diffV2,
    failedStepsByDuration,
    failureCorrelation,
    failureCorrelationByStep,
    handleCancelRun,
    handleCreateTrigger,
    handleDelete,
    handleDeleteTrigger,
    handleDiffVersions,
    handleLaunch,
    handlePauseRun,
    handleResumeRun,
    handleRetryRun,
    handleRollback,
    handleToggleTrigger,
    instantiateTemplate,
    launchForm,
    launchOpen,
    launching,
    loadData,
    loadRuns,
    loadTriggers,
    loading,
    openConsole,
    openLaunch,
    openTriggerModal,
    openVersionModal,
    refreshConsole,
    runDetailOpen,
    runDurationPercentiles,
    runTrend,
    runs,
    runsLoading,
    selectedRun,
    setConsoleData,
    setConsoleOpen,
    setCreateOpen,
    setDiffModalOpen,
    setLaunchOpen,
    setRunDetailOpen,
    setSelectedRun,
    setTriggerModalOpen,
    setVersionModalOpen,
    similarityMatrix,
    stepBottleneckTl,
    stepCofailureMatrix,
    stepDependencyBottleneck,
    stepDurationHist,
    stepDurationHistogram,
    stepFailureRate,
    stepHourlyDistribution,
    stepRetryTopology,
    stepStats,
    structuralComplexity,
    successRateByWorkflow,
    templateLoading,
    templates,
    triggerForm,
    triggerLoading,
    triggerModalOpen,
    triggerTargetWfId,
    triggers,
    versionLoading,
    versionModalOpen,
    versions,
    viewRun,
    workflows,
  } = useWorkflowsData()

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

      <WorkflowDefinitionsCard
        workflows={ workflows }
        loading={ loading }
        handleDelete={ handleDelete }
        loadData={ loadData }
        openLaunch={ openLaunch }
        openTriggerModal={ openTriggerModal }
        openVersionModal={ openVersionModal }
      />

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

      <WorkflowRunsTriggers
        runs={ runs }
        runsLoading={ runsLoading }
        triggers={ triggers }
        triggerLoading={ triggerLoading }
        handleCancelRun={ handleCancelRun }
        handleDeleteTrigger={ handleDeleteTrigger }
        handlePauseRun={ handlePauseRun }
        handleResumeRun={ handleResumeRun }
        handleRetryRun={ handleRetryRun }
        handleToggleTrigger={ handleToggleTrigger }
        loadRuns={ loadRuns }
        loadTriggers={ loadTriggers }
        openTriggerModal={ openTriggerModal }
        viewRun={ viewRun }
        workflows={ workflows }
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
