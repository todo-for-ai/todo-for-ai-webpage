import React from 'react'
import { Modal, Descriptions, Button } from 'antd'
import type { SecurityEventItem } from '../api/agents'

interface SecurityEventDetailModalProps {
  /** 当前查看的事件，null 时 Modal 关闭 */
  event: SecurityEventItem | null
  /** 是否打开（兼容受控用法；默认根据 event 是否为空判定） */
  open?: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 点击「查看运行控制台」回调（有 workflow_run_id 时显示该按钮） */
  onRunClick?: (runId: number) => void
}

/**
 * 安全事件详情 Modal：Descriptions 展示类型/严重度/标题/详情/来源/Agent/运行/发生时间。
 * Dashboard 与 CommandCenter 复用，避免重复实现。
 * footer 含「查看运行控制台 →」按钮（有 workflow_run_id 且提供 onRunClick 时）。
 */
const SecurityEventDetailModal: React.FC<SecurityEventDetailModalProps> = ({
  event,
  open,
  onClose,
  onRunClick,
}) => {
  const e = event as any
  const isOpen = open !== undefined ? open : !!event
  return (
    <Modal
      title={e ? `安全事件 · ${e.severity || 'INFO'}` : '安全事件详情'}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>关闭</Button>,
        ...(e?.workflow_run_id && onRunClick ? [
          <Button
            key="run"
            type="link"
            onClick={() => {
              const runId = e.workflow_run_id
              onClose()
              onRunClick(runId)
            }}
          >
            查看运行控制台 →
          </Button>,
        ] : []),
      ]}
    >
      {e && (
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="类型">{e.event_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="严重度">{e.severity || '-'}</Descriptions.Item>
          <Descriptions.Item label="标题">{e.title || '-'}</Descriptions.Item>
          <Descriptions.Item label="详情">{e.detail || '-'}</Descriptions.Item>
          <Descriptions.Item label="来源">{e.source ? `${e.source}#${e.source_id}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="Agent">{e.agent_id ? `Agent #${e.agent_id}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="工作流运行">{e.workflow_run_id ? `Run #${e.workflow_run_id}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="发生时间">{e.occurred_at ? new Date(e.occurred_at).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  )
}

export default SecurityEventDetailModal
