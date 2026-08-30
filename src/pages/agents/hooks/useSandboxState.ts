/**
 * 沙盒状态管理 Hook
 *
 * 管理沙盒相关的所有状态和操作函数。
 */
import { useState, useCallback } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../api/agents'

export interface SandboxForm {
  name: string
  description: string
  agent_id?: number
  security_level: string
  allowed_tools: string[]
  blocked_tools: string[]
  allowed_network_hosts: string[]
  fs_write_paths: string[]
  fs_read_paths: string[]
  max_memory_mb: number
  max_cpu_seconds: number
  max_output_tokens: number
  timeout_seconds: number
}

export interface SandboxCheckForm {
  sandbox_id: number
  action: string
  target: string
}

export interface SandboxStartForm {
  sandbox_id: number
  agent_id?: number
  run_id?: number
  step_run_id?: number
}

export interface SandboxViolationForm {
  execution_id: number
  violation_type: string
  attempted_action: string
  detail: string
  terminate: boolean
}

export interface SandboxState {
  open: boolean
  sandboxes: any[]
  templates: any[]
  templateOpen: boolean
  formOpen: boolean
  editingId: number | null
  formData: SandboxForm
  execOpen: boolean
  execSandboxId: number | null
  executions: any[]
  execDetail: any
  execDetailOpen: boolean
  checkOpen: boolean
  checkForm: SandboxCheckForm
  checkResult: any
  startOpen: boolean
  startForm: SandboxStartForm
  violationOpen: boolean
  violationForm: SandboxViolationForm
}

export interface SandboxActions {
  openSandboxes: () => void
  closeSandboxes: () => void
  loadSandboxes: () => Promise<void>
  openCreateSandbox: () => void
  openEditSandbox: (id: number) => Promise<void>
  submitSandboxForm: () => Promise<void>
  deleteSandbox: (id: number) => Promise<void>
  bindSandboxToAgent: (sandboxId: number, agentId: number) => Promise<void>
  openSandboxExec: (sandboxId: number) => Promise<void>
  openSandboxExecDetail: (execId: number) => Promise<void>
  completeSandboxExec: (execId: number) => Promise<void>
  revokeSandboxExec: (execId: number) => Promise<void>
  openSandboxCheck: (sandboxId: number) => void
  submitSandboxCheck: () => Promise<void>
  openSandboxStart: (sandboxId: number) => void
  submitSandboxStart: () => Promise<void>
  openSandboxViolation: (execId: number) => void
  submitSandboxViolation: () => Promise<void>
  openSandboxTemplates: () => Promise<void>
  instantiateTemplate: (templateKey: string, agentId?: number) => Promise<void>
  closeTemplates: () => void
  // setters
  setOpen: (v: boolean) => void
  setFormOpen: (v: boolean) => void
  setFormData: (v: SandboxForm) => void
  setEditingId: (v: number | null) => void
  setExecOpen: (v: boolean) => void
  setExecDetailOpen: (v: boolean) => void
  setCheckOpen: (v: boolean) => void
  setCheckForm: (v: SandboxCheckForm) => void
  setCheckResult: (v: any) => void
  setStartOpen: (v: boolean) => void
  setStartForm: (v: SandboxStartForm) => void
  setViolationOpen: (v: boolean) => void
  setViolationForm: (v: SandboxViolationForm) => void
  setTemplateOpen: (v: boolean) => void
}

const DEFAULT_FORM: SandboxForm = {
  name: '',
  description: '',
  agent_id: undefined,
  security_level: 'moderate',
  allowed_tools: [],
  blocked_tools: [],
  allowed_network_hosts: [],
  fs_write_paths: [],
  fs_read_paths: [],
  max_memory_mb: 0,
  max_cpu_seconds: 0,
  max_output_tokens: 0,
  timeout_seconds: 0,
}

