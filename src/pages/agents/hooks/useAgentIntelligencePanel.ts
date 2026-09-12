/**
 * Agents.tsx Agent 智能面板领域块：经验（Experiences）/协作方/声誉/跨项目
 * 协作/协议/审议/经验衰减/自适应能力/跨项目任务发现。从 Agents.tsx 原样
 * 抽出（状态 + 处理函数），逻辑零改动。
 * selectedAgent 为跨域状态；loadAgents 供自适应能力等流程完成后刷新列表
 * （闭包惰性求值注入，规避渲染期 TDZ）。
 */

import { useMemo, useState } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../../api/agents'
import type { Agent, CollaborationGraph } from '../../../api/agents'

export function useAgentIntelligencePanel(
  selectedAgent: Agent | null,
  loadAgents: () => unknown,
) {
  // Collaboration templates
  // Protocols
  const [protocols, setProtocols] = useState<any[]>([])
  const [protocolsOpen, setProtocolsOpen] = useState(false)
  const [protocolsLoading, setProtocolsLoading] = useState(false)
  const [protocolRespondMsg, setProtocolRespondMsg] = useState<any>({ protocol_id: 0, agent_id: undefined, message_type: 'accept', content: '' })
  const [deliberationForm, setDeliberationForm] = useState<any>({ protocol_id: 0, agent_id: undefined, message_type: 'comment', content: '' })
  const [protocolCreateOpen, setProtocolCreateOpen] = useState(false)
  const [protocolForm, setProtocolForm] = useState<any>({ protocol_type: 'proposal', title: '', description: '', initiator_agent_id: undefined, config: {} })
  const [protocolDetailOpen, setProtocolDetailOpen] = useState(false)
  const [protocolDetail, setProtocolDetail] = useState<any>(null)
  const [protocolRespondOpen, setProtocolRespondOpen] = useState(false)
  // Deliberation
  const [deliberationOpen, setDeliberationOpen] = useState(false)

  // Agent Experience (Collective Intelligence)
  const [experiences, setExperiences] = useState<any[]>([])
  const [experiencesLoading, setExperiencesLoading] = useState(false)
  const [experienceCreateOpen, setExperienceCreateOpen] = useState(false)
  const [experienceForm, setExperienceForm] = useState<any>({
    experience_type: 'success_pattern', domain: '', task_type: '',
    capabilities_used: [], strategy: '', outcome_pattern: '',
    key_learnings: '', confidence: 0.7, is_shared: false,
  })
  const [experienceDetailOpen, setExperienceDetailOpen] = useState(false)
  const [experienceDetail, setExperienceDetail] = useState<any>(null)
  const [sharedExperiencesOpen, setSharedExperiencesOpen] = useState(false)
  const [sharedExperiences, setSharedExperiences] = useState<any[]>([])
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false)
  const [sharedExperiencesLoading, setSharedExperiencesLoading] = useState(false)

  const loadExperiences = async (agent: Agent) => {
    setExperiencesLoading(true)
    try {
      const data: any = await agentsApi.listAgentExperiences(agent.id)
      setExperiences(data?.data?.items || data?.items || (Array.isArray(data?.data) ? data.data : []))
    } catch { message.error('加载经验失败') }
    finally { setExperiencesLoading(false) }
  }

  const loadCollaborators = async (agent: Agent) => {
    setCollaboratorsLoading(true)
    try {
      const result = await agentsApi.getAgentCollaborators(agent.id, { limit: 10 })
      setCollaborators(result?.collaborators || [])
    } catch {
      // silent: collaborators are supplementary info
    } finally {
      setCollaboratorsLoading(false)
    }
  }

  // 以当前 Agent 为中心的协作关系子图（中心节点 + top 协作者邻居）
  const collabSubgraph: CollaborationGraph | null = useMemo(() => {
    if (!selectedAgent || collaborators.length === 0) return null
    const center = selectedAgent
    const nodes = [
      { id: center.id, name: center.name, kind: center.kind, messages: 0 },
      ...collaborators.map((c) => ({ id: c.agent_id, name: c.name, kind: undefined, messages: c.total })),
    ]
    // 中心节点 messages = 所有邻居 total 之和
    const centerTotal = collaborators.reduce((s, c) => s + (c.total || 0), 0)
    nodes[0].messages = centerTotal
    const edges = collaborators.map((c) => ({
      source: Math.min(center.id, c.agent_id),
      target: Math.max(center.id, c.agent_id),
      count: c.total,
      // 中心发送给邻居: c.sent；邻居发送给中心: c.received
      // source 为较小 id 端，需按 id 大小映射方向
      ...(center.id < c.agent_id
        ? { source_to_target: c.sent, target_to_source: c.received }
        : { source_to_target: c.received, target_to_source: c.sent }),
    }))
    return { nodes, edges, total_edges: edges.length }
  }, [selectedAgent, collaborators])

  const createExperience = async () => {
    if (!selectedAgent) return
    if (!experienceForm.strategy.trim()) {
      message.warning('请填写策略描述')
      return
    }
    try {
      await agentsApi.createAgentExperience(selectedAgent.id, experienceForm)
      message.success('经验已创建')
      setExperienceCreateOpen(false)
      setExperienceForm({
        experience_type: 'success_pattern', domain: '', task_type: '',
        capabilities_used: [], strategy: '', outcome_pattern: '',
        key_learnings: '', confidence: 0.7, is_shared: false,
      })
      loadExperiences(selectedAgent)
    } catch { message.error('创建经验失败') }
  }

  const openExperienceDetail = async (exp: any) => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.getAgentExperience(selectedAgent.id, exp.id)
      setExperienceDetail(data)
      setExperienceDetailOpen(true)
    } catch { message.error('加载经验详情失败') }
  }

  const deleteExperience = async (expId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.deleteAgentExperience(selectedAgent.id, expId)
      message.success('经验已删除')
      loadExperiences(selectedAgent)
    } catch { message.error('删除经验失败') }
  }

  const shareExperience = async (expId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.shareAgentExperience(selectedAgent.id, expId)
      message.success('经验已分享')
      loadExperiences(selectedAgent)
    } catch { message.error('分享经验失败') }
  }

  const autoExtractExperiences = async () => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.autoExtractExperiences(selectedAgent.id)
      const count = Array.isArray(data) ? data.length : 0
      message.success(`自动提取了 ${count} 条经验`)
      loadExperiences(selectedAgent)
    } catch { message.error('自动提取失败') }
  }

  const loadSharedExperiences = async () => {
    if (!selectedAgent) return
    setSharedExperiencesLoading(true)
    try {
      const data: any = await agentsApi.listSharedExperiences(selectedAgent.id)
      setSharedExperiences(data?.data?.items || data?.items || (Array.isArray(data?.data) ? data.data : []))
      setSharedExperiencesOpen(true)
    } catch { message.error('加载共享经验失败') }
    finally { setSharedExperiencesLoading(false) }
  }

  const learnFromExperience = async (expId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.learnFromExperience(selectedAgent.id, expId)
      message.success('已学习该经验')
      loadExperiences(selectedAgent)
      loadSharedExperiences()
    } catch { message.error('学习经验失败') }
  }

  // Cross-Project Agent Collaboration
  const [crossProjects, setCrossProjects] = useState<any[]>([])
  const [crossProjectOpen, setCrossProjectOpen] = useState(false)
  const [crossProjectLoading, setCrossProjectLoading] = useState(false)
  const [authorizeOpen, setAuthorizeOpen] = useState(false)
  const [authorizeForm, setAuthorizeForm] = useState<any>({ project_id: '', role_in_project: 'contributor', max_concurrent_tasks: 3 })

  const loadCrossProjects = async (agent: Agent) => {
    setCrossProjectLoading(true)
    try {
      const data: any = await agentsApi.listAgentCrossProjects(agent.id)
      setCrossProjects(Array.isArray(data) ? data : data?.items || [])
    } catch { message.error('加载跨项目授权失败') }
    finally { setCrossProjectLoading(false) }
  }

  const openCrossProject = () => {
    if (!selectedAgent) return
    setCrossProjectOpen(true)
    loadCrossProjects(selectedAgent)
  }

  const authorizeAgent = async () => {
    if (!selectedAgent) return
    if (!authorizeForm.project_id) {
      message.warning('请选择目标项目')
      return
    }
    try {
      await agentsApi.authorizeCrossProjectAgent({
        agent_id: selectedAgent.id,
        project_id: Number(authorizeForm.project_id),
        role_in_project: authorizeForm.role_in_project,
        max_concurrent_tasks: authorizeForm.max_concurrent_tasks,
      })
      message.success('跨项目授权成功')
      setAuthorizeOpen(false)
      setAuthorizeForm({ project_id: '', role_in_project: 'contributor', max_concurrent_tasks: 3 })
      loadCrossProjects(selectedAgent)
    } catch { message.error('跨项目授权失败') }
  }

  const revokeCrossProject = async (projectId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.revokeCrossProjectAgent(selectedAgent.id, projectId)
      message.success('已撤销跨项目授权')
      loadCrossProjects(selectedAgent)
    } catch { message.error('撤销授权失败') }
  }

  // Experience decay & validation
  const applyDecay = async () => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.applyExperienceDecay(selectedAgent.id)
      message.success(`经验衰减完成，影响了 ${data?.decayed_count || 0} 条经验`)
      loadExperiences(selectedAgent)
    } catch { message.error('衰减失败') }
  }

  const validateExperience = async (expId: number, isAccurate: boolean) => {
    if (!selectedAgent) return
    try {
      await agentsApi.validateExperience(selectedAgent.id, expId, { is_accurate: isAccurate })
      message.success(isAccurate ? '经验已验证通过' : '经验已被反驳')
      loadExperiences(selectedAgent)
    } catch { message.error('验证失败') }
  }

  // Adaptive capabilities
  const [adaptSuggestions, setAdaptSuggestions] = useState<any>(null)
  const [adaptLoading, setAdaptLoading] = useState(false)
  const [adaptOpen, setAdaptOpen] = useState(false)

  const loadAdaptSuggestions = async (agent: Agent) => {
    setAdaptLoading(true)
    try {
      const data = await agentsApi.suggestCapabilityAdaptation(agent.id)
      setAdaptSuggestions(data)
      setAdaptOpen(true)
    } catch { message.error('获取能力建议失败') }
    finally { setAdaptLoading(false) }
  }

  const applyAdaptation = async (additions: string[], removals: string[]) => {
    if (!selectedAgent) return
    try {
      await agentsApi.applyCapabilityAdaptation(selectedAgent.id, { additions, removals })
      message.success('能力已自适应调整')
      setAdaptOpen(false)
      setAdaptSuggestions(null)
      loadAgents() // refresh list
    } catch { message.error('应用能力调整失败') }
  }

  // Cross-project task discovery
  const [crossTasks, setCrossTasks] = useState<any[]>([])
  const [crossTasksOpen, setCrossTasksOpen] = useState(false)
  const [crossTasksLoading, setCrossTasksLoading] = useState(false)

  const loadCrossProjectTasks = async () => {
    if (!selectedAgent) return
    setCrossTasksLoading(true)
    try {
      const data: any = await agentsApi.findCrossProjectTasks(selectedAgent.id)
      setCrossTasks(Array.isArray(data) ? data : data?.items || [])
      setCrossTasksOpen(true)
    } catch { message.error('加载跨项目任务失败') }
    finally { setCrossTasksLoading(false) }
  }

  const claimCrossTask = async (taskId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.claimCrossProjectTask(selectedAgent.id, taskId)
      message.success(`已领取跨项目任务 #${taskId}`)
      loadCrossProjectTasks()
    } catch { message.error('领取任务失败') }
  }

  const loadProtocols = async () => {
    setProtocolsLoading(true)
    try {
      const data = await agentsApi.listProtocols()
      setProtocols(data?.items || (Array.isArray(data) ? data : []))
    } catch { message.error('加载协议失败') }
    finally { setProtocolsLoading(false) }
  }

  const openProtocols = () => {
    setProtocolsOpen(true)
    loadProtocols()
  }

  const createProtocol = async () => {
    if (!protocolForm.title.trim() || !protocolForm.initiator_agent_id) {
      message.warning('标题和发起 Agent 不能为空')
      return
    }
    try {
      await agentsApi.createProtocol(protocolForm)
      message.success('协议已创建')
      setProtocolCreateOpen(false)
      setProtocolForm({ protocol_type: 'proposal', title: '', description: '', initiator_agent_id: undefined, config: {} })
      loadProtocols()
    } catch { message.error('创建失败') }
  }

  const openProtocolDetail = async (id: number) => {
    try {
      const data = await agentsApi.getProtocol(id)
      setProtocolDetail(data)
      setProtocolDetailOpen(true)
    } catch { message.error('加载协议详情失败') }
  }

  const respondToProtocol = async () => {
    try {
      await agentsApi.respondToProtocol(protocolRespondMsg.protocol_id, {
        agent_id: protocolRespondMsg.agent_id,
        message_type: protocolRespondMsg.message_type,
        content: protocolRespondMsg.content,
      })
      message.success('已响应')
      setProtocolRespondOpen(false)
      if (protocolDetail) openProtocolDetail(protocolDetail.id)
      loadProtocols()
    } catch { message.error('响应失败') }
  }

  const submitDeliberation = async () => {
    try {
      await agentsApi.addDeliberationMessage(deliberationForm.protocol_id, {
        agent_id: deliberationForm.agent_id,
        message_type: deliberationForm.message_type,
        content: deliberationForm.content,
      })
      message.success('已提交审议发言')
      setDeliberationOpen(false)
      if (protocolDetail) openProtocolDetail(protocolDetail.id)
      loadProtocols()
    } catch { message.error('提交审议发言失败') }
  }

  return {
    collabSubgraph, protocolRespondMsg, setProtocolRespondMsg,
    deliberationForm, setDeliberationForm,
    adaptLoading,
    adaptOpen,
    adaptSuggestions,
    applyAdaptation,
    applyDecay,
    authorizeAgent,
    authorizeForm,
    authorizeOpen,
    autoExtractExperiences,
    claimCrossTask,
    collaborators,
    collaboratorsLoading,
    createExperience,
    createProtocol,
    crossProjectLoading,
    crossProjectOpen,
    crossProjects,
    crossTasks,
    crossTasksLoading,
    crossTasksOpen,
    deleteExperience,
    deliberationOpen,
    experienceCreateOpen,
    experienceDetail,
    experienceDetailOpen,
    experienceForm,
    experiences,
    experiencesLoading,
    learnFromExperience,
    loadAdaptSuggestions,
    loadCollaborators,
    loadCrossProjectTasks,
    loadCrossProjects,
    loadExperiences,
    loadProtocols,
    loadSharedExperiences,
    openCrossProject,
    openExperienceDetail,
    openProtocolDetail,
    openProtocols,
    protocolCreateOpen,
    protocolDetail,
    protocolDetailOpen,
    protocolForm,
    protocolRespondOpen,
    protocols,
    protocolsLoading,
    protocolsOpen,
    respondToProtocol,
    revokeCrossProject,
    setAdaptLoading,
    setAdaptOpen,
    setAdaptSuggestions,
    setAuthorizeForm,
    setAuthorizeOpen,
    setCollaborators,
    setCollaboratorsLoading,
    setCrossProjectLoading,
    setCrossProjectOpen,
    setCrossProjects,
    setCrossTasks,
    setCrossTasksLoading,
    setCrossTasksOpen,
    setDeliberationOpen,
    setExperienceCreateOpen,
    setExperienceDetail,
    setExperienceDetailOpen,
    setExperienceForm,
    setExperiences,
    setExperiencesLoading,
    setProtocolCreateOpen,
    setProtocolDetail,
    setProtocolDetailOpen,
    setProtocolForm,
    setProtocolRespondOpen,
    setProtocols,
    setProtocolsLoading,
    setProtocolsOpen,
    setSharedExperiences,
    setSharedExperiencesLoading,
    setSharedExperiencesOpen,
    shareExperience,
    sharedExperiences,
    sharedExperiencesLoading,
    sharedExperiencesOpen,
    submitDeliberation,
    validateExperience,
  }
}
