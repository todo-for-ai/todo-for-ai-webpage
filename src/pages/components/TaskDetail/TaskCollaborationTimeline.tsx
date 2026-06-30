import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Divider, Empty, Form, Input, InputNumber, List, Modal, Progress, Select, Space, Spin, Switch, Tag, Timeline, Tooltip, Typography, message } from 'antd'
import { ApiOutlined, ClockCircleOutlined, CodeOutlined, ReloadOutlined, RobotOutlined, SendOutlined, SwapOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCollaborationSSE } from '../../../hooks/useCollaborationSSE'
import {
  agentsApi,
  type Agent,
  type PostableTaskEventType,
  type RunLogEntry,
  type TaskAssignment,
  type TaskAssignmentState,
  type TaskEvent,
  type UpdateAssignmentData,
} from '../../../api/agents'

const { Text } = Typography
const { TextArea } = Input

interface TaskCollaborationTimelineProps {
  taskId: number
  tp: (key: string, options?: any) => string
}

const eventColor: Record<string, string> = {
  task_claimed: 'blue',
  task_dispatched: 'geekblue',
  subtask_created: 'cyan',
  assignment_updated: 'green',
  assignment_expired: 'red',
  message: 'gray',
  note: 'gray',
  question: 'gold',
  answer: 'cyan',
  handoff: 'purple',
  blocker: 'red',
  decision: 'green',
  info: 'blue',
}

const lineageColor: Record<string, string> = {
  claim: 'blue',
  manual_dispatch: 'purple',
  dispatch: 'geekblue',
  handoff: 'purple',
}

const stateColor: Record<TaskAssignmentState, string> = {
  assigned: 'blue',
  claimed: 'cyan',
  running: 'processing',
  waiting_human: 'gold',
  review: 'purple',
  done: 'green',
  failed: 'red',
  cancelled: 'default',
  expired: 'default',
}

const actorIcon = (event: TaskEvent) => {
  if (event.actor_type === 'agent') {
    return <RobotOutlined />
  }
  if (event.actor_type === 'human') {
    return <UserOutlined />
  }
  return <ApiOutlined />
}

const toDisplayValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const toStringList = (value: unknown) => (
  Array.isArray(value)
    ? value.filter(item => item !== undefined && item !== null && item !== '').map(item => String(item))
    : []
)

