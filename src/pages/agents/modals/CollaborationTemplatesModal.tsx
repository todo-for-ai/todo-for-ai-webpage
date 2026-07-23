import React from 'react'
import {
  Button,
  Empty,
  List,
  message,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import {
  DeleteOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { agentsApi } from '../../../api/agents'

const { Text } = Typography

export interface CollaborationTemplatesModalProps {
  open: boolean
  templates: any[]
  loading: boolean
  onClose: () => void
  onOpenInstantiate: (key: string, name: string) => void
  onReload: () => void
}

const CollaborationTemplatesModal: React.FC<CollaborationTemplatesModalProps> = ({
  open,
  templates,
  loading,
  onClose,
  onOpenInstantiate,
  onReload,
}) => {
  return (
    <Modal
      title="协作模板"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Spin spinning={loading}>
        {templates.length === 0 && !loading ? (
          <Empty description="暂无协作模板" />
        ) : (
          <List
            dataSource={templates}
            renderItem={(tpl: any) => (
              <List.Item
                actions={[
                  <Button
                    key="instantiate"
                    type="primary"
                    size="small"
                    icon={<RocketOutlined />}
                    onClick={() => onOpenInstantiate(tpl.id, tpl.name)}
                  >
                    实例化
                  </Button>,
                  !tpl.is_builtin ? (
                    <Popconfirm
                      key="delete"
                      title="确定删除此模板？"
                      onConfirm={async () => {
                        try {
                          await agentsApi.deleteCollaborationTemplate(parseInt(String(tpl.id).replace('builtin:', ''), 10))
                          message.success('模板已删除')
                          onReload()
                        } catch { message.error('删除失败') }
                      }}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                    </Popconfirm>
                  ) : null,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={<Space>{tpl.name} {tpl.is_builtin && <Tag color="blue">内置</Tag>} {tpl.category && <Tag>{tpl.category}</Tag>}</Space>}
                  description={
                    <div>
                      <div>{tpl.description || '无描述'}</div>
                      {tpl.agent_specs && (
                        <div style={{ marginTop: 4 }}>
                          {(tpl.agent_specs as any[]).map((spec: any, idx: number) => (
                            <Tag key={idx} color="geekblue" style={{ marginBottom: 2 }}>
                              {spec.name} ({spec.kind || 'autonomous'})
                              {spec.collaboration_role && ` · ${spec.collaboration_role}`}
                            </Tag>
                          ))}
                        </div>
                      )}
                      {tpl.workflow_steps && (tpl.workflow_steps as any[]).length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>工作流步骤 ({(tpl.workflow_steps as any[]).length}):</Text>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                            {(tpl.workflow_steps as any[]).map((step: any, idx: number) => (
                              <Tag
                                key={idx}
                                color={step.condition ? 'orange' : 'blue'}
                                style={{ fontSize: 10 }}
                              >
                                {step.name || step.step_key}
                                {step.condition && ` [${step.condition.operator === 'succeeded' ? '✓' : step.condition.operator === 'failed' ? '✗' : '?'}→${step.condition.step_key}]`}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </Modal>
  )
}

export default CollaborationTemplatesModal
