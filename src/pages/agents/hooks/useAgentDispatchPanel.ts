/**
 * Agents.tsx 派发面板领域块：任务认领、派发预览/执行/策略、审查队列。
 * 从 Agents.tsx 原样抽出，逻辑零改动。
 * 跨域状态/回调经 ctx 注入（调用点用 getter 惰性求值，规避渲染期 TDZ）：
 * selectedAgent/setSelectedAgent/setAgents/setDrawerOpen/setAssignmentLoading/
 * assignmentLoading 属共享状态层，所有权在组件；loaders 为各领域刷新回调。
 */

import { useMemo, useState } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../../api/agents'
import type {
  Agent, TaskAssignment, TaskAssignmentState,
  ReviewQueueItem, DispatchPreviewResult, DispatchTasksData,
} from '../../../api/agents'
import {
  DEFAULT_DISPATCH_PREVIEW_OPTIONS, normalizeDispatchOptions,
  withAgentDispatchPolicy, getClaimMatch, toStringList, matchStrategyLabel,
  normalizeDispatchPolicyPayload, getAgentDispatchPolicy,
} from '../utils'

export interface DispatchPanelCtx {
  selectedAgent: Agent | null
  agents: Agent[]
  setSelectedAgent: (a: Agent | null) => void
  setAgents: (a: Agent[] | ((prev: Agent[]) => Agent[])) => void
  setDrawerOpen: (v: boolean) => void
  setAssignmentLoading: (v: boolean) => void
  assignmentLoading: boolean
  loadCollaborators: (agent: Agent) => unknown
  loadExperiences: (agent: Agent) => unknown
  loadKnowledge: (agent: Agent) => unknown
  loadAgents: (o?: { silent?: boolean }) => unknown
  form: { setFieldsValue: (v: unknown) => void }
  loadInbox: (agent: Agent) => unknown
  loadAgentReputation: (agent: Agent) => unknown
  loadAgentSandbox: (agent: Agent) => unknown
  loadReviewQueue: (o?: { silent?: boolean }) => unknown
  feedbackForm: { setFieldsValue: (v: unknown) => void }
  drawerOpen: boolean
}

