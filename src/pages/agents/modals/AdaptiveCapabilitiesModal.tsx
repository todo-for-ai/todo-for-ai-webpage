import React from 'react'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  List,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'

const { Text } = Typography

export interface AdaptiveCapabilitiesModalProps {
  open: boolean
  agentName: string
  suggestions: any
  onCancel: () => void
  onApplyAdaptation: (additions: string[], removals: string[]) => void
}

const AdaptiveCapabilitiesModal: React.FC<AdaptiveCapabilitiesModalProps> = ({
  open,
  agentName,
  suggestions: adaptSuggestions,
  onCancel,
  onApplyAdaptation,
}) => {
  return (
    <Modal
      title={`能力自适应建议 — ${agentName}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      {adaptSuggestions ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">基于 Agent 的成功/失败经验模式，以下能力调整建议可优化任务匹配效果。</Text>
          </div>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="当前能力">
              <Space wrap>{(adaptSuggestions.current_capabilities || []).map((c: string) => <Tag key={c}>{c}</Tag>)}</Space>
            </Descriptions.Item>
          </Descriptions>
          {Object.keys(adaptSuggestions.suggested_additions || {}).length > 0 && (
            <Card size="small" title="建议添加" style={{ marginTop: 12 }} extra={<Button size="small" type="primary" onClick={() => onApplyAdaptation(Object.keys(adaptSuggestions.suggested_additions), [])}>全部添加</Button>}>
              <List size="small" dataSource={Object.entries(adaptSuggestions.suggested_additions)} renderItem={entry => {
                const [cap, info] = entry as [string, any]
                return (
                  <List.Item extra={<Button size="small" onClick={() => onApplyAdaptation([cap], [])}>添加</Button>}>
                    <Tag color="green">{cap}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>{info.reason}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>置信度: {info.confidence}</Text>
                  </List.Item>
                )
              }} />
            </Card>
          )}
          {Object.keys(adaptSuggestions.suggested_removals || {}).length > 0 && (
            <Card size="small" title="建议移除" style={{ marginTop: 12 }} type="inner" extra={<Button size="small" danger onClick={() => onApplyAdaptation([], Object.keys(adaptSuggestions.suggested_removals))}>全部移除</Button>}>
              <List size="small" dataSource={Object.entries(adaptSuggestions.suggested_removals)} renderItem={entry => {
                const [cap, info] = entry as [string, any]
                return (
                  <List.Item extra={<Button size="small" danger onClick={() => onApplyAdaptation([], [cap])}>移除</Button>}>
                    <Tag color="red">{cap}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>{info.reason}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>置信度: {info.confidence}</Text>
                  </List.Item>
                )
              }} />
            </Card>
          )}
          {Object.keys(adaptSuggestions.suggested_additions || {}).length === 0 && Object.keys(adaptSuggestions.suggested_removals || {}).length === 0 && (
            <Empty description="当前没有需要调整的能力" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 20 }} />
          )}
          <div style={{ marginTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>净变化: {adaptSuggestions.net_change || 0}</Text>
          </div>
        </div>
      ) : (
        <Spin />
      )}
    </Modal>
  )
}

export default AdaptiveCapabilitiesModal
