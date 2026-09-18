/**
 * Agents 页组合根：把全部领域 hook、局部状态、派生处理器收敛为一个扁平上下文，
 * 页面壳（Agents.tsx）只负责把它展开注入三个视图区块（原样搬移自 Agents.tsx，无行为变更）。
 * 领域块按域拆分：useAgentCrudActions / useAgentChannelsPanel / useAgentDispatchPanel /
 * useAgentLiveDashboard / useAgentInboxDmTasks / useAgentIntelligencePanel /
 * useAgentCollabKnowledgePanel / useAgentSandboxPanel / useAgentStepOverrides / useAgentConflicts。
 */
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Form, message } from 'antd'
import type { Agent } from '../../api/agents'
import { agentsApi } from '../../api/agents'
import { useAgentSandboxPanel } from './hooks/useAgentSandboxPanel'
import { useAgentChannelsPanel } from './hooks/useAgentChannelsPanel'
import { useAgentIntelligencePanel } from './hooks/useAgentIntelligencePanel'
import { useAgentInboxDmTasks } from './hooks/useAgentInboxDmTasks'
import { useAgentDispatchPanel } from './hooks/useAgentDispatchPanel'
import { useAgentCollabKnowledgePanel } from './hooks/useAgentCollabKnowledgePanel'
import { useAgentStepOverrides } from './hooks/useAgentStepOverrides'
import { useAgentConflicts } from './hooks/useAgentConflicts'
import { useAgentCrudActions } from './hooks/useAgentCrudActions'
import { useAgentLiveDashboard } from './hooks/useAgentLiveDashboard'
import { buildAgentsTableColumns } from './agentsTableColumns'

