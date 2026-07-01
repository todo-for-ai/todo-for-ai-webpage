import React from 'react'
import { List, Tag, Space, Tooltip, Typography } from 'antd'
import type { SecurityEventItem } from '../api/agents'

const { Text } = Typography

interface SecurityEventListItemProps {
  event: SecurityEventItem
  /** full = 完整展示（标题/详情/时间/来源，Dashboard 用）；compact = 紧凑折叠（Tooltip 详情，CommandCenter 用） */
  variant?: 'full' | 'compact'
  /** 点击 Run 标签回调（有 workflow_run_id 时触发） */
  onRunClick?: (runId: number) => void
  /** 点击「详情」标签回调（compact 变体下渲染详情入口，打开详情 Modal） */
  onShowDetail?: (event: SecurityEventItem) => void
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: 'red',
  WARNING: 'orange',
  INFO: 'blue',
}

const TYPE_COLOR: Record<string, string> = {
  sandbox_violation: 'magenta',
  conflict: 'volcano',
  audit: 'geekblue',
}

const TYPE_LABEL: Record<string, string> = {
  sandbox_violation: '沙盒违规',
  conflict: '冲突',
  audit: '审计',
}

/**
 * 单条安全事件的列表项渲染。Dashboard 与 CommandCenter 复用，
 * 通过 variant 区分完整/紧凑展示，onRunClick 支持 Run 跳转。
 */
const SecurityEventListItem: React.FC<SecurityEventListItemProps> = ({
  event,
  variant = 'full',
  onRunClick,
  onShowDetail,
}) => {
  const e = event as any
  const sev = e.severity || 'INFO'
  const sevColor = SEV_COLOR[sev] || 'blue'
  const etype = e.event_type || 'audit'
  const typeColor = TYPE_COLOR[etype] || 'geekblue'
  const typeLabel = TYPE_LABEL[etype] || etype
  const hasRun = !!e.workflow_run_id && !!onRunClick

  const listItemProps = variant === 'compact'
    ? {
        style: {
          cursor: hasRun ? 'pointer' : 'default',
          padding: '6px 8px',
          borderRadius: 4,
        } as React.CSSProperties,
        onClick: hasRun ? () => onRunClick!(e.workflow_run_id) : undefined,
      }
    : {}

  return (
    <List.Item {...listItemProps}>
      <Space align="start" style={{ width: '100%' }}>
        <Tag color={sevColor} style={{ marginTop: 2 }}>{sev}</Tag>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={[6, 4]} wrap>
            <Tag color={typeColor}>{typeLabel}</Tag>
            {variant === 'full' ? (
              <Text strong style={{ fontSize: 13 }}>{e.title}</Text>
            ) : null}
            {e.agent_id && (
              <Tag style={{ fontSize: 11 }}>Agent #{e.agent_id}</Tag>
            )}
            {e.workflow_run_id && (
              <Tag
                color={variant === 'compact' ? 'blue' : undefined}
                style={{ fontSize: 11, cursor: hasRun ? 'pointer' : undefined }}
              >
                Run #{e.workflow_run_id}{variant === 'compact' ? ' →' : ''}
              </Tag>
            )}
            {variant === 'compact' && onShowDetail && (
              <Tag
                style={{ fontSize: 11, cursor: 'pointer' }}
                onClick={(ev) => { ev.stopPropagation(); onShowDetail(event) }}
              >
                详情
              </Tag>
            )}
            {variant === 'full' && e.source && (
              <Text type="secondary" style={{ fontSize: 11 }}>{e.source}#{e.source_id}</Text>
            )}
          </Space>
          {variant === 'full' ? (
            <>
              {e.detail && (
                <div style={{ fontSize: 12, color: '#595959', marginTop: 2, wordBreak: 'break-word' }}>{e.detail}</div>
              )}
              {e.occurred_at && (
                <Text type="secondary" style={{ fontSize: 11 }}>{new Date(e.occurred_at).toLocaleString('zh-CN')}</Text>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              <Tooltip title={e.detail}>
                <Text ellipsis style={{ maxWidth: '100%', display: 'block' }}>
                  {e.title}
                </Text>
              </Tooltip>
            </div>
          )}
        </div>
      </Space>
    </List.Item>
  )
}

export default SecurityEventListItem
