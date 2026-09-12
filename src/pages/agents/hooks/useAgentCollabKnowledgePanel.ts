/**
 * Agents.tsx 协作模板 + 知识库领域块：模板列表/实例化、知识条目
 * CRUD/详情/自动提取。从 Agents.tsx 原样抽出，逻辑零改动。
 * selectedAgent 为跨域状态，由调用方注入。
 */

import { useState } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../../api/agents'
import type { Agent } from '../../../api/agents'

export function useAgentCollabKnowledgePanel(
  selectedAgent: Agent | null,
  loadAgents: () => unknown,
) {
  const [collabTemplates, setCollabTemplates] = useState<any[]>([])
  const [collabTemplatesOpen, setCollabTemplatesOpen] = useState(false)
  const [collabTemplatesLoading, setCollabTemplatesLoading] = useState(false)
  const [collabInstantiateOpen, setCollabInstantiateOpen] = useState(false)
  const [collabInstantiateKey, setCollabInstantiateKey] = useState<string>('')
  const [collabInstantiateName, setCollabInstantiateName] = useState<string>('')
  const [collabInstantiateProjectId, setCollabInstantiateProjectId] = useState<number | undefined>(undefined)

  const [collabInstantiating, setCollabInstantiating] = useState(false)
  const [knowledgeEntries, setKnowledgeEntries] = useState<any[]>([])
  const [knowledgeLoading, setKnowledgeLoading] = useState(false)
  const [knowledgeSearch, setKnowledgeSearch] = useState('')
  const [knowledgeCreateOpen, setKnowledgeCreateOpen] = useState(false)
  const [knowledgeForm, setKnowledgeForm] = useState<any>({ title: '', content: '', domain: '', tags: [], entry_type: 'insight', confidence: 1.0 })
  const [knowledgeDetailOpen, setKnowledgeDetailOpen] = useState(false)
  const [knowledgeDetail, setKnowledgeDetail] = useState<any>(null)

  const loadCollabTemplates = async () => {
    setCollabTemplatesLoading(true)
    try {
      const data = await agentsApi.listCollaborationTemplates()
      setCollabTemplates(Array.isArray(data) ? data : [])
    } catch { message.error('加载协作模板失败') }
    finally { setCollabTemplatesLoading(false) }
  }

  const openCollabTemplates = () => {
    setCollabTemplatesOpen(true)
    loadCollabTemplates()
  }

  const openCollabInstantiate = (key: string, name: string) => {
    setCollabInstantiateKey(key)
    setCollabInstantiateName(name)
    setCollabInstantiateProjectId(undefined)
    setCollabInstantiateOpen(true)
  }

  const instantiateCollabTemplate = async () => {
    setCollabInstantiating(true)
    try {
      const data: Record<string, any> = {}
      if (collabInstantiateProjectId) data.project_id = collabInstantiateProjectId
      const result = await agentsApi.instantiateCollaborationTemplate(collabInstantiateKey, data)
      const agentCount = result?.agents?.length || 0
      message.success(`模板已实例化，创建了 ${agentCount} 个 Agent`)
      setCollabInstantiateOpen(false)
      setCollabTemplatesOpen(false)
      loadAgents()
    } catch { message.error('模板实例化失败') }
    finally { setCollabInstantiating(false) }
  }

  const loadKnowledge = async (agent: Agent) => {
    setKnowledgeLoading(true)
    try {
      const params: Record<string, any> = { include_content: false }
      if (knowledgeSearch) params.search = knowledgeSearch
      const data = await agentsApi.listKnowledgeEntries(agent.id, params)
      const items = data?.items || (Array.isArray(data) ? data : [])
      setKnowledgeEntries(items)
    } catch { message.error('加载知识库失败') }
    finally { setKnowledgeLoading(false) }
  }

  const createKnowledgeEntry = async () => {
    if (!selectedAgent) return
    if (!knowledgeForm.title.trim() || !knowledgeForm.content.trim()) {
      message.warning('标题和内容不能为空')
      return
    }
    try {
      await agentsApi.createKnowledgeEntry(selectedAgent.id, knowledgeForm)
      message.success('知识条目已创建')
      setKnowledgeCreateOpen(false)
      setKnowledgeForm({ title: '', content: '', domain: '', tags: [], entry_type: 'insight', confidence: 1.0 })
      loadKnowledge(selectedAgent)
    } catch { message.error('创建失败') }
  }

  const openKnowledgeDetail = async (entry: any) => {
    if (!selectedAgent) return
    try {
      const data = await agentsApi.getKnowledgeEntry(selectedAgent.id, entry.id)
      setKnowledgeDetail(data)
      setKnowledgeDetailOpen(true)
    } catch { message.error('加载详情失败') }
  }

  const deleteKnowledgeEntry = async (entryId: number) => {
    if (!selectedAgent) return
    try {
      await agentsApi.deleteKnowledgeEntry(selectedAgent.id, entryId)
      message.success('知识条目已删除')
      loadKnowledge(selectedAgent)
    } catch { message.error('删除失败') }
  }

  const autoExtractKnowledge = async () => {
    if (!selectedAgent) return
    try {
      const result = await agentsApi.autoExtractKnowledge(selectedAgent.id, 10)
      const count = result?.entries_created || 0
      message.success(`自动提取完成，创建了 ${count} 条知识条目`)
      loadKnowledge(selectedAgent)
    } catch { message.error('自动提取失败') }
  }

  return {
    collabTemplates, collabTemplatesOpen, setCollabTemplatesOpen,
    collabTemplatesLoading, collabInstantiateOpen, setCollabInstantiateOpen,
    collabInstantiateKey, collabInstantiateName, collabInstantiateProjectId,
    setCollabInstantiateProjectId, collabInstantiating,
    knowledgeEntries, knowledgeLoading, knowledgeSearch, setKnowledgeSearch,
    knowledgeCreateOpen, setKnowledgeCreateOpen, knowledgeForm, setKnowledgeForm,
    knowledgeDetailOpen, setKnowledgeDetailOpen, knowledgeDetail,
    setKnowledgeDetail,
    loadCollabTemplates, openCollabTemplates, openCollabInstantiate,
    instantiateCollabTemplate,
    loadKnowledge, createKnowledgeEntry, openKnowledgeDetail,
    deleteKnowledgeEntry, autoExtractKnowledge,
  }
}
