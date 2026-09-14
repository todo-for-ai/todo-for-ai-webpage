/**
 * Agents.tsx 工作流步骤运行时重配置领域块：有效参数加载 / 覆盖应用 / 覆盖清除。
 * 从 Agents.tsx 原样抽出（状态 + 处理函数），逻辑零改动。
 */

import { useState } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../../api/agents'

export function useAgentStepOverrides() {
  const [stepOverrideOpen, setStepOverrideOpen] = useState(false)
  const [stepOverrideForm, setStepOverrideForm] = useState<any>({ run_id: undefined, step_key: '', agent_id: undefined, required_capabilities: '', timeout_seconds: undefined, retry_count: undefined, on_failure: undefined, condition: '', task_template_id: undefined, sub_workflow_id: undefined })
  const [stepEffective, setStepEffective] = useState<any>(null)

  const openStepOverride = async (runId?: number, stepKey?: string) => {
    setStepOverrideForm({ run_id: runId, step_key: stepKey || '', agent_id: undefined, required_capabilities: '', timeout_seconds: undefined, retry_count: undefined, on_failure: undefined, condition: '', task_template_id: undefined, sub_workflow_id: undefined })
    setStepEffective(null)
    setStepOverrideOpen(true)
    if (runId && stepKey) loadStepEffective(runId, stepKey)
  }

  const loadStepEffective = async (runId: number, stepKey: string) => {
    try {
      const result = await agentsApi.getStepEffectiveParams(runId, stepKey)
      setStepEffective(result)
      const eff = result.effective_params || {}
      const ov = result.overrides || {}
      setStepOverrideForm((prev: any) => ({
        ...prev,
        agent_id: ov.agent_id !== undefined ? ov.agent_id : eff.agent_id ?? undefined,
        required_capabilities: (eff.required_capabilities || []).join(', '),
        timeout_seconds: eff.timeout_seconds ?? undefined,
        retry_count: eff.retry_count ?? undefined,
        on_failure: eff.on_failure || undefined,
        condition: eff.condition ? JSON.stringify(eff.condition) : '',
        task_template_id: eff.task_template_id ?? undefined,
        sub_workflow_id: eff.sub_workflow_id ?? undefined,
      }))
    } catch { message.error('加载有效参数失败') }
  }

  const submitStepOverride = async () => {
    if (!stepOverrideForm.run_id || !stepOverrideForm.step_key) { message.warning('请填写运行 ID 和步骤 key'); return }
    const overrides: any = {}
    if (stepOverrideForm.agent_id !== undefined && stepOverrideForm.agent_id !== null && stepOverrideForm.agent_id !== '') overrides.agent_id = Number(stepOverrideForm.agent_id)
    if (stepOverrideForm.required_capabilities) overrides.required_capabilities = String(stepOverrideForm.required_capabilities).split(',').map((s: string) => s.trim()).filter(Boolean)
    if (stepOverrideForm.timeout_seconds !== undefined && stepOverrideForm.timeout_seconds !== null && stepOverrideForm.timeout_seconds !== '') overrides.timeout_seconds = Number(stepOverrideForm.timeout_seconds)
    if (stepOverrideForm.retry_count !== undefined && stepOverrideForm.retry_count !== null && stepOverrideForm.retry_count !== '') overrides.retry_count = Number(stepOverrideForm.retry_count)
    if (stepOverrideForm.on_failure) overrides.on_failure = stepOverrideForm.on_failure
    if (stepOverrideForm.condition) { try { overrides.condition = JSON.parse(stepOverrideForm.condition) } catch { message.error('condition 必须是合法 JSON'); return } }
    if (stepOverrideForm.task_template_id) overrides.task_template_id = Number(stepOverrideForm.task_template_id)
    if (stepOverrideForm.sub_workflow_id) overrides.sub_workflow_id = Number(stepOverrideForm.sub_workflow_id)
    if (Object.keys(overrides).length === 0) { message.warning('请至少填写一项覆盖参数'); return }
    try {
      const result = await agentsApi.setStepRuntimeOverride(Number(stepOverrideForm.run_id), String(stepOverrideForm.step_key), { overrides, merge: true })
      message.success('步骤运行时覆盖已应用')
      setStepEffective(result)
    } catch { message.error('应用覆盖失败') }
  }

  const clearStepOverride = async () => {
    if (!stepOverrideForm.run_id || !stepOverrideForm.step_key) return
    try {
      const result = await agentsApi.clearStepRuntimeOverride(Number(stepOverrideForm.run_id), String(stepOverrideForm.step_key))
      message.success('运行时覆盖已清除')
      setStepEffective(result)
    } catch { message.error('清除覆盖失败') }
  }

  return {
    stepOverrideOpen, setStepOverrideOpen,
    stepOverrideForm, setStepOverrideForm,
    stepEffective, setStepEffective,
    openStepOverride,
    loadStepEffective,
    submitStepOverride,
    clearStepOverride,
  }
}
