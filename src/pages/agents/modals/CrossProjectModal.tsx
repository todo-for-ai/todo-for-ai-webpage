import React from 'react'
import {
  Button,
  Empty,
  List,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd'
import type { Agent } from '../../../api/agents'

const { Text } = Typography

export interface CrossProjectTask {
  task: {
    id: number
    title: string
    priority?: number
  }
  project: {
    name: string
  }
  role_in_project: string
  match?: {
    score: number
    matched_capabilities?: string[]
  }
}

export interface CrossProjectModalProps {
  open: boolean
  selectedAgent: Agent | null
  tasks: CrossProjectTask[]
  onClose: () => void
  onClaim: (taskId: number) => void
}

const CrossProjectModal: React.FC<CrossProjectModalProps> = ({
  open,
  selectedAgent,
  tasks,
  onClose,
  onClaim,
}) => {
  return (
    <Modal
      title={`跨项目任务 — ${selectedAgent?.name || ''}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        以下是 {selectedAgent?.name} 跨项目授权的项目中可领取的任务，按能力匹配度排序。
      </Text>
      {tasks.length === 0 ? (
        <Empty description="暂无可领取的跨项目任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          size="small"
          dataSource={tasks}
          style={{ maxHeight: 500, overflowY: 'auto' }}
          renderItem={(item: CrossProjectTask) => (
            <List.Item
              actions={[
                <Button key="claim" size="small" type="primary" onClick={() => onClaim(item.task.id)}>
                  领取
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color={item.match?.score && item.match.score >= 50 ? 'green' : item.match?.score && item.match.score >= 20 ? 'orange' : 'default'}>
                      {item.match?.score || 0} 分
                    </Tag>
                    <Text strong>{item.task?.title}</Text>
                  </Space>
                }
                description={
                  <div>
                    <Space size={4}>
                      <Tag color="blue">{item.project?.name}</Tag>
                      <Tag>{item.role_in_project}</Tag>
                      {item.task?.priority && <Tag color="red">优先级 {item.task.priority}</Tag>}
                    </Space>
                    {item.match?.matched_capabilities && item.match.matched_capabilities.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>匹配能力: </Text>
                        {item.match.matched_capabilities.map((c: string, i: number) => (
                          <Tag key={i} color="geekblue" style={{ fontSize: 10 }}>{c}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  )
}

export default CrossProjectModal