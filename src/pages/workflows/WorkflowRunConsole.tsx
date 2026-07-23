import React, { useCallback } from 'react'
import {
  Button, Card, Row, Col, Modal, Form, Input, Select, Space, Tag, Spin,
  Alert, Progress, Timeline, Tooltip, Popconfirm, Empty, Drawer, Typography,
} from 'antd'
const { Text } = Typography
import {
  ReloadOutlined, PauseCircleOutlined, PlayCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  MonitorOutlined, StopOutlined, SafetyOutlined, WarningOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import {
  agentsApi,
  type WorkflowRunItem,
  type WorkflowRunConsoleResult,
  type WorkflowRunConsoleStep,
} from '../../api/agents'
import { useCollaborationSSE } from '../../hooks/useCollaborationSSE'

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

interface WorkflowRunConsoleProps {
  open: boolean
  onClose: () => void
  selectedRun: WorkflowRunItem | null
  consoleData: WorkflowRunConsoleResult | null
  consoleLoading: boolean
  onRefreshConsole: () => void
  onSetConsoleData: (data: WorkflowRunConsoleResult | null) => void
  onPauseRun: (runId: number) => Promise<WorkflowRunItem | void>
  onResumeRun: (runId: number) => Promise<WorkflowRunItem | void>
  onRetryRun: (runId: number) => Promise<WorkflowRunItem | void>
  onCancelRun: (runId: number) => Promise<void>
  onLoadRuns: () => void
}

const WorkflowRunConsole: React.FC<WorkflowRunConsoleProps> = ({
  open,
  onClose,
  selectedRun,
  consoleData,
  consoleLoading,
  onRefreshConsole,
  onSetConsoleData,
  onPauseRun,
  onResumeRun,
  onRetryRun,
  onCancelRun,
  onLoadRuns,
}) => {
  // Step override state
  const [stepOverrideOpen, setStepOverrideOpen] = React.useState(false)
  const [stepOverrideTarget, setStepOverrideTarget] = React.useState<{ runId: number; stepKey: string } | null>(null)
  const [stepOverrideEffective, setStepOverrideEffective] = React.useState<Record<string, any> | null>(null)
  const [stepOverrideSubmitting, setStepOverrideSubmitting] = React.useState(false)
  const [stepOverrideForm] = Form.useForm()

  // Console intervention: runtime override on a step
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
      const overrides: Record<string, any> = {}
      const raw = values || {}
      for (const k of ['agent_id', 'required_capabilities', 'timeout_seconds', 'retry_count', 'on_failure', 'condition', 'task_template_id', 'sub_workflow_id']) {
        if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') {
          overrides[k] = raw[k]
        }
      }
      if (Object.keys(overrides).length === 0) {
        const { message } = await import('antd')
        message.warning('请至少填写一项覆盖参数')
        setStepOverrideSubmitting(false)
        return
      }
      await agentsApi.setStepRuntimeOverride(stepOverrideTarget.runId, stepOverrideTarget.stepKey, overrides)
      const { message } = await import('antd')
      message.success('步骤覆盖已应用')
      setStepOverrideOpen(false)
      setStepOverrideTarget(null)
      // Refresh console so the override tag appears
      if (selectedRun) {
        agentsApi.getWorkflowRunConsole(selectedRun.id, { log_limit: 8 }).then(onSetConsoleData).catch(() => {})
      }
    } catch {
      const { message } = await import('antd')
      message.error('应用覆盖失败')
    } finally {
      setStepOverrideSubmitting(false)
    }
  }

  const clearStepOverride = async (runId: number, stepKey: string) => {
    try {
      await agentsApi.clearStepRuntimeOverride(runId, stepKey)
      const { message } = await import('antd')
      message.success('已清除步骤覆盖')
      if (selectedRun) {
        agentsApi.getWorkflowRunConsole(selectedRun.id, { log_limit: 8 }).then(onSetConsoleData).catch(() => {})
      }
    } catch {
      const { message } = await import('antd')
      message.error('清除覆盖失败')
    }
  }

  // Console intervention: run-level control
  const consoleRunControl = async (action: 'pause' | 'resume' | 'retry' | 'cancel') => {
    if (!selectedRun) return
    if (action === 'pause') await onPauseRun(selectedRun.id)
    else if (action === 'resume') await onResumeRun(selectedRun.id)
    else if (action === 'retry') await onRetryRun(selectedRun.id)
    else if (action === 'cancel') await onCancelRun(selectedRun.id)
    // Refresh console to reflect new state
    agentsApi.getWorkflowRunConsole(selectedRun.id, { log_limit: 8 }).then(onSetConsoleData).catch(() => {})
  }

  // SSE-driven live refresh
  const RUN_RELEVANT_EVENTS = new Set([
    'workflow_step_started', 'workflow_step_finished', 'workflow_step_auto_retry',
    'workflow_step_overridden', 'sandbox_execution_started', 'sandbox_execution_completed',
    'sandbox_execution_revoked', 'sandbox_step_violation', 'sandbox_violation',
    'conflicts_detected', 'conflict_resolved', 'conflicts_auto_resolved',
  ])
  useCollaborationSSE({
    enabled: open,
    onEvent: useCallback((event: any) => {
      if (!selectedRun) return
      const et = event.event_type || ''
      if (!RUN_RELEVANT_EVENTS.has(et)) return
      const payload = event.payload || {}
      if (payload.run_id != null && payload.run_id !== selectedRun.id) return
      agentsApi.getWorkflowRunConsole(selectedRun.id, { log_limit: 8 })
        .then(onSetConsoleData)
        .catch(() => { /* silent: SSE refresh is best-effort */ })
    }, [selectedRun]),
  })

  return (
    <>
      {/* Real-time step console Drawer */}
      <Drawer
        title={
          <Space>
            <MonitorOutlined />
            <span>实时控制台 — 工作流运行 #{selectedRun?.id}</span>
            <Button size="small" icon={<ReloadOutlined />} loading={consoleLoading} onClick={onRefreshConsole}>刷新</Button>
          </Space>
        }
        open={open}
        onClose={() => { onClose(); onSetConsoleData(null) }}
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
    </>
  )
}

export default WorkflowRunConsole
