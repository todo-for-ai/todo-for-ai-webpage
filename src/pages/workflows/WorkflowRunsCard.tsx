/**
 * 工作流运行记录卡片
 *
 * 展示工作流运行历史列表，支持暂停/恢复/重试/取消操作。
 */
import { Button, Card, Empty, Popconfirm, Space, Spin, Tag } from 'antd'
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons'
import type { FC } from 'react'
import type { WorkflowRunItem } from '../../api/agents'

const WORKFLOW_STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  paused: 'warning',
  succeeded: 'success',
  failed: 'error',
  cancelled: 'default',
}

interface WorkflowRunsCardProps {
  runs: WorkflowRunItem[]
  runsLoading: boolean
  onRefresh: () => void
  onViewRun: (runId: number) => void
  onPauseRun: (runId: number) => void
  onResumeRun: (runId: number) => void
  onRetryRun: (runId: number) => void
  onCancelRun: (runId: number) => void
}

const WorkflowRunsCard: FC<WorkflowRunsCardProps> = ({
  runs,
  runsLoading,
  onRefresh,
  onViewRun,
  onPauseRun,
  onResumeRun,
  onRetryRun,
  onCancelRun,
}) => (
  <Card title="运行记录" style={{ marginBottom: 24 }} extra={<Button size="small" onClick={onRefresh}>刷新</Button>}>
    <Spin spinning={runsLoading}>
      {runs.length === 0 ? (
        <Empty description="暂无运行记录" />
      ) : (
        <div>
          {runs.map(run => {
            const done = (run.step_runs || []).filter(sr => sr.status === 'succeeded').length
            const total = (run.step_runs || []).length
            return (
              <Card
                key={run.id}
                size="small"
                style={{ marginBottom: 8, cursor: 'pointer' }}
                onClick={() => onViewRun(run.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Tag color={WORKFLOW_STATUS_COLORS[run.status] || 'default'}>{run.status}</Tag>
                    <span>运行 #{run.id}</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                      步骤 {done}/{total}
                    </span>
                  </Space>
                  <Space>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {new Date(run.created_at).toLocaleString()}
                    </span>
                    {run.status === 'running' && (
                      <Button size="small" icon={<PauseCircleOutlined />} onClick={(e) => { e.stopPropagation(); onPauseRun(run.id) }}>
                        暂停
                      </Button>
                    )}
                    {run.status === 'paused' && (
                      <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={(e) => { e.stopPropagation(); onResumeRun(run.id) }}>
                        恢复
                      </Button>
                    )}
                    {run.status === 'failed' && (
                      <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={(e) => { e.stopPropagation(); onRetryRun(run.id) }}>
                        重试
                      </Button>
                    )}
                    {['running', 'paused', 'pending'].includes(run.status) && (
                      <Popconfirm title="确定取消此运行？" onConfirm={(e) => { e?.stopPropagation(); onCancelRun(run.id) }} onCancel={(e) => e?.stopPropagation()}>
                        <Button size="small" danger icon={<StopOutlined />} onClick={(e) => e.stopPropagation()}>
                          取消
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </Spin>
  </Card>
)

export default WorkflowRunsCard
