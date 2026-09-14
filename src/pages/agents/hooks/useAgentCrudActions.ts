/**
 * Agents.tsx Agent CRUD 与广播/声誉/沙盒域：列表加载、审核队列、创建/编辑/保存、
 * 心跳、广播、Agent 声誉与沙盒加载。
 * 从 Agents.tsx 原样抽出（状态 + 处理函数），逻辑零改动；selectedAgent 经 ctx 注入。
 */

import { useState } from 'react'
import { Form, message } from 'antd'
import { agentsApi } from '../../../api/agents'
import type { Agent, AgentStatus, ReviewQueueAction, ReviewQueueItem, ReputationHistory } from '../../../api/agents'
import { parseLines, stringifyConfig } from '../utils'

interface UseAgentCrudActionsOptions {
  selectedAgent: Agent | null
}

export function useAgentCrudActions({ selectedAgent }: UseAgentCrudActionsOptions) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all')
  const [reviewActionFilter, setReviewActionFilter] = useState<ReviewQueueAction>('all')
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastAgent, setBroadcastAgent] = useState<Agent | null>(null)
  const [broadcastContent, setBroadcastContent] = useState('')
  const [broadcasting, setBroadcasting] = useState(false)
  const [agentReputation, setAgentReputation] = useState<any>(null)
  const [reputationHistory, setReputationHistory] = useState<ReputationHistory | null>(null)
  const [agentSandbox, setAgentSandbox] = useState<any>(null)
  const [form] = Form.useForm()

  const loadAgents = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (!silent) setLoading(true)
    try {
      const result = await agentsApi.getAgents({
        status: statusFilter,
        search: searchText,
        sort_by: 'last_seen_at',
        sort_order: 'desc',
        per_page: 50,
      })
      setAgents(result.items)
    } catch (error) {
      if (!silent) message.error('加载 Agent 失败')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const loadReviewQueue = async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true
    if (!silent) setReviewLoading(true)
    try {
      const result = await agentsApi.getReviewQueue({
        action: reviewActionFilter,
        per_page: 20,
      })
      setReviewQueue(result.items)
    } catch (error) {
      if (!silent) message.error(error instanceof Error ? error.message : '加载人工审核队列失败')
    } finally {
      if (!silent) setReviewLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingAgent(null)
    form.setFieldsValue({
      name: '',
      description: '',
      kind: 'assistant',
      status: 'active',
      provider: '',
      model: '',
      capabilitiesText: '',
      configText: '{}',
    })
    setModalOpen(true)
  }

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent)
    form.setFieldsValue({
      name: agent.name,
      description: agent.description,
      kind: agent.kind,
      status: agent.status,
      provider: agent.provider,
      model: agent.model,
      capabilitiesText: (agent.capabilities || []).join('\n'),
      configText: stringifyConfig(agent),
    })
    setModalOpen(true)
  }

  const saveAgent = async () => {
    try {
      const values = await form.validateFields()
      let config = {}
      try {
        config = JSON.parse(values.configText || '{}')
      } catch {
        message.error('运行配置必须是合法 JSON')
        return
      }

      const payload = {
        name: values.name,
        description: values.description,
        kind: values.kind,
        status: values.status,
        provider: values.provider,
        model: values.model,
        capabilities: parseLines(values.capabilitiesText),
        config,
      }

      if (editingAgent) {
        await agentsApi.updateAgent(editingAgent.id, payload)
        message.success('Agent 已更新')
      } else {
        await agentsApi.createAgent(payload)
        message.success('Agent 已创建')
      }

      setModalOpen(false)
      loadAgents()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    }
  }

  const heartbeat = async (agent: Agent) => {
    try {
      await agentsApi.heartbeatAgent(agent.id, 'active')
      message.success('心跳已记录')
      loadAgents()
    } catch {
      message.error('心跳失败')
    }
  }

  const sendBroadcast = async () => {
    if (!broadcastAgent || !broadcastContent.trim()) {
      message.warning('请输入广播内容')
      return
    }
    setBroadcasting(true)
    try {
      const result = await agentsApi.broadcastMessage(broadcastAgent.id, broadcastContent.trim())
      message.success(`广播已发送给 ${result.recipient_count} 个活跃 Agent`)
      setBroadcastOpen(false)
      setBroadcastAgent(null)
      setBroadcastContent('')
    } catch {
      message.error('广播发送失败')
    } finally {
      setBroadcasting(false)
    }
  }

  const loadAgentReputation = async (agent: Agent) => {
    try {
      const data = await agentsApi.getAgentReputation(agent.id)
      setAgentReputation(data)
    } catch {
      setAgentReputation(null)
    }
    try {
      const hist = await agentsApi.getAgentReputationHistory(agent.id, { limit: 200 })
      setReputationHistory(hist)
    } catch {
      setReputationHistory(null)
    }
  }

  const loadAgentSandbox = async (agent: Agent) => {
    try {
      const data = await agentsApi.getAgentSandbox(agent.id)
      setAgentSandbox(data.sandbox || null)
    } catch {
      setAgentSandbox(null)
    }
  }

  const recalculateReputation = async () => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.recalculateReputation(selectedAgent.id)
      setAgentReputation(data)
      const hist = await agentsApi.getAgentReputationHistory(selectedAgent.id, { limit: 200 })
      setReputationHistory(hist)
      message.success('声誉已重新计算')
    } catch { message.error('重新计算失败') }
  }

  return {
    agents, setAgents,
    reviewQueue, setReviewQueue,
    loading, setLoading,
    reviewLoading, setReviewLoading,
    modalOpen, setModalOpen,
    editingAgent, setEditingAgent,
    searchText, setSearchText,
    statusFilter, setStatusFilter,
    reviewActionFilter, setReviewActionFilter,
    broadcastOpen, setBroadcastOpen,
    broadcastAgent, setBroadcastAgent,
    broadcastContent, setBroadcastContent,
    broadcasting, setBroadcasting,
    agentReputation, setAgentReputation,
    reputationHistory, setReputationHistory,
    agentSandbox, setAgentSandbox,
    form,
    loadAgents,
    loadReviewQueue,
    openCreateModal,
    openEditModal,
    saveAgent,
    heartbeat,
    sendBroadcast,
    loadAgentReputation,
    loadAgentSandbox,
    recalculateReputation,
  }
}