export function useAgentDispatchPanel(ctx: DispatchPanelCtx) {
  const { selectedAgent, agents, setSelectedAgent, setAgents, setDrawerOpen, loadInbox, loadAgentReputation, loadAgentSandbox, loadReviewQueue, drawerOpen, feedbackForm, setAssignmentLoading, assignmentLoading, loadCollaborators, loadExperiences, loadKnowledge, loadAgents, form } = ctx

  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
  const [claimTaskId, setClaimTaskId] = useState<number | null>(null)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)
  const [feedbackReviewItem, setFeedbackReviewItem] = useState<ReviewQueueItem | null>(null)
  const [dispatchPreviewOpen, setDispatchPreviewOpen] = useState(false)
  const [dispatchPreviewAgent, setDispatchPreviewAgent] = useState<Agent | null>(null)
  const [dispatchPreview, setDispatchPreview] = useState<DispatchPreviewResult | null>(null)
  const [dispatchPreviewLoading, setDispatchPreviewLoading] = useState(false)
  const [dispatchPreviewApplying, setDispatchPreviewApplying] = useState(false)
  const [dispatchPolicySaving, setDispatchPolicySaving] = useState(false)
  const [dispatchPolicyDirty, setDispatchPolicyDirty] = useState(false)
  const [dispatchPreviewOptions, setDispatchPreviewOptions] = useState<DispatchTasksData>(DEFAULT_DISPATCH_PREVIEW_OPTIONS)

  const loadAssignments = async (agent: Agent, options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (!silent) {
      setSelectedAgent(agent)
      setDrawerOpen(true)
      setAssignmentLoading(true)
      loadInbox(agent)
      loadKnowledge(agent)
      loadAgentReputation(agent)
      loadExperiences(agent)
      loadAgentSandbox(agent)
      loadCollaborators(agent)
    }
    try {
      const result = await agentsApi.getAgentAssignments(agent.id, { per_page: 50 })
      setAssignments(result.items)
    } catch {
      if (!silent) message.error('加载派发记录失败')
    } finally {
      if (!silent) setAssignmentLoading(false)
    }
  }
  const showClaimSuccess = (result: NonNullable<Awaited<ReturnType<typeof agentsApi.claimTask>>>) => {
    const capabilityMatch = getClaimMatch(result.run.run_metadata)
    const matchedCapabilities = toStringList(capabilityMatch?.matched_capabilities)
    const score = typeof capabilityMatch?.score === 'number' ? capabilityMatch.score : 0

    if (!capabilityMatch) {
      message.success(`已领取任务 #${result.assignment.task_id}`)
      return
    }

    const matchedText = matchedCapabilities.length > 0
      ? `，命中 ${matchedCapabilities.slice(0, 3).join(', ')}`
      : ''

    message.success(
      `已领取任务 #${result.assignment.task_id}（${matchStrategyLabel(capabilityMatch.strategy)}，分数 ${score}${matchedText}）`,
    )
  }
  const claimTask = async (agent: Agent, taskId?: number | null, matchCapabilities = true) => {
    try {
      const payload = taskId ? { task_id: taskId } : { match_capabilities: matchCapabilities }
      const result = await agentsApi.claimTask(agent.id, payload)
      if (!result) {
        message.info('当前没有可领取任务')
        return
      }
      showClaimSuccess(result)
      setClaimTaskId(null)
      loadAgents()
      loadReviewQueue()
      if (drawerOpen) {
        loadAssignments(agent)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '领取任务失败')
    }
  }
  const updateDispatchPreviewOptions = (patch: Partial<DispatchTasksData>) => {
    setDispatchPreviewOptions(prev => ({
      ...prev,
      ...patch,
    }))
    setDispatchPolicyDirty(true)
    setDispatchPreview(null)
  }
  const dispatchTasks = async (agent: Agent, options: DispatchTasksData = {}) => {
    try {
      const result = await agentsApi.dispatchTasks(agent.id, normalizeDispatchOptions(options))
      const { dispatched, claimable_tasks, available_agents } = result.summary
      if (dispatched === 0) {
        message.info(
          available_agents === 0
            ? '没有空闲的可派活 Agent'
            : claimable_tasks === 0
              ? '当前没有待派发的任务'
              : '没有可派发的任务（可能均无匹配 Agent）',
        )
      } else {
        const detail = result.assignments
          .slice(0, 3)
          .map((item) => `#${item.assignment.task_id}→${item.agent?.name || `Agent ${item.assignment.agent_id}`}`)
          .join('，')
        message.success(
          `协调器 ${result.coordinator.name} 派发 ${dispatched}/${claimable_tasks} 个任务给 ${available_agents} 个空闲 Agent${detail ? `：${detail}` : ''}`,
        )
      }
      loadAgents()
      loadReviewQueue()
      if (drawerOpen) {
        loadAssignments(agent)
      }
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : '自动派活失败')
      return false
    }
  }
  const previewDispatchTasks = async (agent: Agent, options?: DispatchTasksData) => {
    const hasExplicitOptions = !!options
    let nextOptions = options || getAgentDispatchPolicy(agent)
    setDispatchPreviewOptions(nextOptions)
    setDispatchPreviewAgent(agent)
    setDispatchPreviewOpen(true)
    setDispatchPreviewLoading(true)
    setDispatchPreview(null)
    try {
      if (!hasExplicitOptions) {
        const { policy } = await agentsApi.getDispatchPolicy(agent.id)
        nextOptions = policy
        const agentWithLatestPolicy = withAgentDispatchPolicy(agent, policy)
        setDispatchPreviewAgent(agentWithLatestPolicy)
        setDispatchPreviewOptions(nextOptions)
        setDispatchPolicyDirty(false)
        setAgents(prev => prev.map(item => item.id === agent.id ? agentWithLatestPolicy : item))
      }
      const result = await agentsApi.previewDispatchTasks(agent.id, normalizeDispatchOptions(nextOptions))
      setDispatchPreview(result)
      setDispatchPreviewOptions(result.options || nextOptions)
      if (!hasExplicitOptions) {
        setDispatchPolicyDirty(false)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '派活预览失败')
    } finally {
      setDispatchPreviewLoading(false)
    }
  }
  const saveDispatchPolicy = async () => {
    if (!dispatchPreviewAgent) {
      return
    }

    setDispatchPolicySaving(true)
    try {
      const result = await agentsApi.updateDispatchPolicy(
        dispatchPreviewAgent.id,
        normalizeDispatchPolicyPayload(dispatchPreviewOptions),
      )
      setDispatchPreviewAgent(result.coordinator)
      setDispatchPreviewOptions(result.policy)
      setDispatchPolicyDirty(false)
      setAgents(prev => prev.map(agent => agent.id === result.coordinator.id ? result.coordinator : agent))
      message.success('派活策略已保存')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存派活策略失败')
    } finally {
      setDispatchPolicySaving(false)
    }
  }
  const applyDispatchPreview = async () => {
    if (!dispatchPreviewAgent) {
      return
    }

    setDispatchPreviewApplying(true)
    try {
      const dispatched = await dispatchTasks(dispatchPreviewAgent, dispatchPreviewOptions)
      if (dispatched) {
        setDispatchPreviewOpen(false)
        setDispatchPreview(null)
      }
    } finally {
      setDispatchPreviewApplying(false)
    }
  }
  const updateAssignmentState = async (assignment: TaskAssignment, state: TaskAssignmentState) => {
    if (!selectedAgent) {
      return
    }

    try {
      await agentsApi.updateAssignment(selectedAgent.id, assignment.id, { state })
      message.success('派发状态已更新')
      loadAssignments(selectedAgent)
      loadAgents()
      loadReviewQueue()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新派发状态失败')
    }
  }
  const updateReviewQueueItem = async (
    item: ReviewQueueItem,
    action: 'approve' | 'resume' | 'cancel',
  ) => {
    if (action === 'resume' && item.action === 'human_feedback') {
      setFeedbackReviewItem(item)
      feedbackForm.setFieldsValue({
        feedback_content: '',
      })
      setFeedbackModalOpen(true)
      return
    }

    const taskId = item.assignment.task_id
    const assignmentId = item.assignment.id

    try {
      if (action === 'approve') {
        await agentsApi.updateTaskAssignment(taskId, assignmentId, {
          state: 'done',
          progress_rate: 100,
          task_status: 'done',
        })
        message.success('任务已审核完成')
      } else if (action === 'resume') {
        await agentsApi.updateTaskAssignment(taskId, assignmentId, {
          state: 'running',
          task_status: 'in_progress',
        })
        message.success('已退回 Agent 继续执行')
      } else {
        await agentsApi.updateTaskAssignment(taskId, assignmentId, {
          state: 'cancelled',
          task_status: 'cancelled',
        })
        message.success('派发已取消')
      }

      loadReviewQueue()
      loadAgents()
      if (selectedAgent && selectedAgent.id === item.assignment.agent_id) {
        loadAssignments(selectedAgent)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '更新审核队列失败')
    }
  }


  const dispatchCandidateOptions = useMemo(() => {
    return agents
      .filter(agent => {
        if (agent.status !== 'active') {
          return false
        }
        if (agent.kind !== 'coordinator') {
          return true
        }
        return dispatchPreviewOptions.include_self && agent.id === dispatchPreviewAgent?.id
      })
      .map(agent => ({
        label: `${agent.name} · ${agent.kind}`,
        value: agent.id,
      }))
  }, [agents, dispatchPreviewAgent?.id, dispatchPreviewOptions.include_self])
  return {
    dispatchCandidateOptions,
    applyDispatchPreview,
    assignments,
    claimTask,
    claimTaskId,
    dispatchPolicyDirty,
    dispatchPolicySaving,
    dispatchPreview,
    dispatchPreviewAgent,
    dispatchPreviewApplying,
    dispatchPreviewLoading,
    dispatchPreviewOpen,
    dispatchPreviewOptions,
    dispatchTasks,
    feedbackModalOpen,
    feedbackReviewItem,
    loadAssignments,
    previewDispatchTasks,
    saveDispatchPolicy,
    setAssignments,
    setClaimTaskId,
    setDispatchPolicyDirty,
    setDispatchPolicySaving,
    setDispatchPreview,
    setDispatchPreviewAgent,
    setDispatchPreviewApplying,
    setDispatchPreviewLoading,
    setDispatchPreviewOpen,
    setDispatchPreviewOptions,
    setFeedbackModalOpen,
    setFeedbackReviewItem,
    showClaimSuccess,
    updateAssignmentState,
    updateDispatchPreviewOptions,
    updateReviewQueueItem,
  }
}