export const TaskCollaborationTimeline: React.FC<TaskCollaborationTimelineProps> = ({ taskId, tp }) => {
  const [events, setEvents] = useState<TaskEvent[]>([])
  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [liveMode, setLiveMode] = useState(true)
  const [updatingAssignmentId, setUpdatingAssignmentId] = useState<number | null>(null)
  const [feedbackAssignment, setFeedbackAssignment] = useState<TaskAssignment | null>(null)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [dispatchAgents, setDispatchAgents] = useState<Agent[]>([])
  const [dispatchLoading, setDispatchLoading] = useState(false)
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false)
  const [feedbackForm] = Form.useForm()
  const [dispatchForm] = Form.useForm()
  const [composerContent, setComposerContent] = useState('')
  const [composerType, setComposerType] = useState<PostableTaskEventType>('message')
  const [composerToAgentId, setComposerToAgentId] = useState<number | undefined>(undefined)
  const [posting, setPosting] = useState(false)
  const [handoffAssignment, setHandoffAssignment] = useState<TaskAssignment | null>(null)
  const [handoffSubmitting, setHandoffSubmitting] = useState(false)
  const [handoffForm] = Form.useForm()
  const [runLogs, setRunLogs] = useState<Record<number, RunLogEntry[]>>({})
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null)
  const [runLogsLoading, setRunLogsLoading] = useState(false)

  const loadRunLogs = useCallback(async (runId: number) => {
    setRunLogsLoading(true)
    try {
      const result = await agentsApi.getRunLogs(runId, { per_page: 200 })
      setRunLogs(prev => ({ ...prev, [runId]: result.items || [] }))
    } catch {
      // silent
    } finally {
      setRunLogsLoading(false)
    }
  }, [])

  const loadCollaboration = useCallback(async (options?: { silent?: boolean }) => {
    if (!taskId) {
      return
    }

    const silent = options?.silent === true
    if (!silent) {
      setLoading(true)
    }
    try {
      const [assignmentResult, eventResult] = await Promise.all([
        agentsApi.getTaskAssignments(taskId, { state: 'active', per_page: 10 }),
        agentsApi.getTaskEvents(taskId, { per_page: 50 }),
      ])
      setAssignments(assignmentResult.items)
      setEvents(eventResult.items)
      setLoadFailed(false)
    } catch {
      if (!silent) {
        setLoadFailed(true)
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [taskId])

  useEffect(() => {
    loadCollaboration()
  }, [loadCollaboration])

  useEffect(() => {
    if (!liveMode || !taskId) {
      return
    }
    const timer = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) {
        return
      }
      loadCollaboration({ silent: true })
    }, 8000)
    return () => window.clearInterval(timer)
  }, [liveMode, taskId, loadCollaboration])

  // SSE: when the server pushes a collaboration event, refresh silently
  useCollaborationSSE({
    enabled: liveMode && !!taskId,
    onEvent: useCallback((_event) => {
      loadCollaboration({ silent: true })
    }, [loadCollaboration]),
  })

  const actorLabel = useCallback((event: TaskEvent) => {
    if (event.actor_type === 'agent') {
      return event.actor_agent?.name || (event.actor_agent_id ? `Agent #${event.actor_agent_id}` : tp('collaboration.actors.agent'))
    }
    if (event.actor_type === 'human') {
      return event.actor_user?.name || event.actor_user?.email || tp('collaboration.actors.human')
    }
    return tp('collaboration.actors.system')
  }, [tp])

  const renderEventTitle = useCallback((event: TaskEvent) => {
    const translated = tp(`collaboration.events.${event.event_type}`)
    return translated === `collaboration.events.${event.event_type}` ? event.event_type : translated
  }, [tp])

  const renderState = useCallback((state: unknown) => {
    if (!state) {
      return '-'
    }
    const stateKey = String(state)
    const translated = tp(`collaboration.states.${stateKey}`)
    return translated === `collaboration.states.${stateKey}` ? stateKey : translated
  }, [tp])

  const renderMatchStrategy = useCallback((strategy: unknown) => {
    if (!strategy) {
      return '-'
    }
    const strategyKey = String(strategy)
    const translated = tp(`collaboration.matchStrategies.${strategyKey}`)
    return translated === `collaboration.matchStrategies.${strategyKey}` ? strategyKey : translated
  }, [tp])

  const renderClaimMode = useCallback((mode: unknown) => {
    if (!mode) {
      return '-'
    }
    const modeKey = String(mode)
    const translated = tp(`collaboration.claimModes.${modeKey}`)
    return translated === `collaboration.claimModes.${modeKey}` ? modeKey : translated
  }, [tp])

  const updateAssignment = useCallback(async (assignment: TaskAssignment, data: UpdateAssignmentData) => {
    setUpdatingAssignmentId(assignment.id)
    try {
      await agentsApi.updateTaskAssignment(taskId, assignment.id, data)
      message.success(tp('collaboration.updateSuccess'))
      await loadCollaboration()
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : tp('collaboration.updateFailed'))
      return false
    } finally {
      setUpdatingAssignmentId(null)
    }
  }, [loadCollaboration, taskId, tp])

  const openFeedbackModal = useCallback((assignment: TaskAssignment) => {
    setFeedbackAssignment(assignment)
    feedbackForm.setFieldsValue({
      feedback_content: '',
    })
  }, [feedbackForm])

  const loadDispatchAgents = useCallback(async () => {
    setDispatchLoading(true)
    try {
      const result = await agentsApi.getAgents({
        status: 'all',
        sort_by: 'last_seen_at',
        sort_order: 'desc',
        per_page: 100,
      })
      setDispatchAgents(result.items)
    } catch (error) {
      message.error(error instanceof Error ? error.message : tp('collaboration.dispatch.loadAgentsFailed'))
    } finally {
      setDispatchLoading(false)
    }
  }, [tp])

  const openDispatchModal = useCallback(() => {
    dispatchForm.setFieldsValue({
      agent_id: undefined,
      lease_minutes: 30,
      notes: '',
    })
    setDispatchOpen(true)
    loadDispatchAgents()
  }, [dispatchForm, loadDispatchAgents])

  const submitDispatch = useCallback(async () => {
    try {
      const values = await dispatchForm.validateFields()
      setDispatchSubmitting(true)
      const result = await agentsApi.claimTask(values.agent_id, {
        task_id: taskId,
        lease_seconds: Math.max(1, Number(values.lease_minutes || 30)) * 60,
        dispatch_source: 'human',
        run_metadata: values.notes ? { dispatch_notes: values.notes } : {},
      })

      if (!result) {
        message.info(tp('collaboration.dispatch.noTask'))
        return
      }

      message.success(tp('collaboration.dispatch.success'))
      setDispatchOpen(false)
      dispatchForm.resetFields()
      await loadCollaboration()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setDispatchSubmitting(false)
    }
  }, [dispatchForm, loadCollaboration, taskId, tp])

  const submitHumanFeedback = useCallback(async () => {
    if (!feedbackAssignment) {
      return
    }

    try {
      const values = await feedbackForm.validateFields()
      setFeedbackSubmitting(true)
      const updated = await updateAssignment(feedbackAssignment, {
        state: 'running',
        task_status: 'in_progress',
        feedback_content: values.feedback_content,
        notes: values.feedback_content,
        lease_seconds: 1800,
      })
      if (updated) {
        setFeedbackAssignment(null)
        feedbackForm.resetFields()
      }
    } finally {
      setFeedbackSubmitting(false)
    }
  }, [feedbackAssignment, feedbackForm, updateAssignment])

  const postMessage = useCallback(async () => {
    const content = composerContent.trim()
    if (!content) {
      return
    }
    setPosting(true)
    try {
      await agentsApi.postTaskEvent(taskId, { content, event_type: composerType, to_agent_id: composerToAgentId })
      setComposerContent('')
      setComposerType('message')
      setComposerToAgentId(undefined)
      message.success(tp('collaboration.composer.success'))
      await loadCollaboration()
    } catch (error) {
      message.error(error instanceof Error ? error.message : tp('collaboration.composer.failed'))
    } finally {
      setPosting(false)
    }
  }, [composerContent, composerType, composerToAgentId, loadCollaboration, taskId, tp])

  const composerTypeOptions = useMemo(() => (
    (['message', 'note', 'question', 'answer', 'handoff', 'blocker', 'decision', 'info'] as PostableTaskEventType[])
      .map(type => {
        const translated = tp(`collaboration.composer.types.${type}`)
        return {
          value: type,
          label: translated === `collaboration.composer.types.${type}` ? type : translated,
        }
      })
  ), [tp])

  const openHandoffModal = useCallback((assignment: TaskAssignment) => {
    setHandoffAssignment(assignment)
    handoffForm.setFieldsValue({
      to_agent_id: undefined,
      lease_minutes: 30,
      reason: '',
    })
    loadDispatchAgents()
  }, [handoffForm, loadDispatchAgents])

  const submitHandoff = useCallback(async () => {
    if (!handoffAssignment) {
      return
    }
    try {
      const values = await handoffForm.validateFields()
      setHandoffSubmitting(true)
      await agentsApi.handoffTask(taskId, {
        to_agent_id: values.to_agent_id,
        from_assignment_id: handoffAssignment.id,
        lease_seconds: Math.max(1, Number(values.lease_minutes || 30)) * 60,
        reason: values.reason || undefined,
      })
      message.success(tp('collaboration.handoff.success'))
      setHandoffAssignment(null)
      handoffForm.resetFields()
      await loadCollaboration()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setHandoffSubmitting(false)
    }
  }, [handoffAssignment, handoffForm, loadCollaboration, taskId, tp])

  const renderAssignmentActions = useCallback((assignment: TaskAssignment) => {
    const updating = updatingAssignmentId === assignment.id

    return (
      <Space size={4} wrap>
        <Button
          size="small"
          icon={<SwapOutlined />}
          loading={updating}
          onClick={() => openHandoffModal(assignment)}
        >
          {tp('collaboration.actions.handoff')}
        </Button>
        {assignment.state === 'waiting_human' && (
          <Button
            size="small"
            loading={updating}
            onClick={() => openFeedbackModal(assignment)}
          >
            {tp('collaboration.actions.resume')}
          </Button>
        )}
        {assignment.state !== 'review' && (
          <Button
            size="small"
            loading={updating}
            onClick={() => updateAssignment(assignment, { state: 'review' })}
          >
            {tp('collaboration.actions.review')}
          </Button>
        )}
        <Button
          size="small"
          icon={<ClockCircleOutlined />}
          loading={updating}
          onClick={() => updateAssignment(assignment, { lease_seconds: 1800 })}
        >
          {tp('collaboration.actions.extendLease')}
        </Button>
        <Button
          size="small"
          danger
          loading={updating}
          onClick={() => updateAssignment(assignment, { state: 'cancelled' })}
        >
          {tp('collaboration.actions.cancel')}
        </Button>
      </Space>
    )
  }, [openFeedbackModal, openHandoffModal, tp, updateAssignment, updatingAssignmentId])

  const renderActiveAssignments = useCallback(() => {
    if (assignments.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tp('collaboration.noActiveAssignments')} />
    }

    return (
      <List
        size="small"
        dataSource={assignments}
        renderItem={assignment => (
          <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Space size={6} wrap>
                <Text strong>{assignment.agent?.name || `Agent #${assignment.agent_id}`}</Text>
                <Tag color={stateColor[assignment.state]}>{renderState(assignment.state)}</Tag>
              </Space>
              <Progress percent={assignment.progress_rate || 0} size="small" />
              <Space direction="vertical" size={2}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {tp('collaboration.fields.assignment')} #{assignment.id}
                </Text>
                {assignment.lease_expires_at && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {tp('collaboration.fields.leaseExpires')} {dayjs(assignment.lease_expires_at).format('YYYY-MM-DD HH:mm')}
                  </Text>
                )}
                {assignment.last_heartbeat_at && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {tp('collaboration.fields.lastHeartbeat')} {dayjs(assignment.last_heartbeat_at).format('YYYY-MM-DD HH:mm')}
                  </Text>
                )}
              </Space>
              {renderAssignmentActions(assignment)}
              {assignment.runs && assignment.runs.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {expandedRunId === assignment.runs[0].id ? (
                    <>
                      <Button
                        size="small"
                        type="link"
                        icon={<CodeOutlined />}
                        onClick={() => setExpandedRunId(null)}
                      >
                        {tp('collaboration.runLogs.hide') || '收起日志'}
                      </Button>
                      <div style={{ background: '#1e1e1e', borderRadius: 4, padding: 8, marginTop: 4, maxHeight: 200, overflow: 'auto', fontSize: 12, fontFamily: 'monospace' }}>
                        {(runLogs[assignment.runs[0].id] || []).length === 0 && runLogsLoading && <Spin size="small" />}
                        {(runLogs[assignment.runs[0].id] || []).map(log => (
                          <div key={log.id} style={{ marginBottom: 2 }}>
                            <Tag
                              color={log.level === 'error' ? 'red' : log.level === 'warn' ? 'gold' : log.level === 'debug' ? 'default' : 'blue'}
                              style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}
                            >
                              {log.level}
                            </Tag>
                            <span style={{ color: '#d4d4d4' }}>{log.message}</span>
                            <span style={{ color: '#666', marginLeft: 8 }}>{dayjs(log.created_at).format('HH:mm:ss')}</span>
                          </div>
                        ))}
                        {(runLogs[assignment.runs[0].id] || []).length === 0 && !runLogsLoading && (
                          <Text type="secondary" style={{ color: '#666' }}>暂无日志</Text>
                        )}
                      </div>
                    </>
                  ) : (
                    <Button
                      size="small"
                      type="link"
                      icon={<CodeOutlined />}
                      onClick={() => {
                        setExpandedRunId(assignment.runs[0].id)
                        loadRunLogs(assignment.runs[0].id)
                      }}
                    >
                      {tp('collaboration.runLogs.show') || '查看日志'}
                    </Button>
                  )}
                </div>
              )}
            </Space>
          </List.Item>
        )}
      />
    )
  }, [assignments, renderAssignmentActions, renderState, tp])

  const renderPayload = useCallback((event: TaskEvent) => {
    const payload = event.payload || {}

    if (event.event_type === 'task_claimed') {
      const capabilityMatch = isRecord(payload.capability_match) ? payload.capability_match : null
      const score = typeof capabilityMatch?.score === 'number' ? capabilityMatch.score : 0
      const matchedCapabilities = toStringList(capabilityMatch?.matched_capabilities)
      const matchedTags = toStringList(capabilityMatch?.matched_tags)
      const matchedText = toStringList(capabilityMatch?.matched_text)

      return (
        <Space size={[4, 4]} wrap>
          {'assignment_id' in payload && <Tag>{tp('collaboration.fields.assignment')} #{toDisplayValue(payload.assignment_id)}</Tag>}
          {'agent_id' in payload && <Tag>{tp('collaboration.fields.agent')} #{toDisplayValue(payload.agent_id)}</Tag>}
          {'run_id' in payload && <Tag>{tp('collaboration.fields.run')} #{toDisplayValue(payload.run_id)}</Tag>}
          {'lease_seconds' in payload && <Tag>{tp('collaboration.fields.lease')} {toDisplayValue(payload.lease_seconds)}s</Tag>}
          {'claim_mode' in payload && (
            <Tag color={payload.claim_mode === 'manual_dispatch' ? 'purple' : 'blue'}>
              {renderClaimMode(payload.claim_mode)}
            </Tag>
          )}
          {capabilityMatch && (
            <Tag color={score > 0 ? 'green' : 'default'}>
              {tp('collaboration.fields.matchStrategy')} {renderMatchStrategy(capabilityMatch.strategy)}
            </Tag>
          )}
          {capabilityMatch && (
            <Tag color={score > 0 ? 'green' : 'default'}>
              {tp('collaboration.fields.matchScore')} {score}
            </Tag>
          )}
          {matchedCapabilities.length > 0 && (
            <Tag color="cyan">
              {tp('collaboration.fields.matchedCapabilities')} {matchedCapabilities.slice(0, 4).join(', ')}
            </Tag>
          )}
          {matchedTags.length > 0 && (
            <Tag color="blue">
              {tp('collaboration.fields.matchedTags')} {matchedTags.slice(0, 4).join(', ')}
            </Tag>
          )}
          {matchedText.length > 0 && (
            <Tag color="geekblue">
              {tp('collaboration.fields.matchedText')} {matchedText.slice(0, 4).join(', ')}
            </Tag>
          )}
        </Space>
      )
    }

    if (event.event_type === 'task_dispatched') {
      const score = typeof payload.score === 'number' ? payload.score : 0
      const matchedCapabilities = toStringList(payload.matched_capabilities)

      return (
        <Space size={[4, 4]} wrap>
          {'to_agent_id' in payload && <Tag color="geekblue">@{payload.to_agent_name ? String(payload.to_agent_name) : `Agent #${toDisplayValue(payload.to_agent_id)}`}</Tag>}
          {'assignment_id' in payload && <Tag>{tp('collaboration.fields.assignment')} #{toDisplayValue(payload.assignment_id)}</Tag>}
          {'run_id' in payload && <Tag>{tp('collaboration.fields.run')} #{toDisplayValue(payload.run_id)}</Tag>}
          {'lease_seconds' in payload && <Tag>{tp('collaboration.fields.lease')} {toDisplayValue(payload.lease_seconds)}s</Tag>}
          {'strategy' in payload && (
            <Tag color={score > 0 ? 'green' : 'default'}>
              {tp('collaboration.fields.matchStrategy')} {renderMatchStrategy(payload.strategy)}
            </Tag>
          )}
          <Tag color={score > 0 ? 'green' : 'default'}>{tp('collaboration.fields.matchScore')} {score}</Tag>
          {matchedCapabilities.length > 0 && (
            <Tag color="cyan">
              {tp('collaboration.fields.matchedCapabilities')} {matchedCapabilities.slice(0, 4).join(', ')}
            </Tag>
          )}
        </Space>
      )
    }

    if (event.event_type === 'subtask_created') {
      return (
        <Space size={[4, 4]} wrap>
          <Tag color="cyan">{tp('collaboration.events.subtask_created')}</Tag>
          {'subtask_id' in payload && <Tag>#{toDisplayValue(payload.subtask_id)}</Tag>}
          {'subtask_title' in payload && <Text strong>{String(payload.subtask_title)}</Text>}
        </Space>
      )
    }

    if (event.event_type === 'assignment_updated') {
      return (
        <Space size={[4, 4]} wrap>
          <Tag>
            {renderState(payload.old_state)} {'->'} {renderState(payload.new_state)}
          </Tag>
          {'progress_rate' in payload && <Tag>{tp('collaboration.fields.progress')} {toDisplayValue(payload.progress_rate)}%</Tag>}
          {payload.has_feedback === true && <Tag color="purple">{tp('collaboration.fields.feedback')}</Tag>}
          {payload.feedback_excerpt && <Tag color="purple">{toDisplayValue(payload.feedback_excerpt)}</Tag>}
        </Space>
      )
    }

    if (event.event_type === 'assignment_expired') {
      return (
        <Space size={[4, 4]} wrap>
          {'assignment_id' in payload && <Tag>{tp('collaboration.fields.assignment')} #{toDisplayValue(payload.assignment_id)}</Tag>}
          {'run_id' in payload && payload.run_id && <Tag>{tp('collaboration.fields.run')} #{toDisplayValue(payload.run_id)}</Tag>}
          <Tag color="red">
            {renderState(payload.old_state)} {'->'} {renderState(payload.new_state)}
          </Tag>
          {'lease_expires_at' in payload && <Tag>{tp('collaboration.fields.leaseExpires')} {toDisplayValue(payload.lease_expires_at)}</Tag>}
        </Space>
      )
    }

    // question/answer protocol: show awaiting status and reply linkage
    if (event.event_type === 'question') {
      const awaiting = payload.awaiting_answer !== false
      return (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {typeof payload.content === 'string' && payload.content.trim() && (
            <Text style={{ whiteSpace: 'pre-wrap' }}>{String(payload.content)}</Text>
          )}
          <Space size={[4, 4]} wrap>
            {payload.to_agent_id != null && <Tag color="geekblue">@{payload.to_agent_name ? String(payload.to_agent_name) : `Agent #${payload.to_agent_id}`}</Tag>}
            <Tag color={awaiting ? 'orange' : 'green'}>{awaiting ? tp('collaboration.protocol.awaitingAnswer') : tp('collaboration.protocol.answered')}</Tag>
            {payload.answered_by_event_id != null && <Tag color="cyan">{tp('collaboration.protocol.answerEvent')} #{toDisplayValue(payload.answered_by_event_id)}</Tag>}
          </Space>
        </Space>
      )
    }

    if (event.event_type === 'answer') {
      return (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {typeof payload.content === 'string' && payload.content.trim() && (
            <Text style={{ whiteSpace: 'pre-wrap' }}>{String(payload.content)}</Text>
          )}
          <Space size={[4, 4]} wrap>
            {payload.reply_to_event_id != null && <Tag color="purple">{tp('collaboration.protocol.replyTo')} #{toDisplayValue(payload.reply_to_event_id)}</Tag>}
            {payload.to_agent_id != null && <Tag color="geekblue">@{payload.to_agent_name ? String(payload.to_agent_name) : `Agent #${payload.to_agent_id}`}</Tag>}
          </Space>
        </Space>
      )
    }

    const hasContent = typeof payload.content === 'string' && payload.content.trim() !== ''
    const hiddenKeys = new Set(['content', 'to_agent_id', 'to_agent_name'])
    const otherEntries = Object.entries(payload).filter(
      ([key, value]) => !hiddenKeys.has(key) && value !== undefined && value !== null
    )

    if (!hasContent && otherEntries.length === 0) {
      return null
    }

    return (
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {hasContent && (
          <Text style={{ whiteSpace: 'pre-wrap' }}>{String(payload.content)}</Text>
        )}
        {otherEntries.length > 0 && (
          <Space size={[4, 4]} wrap>
            {otherEntries.slice(0, 4).map(([key, value]) => (
              <Tag key={key}>{key}: {toDisplayValue(value)}</Tag>
            ))}
          </Space>
        )}
      </Space>
    )
  }, [renderClaimMode, renderMatchStrategy, renderState, tp])

  const agentNames = useMemo(() => {
    const map = new Map<number, string>()
    assignments.forEach(a => {
      if (a.agent?.id && a.agent.name) map.set(a.agent.id, a.agent.name)
    })
    events.forEach(e => {
      if (e.actor_agent_id && e.actor_agent?.name) map.set(e.actor_agent_id, e.actor_agent.name)
    })
    return map
  }, [assignments, events])

  const agentLabel = useCallback(
    (id?: number | null) => (id ? agentNames.get(id) || `Agent #${id}` : tp('collaboration.lineage.unassigned')),
    [agentNames, tp],
  )

  // 流转链路：按事件顺序派生「谁持有任务 → 如何流转 → 下一个持有者」
  const lineage = useMemo(() => {
    const num = (v: unknown): number | null => {
      const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
      return Number.isFinite(n) ? n : null
    }
    const ordered = [...events].sort((a, b) => a.id - b.id)
    const steps: Array<{ from: number | null; to: number | null; via: string }> = []
    ordered.forEach(event => {
      const p = (event.payload || {}) as Record<string, unknown>
      if (event.event_type === 'task_claimed') {
        const to = num(p.agent_id) ?? event.actor_agent_id ?? null
        steps.push({ from: null, to, via: p.claim_mode === 'manual_dispatch' ? 'manual_dispatch' : 'claim' })
      } else if (event.event_type === 'task_dispatched') {
        const from = num(p.dispatched_by_agent_id) ?? event.actor_agent_id ?? null
        steps.push({ from, to: num(p.to_agent_id), via: 'dispatch' })
      } else if (event.event_type === 'handoff') {
        steps.push({ from: num(p.from_agent_id), to: num(p.to_agent_id), via: 'handoff' })
      }
    })
    return steps
  }, [events])

  const items = useMemo(() => events.map(event => ({
    color: eventColor[event.event_type] || 'gray',
    dot: actorIcon(event),
    children: (
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space size={8} wrap>
          <Text strong>{renderEventTitle(event)}</Text>
          <Text type="secondary">{actorLabel(event)}</Text>
        </Space>
        {renderPayload(event)}
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(event.created_at).format('YYYY-MM-DD HH:mm')}
        </Text>
      </Space>
    ),
  })), [actorLabel, events, renderEventTitle, renderPayload])

  return (
    <>
      <Card
        title={tp('collaboration.title')}
        style={{ marginTop: 16 }}
        extra={(
          <Space size={8}>
            <Tooltip title={tp('collaboration.live.tooltip')}>
              <Switch
                size="small"
                checked={liveMode}
                onChange={setLiveMode}
                checkedChildren={tp('collaboration.live.on')}
                unCheckedChildren={tp('collaboration.live.off')}
              />
            </Tooltip>
            <Tooltip title={tp('collaboration.dispatch.open')}>
              <Button
                aria-label={tp('collaboration.dispatch.open')}
                icon={<SendOutlined />}
                size="small"
                type="primary"
                onClick={openDispatchModal}
              />
            </Tooltip>
            <Tooltip title={tp('actions.refresh')}>
              <Button
                aria-label={tp('actions.refresh')}
                icon={<ReloadOutlined />}
                size="small"
                onClick={() => loadCollaboration()}
              />
            </Tooltip>
          </Space>
        )}
      >
        <Spin spinning={loading}>
          {loadFailed ? (
            <Text type="danger">{tp('collaboration.loadFailed')}</Text>
          ) : (
            <>
              <Text strong>{tp('collaboration.activeAssignments')}</Text>
              <div style={{ marginTop: 8 }}>
                {renderActiveAssignments()}
              </div>
              {lineage.length > 0 && (
                <>
                  <Divider style={{ margin: '16px 0' }} />
                  <Text strong>{tp('collaboration.lineage.title')}</Text>
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', rowGap: 8 }}>
                    {lineage.map((step, index) => {
                      const showFrom = index === 0 && step.from != null
                      return (
                        <React.Fragment key={index}>
                          {showFrom && <Tag color="default">{agentLabel(step.from)}</Tag>}
                          <Text type="secondary" style={{ margin: '0 6px', fontSize: 12, whiteSpace: 'nowrap' }}>
                            ──{tp(`collaboration.lineage.via.${step.via}`)}→
                          </Text>
                          <Tag color={lineageColor[step.via] || 'blue'}>{agentLabel(step.to)}</Tag>
                        </React.Fragment>
                      )
                    })}
                  </div>
                </>
              )}
              <Divider style={{ margin: '16px 0' }} />
              <Text strong>{tp('collaboration.eventTimeline')}</Text>
              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <Select
                      value={composerType}
                      onChange={value => setComposerType(value as PostableTaskEventType)}
                      options={composerTypeOptions}
                      style={{ width: 130 }}
                    />
                    <Input
                      value={composerContent}
                      onChange={e => setComposerContent(e.target.value)}
                      onPressEnter={postMessage}
                      placeholder={tp('collaboration.composer.placeholder')}
                      disabled={posting}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      loading={posting}
                      disabled={!composerContent.trim()}
                      onClick={postMessage}
                    >
                      {tp('collaboration.composer.send')}
                    </Button>
                  </Space.Compact>
                  <Select
                    allowClear
                    showSearch
                    value={composerToAgentId}
                    onChange={setComposerToAgentId}
                    placeholder={tp('collaboration.composer.mentionPlaceholder')}
                    style={{ width: '100%' }}
                    optionFilterProp="label"
                    options={dispatchAgents.map(agent => ({
                      value: agent.id,
                      label: agent.name,
                    }))}
                  />
                </Space>
              </div>
              <div style={{ marginTop: 12 }}>
                {events.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={tp('collaboration.empty')} />
                ) : (
                  <Timeline items={items} />
                )}
              </div>
            </>
          )}
        </Spin>
      </Card>
      <Modal
        title={tp('collaboration.dispatch.title')}
        open={dispatchOpen}
        onOk={submitDispatch}
        onCancel={() => {
          setDispatchOpen(false)
          dispatchForm.resetFields()
        }}
        confirmLoading={dispatchSubmitting}
        okText={tp('collaboration.dispatch.submit')}
        cancelText={tp('collaboration.dispatch.cancel')}
      >
        <Form form={dispatchForm} layout="vertical">
          <Form.Item
            name="agent_id"
            label={tp('collaboration.dispatch.agent')}
            rules={[{ required: true, message: tp('collaboration.dispatch.agentRequired') }]}
          >
            <Select
              loading={dispatchLoading}
              showSearch
              optionFilterProp="label"
              placeholder={tp('collaboration.dispatch.agentPlaceholder')}
              options={dispatchAgents.map(agent => ({
                value: agent.id,
                label: `${agent.name} · ${agent.kind} · ${agent.status}`,
                disabled: agent.status === 'paused' || agent.status === 'disabled',
              }))}
            />
          </Form.Item>
          <Form.Item
            name="lease_minutes"
            label={tp('collaboration.dispatch.leaseMinutes')}
            rules={[{ required: true, message: tp('collaboration.dispatch.leaseRequired') }]}
          >
            <InputNumber min={1} max={1440} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label={tp('collaboration.dispatch.notes')}>
            <TextArea rows={3} placeholder={tp('collaboration.dispatch.notesPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={tp('collaboration.feedback.title')}
        open={!!feedbackAssignment}
        onOk={submitHumanFeedback}
        onCancel={() => {
          setFeedbackAssignment(null)
          feedbackForm.resetFields()
        }}
        confirmLoading={feedbackSubmitting}
        okText={tp('collaboration.feedback.submit')}
        cancelText={tp('collaboration.feedback.cancel')}
      >
        <Form form={feedbackForm} layout="vertical">
          <Form.Item
            name="feedback_content"
            label={tp('collaboration.feedback.label')}
            rules={[{ required: true, message: tp('collaboration.feedback.required') }]}
          >
            <TextArea rows={5} placeholder={tp('collaboration.feedback.placeholder')} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={tp('collaboration.handoff.title')}
        open={!!handoffAssignment}
        onOk={submitHandoff}
        onCancel={() => {
          setHandoffAssignment(null)
          handoffForm.resetFields()
        }}
        confirmLoading={handoffSubmitting}
        okText={tp('collaboration.handoff.submit')}
        cancelText={tp('collaboration.handoff.cancel')}
      >
        {handoffAssignment && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            {tp('collaboration.handoff.from')} {handoffAssignment.agent?.name || `Agent #${handoffAssignment.agent_id}`}
          </Text>
        )}
        <Form form={handoffForm} layout="vertical">
          <Form.Item
            name="to_agent_id"
            label={tp('collaboration.handoff.toAgent')}
            rules={[{ required: true, message: tp('collaboration.handoff.toAgentRequired') }]}
          >
            <Select
              loading={dispatchLoading}
              showSearch
              optionFilterProp="label"
              placeholder={tp('collaboration.handoff.toAgentPlaceholder')}
              options={dispatchAgents
                .filter(agent => agent.id !== handoffAssignment?.agent_id)
                .map(agent => ({
                  value: agent.id,
                  label: `${agent.name} · ${agent.kind} · ${agent.status}`,
                  disabled: agent.status === 'paused' || agent.status === 'disabled',
                }))}
            />
          </Form.Item>
          <Form.Item
            name="lease_minutes"
            label={tp('collaboration.handoff.leaseMinutes')}
            rules={[{ required: true, message: tp('collaboration.dispatch.leaseRequired') }]}
          >
            <InputNumber min={1} max={1440} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label={tp('collaboration.handoff.reason')}>
            <TextArea rows={3} placeholder={tp('collaboration.handoff.reasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
