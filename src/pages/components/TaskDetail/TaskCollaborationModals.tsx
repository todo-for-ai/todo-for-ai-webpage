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

import type { useTaskCollaborationData } from './useTaskCollaborationData'
import type { useTaskAssignmentActions } from './useTaskAssignmentActions'

const { Text } = Typography

const { TextArea } = Input

interface Props extends ReturnType<typeof useTaskCollaborationData>, ReturnType<typeof useTaskAssignmentActions> {
  tp: (k: string, opts?: any) => string
}

/**
 * 任务协作时间线的反馈/派发/交接三个 Modal。props 收双 hook 合并包与 tp，
 * 由 TaskCollaborationTimeline 原样拆出。
 */
export function TaskCollaborationModals(props: Props) {
  const {
    dispatchAgents,
    dispatchForm,
    dispatchLoading,
    dispatchOpen,
    dispatchSubmitting,
    feedbackAssignment,
    feedbackForm,
    feedbackSubmitting,
    handoffAssignment,
    handoffForm,
    handoffSubmitting,
    loading,
    setDispatchOpen,
    setFeedbackAssignment,
    setHandoffAssignment,
    submitDispatch,
    submitHandoff,
    submitHumanFeedback,
    tp,
  } = props

  return (
    <>
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
