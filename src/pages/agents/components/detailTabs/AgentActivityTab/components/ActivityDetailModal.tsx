import { Descriptions, Modal, Typography } from 'antd'
import type { AgentActivityItem } from '../../../../../../api/agents'
import { usePageTranslation } from '../../../../../../i18n/hooks/useTranslation'
import { formatDateTime } from '../../shared'
import './ActivityDetailModal.css'

const { Text } = Typography

interface ActivityDetailModalProps {
  detailItem: AgentActivityItem | null
  getActivitySourceLabel: (value?: string | null) => string
  getActivityLevelLabel: (value?: string | null) => string
  onClose: () => void
}

export function ActivityDetailModal({
  detailItem,
  getActivitySourceLabel,
  getActivityLevelLabel,
  onClose,
}: ActivityDetailModalProps) {
  const { tp } = usePageTranslation('agents')

  return (
    <Modal
      title={tp('detail.activity.detailTitle', { defaultValue: 'Activity Detail' })}
      open={!!detailItem}
      onCancel={onClose}
      onOk={onClose}
      okText={tp('detail.activity.close', { defaultValue: 'Close' })}
      cancelButtonProps={{ style: { display: 'none' } }}
      width={900}
      className='flat-modal'
    >
      <Descriptions bordered size='small' column={2}>
        <Descriptions.Item label={tp('detail.activity.source', { defaultValue: 'Source' })}>
          {getActivitySourceLabel(detailItem?.source)}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.level', { defaultValue: 'Level' })}>
          {getActivityLevelLabel(detailItem?.level)}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.eventType', { defaultValue: 'Event Type' })} span={2}>
          <Text code>{detailItem?.event_type || '-'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.occurredAt', { defaultValue: 'Occurred At' })}>
          {formatDateTime(detailItem?.occurred_at)}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.related', { defaultValue: 'Related' })}>
          {detailItem?.task_id
            ? `${tp('detail.activity.taskId', { defaultValue: 'Task ID' })}: ${detailItem.task_id}`
            : detailItem?.run_id
              ? `${tp('detail.activity.runId', { defaultValue: 'Run ID' })}: ${detailItem.run_id}`
              : detailItem?.attempt_id
                ? `${tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}: ${detailItem.attempt_id}`
                : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.message', { defaultValue: 'Message' })} span={2}>
          {detailItem?.message || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.riskScore', { defaultValue: 'Risk Score' })}>
          {typeof detailItem?.risk_score === 'number' ? detailItem.risk_score : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.correlationId', { defaultValue: 'Correlation ID' })}>
          {detailItem?.correlation_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.requestId', { defaultValue: 'Request ID' })}>
          {detailItem?.request_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.durationMs', { defaultValue: 'Duration (ms)' })}>
          {typeof detailItem?.duration_ms === 'number' ? detailItem.duration_ms : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.errorCode', { defaultValue: 'Error Code' })}>
          {detailItem?.error_code || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.runId', { defaultValue: 'Run ID' })}>
          {detailItem?.run_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.attemptId', { defaultValue: 'Attempt ID' })}>
          {detailItem?.attempt_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.taskId', { defaultValue: 'Task ID' })}>
          {detailItem?.task_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.projectId', { defaultValue: 'Project ID' })}>
          {detailItem?.project_id || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.actor', { defaultValue: 'Actor' })}>
          {detailItem?.actor_type || detailItem?.actor_id
            ? `${detailItem?.actor_type || '-'}:${detailItem?.actor_id || '-'}`
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.target', { defaultValue: 'Target' })}>
          {detailItem?.target_type || detailItem?.target_id
            ? `${detailItem?.target_type || '-'}:${detailItem?.target_id || '-'}`
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={tp('detail.activity.payload', { defaultValue: 'Payload' })} span={2}>
          <pre className='activity-detail-modal__payload'>
            {JSON.stringify(detailItem?.payload || {}, null, 2)}
          </pre>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  )
}
