import { useState, useEffect, useCallback } from 'react'
import { Form, message } from 'antd'
import { agentsApi } from '../../api/agents'

/**
 * 工作流定时触发器域：列表/创建弹窗/启停/删除。
 * 从 useWorkflowsData 原样拆出；行为由 useWorkflowsData.test.tsx 钉住。
 */
export function useWorkflowTriggers() {
  const [triggers, setTriggers] = useState<any[]>([])
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [triggerModalOpen, setTriggerModalOpen] = useState(false)
  const [triggerForm] = Form.useForm()
  const [triggerTargetWfId, setTriggerTargetWfId] = useState<number | null>(null)

  const loadTriggers = useCallback(async () => {
    setTriggerLoading(true)
    try {
      const result = await agentsApi.getWorkflowTriggers({ per_page: 100 })
      setTriggers(result.items)
    } catch {
      message.error('加载触发器失败')
    } finally {
      setTriggerLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTriggers()
  }, [loadTriggers])

  const openTriggerModal = (workflowId: number) => {
    setTriggerTargetWfId(workflowId)
    setTriggerModalOpen(true)
    triggerForm.resetFields()
  }

  const handleCreateTrigger = async () => {
    if (!triggerTargetWfId) return
    try {
      const values = await triggerForm.validateFields()
      await agentsApi.createWorkflowTrigger({
        workflow_id: triggerTargetWfId,
        name: values.name,
        cron_expr: values.cron_expr || undefined,
        one_shot_at: values.one_shot_at || undefined,
        is_active: values.is_active !== false,
        project_id: values.project_id || undefined,
      })
      message.success('触发器创建成功')
      setTriggerModalOpen(false)
      loadTriggers()
    } catch (e: any) {
      if (e?.errorFields) return
      message.error('创建触发器失败: ' + (e?.message || ''))
    }
  }

  const handleToggleTrigger = async (trigger: any) => {
    try {
      await agentsApi.updateWorkflowTrigger(trigger.id, { is_active: !trigger.is_active })
      message.success(trigger.is_active ? '已停用' : '已启用')
      loadTriggers()
    } catch {
      message.error('操作失败')
    }
  }

  const handleDeleteTrigger = async (id: number) => {
    try {
      await agentsApi.deleteWorkflowTrigger(id)
      message.success('已删除')
      loadTriggers()
    } catch {
      message.error('删除失败')
    }
  }

  return {
    triggers, setTriggers,
    triggerLoading, setTriggerLoading,
    triggerModalOpen, setTriggerModalOpen,
    triggerForm,
    triggerTargetWfId, setTriggerTargetWfId,
    loadTriggers,
    openTriggerModal,
    handleCreateTrigger,
    handleToggleTrigger,
    handleDeleteTrigger,
  }
}
