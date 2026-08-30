import { Descriptions, Modal, Typography } from 'antd'
import type { AgentActivityItem } from '../../../../api/agents'
import { formatDateTime } from '../detailTabs/shared'
import './WorkspaceActivityDetailModal.css'

const { Text } = Typography

type TranslateFn = (key: string, options?: Record<string, any>) => string

interface WorkspaceActivityDetailModalProps {
  tp: TranslateFn
  item: AgentActivityItem | null
  onClose: () => void
  getActivitySourceLabel: (value?: string | null) => string
  getActivityLevelLabel: (value?: string | null) => string
}

export function WorkspaceActivityDetailModal({
  tp,
  item,
  onClose,
  getActivitySourceLabel,
  getActivityLevelLabel,
}: WorkspaceActivityDetailModalProps) {
  return (
    <Modal
      title={tp('detail.activity.detailTitle', { defaultValue: 'Activity Detail' })}
      open={!!item}
      onCancel={onClose}
      onOk={onClose}
      okText={tp('detail.activity.close', { defaultValue: 'Close' })}
      cancelButtonProps={{ style: { display: 'none' } }}
      width={900}
    >
      <Descriptions bordered size='small' column={2}>
        <Descriptions.Item label={tp('workspaceActivity.agent', { defaultValue: 'Agent' })} span={2}>
          {item?.agent_display_name || item?.agent_name || '-'}
          {item?.agent_id ? ` (#${item.agent_id})` : ''}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.source', { defaultValue: 'Source' })}>
          {getActivitySourceLabel(item?.source)}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.level', { defaultValue: 'Level' })}>
          {getActivityLevelLabel(item?.level)}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.eventType', { defaultValue: 'Event Type' })} span={2}>
          <Text code>{item?.event_type || '-'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.occurredAt', { defaultValue: 'Occurred At' })}>
          {formatDateTime(item?.occurred_at)}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.related', { defaultValue: 'Related' })}>
          {item?.task_id
            ? `${tp('detail.activity.taskId', { defaultValue: 'Task ID' })}: ${item.task_id}`
            : item?.run_id
              ? `${tp('detail.activity.runId', { defaultValue: 'Run ID' })}: ${item.run_id}`
              : item?.attempt_id
                ? `${tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}: ${item.attempt_id}`
                : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.message', { defaultValue: 'Message' })} span={2}>
          {item?.message || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.riskScore', { defaultValue: 'Risk Score' })}>
          {typeof item?.risk_score === 'number' ? item.risk_score : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.correlationId', { defaultValue: 'Correlation ID' })}>
          {item?.correlation_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.requestId', { defaultValue: 'Request ID' })}>
          {item?.request_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.durationMs', { defaultValue: 'Duration (ms)' })}>
          {typeof item?.duration_ms === 'number' ? item.duration_ms : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.errorCode', { defaultValue: 'Error Code' })}>
          {item?.error_code || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.runId', { defaultValue: 'Run ID' })}>
          {item?.run_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}>
          {item?.attempt_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.taskId', { defaultValue: 'Task ID' })}>
          {item?.task_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.projectId', { defaultValue: 'Project ID' })}>
          {item?.project_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.actor', { defaultValue: 'Actor' })}>
          {item?.actor_type || item?.actor_id ? `${item?.actor_type || '-'}:${item?.actor_id || '-'}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.target', { defaultValue: 'Target' })}>
          {item?.target_type || item?.target_id ? `${item?.target_type || '-'}:${item?.target_id || '-'}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.payload', { defaultValue: 'Payload' })} span={2}>
          <pre className='workspace-activity-detail-modal__payload'>{JSON.stringify(item?.payload || {}, null, 2)}</pre>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  )
}

export default WorkspaceActivityDetailModal