export function useSandboxState(): [SandboxState, SandboxActions] {
  const [open, setOpen] = useState(false)
  const [sandboxes, setSandboxes] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [templateOpen, setTemplateOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<SandboxForm>(DEFAULT_FORM)
  const [execOpen, setExecOpen] = useState(false)
  const [execSandboxId, setExecSandboxId] = useState<number | null>(null)
  const [executions, setExecutions] = useState<any[]>([])
  const [execDetail, setExecDetail] = useState<any>(null)
  const [execDetailOpen, setExecDetailOpen] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [checkForm, setCheckForm] = useState<SandboxCheckForm>({ sandbox_id: 0, action: 'tool', target: '' })
  const [checkResult, setCheckResult] = useState<any>(null)
  const [startOpen, setStartOpen] = useState(false)
  const [startForm, setStartForm] = useState<SandboxStartForm>({ sandbox_id: 0, agent_id: undefined, run_id: undefined, step_run_id: undefined })
  const [violationOpen, setViolationOpen] = useState(false)
  const [violationForm, setViolationForm] = useState<SandboxViolationForm>({ execution_id: 0, violation_type: 'disallowed_tool', attempted_action: '', detail: '', terminate: false })

  const loadSandboxes = useCallback(async () => {
    try {
      const result = await agentsApi.listSandboxes({ include_stats: 'true' })
      setSandboxes(result.items || [])
    } catch {
      message.error('加载沙盒列表失败')
    }
  }, [])

  const openSandboxes = useCallback(() => {
    setOpen(true)
    loadSandboxes()
  }, [loadSandboxes])

  const closeSandboxes = useCallback(() => {
    setOpen(false)
  }, [])

  const openCreateSandbox = useCallback(() => {
    setEditingId(null)
    setFormData(DEFAULT_FORM)
    setFormOpen(true)
  }, [])

  const openEditSandbox = useCallback(async (id: number) => {
    try {
      const s = await agentsApi.getSandbox(id)
      setEditingId(id)
      setFormData({
        name: s.name || '',
        description: s.description || '',
        agent_id: s.agent_id,
        security_level: s.security_level || 'moderate',
        allowed_tools: s.allowed_tools || [],
        blocked_tools: s.blocked_tools || [],
        allowed_network_hosts: s.allowed_network_hosts || [],
        fs_write_paths: s.fs_write_paths || [],
        fs_read_paths: s.fs_read_paths || [],
        max_memory_mb: s.max_memory_mb || 0,
        max_cpu_seconds: s.max_cpu_seconds || 0,
        max_output_tokens: s.max_output_tokens || 0,
        timeout_seconds: s.timeout_seconds || 0,
      })
      setFormOpen(true)
    } catch {
      message.error('加载沙盒详情失败')
    }
  }, [])

  const submitSandboxForm = useCallback(async () => {
    if (!formData.name) {
      message.warning('请填写沙盒名称')
      return
    }
    try {
      if (editingId) {
        await agentsApi.updateSandbox(editingId, formData)
        message.success('沙盒已更新')
      } else {
        await agentsApi.createSandbox(formData)
        message.success('沙盒已创建')
      }
      setFormOpen(false)
      loadSandboxes()
    } catch {
      message.error('保存沙盒失败')
    }
  }, [formData, editingId, loadSandboxes])

  const deleteSandbox = useCallback(async (id: number) => {
    try {
      await agentsApi.deleteSandbox(id)
      message.success('沙盒已删除')
      loadSandboxes()
    } catch {
      message.error('删除沙盒失败')
    }
  }, [loadSandboxes])

  const bindSandboxToAgent = useCallback(async (sandboxId: number, agentId: number) => {
    try {
      await agentsApi.bindAgentSandbox(agentId, sandboxId)
      message.success(`已绑定到 Agent #${agentId}`)
      loadSandboxes()
    } catch {
      message.error('绑定失败')
    }
  }, [loadSandboxes])

  const openSandboxExec = useCallback(async (sandboxId: number) => {
    setExecSandboxId(sandboxId)
    setExecOpen(true)
    try {
      const result = await agentsApi.listSandboxExecutions(sandboxId)
      setExecutions(result.items || [])
    } catch {
      message.error('加载执行记录失败')
    }
  }, [])

  const openSandboxExecDetail = useCallback(async (execId: number) => {
    try {
      const result = await agentsApi.getSandboxExecution(execId)
      setExecDetail(result.execution)
      setExecDetailOpen(true)
    } catch {
      message.error('加载执行详情失败')
    }
  }, [])

  const completeSandboxExec = useCallback(async (execId: number) => {
    try {
      await agentsApi.completeSandboxExecution(execId, { output_summary: '手动标记完成' })
      message.success('执行已完成')
      if (execSandboxId) openSandboxExec(execSandboxId)
    } catch {
      message.error('完成失败')
    }
  }, [execSandboxId, openSandboxExec])

  const revokeSandboxExec = useCallback(async (execId: number) => {
    try {
      await agentsApi.revokeSandboxExecution(execId)
      message.success('执行已吊销')
      if (execSandboxId) openSandboxExec(execSandboxId)
    } catch {
      message.error('吊销失败')
    }
  }, [execSandboxId, openSandboxExec])

  const openSandboxCheck = useCallback((sandboxId: number) => {
    setCheckForm({ sandbox_id: sandboxId, action: 'tool', target: '' })
    setCheckResult(null)
    setCheckOpen(true)
  }, [])

  const submitSandboxCheck = useCallback(async () => {
    if (!checkForm.target) {
      message.warning('请输入目标')
      return
    }
    try {
      const result = await agentsApi.checkSandboxAction(checkForm.sandbox_id, checkForm.action, checkForm.target)
      setCheckResult(result)
    } catch {
      message.error('检查失败')
    }
  }, [checkForm])

  const openSandboxStart = useCallback((sandboxId: number) => {
    setStartForm({ sandbox_id: sandboxId, agent_id: undefined, run_id: undefined, step_run_id: undefined })
    setStartOpen(true)
  }, [])

  const submitSandboxStart = useCallback(async () => {
    if (!startForm.agent_id) {
      message.warning('请选择 Agent')
      return
    }
    try {
      const result = await agentsApi.startSandboxExecution(startForm.sandbox_id, {
        agent_id: startForm.agent_id,
        run_id: startForm.run_id || undefined,
        step_run_id: startForm.step_run_id || undefined,
      })
      message.success(`已启动沙盒执行 #${result.execution?.id}`)
      setStartOpen(false)
      if (execSandboxId) openSandboxExec(execSandboxId)
    } catch {
      message.error('启动执行失败')
    }
  }, [startForm, execSandboxId, openSandboxExec])

  const openSandboxViolation = useCallback((execId: number) => {
    setViolationForm({ execution_id: execId, violation_type: 'disallowed_tool', attempted_action: '', detail: '', terminate: false })
    setViolationOpen(true)
  }, [])

  const submitSandboxViolation = useCallback(async () => {
    try {
      await agentsApi.reportSandboxViolation(violationForm.execution_id, {
        violation_type: violationForm.violation_type,
        attempted_action: violationForm.attempted_action,
        detail: violationForm.detail,
        terminate: violationForm.terminate,
      })
      message.success('违规已记录')
      setViolationOpen(false)
      if (execDetail?.id === violationForm.execution_id) openSandboxExecDetail(violationForm.execution_id)
      if (execSandboxId) openSandboxExec(execSandboxId)
    } catch {
      message.error('记录违规失败')
    }
  }, [violationForm, execDetail, execSandboxId, openSandboxExecDetail, openSandboxExec])

  const openSandboxTemplates = useCallback(async () => {
    try {
      const result = await agentsApi.listSandboxTemplates()
      setTemplates(result.templates || [])
      setTemplateOpen(true)
    } catch {
      message.error('加载沙盒模板失败')
    }
  }, [])

  const instantiateTemplate = useCallback(async (templateKey: string, agentId?: number) => {
    try {
      await agentsApi.instantiateSandboxTemplate(templateKey, { agent_id: agentId })
      message.success('模板已实例化')
      setTemplateOpen(false)
      loadSandboxes()
    } catch {
      message.error('实例化失败')
    }
  }, [loadSandboxes])

  const closeTemplates = useCallback(() => {
    setTemplateOpen(false)
  }, [])

  const state: SandboxState = {
    open,
    sandboxes,
    templates,
    templateOpen,
    formOpen,
    editingId,
    formData,
    execOpen,
    execSandboxId,
    executions,
    execDetail,
    execDetailOpen,
    checkOpen,
    checkForm,
    checkResult,
    startOpen,
    startForm,
    violationOpen,
    violationForm,
  }

  const actions: SandboxActions = {
    openSandboxes,
    closeSandboxes,
    loadSandboxes,
    openCreateSandbox,
    openEditSandbox,
    submitSandboxForm,
    deleteSandbox,
    bindSandboxToAgent,
    openSandboxExec,
    openSandboxExecDetail,
    completeSandboxExec,
    revokeSandboxExec,
    openSandboxCheck,
    submitSandboxCheck,
    openSandboxStart,
    submitSandboxStart,
    openSandboxViolation,
    submitSandboxViolation,
    openSandboxTemplates,
    instantiateTemplate,
    closeTemplates,
    setOpen,
    setFormOpen,
    setFormData,
    setEditingId,
    setExecOpen,
    setExecDetailOpen,
    setCheckOpen,
    setCheckForm,
    setCheckResult,
    setStartOpen,
    setStartForm,
    setViolationOpen,
    setViolationForm,
    setTemplateOpen,
  }

  return [state, actions]
}

export default useSandboxState
