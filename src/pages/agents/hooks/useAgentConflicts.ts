/**
 * Agents.tsx 冲突检测与解决领域块：冲突列表 / 扫描 / 详情 / 确认 / 忽略 / 手动与自动解决。
 * 从 Agents.tsx 原样抽出（状态 + 处理函数），逻辑零改动。
 */

import { useState } from 'react'
import { message } from 'antd'
import { agentsApi } from '../../../api/agents'

export function useAgentConflicts() {
  const [conflictOpen, setConflictOpen] = useState(false)
  const [conflicts, setConflicts] = useState<any[]>([])
  const [conflictDetail, setConflictDetail] = useState<any>(null)
  const [conflictDetailOpen, setConflictDetailOpen] = useState(false)
  const [conflictResolveOpen, setConflictResolveOpen] = useState(false)
  const [conflictResolveForm, setConflictResolveForm] = useState<any>({ conflict_id: 0, strategy: '', description: '' })

  const loadConflicts = async (activeOnly = true) => {
    try {
      const result = await agentsApi.listConflicts(activeOnly ? { active_only: 'true' } : {})
      setConflicts(result.items || [])
    } catch { message.error('加载冲突列表失败') }
  }

  const openConflicts = async () => {
    setConflictOpen(true)
    loadConflicts()
  }

  const scanConflicts = async () => {
    try {
      const result = await agentsApi.scanConflicts()
      message.success(result.detected > 0 ? `检测到 ${result.detected} 个新冲突` : '无新冲突')
      loadConflicts()
    } catch { message.error('扫描失败') }
  }

  const openConflictDetail = async (id: number) => {
    try {
      const result = await agentsApi.getConflict(id)
      setConflictDetail(result.conflict)
      setConflictDetailOpen(true)
    } catch { message.error('加载冲突详情失败') }
  }

  const acknowledgeConflict = async (id: number) => {
    try {
      await agentsApi.acknowledgeConflict(id)
      message.success('已确认')
      loadConflicts()
    } catch { message.error('确认失败') }
  }

  const ignoreConflict = async (id: number) => {
    try {
      await agentsApi.ignoreConflict(id)
      message.success('已忽略')
      loadConflicts()
    } catch { message.error('忽略失败') }
  }

  const openResolveConflict = (c: any) => {
    setConflictResolveForm({ conflict_id: c.id, strategy: c.suggested_strategy || 'manual', description: '' })
    setConflictResolveOpen(true)
  }

  const submitResolveConflict = async () => {
    try {
      const result = await agentsApi.resolveConflict(conflictResolveForm.conflict_id, conflictResolveForm.strategy, conflictResolveForm.description)
      message.success('冲突已解决')
      setConflictResolveOpen(false)
      loadConflicts()
      if (result.actions?.length) message.info(`执行 ${result.actions.length} 项动作`, 4)
    } catch { message.error('解决失败') }
  }

  const autoResolveConflicts = async () => {
    try {
      const result = await agentsApi.autoResolveConflicts()
      message.success(`自动解决 ${result.auto_resolved || 0} 个, 跳过 ${result.skipped || 0} 个`)
      loadConflicts()
    } catch { message.error('自动解决失败') }
  }

  return {
    conflictOpen, setConflictOpen,
    conflicts, setConflicts,
    conflictDetail, setConflictDetail,
    conflictDetailOpen, setConflictDetailOpen,
    conflictResolveOpen, setConflictResolveOpen,
    conflictResolveForm, setConflictResolveForm,
    loadConflicts,
    openConflicts,
    scanConflicts,
    openConflictDetail,
    acknowledgeConflict,
    ignoreConflict,
    openResolveConflict,
    submitResolveConflict,
    autoResolveConflicts,
  }
}
