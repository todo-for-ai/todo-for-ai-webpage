import React from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Divider,
  Empty,
  InputNumber,
  List,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import { SearchOutlined, SettingOutlined } from '@ant-design/icons'
import type { Agent, DispatchPreviewResult, DispatchTasksData } from '../../../api/agents'
import { matchStrategyLabel, renderCapabilities } from '../utils'

const { Text } = Typography

export interface DispatchPreviewModalProps {
  open: boolean
  agent: Agent | null
  preview: DispatchPreviewResult | null
  loading: boolean
  applying: boolean
  policySaving: boolean
  policyDirty: boolean
  options: DispatchTasksData
  candidateOptions: { value: number; label: string }[]
  onClose: () => void
  onApply: () => void
  onPreview: () => void
  onSavePolicy: () => void
  onUpdateOptions: (patch: Partial<DispatchTasksData>) => void
}

const DispatchPreviewModal: React.FC<DispatchPreviewModalProps> = ({
  open,
  agent,
  preview,
  loading,
  applying,
  policySaving,
  policyDirty,
  options,
  candidateOptions,
  onClose,
  onApply,
  onPreview,
  onSavePolicy,
  onUpdateOptions,
}) => {
  return (
    <Modal
      title={`派活预览 — ${agent?.name || ''}`}
      open={open}
      onCancel={onClose}
      onOk={onApply}
      okText="按此计划派发"
      cancelText="关闭"
      confirmLoading={applying}
      okButtonProps={{ disabled: !preview || preview.summary.planned === 0 }}
      width={980}
    >
      <Spin spinning={loading}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[12, 12]} align="bottom">
            <Col xs={24} sm={12} md={6}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>本轮上限</Text>
              <InputNumber
                min={1}
                max={20}
                value={options.max_assignments}
                onChange={value => onUpdateOptions({ max_assignments: value ? Number(value) : undefined })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>租约秒数</Text>
              <InputNumber
                min={60}
                max={86400}
                step={300}
                value={options.lease_seconds}
                onChange={value => onUpdateOptions({ lease_seconds: value ? Number(value) : undefined })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>项目 ID</Text>
              <InputNumber
                min={1}
                value={options.project_id}
                onChange={value => onUpdateOptions({ project_id: value ? Number(value) : undefined })}
                placeholder="全部项目"
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Button
                  block
                  icon={<SearchOutlined />}
                  loading={loading}
                  onClick={onPreview}
                >
                  生成预览
                </Button>
                <Button
                  block
                  icon={<SettingOutlined />}
                  loading={policySaving}
                  disabled={loading}
                  onClick={onSavePolicy}
                >
                  保存策略
                </Button>
              </Space>
            </Col>
            <Col span={24}>
              <Select
                mode="multiple"
                allowClear
                maxTagCount="responsive"
                placeholder="默认使用所有空闲 Worker Agent"
                value={options.candidate_agent_ids || []}
                options={candidateOptions}
                onChange={values => onUpdateOptions({ candidate_agent_ids: values.length ? values : undefined })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={24}>
              <Space wrap size={[16, 8]}>
                <Space size={6}>
                  <Switch
                    size="small"
                    checked={!!options.auto_dispatch_enabled}
                    onChange={checked => onUpdateOptions({ auto_dispatch_enabled: checked })}
                  />
                  <Text>自动派活</Text>
                </Space>
                <Checkbox
                  checked={options.match_capabilities !== false}
                  onChange={event => onUpdateOptions({
                    match_capabilities: event.target.checked,
                    require_capability_match: event.target.checked ? options.require_capability_match : false,
                  })}
                >
                  能力匹配
                </Checkbox>
                <Checkbox
                  checked={!!options.require_capability_match}
                  disabled={options.match_capabilities === false}
                  onChange={event => onUpdateOptions({ require_capability_match: event.target.checked })}
                >
                  只派给有匹配分的 Agent
                </Checkbox>
                <Checkbox
                  checked={!!options.include_self}
                  onChange={event => onUpdateOptions({ include_self: event.target.checked })}
                >
                  允许协调器参与执行
                </Checkbox>
              </Space>
            </Col>
          </Row>

          <Alert
            type={policyDirty ? 'warning' : 'info'}
            showIcon
            message={policyDirty ? '当前策略有未保存改动' : '当前策略已与后端同步'}
            description={
              preview?.options ? (
                <Space wrap size={[6, 6]}>
                  <Tag>上限 {preview.options.max_assignments}</Tag>
                  <Tag>租约 {preview.options.lease_seconds}s</Tag>
                  <Tag>{preview.options.project_id ? `项目 #${preview.options.project_id}` : '全部项目'}</Tag>
                  <Tag color={preview.options.match_capabilities ? 'blue' : 'default'}>
                    {preview.options.match_capabilities ? '能力匹配' : '先进先派'}
                  </Tag>
                  {preview.options.require_capability_match && <Tag color="green">要求匹配分</Tag>}
                  {preview.options.include_self && <Tag color="purple">包含协调器</Tag>}
                  {preview.options.candidate_agent_ids.length > 0 && (
                    <Tag>候选池 {preview.options.candidate_agent_ids.length}</Tag>
                  )}
                </Space>
              ) : undefined
            }
          />

          <Divider style={{ margin: '4px 0' }} />

          {preview ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={12}>
              <Col span={6}><Statistic title="可派任务" value={preview.summary.claimable_tasks} /></Col>
              <Col span={6}><Statistic title="空闲 Agent" value={preview.summary.available_agents} /></Col>
              <Col span={6}><Statistic title="本轮计划" value={preview.summary.planned} /></Col>
              <Col span={6}><Statistic title="未派发" value={preview.unmatched_tasks.length} /></Col>
            </Row>

            <Table
              size="small"
              rowKey={record => `${record.task.id}-${record.agent.id}`}
              dataSource={preview.proposed_assignments}
              pagination={false}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前没有可执行的派发计划" /> }}
              columns={[
                {
                  title: '任务',
                  dataIndex: ['task', 'title'],
                  render: (_: unknown, record) => (
                    <Space direction="vertical" size={0}>
                      <Text strong>#{record.task.id} {record.task.title}</Text>
                      <Text type="secondary">{record.task.project?.name || '-'}</Text>
                    </Space>
                  ),
                },
                {
                  title: '推荐 Agent',
                  dataIndex: ['agent', 'name'],
                  width: 180,
                  render: (_: unknown, record) => (
                    <Space direction="vertical" size={0}>
                      <Text>{record.agent.name}</Text>
                      <Text type="secondary">{record.agent.kind}</Text>
                    </Space>
                  ),
                },
                {
                  title: '匹配',
                  key: 'match',
                  width: 220,
                  render: (_: unknown, record) => (
                    <Space direction="vertical" size={4}>
                      <Space size={4}>
                        <Tag color={record.score > 0 ? 'green' : 'default'}>{record.score} 分</Tag>
                        <Tag color="blue">{matchStrategyLabel(record.strategy)}</Tag>
                      </Space>
                      {renderCapabilities(record.matched_capabilities || [], 3)}
                    </Space>
                  ),
                },
              ]}
            />

            {preview.task_candidates.length > 0 && (
              <div>
                <Text strong>候选匹配</Text>
                <List
                  size="small"
                  dataSource={preview.task_candidates.slice(0, 8)}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={<Text>#{item.task.id} {item.task.title}</Text>}
                        description={
                          <Space wrap size={[4, 4]}>
                            {item.candidates.length > 0 ? item.candidates.slice(0, 5).map(candidate => (
                              <Tag key={candidate.agent.id} color={candidate.score > 0 ? 'green' : 'default'}>
                                {candidate.agent.name}: {candidate.score}
                              </Tag>
                            )) : (
                              <Text type="secondary">无候选 Agent</Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {preview.unmatched_tasks.length > 0 && (
              <div>
                <Text strong>未进入本轮计划</Text>
                <List
                  size="small"
                  dataSource={preview.unmatched_tasks.slice(0, 8)}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={<Text>#{item.task.id} {item.task.title}</Text>}
                        description={
                          <Space wrap size={4}>
                            <Tag color={item.reason === 'no_matching_agent' ? 'orange' : 'default'}>
                              {item.reason === 'no_matching_agent' ? '无匹配 Agent' : '空闲容量不足'}
                            </Tag>
                            {item.best_candidate && (
                              <Text type="secondary">
                                最佳候选 {item.best_candidate.agent.name}，{item.best_candidate.score} 分
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Space>
        ) : (
          !loading && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无派活预览" />
        )}
        </Space>
      </Spin>
    </Modal>
  )
}

export default DispatchPreviewModal
