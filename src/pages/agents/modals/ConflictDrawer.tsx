import React from 'react'
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons'

const { Text } = Typography
const { Option } = Select

export interface ConflictData {
  id: number
  conflict_type: string
  severity: 'critical' | 'warning' | 'info'
  status: string
  title: string
  description?: string
  agent_ids?: number[]
  suggested_strategy?: string
  task_id?: number
  protocol_id?: number
  evidence?: Record<string, unknown>
  resolution?: string
}

export interface ConflictResolveFormData {
  conflict_id: number
  strategy: string
  description: string
}

export interface ConflictDrawerProps {
  open: boolean
  conflicts: ConflictData[]
  detail: ConflictData | null
  detailOpen: boolean
  resolveOpen: boolean
  resolveForm: ConflictResolveFormData
  onClose: () => void
  onRefresh: () => void
  onScan: () => void
  onAutoResolve: () => void
  onOpenDetail: (id: number) => void
  onAcknowledge: (id: number) => void
  onIgnore: (id: number) => void
  onOpenResolve: (conflict: ConflictData) => void
  onSubmitResolve: () => void
  setDetailOpen: React.Dispatch<React.SetStateAction<boolean>>
  setResolveOpen: React.Dispatch<React.SetStateAction<boolean>>
  setResolveForm: React.Dispatch<React.SetStateAction<ConflictResolveFormData>>
}

const ConflictDrawer: React.FC<ConflictDrawerProps> = ({
  open,
  conflicts,
  detail,
  detailOpen,
  resolveOpen,
  resolveForm,
  onClose,
  onRefresh,
  onScan,
  onAutoResolve,
  onOpenDetail,
  onAcknowledge,
  onIgnore,
  onOpenResolve,
  onSubmitResolve,
  setDetailOpen,
  setResolveOpen,
  setResolveForm,
}) => {
  const handleDetailAcknowledge = () => {
    if (detail) {
      onAcknowledge(detail.id)
      setDetailOpen(false)
    }
  }

  const handleDetailIgnore = () => {
    if (detail) {
      onIgnore(detail.id)
      setDetailOpen(false)
    }
  }

  const handleDetailResolve = () => {
    if (detail) {
      setDetailOpen(false)
      onOpenResolve(detail)
    }
  }

  return (
    <>
      {/* Conflict Management Drawer */}
      <Drawer
        title={<Space><WarningOutlined /> 协作冲突检测与解决</Space>}
        open={open}
        onClose={onClose}
        width={820}
        extra={<Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>刷新</Button>
          <Popconfirm title="自动解决低严重度冲突？(严重冲突不会自动处理)" onConfirm={onAutoResolve}>
            <Button icon={<ThunderboltOutlined />}>自动解决</Button>
          </Popconfirm>
          <Button type="primary" icon={<SearchOutlined />} onClick={onScan} loading={false}>扫描冲突</Button>
        </Space>}
      >
        <Alert
          message="协作冲突检测"
          description="扫描检测重复认领、过期分配、协议僵局等冲突，并提供自动/手动解决策略。"
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
        />
        <List
          dataSource={conflicts}
          locale={{ emptyText: '暂无活跃冲突' }}
          renderItem={(c) => (
            <List.Item
              actions={[
                <Button key="detail" size="small" onClick={() => onOpenDetail(c.id)}>详情</Button>,
                <Button key="resolve" size="small" type="primary" onClick={() => onOpenResolve(c)}>解决</Button>,
                <Button key="ack" size="small" onClick={() => onAcknowledge(c.id)}>确认</Button>,
                <Popconfirm key="ignore" title="忽略此冲突？" onConfirm={() => onIgnore(c.id)}>
                  <Button size="small" danger>忽略</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Space>
                  <Tag color={c.severity === 'critical' ? 'red' : c.severity === 'warning' ? 'orange' : 'blue'}>{c.severity}</Tag>
                  <Tag color="purple">{c.conflict_type}</Tag>
                  <Tag>{c.status}</Tag>
                  <Text strong>{c.title}</Text>
                </Space>}
                description={<Space size={[16, 4]} wrap style={{ fontSize: 12 }}>
                  <span>涉及 Agent: {(c.agent_ids || []).map(id => `#${id}`).join(', ') || '-'}</span>
                  {c.suggested_strategy && <span>建议: {c.suggested_strategy}</span>}
                </Space>}
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Conflict Detail Modal */}
      <Modal
        title={`冲突详情 #${detail?.id || ''}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={detail && detail.status !== 'resolved' && detail.status !== 'ignored' ? [
          <Button key="ack" onClick={handleDetailAcknowledge}>确认</Button>,
          <Button key="ign" danger onClick={handleDetailIgnore}>忽略</Button>,
          <Button key="res" type="primary" onClick={handleDetailResolve}>解决</Button>,
        ] : null}
      >
        {detail && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="类型"><Tag color="purple">{detail.conflict_type}</Tag></Descriptions.Item>
            <Descriptions.Item label="严重度"><Tag color={detail.severity === 'critical' ? 'red' : detail.severity === 'warning' ? 'orange' : 'blue'}>{detail.severity}</Tag></Descriptions.Item>
            <Descriptions.Item label="状态"><Tag>{detail.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="标题">{detail.title}</Descriptions.Item>
            <Descriptions.Item label="描述">{detail.description}</Descriptions.Item>
            <Descriptions.Item label="涉及 Agent">{(detail.agent_ids || []).map(id => `#${id}`).join(', ') || '-'}</Descriptions.Item>
            <Descriptions.Item label="建议策略">{detail.suggested_strategy || '-'}</Descriptions.Item>
            {detail.task_id && <Descriptions.Item label="任务">#{detail.task_id}</Descriptions.Item>}
            {detail.protocol_id && <Descriptions.Item label="协议">#{detail.protocol_id}</Descriptions.Item>}
            {detail.evidence && Object.keys(detail.evidence).length > 0 && <Descriptions.Item label="证据"><pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(detail.evidence, null, 2)}</pre></Descriptions.Item>}
            {detail.resolution && <Descriptions.Item label="解决说明">{detail.resolution}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>

      {/* Conflict Resolve Modal */}
      <Modal
        title={`解决冲突 #${resolveForm.conflict_id}`}
        open={resolveOpen}
        onCancel={() => setResolveOpen(false)}
        onOk={onSubmitResolve}
        okText="解决"
      >
        <Form layout="vertical">
          <Form.Item label="解决策略" required>
            <Select value={resolveForm.strategy} onChange={v => setResolveForm({ ...resolveForm, strategy: v })}>
              <Option value="first_wins">先到先得 (保留最早分配)</Option>
              <Option value="highest_reputation">最高声誉 (声誉最佳者胜出)</Option>
              <Option value="least_loaded">最少负载 (活跃任务最少者胜出)</Option>
              <Option value="auto_retry">自动重试 (取消过期/重新排队)</Option>
              <Option value="split">拆分 (分配给多方)</Option>
              <Option value="escalate">升级 (转交协调者)</Option>
              <Option value="manual">人工 (仅记录)</Option>
            </Select>
          </Form.Item>
          <Form.Item label="解决说明">
            <Input.TextArea value={resolveForm.description} onChange={e => setResolveForm({ ...resolveForm, description: e.target.value })} placeholder="可选: 解决备注" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default ConflictDrawer
