import { useCallback, useEffect, useState } from 'react'
import { Modal, Spin, message } from 'antd'
import { agentsApi, type Agent, type WorkflowItem } from '../../../api/agents'
import type { CreateWorkflowStepData } from '../../../api/agents'
import WorkflowCanvasEditor from './WorkflowCanvasEditor'

interface WorkflowCanvasModalProps {
  /** null = 关闭 */
  workflowId: number | null
  agents: Agent[]
  workflows: WorkflowItem[]
  onClose: () => void
  onSaved: () => void
}

/** 画布式工作流编辑器入口：加载详情 → React Flow 编辑 → PUT 保存 */
const WorkflowCanvasModal: React.FC<WorkflowCanvasModalProps> = ({
  workflowId, agents, workflows, onClose, onSaved,
}) => {
  const [workflow, setWorkflow] = useState<WorkflowItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (workflowId == null) {
      setWorkflow(null)
      return
    }
    let cancelled = false
    setLoading(true)
    agentsApi.getWorkflow(workflowId)
      .then((wf: WorkflowItem) => {
        if (!cancelled) setWorkflow(wf)
      })
      .catch((e: Error) => {
        void message.error('加载工作流失败: ' + (e?.message || '未知错误'))
        onClose()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId])

  const handleSave = useCallback(async (payload: {
    name: string
    description: string
    max_parallel_steps: number
    definition: Record<string, unknown>
    steps: CreateWorkflowStepData[]
  }) => {
    if (!workflow) return
    setSaving(true)
    try {
      await agentsApi.updateWorkflow(workflow.id, payload)
      void message.success('工作流已保存（自动生成新版本）')
      onSaved()
      onClose()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      void message.error('保存失败: ' + (err?.response?.data?.error || err?.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }, [workflow, onSaved, onClose])

  return (
    <Modal
      title={`画布编辑 · ${workflow?.name ?? ''}`}
      open={workflowId != null}
      onCancel={onClose}
      footer={null}
      width="96vw"
      style={{ top: 16 }}
      styles={{ body: { height: 'calc(100vh - 120px)', padding: 0 } }}
      destroyOnClose
    >
      {loading || !workflow ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Spin tip="加载工作流…" />
        </div>
      ) : (
        <WorkflowCanvasEditor
          workflow={workflow}
          agents={agents.map(a => ({ id: a.id, name: a.name }))}
          workflows={workflows.map(w => ({ id: w.id, name: w.name }))}
          saving={saving}
          onSave={handleSave}
        />
      )}
    </Modal>
  )
}

export default WorkflowCanvasModal
