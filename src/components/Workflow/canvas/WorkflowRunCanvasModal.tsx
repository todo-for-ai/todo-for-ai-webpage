import { Modal } from 'antd'
import WorkflowRunCanvas from './WorkflowRunCanvas'

interface WorkflowRunCanvasModalProps {
  /** null = 关闭 */
  runId: number | null
  onClose: () => void
  /** 打开旧控制台视图（联动复用） */
  onOpenConsole?: (runId: number) => void
}

/** 运行态画布入口：全屏展示一次工作流运行的实时 DAG */
const WorkflowRunCanvasModal: React.FC<WorkflowRunCanvasModalProps> = ({
  runId, onClose, onOpenConsole,
}) => (
  <Modal
    title={`运行画布 · #${runId ?? ''}`}
    open={runId != null}
    onCancel={onClose}
    footer={null}
    width="92vw"
    style={{ top: 24 }}
    styles={{ body: { height: 'calc(100vh - 160px)', padding: 0 } }}
    destroyOnClose
  >
    {runId != null && (
      <WorkflowRunCanvas runId={runId} onOpenConsole={onOpenConsole} />
    )}
  </Modal>
)

export default WorkflowRunCanvasModal
