/**
 * 协作事件 Payload 渲染组件
 *
 * 根据事件类型渲染不同的 payload 内容。
 */
import { Space, Tag, Typography } from 'antd'
import type { TaskEvent } from '../../../api/agents'
import { isRecord, toDisplayValue, toStringList } from './collaborationUtils'

const { Text } = Typography

interface EventPayloadRendererProps {
  event: TaskEvent
  tp: (key: string, options?: any) => string
  renderClaimMode: (mode: unknown) => string
  renderMatchStrategy: (strategy: unknown) => string
  renderState: (state: unknown) => string
}

const EventPayloadRenderer: React.FC<EventPayloadRendererProps> = ({
  event,
  tp,
  renderClaimMode,
  renderMatchStrategy,
  renderState,
}) => {
  const payload = event.payload || {}

  if (event.event_type === 'task_claimed') {
    const capabilityMatch = isRecord(payload.capability_match) ? payload.capability_match : null
    const score = typeof capabilityMatch?.score === 'number' ? capabilityMatch.score : 0
    const matchedCapabilities = toStringList(capabilityMatch?.matched_capabilities)
    const matchedTags = toStringList(capabilityMatch?.matched_tags)
    const matchedText = toStringList(capabilityMatch?.matched_text)

    return (
      <Space size={[4, 4]} wrap>
        {'assignment_id' in payload && <Tag>{tp('collaboration.fields.assignment')} #{toDisplayValue(payload.assignment_id)}</Tag>}
        {'agent_id' in payload && <Tag>{tp('collaboration.fields.agent')} #{toDisplayValue(payload.agent_id)}</Tag>}
        {'run_id' in payload && <Tag>{tp('collaboration.fields.run')} #{toDisplayValue(payload.run_id)}</Tag>}
        {'lease_seconds' in payload && <Tag>{tp('collaboration.fields.lease')} {toDisplayValue(payload.lease_seconds)}s</Tag>}
        {'claim_mode' in payload && (
          <Tag color={payload.claim_mode === 'manual_dispatch' ? 'purple' : 'blue'}>
            {renderClaimMode(payload.claim_mode)}
          </Tag>
        )}
        {capabilityMatch && (
          <Tag color={score > 0 ? 'green' : 'default'}>
            {tp('collaboration.fields.matchStrategy')} {renderMatchStrategy(capabilityMatch.strategy)}
          </Tag>
        )}
        {capabilityMatch && (
          <Tag color={score > 0 ? 'green' : 'default'}>
            {tp('collaboration.fields.matchScore')} {score}
          </Tag>
        )}
        {matchedCapabilities.length > 0 && (
          <Tag color="cyan">
            {tp('collaboration.fields.matchedCapabilities')} {matchedCapabilities.slice(0, 4).join(', ')}
          </Tag>
        )}
        {matchedTags.length > 0 && (
          <Tag color="blue">
            {tp('collaboration.fields.matchedTags')} {matchedTags.slice(0, 4).join(', ')}
          </Tag>
        )}
        {matchedText.length > 0 && (
          <Tag color="geekblue">
            {tp('collaboration.fields.matchedText')} {matchedText.slice(0, 4).join(', ')}
          </Tag>
        )}
      </Space>
    )
  }

  if (event.event_type === 'task_dispatched') {
    const score = typeof payload.score === 'number' ? payload.score : 0
    const matchedCapabilities = toStringList(payload.matched_capabilities)

    return (
      <Space size={[4, 4]} wrap>
        {'to_agent_id' in payload && <Tag color="geekblue">@{payload.to_agent_name ? String(payload.to_agent_name) : `Agent #${toDisplayValue(payload.to_agent_id)}`}</Tag>}
        {'assignment_id' in payload && <Tag>{tp('collaboration.fields.assignment')} #{toDisplayValue(payload.assignment_id)}</Tag>}
        {'run_id' in payload && <Tag>{tp('collaboration.fields.run')} #{toDisplayValue(payload.run_id)}</Tag>}
        {'lease_seconds' in payload && <Tag>{tp('collaboration.fields.lease')} {toDisplayValue(payload.lease_seconds)}s</Tag>}
        {'strategy' in payload && (
          <Tag color={score > 0 ? 'green' : 'default'}>
            {tp('collaboration.fields.matchStrategy')} {renderMatchStrategy(payload.strategy)}
          </Tag>
        )}
        <Tag color={score > 0 ? 'green' : 'default'}>{tp('collaboration.fields.matchScore')} {score}</Tag>
        {matchedCapabilities.length > 0 && (
          <Tag color="cyan">
            {tp('collaboration.fields.matchedCapabilities')} {matchedCapabilities.slice(0, 4).join(', ')}
          </Tag>
        )}
      </Space>
    )
  }

  if (event.event_type === 'subtask_created') {
    return (
      <Space size={[4, 4]} wrap>
        <Tag color="cyan">{tp('collaboration.events.subtask_created')}</Tag>
        {'subtask_id' in payload && <Tag>#{toDisplayValue(payload.subtask_id)}</Tag>}
        {'subtask_title' in payload && <Text strong>{String(payload.subtask_title)}</Text>}
      </Space>
    )
  }

  if (event.event_type === 'assignment_updated') {
    return (
      <Space size={[4, 4]} wrap>
        <Tag>
          {renderState(payload.old_state)} {'->'} {renderState(payload.new_state)}
        </Tag>
        {'progress_rate' in payload && <Tag>{tp('collaboration.fields.progress')} {toDisplayValue(payload.progress_rate)}%</Tag>}
        {payload.has_feedback === true && <Tag color="purple">{tp('collaboration.fields.feedback')}</Tag>}
        {payload.feedback_excerpt && <Tag color="purple">{toDisplayValue(payload.feedback_excerpt)}</Tag>}
      </Space>
    )
  }

  if (event.event_type === 'assignment_expired') {
    return (
      <Space size={[4, 4]} wrap>
        {'assignment_id' in payload && <Tag>{tp('collaboration.fields.assignment')} #{toDisplayValue(payload.assignment_id)}</Tag>}
        {'run_id' in payload && payload.run_id && <Tag>{tp('collaboration.fields.run')} #{toDisplayValue(payload.run_id)}</Tag>}
        <Tag color="red">
          {renderState(payload.old_state)} {'->'} {renderState(payload.new_state)}
        </Tag>
        {'lease_expires_at' in payload && <Tag>{tp('collaboration.fields.leaseExpires')} {toDisplayValue(payload.lease_expires_at)}</Tag>}
      </Space>
    )
  }

  // question/answer protocol: show awaiting status and reply linkage
  if (event.event_type === 'question') {
    const awaiting = payload.awaiting_answer !== false
    return (
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {typeof payload.content === 'string' && payload.content.trim() && (
          <Text style={{ whiteSpace: 'pre-wrap' }}>{String(payload.content)}</Text>
        )}
        <Space size={[4, 4]} wrap>
          {payload.to_agent_id != null && <Tag color="geekblue">@{payload.to_agent_name ? String(payload.to_agent_name) : `Agent #${payload.to_agent_id}`}</Tag>}
          <Tag color={awaiting ? 'orange' : 'green'}>{awaiting ? tp('collaboration.protocol.awaitingAnswer') : tp('collaboration.protocol.answered')}</Tag>
          {payload.answered_by_event_id != null && <Tag color="cyan">{tp('collaboration.protocol.answerEvent')} #{toDisplayValue(payload.answered_by_event_id)}</Tag>}
        </Space>
      </Space>
    )
  }

  if (event.event_type === 'answer') {
    return (
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        {typeof payload.content === 'string' && payload.content.trim() && (
          <Text style={{ whiteSpace: 'pre-wrap' }}>{String(payload.content)}</Text>
        )}
        <Space size={[4, 4]} wrap>
          {payload.reply_to_event_id != null && <Tag color="purple">{tp('collaboration.protocol.replyTo')} #{toDisplayValue(payload.reply_to_event_id)}</Tag>}
          {payload.to_agent_id != null && <Tag color="geekblue">@{payload.to_agent_name ? String(payload.to_agent_name) : `Agent #${payload.to_agent_id}`}</Tag>}
        </Space>
      </Space>
    )
  }

  const hasContent = typeof payload.content === 'string' && payload.content.trim() !== ''
  const hiddenKeys = new Set(['content', 'to_agent_id', 'to_agent_name'])
  const otherEntries = Object.entries(payload).filter(
    ([key, value]) => !hiddenKeys.has(key) && value !== undefined && value !== null
  )

  if (!hasContent && otherEntries.length === 0) {
    return null
  }

  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      {hasContent && (
        <Text style={{ whiteSpace: 'pre-wrap' }}>{String(payload.content)}</Text>
      )}
      {otherEntries.length > 0 && (
        <Space size={[4, 4]} wrap>
          {otherEntries.slice(0, 4).map(([key, value]) => (
            <Tag key={key}>{key}: {toDisplayValue(value)}</Tag>
          ))}
        </Space>
      )}
    </Space>
  )
}

export default EventPayloadRenderer