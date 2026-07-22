import React from 'react'
import { Button, Empty, List, Modal, Spin, Tag } from 'antd'
import { Space, Typography } from 'antd'
import type { Agent } from '../../../api/agents'

const { Text } = Typography

export interface RecommendedTasksModalProps {
  open: boolean
  agent: Agent | null
  tasks: any[]
  loading: boolean
  onCancel: () => void
  onClaim: (agent: Agent, taskId: number) => void
}

const RecommendedTasksModal: React.FC<RecommendedTasksModalProps> = ({
  open,
  agent,
  tasks,
  loading,
  onCancel,
  onClaim,
}) => {
  return (
    <Modal
      title={`推荐任务 — ${agent?.name || ''}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Spin spinning={loading}>
        {tasks.length === 0 && !loading ? (
          <Empty description="没有匹配的推荐任务" />
        ) : (
          <List
            size="small"
            dataSource={tasks}
            renderItem={(item: any, index: number) => {
              const t = item.task
              const matched = [...(item.matched_capabilities || []), ...(item.matched_tags || [])]
              const missing = item.missing_required || []
              return (
                <List.Item
                  style={{ padding: '8px 0' }}
                  actions={[
                    <Button key="claim" size="small" type="primary" onClick={() => {
                      if (agent) { onClaim(agent, t.id) }
                    }}>领取</Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>#{t.id} {t.title}</span>
                        <Tag color="blue">得分: {item.score}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        {matched.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            <Text type="success" style={{ fontSize: 12 }}>匹配: </Text>
                            {matched.map((c: string) => <Tag key={c} color="green" style={{ fontSize: 11 }}>{c}</Tag>)}
                          </div>
                        )}
                        {missing.length > 0 && (
                          <div>
                            <Text type="danger" style={{ fontSize: 12 }}>缺失: </Text>
                            {missing.map((c: string) => <Tag key={c} color="red" style={{ fontSize: 11 }}>{c}</Tag>)}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )
            }}
          />
        )}
      </Spin>
    </Modal>
  )
}

export default RecommendedTasksModal
