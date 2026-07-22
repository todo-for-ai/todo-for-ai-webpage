import React from 'react'
import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import {
  BookOutlined,
  DeleteOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { Agent } from '../../../api/agents'

const { Text } = Typography

export interface KnowledgeEntry {
  id: number
  title: string
  content: string
  domain?: string
  tags?: string[]
  entry_type?: string
  confidence?: number
  access_count?: number
  source_type?: string
  source_task_id?: number
}

export interface KnowledgeFormData {
  title: string
  content: string
  domain: string
  tags: string[]
  entry_type: string
  confidence: number
}

export interface KnowledgeDrawerProps {
  selectedAgent: Agent | null
  entries: KnowledgeEntry[]
  loading: boolean
  search: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  createOpen: boolean
  form: KnowledgeFormData
  onFormChange: (form: KnowledgeFormData) => void
  onCreateOpenChange: (open: boolean) => void
  onCreate: () => void
  detailOpen: boolean
  detail: KnowledgeEntry | null
  onDetailOpenChange: (open: boolean) => void
  onDetailChange: (detail: KnowledgeEntry | null) => void
  onDelete: (entryId: number) => void
  onOpenDetail: (entry: KnowledgeEntry) => void
  onAutoExtract: () => void
}

const KnowledgeSection: React.FC<KnowledgeDrawerProps> = ({
  selectedAgent,
  entries,
  loading,
  search,
  onSearchChange,
  onSearch,
  createOpen,
  form,
  onFormChange,
  onCreateOpenChange,
  onCreate,
  detailOpen,
  detail,
  onDetailOpenChange,
  onDetailChange,
  onDelete,
  onOpenDetail,
  onAutoExtract,
}) => {
  return (
    <>
      {/* Knowledge Base */}
      {selectedAgent && (
        <>
          <Typography.Title level={5} style={{ marginBottom: 8 }}>
            <Space>
              <BookOutlined />
              <Text>知识库</Text>
              <Tag color="blue">{entries.length}</Tag>
            </Space>
          </Typography.Title>
          <Space style={{ marginBottom: 8, width: '100%' }} wrap>
            <Input.Search
              placeholder="搜索知识..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              onSearch={onSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<PlusOutlined />} onClick={() => onCreateOpenChange(true)}>添加知识</Button>
            <Button icon={<ThunderboltOutlined />} onClick={onAutoExtract}>自动提取</Button>
          </Space>
          <Spin spinning={loading}>
            {entries.length === 0 && !loading ? (
              <Empty description="暂无知识条目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={entries}
                style={{ maxHeight: 300, overflowY: 'auto' }}
                renderItem={(entry: KnowledgeEntry) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '6px 8px' }}
                    actions={[
                      <Popconfirm key="del" title="确定删除？" onConfirm={() => onDelete(entry.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>,
                    ]}
                    onClick={() => onOpenDetail(entry)}
                  >
                    <List.Item.Meta
                      title={<Space><Text strong>{entry.title}</Text> {entry.entry_type && <Tag>{entry.entry_type}</Tag>} {entry.domain && <Tag color="blue">{entry.domain}</Tag>}</Space>}
                      description={
                        <Space size={4}>
                          <Text type="secondary" style={{ fontSize: 11 }}>置信度: {entry.confidence ?? 1.0}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>访问: {entry.access_count || 0}</Text>
                          {entry.tags && (entry.tags as string[]).map((t, i) => <Tag key={i} style={{ fontSize: 10 }}>{t}</Tag>)}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Spin>
        </>
      )}

      {/* Knowledge Create Modal */}
      <Modal
        title="添加知识条目"
        open={createOpen}
        onCancel={() => onCreateOpenChange(false)}
        onOk={onCreate}
        okText="创建"
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="标题" required>
            <Input value={form.title} onChange={e => onFormChange({ ...form, title: e.target.value })} placeholder="简短描述这条知识" />
          </Form.Item>
          <Form.Item label="内容" required>
            <Input.TextArea value={form.content} onChange={e => onFormChange({ ...form, content: e.target.value })} placeholder="知识内容（支持 Markdown）" rows={6} />
          </Form.Item>
          <Form.Item label="领域">
            <Input value={form.domain} onChange={e => onFormChange({ ...form, domain: e.target.value })} placeholder="如: python, frontend, devops" />
          </Form.Item>
          <Form.Item label="类型">
            <Select value={form.entry_type} onChange={v => onFormChange({ ...form, entry_type: v })} style={{ width: 160 }}>
              <Select.Option value="insight">洞察</Select.Option>
              <Select.Option value="pattern">模式</Select.Option>
              <Select.Option value="solution">解决方案</Select.Option>
              <Select.Option value="reference">参考</Select.Option>
              <Select.Option value="rule">规则</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="标签">
            <Select mode="tags" value={form.tags} onChange={v => onFormChange({ ...form, tags: v })} placeholder="添加标签" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="置信度">
            <InputNumber min={0} max={1} step={0.1} value={form.confidence} onChange={v => onFormChange({ ...form, confidence: v ?? 1.0 })} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Knowledge Detail Modal */}
      <Modal
        title={detail?.title || '知识详情'}
        open={detailOpen}
        onCancel={() => { onDetailOpenChange(false); onDetailChange(null) }}
        footer={null}
        width={700}
      >
        {detail && (
          <div>
            <Space style={{ marginBottom: 12 }} wrap>
              {detail.entry_type && <Tag>{detail.entry_type}</Tag>}
              {detail.domain && <Tag color="blue">{detail.domain}</Tag>}
              <Tag>置信度: {detail.confidence ?? 1.0}</Tag>
              <Tag>访问: {detail.access_count || 0}</Tag>
              <Tag>来源: {detail.source_type || 'manual'}</Tag>
              {detail.tags && (detail.tags as string[]).map((t: string, i: number) => <Tag key={i} color="geekblue">{t}</Tag>)}
            </Space>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8, maxHeight: 400, overflowY: 'auto' }}>
              {detail.content}
            </div>
            {detail.source_task_id && (
              <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                来源任务: #{detail.source_task_id}
              </Text>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

export default KnowledgeSection
