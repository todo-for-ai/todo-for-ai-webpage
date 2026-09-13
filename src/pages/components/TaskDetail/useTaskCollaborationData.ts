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

const { Text } = Typography

/**
 * 任务协作时间线的数据层：事件/指派状态、轮询与 SSE 实时刷新、运行日志。
 * 动作层在 useTaskAssignmentActions（原样拆分，行为不变）。
 */
export function useTaskCollaborationData(taskId: number) {
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


  return {
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
  }
}