export function useAgentsPage() {
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const pendingAgentId = searchParams.get('agent_id')
  const [autoOpened, setAutoOpened] = useState(false)
  const [autoOpenedConflicts, setAutoOpenedConflicts] = useState(false)
  // Agent CRUD/广播/声誉/沙盒域块
  const crud = useAgentCrudActions({ selectedAgent })
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)

  // Channels：频道/聊天领域块
  const channelsPanel = useAgentChannelsPanel()

  // 派发面板领域块（经 getter 注入跨域依赖，保持实时读取）
  const dispatchPanel = useAgentDispatchPanel({
    get selectedAgent() { return selectedAgent },
    get agents() { return crud.agents },
    get loadInbox() { return inbox.loadInbox },
    get loadAgentReputation() { return crud.loadAgentReputation },
    get loadAgentSandbox() { return crud.loadAgentSandbox },
    get loadReviewQueue() { return crud.loadReviewQueue },
    get drawerOpen() { return drawerOpen },
    get feedbackForm() { return feedbackForm },
    get setSelectedAgent() { return setSelectedAgent },
    get setAgents() { return crud.setAgents },
    get setDrawerOpen() { return setDrawerOpen },
    get setAssignmentLoading() { return setAssignmentLoading },
    get assignmentLoading() { return assignmentLoading },
    get loadCollaborators() { return intelligence.loadCollaborators },
    get loadExperiences() { return intelligence.loadExperiences },
    get loadKnowledge() { return collabKnowledge.loadKnowledge },
    get loadAgents() { return crud.loadAgents },
    get form() { return crud.form },
  })

  // 实时看板域块
  const liveDashboard = useAgentLiveDashboard({
    agents: crud.agents,
    statusFilter: crud.statusFilter,
    searchText: crud.searchText,
    reviewActionFilter: crud.reviewActionFilter,
    drawerOpen,
    selectedAgent,
    loadAgents: crud.loadAgents,
    loadReviewQueue: crud.loadReviewQueue,
    loadAssignments: dispatchPanel.loadAssignments,
  })

  // 收件箱/私信/推荐任务三小块
  const inbox = useAgentInboxDmTasks()

  // Agent 智能面板领域块
  const intelligence = useAgentIntelligencePanel(selectedAgent, () => crud.loadAgents)
  // 协作模板 + 知识库领域块
  const collabKnowledge = useAgentCollabKnowledgePanel(selectedAgent, () => crud.loadAgents)

  // 沙盒面板领域块
  const sandboxPanel = useAgentSandboxPanel()
  // Workflow step dynamic reconfiguration 域块
  const stepOverrides = useAgentStepOverrides()
  // Conflict detection & resolution 域块
  const conflicts = useAgentConflicts()

  const [feedbackForm] = Form.useForm()

  useEffect(() => {
    crud.loadAgents()
    inbox.loadNotifications()
    liveDashboard.loadDashboardStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crud.statusFilter])

  // 从 URL ?agent_id= 自动打开对应 Agent 的 Drawer（指挥中心等外部跳转入口）
  useEffect(() => {
    if (!pendingAgentId || autoOpened || crud.agents.length === 0) return
    const target = crud.agents.find((a) => String(a.id) === String(pendingAgentId))
    if (target) {
      setAutoOpened(true)
      dispatchPanel.loadAssignments(target)
      // 清除 URL 参数，避免刷新或返回时重复打开
      const next = new URLSearchParams(searchParams)
      next.delete('agent_id')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAgentId, crud.agents, autoOpened])

  // 从 URL ?conflicts=1 自动打开冲突管理 Drawer（指挥中心冲突跳转入口）
  useEffect(() => {
    if (searchParams.get('conflicts') !== '1' || autoOpenedConflicts) return
    setAutoOpenedConflicts(true)
    conflicts.openConflicts()
    const next = new URLSearchParams(searchParams)
    next.delete('conflicts')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, autoOpenedConflicts])

  useEffect(() => {
    crud.loadReviewQueue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crud.reviewActionFilter])

  const resolveProtocol = async (protocolId: number, resolution: string) => {
    try {
      await agentsApi.resolveProtocol(protocolId, { resolution })
      message.success(`协议已${resolution === 'accepted' ? '接受' : resolution === 'rejected' ? '拒绝' : '取消'}`)
      if (intelligence.protocolDetail) intelligence.openProtocolDetail(intelligence.protocolDetail.id)
      intelligence.loadProtocols()
    } catch { message.error('操作失败') }
  }

  const submitHumanFeedback = async () => {
    if (!dispatchPanel.feedbackReviewItem) {
      return
    }

    try {
      const values = await feedbackForm.validateFields()
      setFeedbackSubmitting(true)
      await agentsApi.updateTaskAssignment(dispatchPanel.feedbackReviewItem.assignment.task_id, dispatchPanel.feedbackReviewItem.assignment.id, {
        state: 'running',
        task_status: 'in_progress',
        feedback_content: values.feedback_content,
        notes: values.feedback_content,
        lease_seconds: 1800,
      })

      message.success('反馈已提交，Agent 可继续执行')
      dispatchPanel.setFeedbackModalOpen(false)
      dispatchPanel.setFeedbackReviewItem(null)
      feedbackForm.resetFields()
      crud.loadReviewQueue()
      crud.loadAgents()
      if (selectedAgent && selectedAgent.id === dispatchPanel.feedbackReviewItem.assignment.agent_id) {
        dispatchPanel.loadAssignments(selectedAgent)
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  // 表格列定义（处理器经 ctx 注入）
  const { columns, assignmentColumns } = buildAgentsTableColumns({
    heartbeat: crud.heartbeat, previewDispatchTasks: dispatchPanel.previewDispatchTasks,
    dispatchTasks: dispatchPanel.dispatchTasks, claimTask: dispatchPanel.claimTask,
    loadRecommendedTasks: inbox.loadRecommendedTasks,
    loadAssignments: dispatchPanel.loadAssignments, openEditModal: crud.openEditModal,
    setBroadcastAgent: crud.setBroadcastAgent, setBroadcastOpen: crud.setBroadcastOpen,
    setBroadcastContent: crud.setBroadcastContent,
    setDmFrom: inbox.setDmFrom, setDmTo: inbox.setDmTo, setDmOpen: inbox.setDmOpen, setDmContent: inbox.setDmContent,
    updateAssignmentState: dispatchPanel.updateAssignmentState,
  })

  return {
    ...crud,
    ...channelsPanel,
    ...dispatchPanel,
    ...liveDashboard,
    ...inbox,
    ...intelligence,
    ...collabKnowledge,
    ...sandboxPanel,
    ...stepOverrides,
    ...conflicts,
    // 局部状态
    assignmentLoading, setAssignmentLoading,
    drawerOpen, setDrawerOpen,
    selectedAgent, setSelectedAgent,
    feedbackSubmitting, setFeedbackSubmitting,
    feedbackForm,
    navigate,
    // 派生处理器
    resolveProtocol, submitHumanFeedback,
    columns, assignmentColumns,
  }
}

export type AgentsPageContext = ReturnType<typeof useAgentsPage>
