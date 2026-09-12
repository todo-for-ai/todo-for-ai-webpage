/**
 * Agents.tsx 沙盒面板领域块：沙盒 CRUD / 执行记录 / 动作检查 / 违规上报 / 模板实例化。
 * 从 Agents.tsx 原样抽出（状态 + 处理函数），逻辑零改动。
 */

import { useState } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../../api/agents'

export function useAgentSandboxPanel() {
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const [sandboxes, setSandboxes] = useState<any[]>([])
  const [sandboxForm, setSandboxForm] = useState<any>({ name: '', description: '', agent_id: undefined, security_level: 'moderate', allowed_tools: [], blocked_tools: [], allowed_network_hosts: [], fs_write_paths: [], fs_read_paths: [], max_memory_mb: 0, max_cpu_seconds: 0, max_output_tokens: 0, timeout_seconds: 0 })
  const [sandboxEditingId, setSandboxEditingId] = useState<number | null>(null)
  const [sandboxFormOpen, setSandboxFormOpen] = useState(false)
  const [sandboxExecOpen, setSandboxExecOpen] = useState(false)
  const [sandboxExecSandboxId, setSandboxExecSandboxId] = useState<number | null>(null)
  const [sandboxExecutions, setSandboxExecutions] = useState<any[]>([])
  const [sandboxExecDetail, setSandboxExecDetail] = useState<any>(null)
  const [sandboxExecDetailOpen, setSandboxExecDetailOpen] = useState(false)
  const [sandboxCheckOpen, setSandboxCheckOpen] = useState(false)
  const [sandboxCheckForm, setSandboxCheckForm] = useState<any>({ sandbox_id: 0, action: 'tool', target: '' })
  const [sandboxCheckResult, setSandboxCheckResult] = useState<any>(null)
  const [sandboxStartOpen, setSandboxStartOpen] = useState(false)
  const [sandboxStartForm, setSandboxStartForm] = useState<any>({ sandbox_id: 0, agent_id: undefined, run_id: undefined, step_run_id: undefined })
  const [sandboxViolationOpen, setSandboxViolationOpen] = useState(false)
  const [sandboxViolationForm, setSandboxViolationForm] = useState<any>({ execution_id: 0, violation_type: 'disallowed_tool', attempted_action: '', detail: '', terminate: false })

  // Sandbox templates
  // Sandbox templates
  const [sandboxTemplates, setSandboxTemplates] = useState<any[]>([])
  const [sandboxTemplateOpen, setSandboxTemplateOpen] = useState(false)

  // ---- Sandbox functions ----
  const loadSandboxes = async () => {
    try {
      const result = await agentsApi.listSandboxes({ include_stats: 'true' })
      setSandboxes(result.items || [])
    } catch { message.error('加载沙盒列表失败') }
  }

  const openSandboxes = async () => {
    setSandboxOpen(true)
    loadSandboxes()
  }

  const openCreateSandbox = () => {
    setSandboxEditingId(null)
    setSandboxForm({ name: '', description: '', agent_id: undefined, security_level: 'moderate', allowed_tools: [], blocked_tools: [], allowed_network_hosts: [], fs_write_paths: [], fs_read_paths: [], max_memory_mb: 0, max_cpu_seconds: 0, max_output_tokens: 0, timeout_seconds: 0 })
    setSandboxFormOpen(true)
  }

  const openEditSandbox = async (id: number) => {
    try {
      const s = await agentsApi.getSandbox(id)
      setSandboxEditingId(id)
      setSandboxForm({
        name: s.name || '', description: s.description || '', agent_id: s.agent_id, security_level: s.security_level || 'moderate',
        allowed_tools: s.allowed_tools || [], blocked_tools: s.blocked_tools || [], allowed_network_hosts: s.allowed_network_hosts || [],
        fs_write_paths: s.fs_write_paths || [], fs_read_paths: s.fs_read_paths || [],
        max_memory_mb: s.max_memory_mb || 0, max_cpu_seconds: s.max_cpu_seconds || 0, max_output_tokens: s.max_output_tokens || 0, timeout_seconds: s.timeout_seconds || 0,
      })
      setSandboxFormOpen(true)
    } catch { message.error('加载沙盒详情失败') }
  }

  const submitSandboxForm = async () => {
    if (!sandboxForm.name) { message.warning('请填写沙盒名称'); return }
    try {
      if (sandboxEditingId) {
        await agentsApi.updateSandbox(sandboxEditingId, sandboxForm)
        message.success('沙盒已更新')
      } else {
        await agentsApi.createSandbox(sandboxForm)
        message.success('沙盒已创建')
      }
      setSandboxFormOpen(false)
      loadSandboxes()
    } catch { message.error('保存沙盒失败') }
  }

  const deleteSandbox = async (id: number) => {
    try {
      await agentsApi.deleteSandbox(id)
      message.success('沙盒已删除')
      loadSandboxes()
    } catch { message.error('删除沙盒失败') }
  }

  const bindSandboxToAgent = async (sandboxId: number, agentId: number) => {
    try {
      await agentsApi.bindAgentSandbox(agentId, sandboxId)
      message.success(`已绑定到 Agent #${agentId}`)
      loadSandboxes()
    } catch { message.error('绑定失败') }
  }

  const openSandboxExec = async (sandboxId: number) => {
    setSandboxExecSandboxId(sandboxId)
    setSandboxExecOpen(true)
    try {
      const result = await agentsApi.listSandboxExecutions(sandboxId)
      setSandboxExecutions(result.items || [])
    } catch { message.error('加载执行记录失败') }
  }

  const openSandboxExecDetail = async (execId: number) => {
    try {
      const result = await agentsApi.getSandboxExecution(execId)
      setSandboxExecDetail(result.execution)
      setSandboxExecDetailOpen(true)
    } catch { message.error('加载执行详情失败') }
  }

  const openSandboxStart = (sandboxId: number) => {
    setSandboxStartForm({ sandbox_id: sandboxId, agent_id: undefined, run_id: undefined, step_run_id: undefined })
    setSandboxStartOpen(true)
  }

  const submitSandboxStart = async () => {
    if (!sandboxStartForm.agent_id) { message.warning('请选择 Agent'); return }
    try {
      const result = await agentsApi.startSandboxExecution(sandboxStartForm.sandbox_id, {
        agent_id: sandboxStartForm.agent_id,
        run_id: sandboxStartForm.run_id || undefined,
        step_run_id: sandboxStartForm.step_run_id || undefined,
      })
      message.success(`已启动沙盒执行 #${result.execution?.id}`)
      setSandboxStartOpen(false)
      if (sandboxExecSandboxId) openSandboxExec(sandboxExecSandboxId)
    } catch { message.error('启动执行失败') }
  }

  const completeSandboxExec = async (execId: number) => {
    try {
      await agentsApi.completeSandboxExecution(execId, { output_summary: '手动标记完成' })
      message.success('执行已完成')
      if (sandboxExecSandboxId) openSandboxExec(sandboxExecSandboxId)
    } catch { message.error('完成失败') }
  }

  const revokeSandboxExec = async (execId: number) => {
    try {
      await agentsApi.revokeSandboxExecution(execId)
      message.success('执行已吊销')
      if (sandboxExecSandboxId) openSandboxExec(sandboxExecSandboxId)
    } catch { message.error('吊销失败') }
  }

  const openSandboxCheck = (sandboxId: number) => {
    setSandboxCheckForm({ sandbox_id: sandboxId, action: 'tool', target: '' })
    setSandboxCheckResult(null)
    setSandboxCheckOpen(true)
  }

  const submitSandboxCheck = async () => {
    if (!sandboxCheckForm.target) { message.warning('请输入目标'); return }
    try {
      const result = await agentsApi.checkSandboxAction(sandboxCheckForm.sandbox_id, sandboxCheckForm.action, sandboxCheckForm.target)
      setSandboxCheckResult(result)
    } catch { message.error('检查失败') }
  }

  const openSandboxViolation = (execId: number) => {
    setSandboxViolationForm({ execution_id: execId, violation_type: 'disallowed_tool', attempted_action: '', detail: '', terminate: false })
    setSandboxViolationOpen(true)
  }

  const submitSandboxViolation = async () => {
    try {
      await agentsApi.reportSandboxViolation(sandboxViolationForm.execution_id, {
        violation_type: sandboxViolationForm.violation_type,
        attempted_action: sandboxViolationForm.attempted_action,
        detail: sandboxViolationForm.detail,
        terminate: sandboxViolationForm.terminate,
      })
      message.success('违规已记录')
      setSandboxViolationOpen(false)
      if (sandboxExecDetail?.id === sandboxViolationForm.execution_id) openSandboxExecDetail(sandboxViolationForm.execution_id)
      if (sandboxExecSandboxId) openSandboxExec(sandboxExecSandboxId)
    } catch { message.error('记录违规失败') }
  }

  // ---- Sandbox templates ----
  const openSandboxTemplates = async () => {
    try {
      const result = await agentsApi.listSandboxTemplates()
      setSandboxTemplates(result.templates || [])
      setSandboxTemplateOpen(true)
    } catch { message.error('加载模板失败') }
  }

  const instantiateTemplate = async (key: string, name: string) => {
    try {
      await agentsApi.instantiateSandboxTemplate(key, { name })
      message.success(`已从模板 "${name}" 创建沙盒`)
      setSandboxTemplateOpen(false)
      loadSandboxes()
    } catch { message.error('创建失败') }
  }

  return {
    sandboxOpen, setSandboxOpen,
    sandboxes, setSandboxes,
    sandboxForm, setSandboxForm,
    sandboxEditingId, setSandboxEditingId,
    sandboxFormOpen, setSandboxFormOpen,
    sandboxExecOpen, setSandboxExecOpen,
    sandboxExecSandboxId, setSandboxExecSandboxId,
    sandboxExecutions, setSandboxExecutions,
    sandboxExecDetail, setSandboxExecDetail,
    sandboxExecDetailOpen, setSandboxExecDetailOpen,
    sandboxCheckOpen, setSandboxCheckOpen,
    sandboxCheckForm, setSandboxCheckForm,
    sandboxCheckResult, setSandboxCheckResult,
    sandboxStartOpen, setSandboxStartOpen,
    sandboxStartForm, setSandboxStartForm,
    sandboxViolationOpen, setSandboxViolationOpen,
    sandboxViolationForm, setSandboxViolationForm,
    sandboxTemplates, setSandboxTemplates,
    sandboxTemplateOpen, setSandboxTemplateOpen,
    loadSandboxes, openSandboxes, openCreateSandbox, openEditSandbox,
    submitSandboxForm, deleteSandbox, bindSandboxToAgent,
    openSandboxExec, openSandboxExecDetail, openSandboxStart, submitSandboxStart,
    completeSandboxExec, revokeSandboxExec,
    openSandboxCheck, submitSandboxCheck,
    openSandboxViolation, submitSandboxViolation,
    openSandboxTemplates, instantiateTemplate,
  }
}
