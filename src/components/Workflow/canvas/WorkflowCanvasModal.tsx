import { useCallback, useEffect, useState } from 'react'
import { Modal, Spin, message } from 'antd'
import { agentsApi, type Agent, type CreateWorkflowStepData, type WorkflowItem } from '../../../api/agents'
import WorkflowCanvasEditor from './WorkflowCanvasEditor'

interface WorkflowCanvasModalProps {
  /** 编辑模式的工作流 id；createMode=true 时忽略 */
  workflowId: number | null
  /** true = 画布新建空白工作流（保存时 POST 创建） */
  createMode?: boolean
  agents: Agent[]
  workflows: WorkflowItem[]
  onClose: () => void
  onSaved: () => void
}

const blankDraft = (): WorkflowItem => ({
  id: 0,
  owner_id: 0,
  name: '',
  description: '',
  version: 1,
  definition: {},
  is_active: true,
  max_parallel_steps: 0,
  steps: [],
  created_at: '',
  updated_at: '',
})

/** 画布式工作流编辑器入口：加载详情 → React Flow 编辑 → PUT 保存（或 createMode 时 POST 创建） */
const WorkflowCanvasModal: React.FC<WorkflowCanvasModalProps> = ({
  workflowId, createMode = false, agents, workflows, onClose, onSaved,
}) => {
  const [workflow, setWorkflow] = useState<WorkflowItem | null>(createMode ? blankDraft() : null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (createMode) {
      setWorkflow(blankDraft())
      setDirty(false)
      return
    }
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
  }, [workflowId, createMode])

  const handleSave = useCallback(async (payload: {
    name: string
    description: string
    max_parallel_steps: number
    definition: Record<string, unknown>
    steps: CreateWorkflowStepData[]
  }) => {
    setSaving(true)
    try {
      if (createMode) {
        await agentsApi.createWorkflow(payload)
        void message.success('工作流已创建')
      } else {
        if (!workflow) return
        await agentsApi.updateWorkflow(workflow.id, payload)
        void message.success('工作流已保存（自动生成新版本）')
      }
      setDirty(false)
      onSaved()
      onClose()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string }
      void message.error('保存失败: ' + (err?.response?.data?.error || err?.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }, [createMode, workflow, onSaved, onClose])

  // 有未保存变更时关闭前确认（右上角 × / 遮罩点击 / ESC 都走这里）
  const requestClose = useCallback(() => {
    if (!dirty) {
      onClose()
      return
    }
    Modal.confirm({
      title: '放弃未保存的修改？',
      content: '画布上有未保存的变更，关闭后将丢失。',
      okText: '放弃修改',
      okButtonProps: { danger: true },
      cancelText: '继续编辑',
      onOk: () => {
        setDirty(false)
        onClose()
      },
    })
  }, [dirty, onClose])

  const open = createMode || workflowId != null

  return (
    <Modal
      title={createMode ? '画布新建工作流' : `画布编辑 · ${workflow?.name ?? ''}`}
      open={open}
      onCancel={requestClose}
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
          onDirtyChange={setDirty}
          onTestRun={!createMode && workflow.id > 0
            ? async (stepKey: string) => agentsApi.testRunWorkflowStep(workflow.id, stepKey)
            : undefined}
          onSave={handleSave}
        />
      )}
    </Modal>
  )
}

export default WorkflowCanvasModal
