/**
 * 任务协作时间线组件
 *
 * 展示任务分配、事件时间线、流转链路，支持实时更新。
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Divider, Empty, Form, Input, InputNumber, List, Modal, Progress, Select, Space, Spin, Switch, Tag, Timeline, Tooltip, Typography, message } from 'antd'
import { ReloadOutlined, SendOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCollaborationSSE } from '../../../hooks/useCollaborationSSE'
import {
  agentsApi,
  type Agent,
  type PostableTaskEventType,
  type RunLogEntry,
  type TaskAssignment,
  type TaskEvent,
  type UpdateAssignmentData,
} from '../../../api/agents'
import {
  actorIcon,
  eventColor,
  lineageColor,
  stateColor,
} from './collaborationUtils'
import EventPayloadRenderer from './EventPayloadRenderer'

import { useTaskCollaborationData } from './useTaskCollaborationData'
import { useTaskAssignmentActions } from './useTaskAssignmentActions'
import { TaskCollaborationModals } from './TaskCollaborationModals'
const { Text } = Typography
const { TextArea } = Input

interface TaskCollaborationTimelineProps {
  taskId: number
  tp: (key: string, options?: any) => string
}

export const TaskCollaborationTimeline: React.FC<TaskCollaborationTimelineProps> = ({ taskId, tp }) => {
  const data = useTaskCollaborationData(taskId)
  const actions = useTaskAssignmentActions(taskId, tp, data)
  const {
    assignments,
    composerContent,
    composerToAgentId,
    composerType,
    dispatchAgents,
    dispatchForm,
    dispatchLoading,
    dispatchOpen,
    dispatchSubmitting,
    events,
    expandedRunId,
    feedbackAssignment,
    feedbackForm,
    feedbackSubmitting,
    handoffAssignment,
    handoffForm,
    handoffSubmitting,
    liveMode,
    loadCollaboration,
    loadFailed,
    loadRunLogs,
    loading,
    posting,
    runLogs,
    runLogsLoading,
    setAssignments,
    setComposerContent,
    setComposerToAgentId,
    setComposerType,
    setDispatchAgents,
    setDispatchLoading,
    setDispatchOpen,
    setDispatchSubmitting,
    setEvents,
    setExpandedRunId,
    setFeedbackAssignment,
    setFeedbackSubmitting,
    setHandoffAssignment,
    setHandoffSubmitting,
    setLiveMode,
    setLoadFailed,
    setLoading,
    setPosting,
    setRunLogs,
    setRunLogsLoading,
    setUpdatingAssignmentId,
    updatingAssignmentId,
    updateAssignment,
    openFeedbackModal,
    loadDispatchAgents,
    openDispatchModal,
    submitDispatch,
    submitHumanFeedback,
    postMessage,
    openHandoffModal,
    submitHandoff,
  } = { ...data, ...actions }

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

  const renderAssignmentActions = useCallback((assignment: TaskAssignment) => {
    const updating = updatingAssignmentId === assignment.id

    return (
      <Space size={4} wrap>
        <Button
          size="small"
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
  }, [assignments, loadRunLogs, renderAssignmentActions, renderState, runLogs, runLogsLoading, expandedRunId, tp])

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
        <EventPayloadRenderer
          event={event}
          tp={tp}
          renderClaimMode={renderClaimMode}
          renderMatchStrategy={renderMatchStrategy}
          renderState={renderState}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(event.created_at).format('YYYY-MM-DD HH:mm')}
        </Text>
      </Space>
    ),
  })), [actorLabel, events, renderClaimMode, renderEventTitle, renderMatchStrategy, renderState, tp])
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
      <TaskCollaborationModals {...({ ...data, ...actions, tp } as any)} />
    </>
  )
}
