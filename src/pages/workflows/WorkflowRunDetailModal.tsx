import React from 'react'
import { Button, Descriptions, Modal, Popconfirm, Space, Steps, Tag } from 'antd'
import {
  MonitorOutlined, PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined, StopOutlined,
} from '@ant-design/icons'
import type { WorkflowRunItem } from '../../api/agents'
import WorkflowDagViewer from '../../components/Workflow/WorkflowDagViewer'
import { STEP_STATUS_MAP, WORKFLOW_STATUS_COLORS } from './runStatus'

interface WorkflowRunDetailModalProps {
  open: boolean
  run: WorkflowRunItem | null
  onClose: () => void
  onOpenConsole: (runId: number) => void
  onPause: (runId: number) => void
  onResume: (runId: number) => void
  onRetry: (runId: number) => void
  onCancel: (runId: number) => void
}

/** 运行详情弹窗：概要 + 运行控制 + 运行 DAG + 步骤时间线 */
const WorkflowRunDetailModal: React.FC<WorkflowRunDetailModalProps> = ({
  open, run, onClose, onOpenConsole, onPause, onResume, onRetry, onCancel,
}) => (
  <Modal
    title={`工作流运行 #${run?.id || ''}`}
    open={open}
    onCancel={onClose}
    footer={null}
    width={640}
  >
    {run && (
      <div>
        <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="状态">
            <Tag color={WORKFLOW_STATUS_COLORS[run.status] || 'default'}>{run.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="项目 ID">{run.project_id}</Descriptions.Item>
          {run.root_task_id && (
            <Descriptions.Item label="根任务">#{run.root_task_id}</Descriptions.Item>
          )}
          {run.error && (
            <Descriptions.Item label="错误" span={2}>
              <span style={{ color: '#ff4d4f' }}>{run.error}</span>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Runtime control buttons */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Button size="small" icon={<MonitorOutlined />} onClick={() => onOpenConsole(run.id)}>
            实时控制台
          </Button>
          {run.status === 'running' && (
            <Button size="small" icon={<PauseCircleOutlined />} onClick={() => onPause(run.id)}>
              暂停
            </Button>
          )}
          {run.status === 'paused' && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => onResume(run.id)}>
              恢复
            </Button>
          )}
          {run.status === 'failed' && (
            <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={() => onRetry(run.id)}>
              重试
            </Button>
          )}
          {['running', 'paused', 'pending'].includes(run.status) && (
            <Popconfirm title="确定取消此工作流运行？" onConfirm={() => onCancel(run.id)}>
              <Button size="small" danger icon={<StopOutlined />}>取消</Button>
            </Popconfirm>
          )}
        </div>

        {/* Run DAG visualization */}
        {(run.step_runs || []).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>运行 DAG</div>
            <WorkflowDagViewer
              steps={(run.step_runs || []).map(sr => ({
                step_key: sr.step_key,
                name: sr.name || sr.step_key,
                depends_on: sr.depends_on || [],
                status: sr.status,
                agent_id: sr.agent_id,
                task_id: sr.task_id,
              }))}
              width={580}
              height={200}
            />
          </div>
        )}

        <Steps
          direction="vertical"
          size="small"
          items={(run.step_runs || []).map(sr => {
            const statusInfo = STEP_STATUS_MAP[sr.status] || STEP_STATUS_MAP.pending
            return {
              title: (
                <Space>
                  <span>{sr.step_key}</span>
                  <Tag color={statusInfo.color} icon={statusInfo.icon} style={{ fontSize: 11 }}>
                    {sr.status}
                  </Tag>
                  {sr.agent_id && (
                    <Tag style={{ fontSize: 11 }}>Agent #{sr.agent_id}</Tag>
                  )}
                </Space>
              ),
              description: (
                <div>
                  {sr.task_id && <div style={{ fontSize: 12, color: '#8c8c8c' }}>任务 #{sr.task_id}</div>}
                  {sr.error && <div style={{ fontSize: 12, color: '#ff4d4f' }}>{sr.error}</div>}
                  {sr.started_at && (
                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                      开始: {new Date(sr.started_at).toLocaleString()}
                      {sr.finished_at && ` → 结束: ${new Date(sr.finished_at).toLocaleString()}`}
                    </div>
                  )}
                </div>
              ),
            }
          })}
        />
      </div>
    )}
  </Modal>
)

export default WorkflowRunDetailModal
