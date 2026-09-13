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
import type { useTaskCollaborationData } from './useTaskCollaborationData'

type DataHook = ReturnType<typeof useTaskCollaborationData>

/**
 * 任务协作的动作层：指派更新/人工反馈/派发/交接/发帖。
 * 接收数据层返回包（仅类型级引用），由原单文件组件原样拆出。
 */
type Tp = (key: string, options?: any) => string

export function useTaskAssignmentActions(taskId: number, tp: Tp, data: DataHook) {
  const {
    assignments,
    composerContent,
    composerToAgentId,
    composerType,
    dispatchForm,
    events,
    expandedRunId,
    feedbackAssignment,
    feedbackForm,
    handoffAssignment,
    handoffForm,
    loadCollaboration,
    loadRunLogs,
    loading,
    runLogs,
    runLogsLoading,
    setComposerContent,
    setComposerToAgentId,
    setComposerType,
    setDispatchAgents,
    setDispatchLoading,
    setDispatchOpen,
    setDispatchSubmitting,
    setExpandedRunId,
    setFeedbackAssignment,
    setFeedbackSubmitting,
    setHandoffAssignment,
    setHandoffSubmitting,
    setPosting,
    setUpdatingAssignmentId,
    updatingAssignmentId,
  } = data

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

  return {
    updateAssignment,
    openFeedbackModal,
    loadDispatchAgents,
    openDispatchModal,
    submitDispatch,
    submitHumanFeedback,
    postMessage,
    openHandoffModal,
    submitHandoff,
  }
}