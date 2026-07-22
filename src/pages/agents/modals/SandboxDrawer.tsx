import React from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import {
  AppstoreOutlined,
  PlusOutlined,
  SafetyOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { Agent } from '../../../api/agents'

const { Title, Text } = Typography
const { Option } = Select

export interface SandboxData {
  id: number
  name: string
  description?: string
  agent_id?: number
  security_level: 'strict' | 'moderate' | 'permissive'
  is_active: boolean
  allowed_tools?: string[]
  blocked_tools?: string[]
  allowed_network_hosts?: string[]
  fs_write_paths?: string[]
  fs_read_paths?: string[]
  timeout_seconds?: number
  max_memory_mb?: number
  max_cpu_seconds?: number
  max_output_tokens?: number
  stats?: {
    total_executions?: number
    violations?: number
  }
}

export interface SandboxTemplate {
  key: string
  name: string
  description?: string
  security_level: 'strict' | 'moderate' | 'permissive'
  timeout_seconds?: number
  max_memory_mb?: number
  allowed_tools?: string[]
  blocked_tools?: string[]
}

export interface SandboxExecution {
  id: number
  agent_id: number
  status: string
  tool_calls?: number
  network_calls?: number
  started_at?: string
  ended_at?: string
  peak_memory_mb?: number
  cpu_seconds?: number
  termination_reason?: string
  output_summary?: string
  violations?: Array<{
    violation_type: string
    blocked_at: string
    attempted_action: string
    detail?: string
  }>
}

export interface SandboxFormData {
  name: string
  description?: string
  agent_id?: number
  security_level: 'strict' | 'moderate' | 'permissive'
  allowed_tools: string[]
  blocked_tools: string[]
  allowed_network_hosts: string[]
  fs_write_paths: string[]
  fs_read_paths: string[]
  timeout_seconds: number
  max_memory_mb: number
  max_cpu_seconds: number
  max_output_tokens: number
}

export interface SandboxCheckFormData {
  sandbox_id: number
  action: 'tool' | 'network' | 'fs_write'
  target: string
}

export interface SandboxStartFormData {
  sandbox_id: number
  agent_id?: number
  run_id?: number
  step_run_id?: number
}

export interface SandboxViolationFormData {
  execution_id: number
  violation_type: string
  attempted_action: string
  detail: string
  terminate: boolean
}

export interface SandboxDrawerProps {
  open: boolean
  sandboxes: SandboxData[]
  templates: SandboxTemplate[]
  agents: Agent[]
  // Sub-modal states
  templateOpen: boolean
  formOpen: boolean
  editingId: number | null
  formData: SandboxFormData
  execOpen: boolean
  execSandboxId: number | null
  executions: SandboxExecution[]
  execDetail: SandboxExecution | null
  execDetailOpen: boolean
  checkOpen: boolean
  checkForm: SandboxCheckFormData
  checkResult: { allowed: boolean; reason?: string } | null
  startOpen: boolean
  startForm: SandboxStartFormData
  violationOpen: boolean
  violationForm: SandboxViolationFormData
  // Callbacks
  onClose: () => void
  onOpenTemplates: () => void
  onCreate: () => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onSubmitForm: () => void
  onInstantiateTemplate: (key: string, name: string) => void
  onCloseTemplates: () => void
  onOpenExec: (sandboxId: number) => void
  onOpenExecDetail: (execId: number) => void
  onCompleteExec: (execId: number) => void
  onRevokeExec: (execId: number) => void
  onOpenCheck: (sandboxId: number) => void
  onSubmitCheck: () => void
  onOpenStart: (sandboxId: number) => void
  onSubmitStart: () => void
  onOpenViolation: (execId: number) => void
  onSubmitViolation: () => void
  // Form updaters
  setFormData: React.Dispatch<React.SetStateAction<SandboxFormData>>
  setCheckForm: React.Dispatch<React.SetStateAction<SandboxCheckFormData>>
  setStartForm: React.Dispatch<React.SetStateAction<SandboxStartFormData>>
  setViolationForm: React.Dispatch<React.SetStateAction<SandboxViolationFormData>>
  setCheckResult: React.Dispatch<React.SetStateAction<{ allowed: boolean; reason?: string } | null>>
  setExecDetailOpen: React.Dispatch<React.SetStateAction<boolean>>
  setExecOpen: React.Dispatch<React.SetStateAction<boolean>>
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>
  setTemplateOpen: React.Dispatch<React.SetStateAction<boolean>>
  setCheckOpen: React.Dispatch<React.SetStateAction<boolean>>
  setStartOpen: React.Dispatch<React.SetStateAction<boolean>>
  setViolationOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SandboxDrawer: React.FC<SandboxDrawerProps> = ({
  open,
  sandboxes,
  templates,
  agents,
  templateOpen,
  formOpen,
  editingId,
  formData,
  execOpen,
  execSandboxId,
  executions,
  execDetail,
  execDetailOpen,
  checkOpen,
  checkForm,
  checkResult,
  startOpen,
  startForm,
  violationOpen,
  violationForm,
  onClose,
  onOpenTemplates,
  onCreate,
  onEdit,
  onDelete,
  onSubmitForm,
  onInstantiateTemplate,
  onCloseTemplates,
  onOpenExec,
  onOpenExecDetail,
  onCompleteExec,
  onRevokeExec,
  onOpenCheck,
  onSubmitCheck,
  onOpenStart,
  onSubmitStart,
  onOpenViolation,
  onSubmitViolation,
  setFormData,
  setCheckForm,
  setStartForm,
  setViolationForm,
  setExecDetailOpen,
  setExecOpen,
  setFormOpen,
  setTemplateOpen,
  setCheckOpen,
  setStartOpen,
  setViolationOpen,
  setCheckResult,
}) => {
  return (
    <>
      {/* Sandbox Management Drawer */}
      <Drawer
        title={<Space><SafetyOutlined /> Agent 执行沙盒</Space>}
        open={open}
        onClose={onClose}
        width={900}
        extra={<Space>
          <Button icon={<AppstoreOutlined />} onClick={onOpenTemplates}>模板</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>新建沙盒</Button>
        </Space>}
      >
        <Alert
          message="安全执行环境隔离"
          description="沙盒策略控制 Agent 执行时的工具访问、网络出口、文件系统范围和资源限制。每次执行会冻结策略快照用于审计。"
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
        />
        <List
          dataSource={sandboxes}
          locale={{ emptyText: '暂无沙盒策略' }}
          renderItem={(s) => (
            <List.Item
              actions={[
                <Button key="edit" size="small" onClick={() => onEdit(s.id)}>编辑</Button>,
                <Button key="check" size="small" icon={<SearchOutlined />} onClick={() => onOpenCheck(s.id)}>检查</Button>,
                <Button key="start" size="small" onClick={() => onOpenStart(s.id)}>启动执行</Button>,
                <Button key="exec" size="small" onClick={() => onOpenExec(s.id)}>执行记录</Button>,
                <Popconfirm key="del" title="确认删除此沙盒？" onConfirm={() => onDelete(s.id)}>
                  <Button size="small" danger>删除</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Space><Text strong>{s.name}</Text><Tag color={s.security_level === 'strict' ? 'red' : s.security_level === 'permissive' ? 'green' : 'orange'}>{s.security_level}</Tag>{s.is_active ? <Tag color="blue">活跃</Tag> : <Tag>停用</Tag>}{s.agent_id ? <Tag color="purple">Agent #{s.agent_id}</Tag> : <Tag>未绑定</Tag>}</Space>}
                description={
                  <Space size={[16, 4]} wrap style={{ fontSize: 12 }}>
                    <span>工具: {(s.allowed_tools || []).length}允许 / {(s.blocked_tools || []).length}禁止</span>
                    <span>网络: {(s.allowed_network_hosts || []).length}主机</span>
                    <span>超时: {s.timeout_seconds || 0}s</span>
                    <span>内存: {s.max_memory_mb || 0}MB</span>
                    <span>执行: {s.stats?.total_executions || 0}</span>
                    <span style={{ color: (s.stats?.violations || 0) > 0 ? '#ff4d4f' : undefined }}>违规: {s.stats?.violations || 0}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Sandbox Templates Modal */}
      <Modal
        title={<Space><AppstoreOutlined /> 沙盒策略模板</Space>}
        open={templateOpen}
        onCancel={() => setTemplateOpen(false)}
        footer={null}
        width={720}
      >
        <Alert
          message="从预置模板一键创建沙盒策略"
          description="模板提供常见安全配置基线，创建后可进一步编辑调整。"
          type="info"
          style={{ marginBottom: 16 }}
          showIcon
        />
        <List
          dataSource={templates}
          locale={{ emptyText: '暂无模板' }}
          renderItem={(t) => (
            <List.Item
              actions={[
                <Popconfirm key="inst" title={`从模板 "${t.name}" 创建沙盒？`} onConfirm={() => onInstantiateTemplate(t.key, t.name)}>
                  <Button type="primary" size="small">从此模板创建</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={<Space><Text strong>{t.name}</Text><Tag color={t.security_level === 'strict' ? 'red' : t.security_level === 'permissive' ? 'green' : 'orange'}>{t.security_level}</Tag><Tag>{t.key}</Tag></Space>}
                description={<Space size={[16, 4]} wrap style={{ fontSize: 12 }}>
                  <span>{t.description}</span>
                  <span>超时: {t.timeout_seconds}s</span>
                  <span>内存: {t.max_memory_mb}MB</span>
                  <span>工具: {(t.allowed_tools || []).length}允许/{(t.blocked_tools || []).length}禁止</span>
                </Space>}
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Sandbox Create/Edit Modal */}
      <Modal
        title={editingId ? '编辑沙盒策略' : '新建沙盒策略'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={onSubmitForm}
        okText="保存"
        width={680}
      >
        <Form layout="vertical">
          <Form.Item label="名称" required>
            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="沙盒名称" />
          </Form.Item>
          <Form.Item label="描述">
            <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="沙盒用途说明" />
          </Form.Item>
          <Form.Item label="绑定 Agent">
            <Select value={formData.agent_id} onChange={v => setFormData({ ...formData, agent_id: v })} allowClear placeholder="不绑定 (可复用模板)" style={{ width: '100%' }}>
              {agents.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="安全级别" required>
            <Select value={formData.security_level} onChange={v => setFormData({ ...formData, security_level: v })}>
              <Option value="strict">严格 (无网络/无写盘/仅白名单工具)</Option>
              <Option value="moderate">中等 (受限网络/范围写盘/工具白名单)</Option>
              <Option value="permissive">宽松 (全网络/全盘/工具黑名单)</Option>
            </Select>
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="允许工具 (逗号分隔)">
                <Input value={(formData.allowed_tools || []).join(', ')} onChange={e => setFormData({ ...formData, allowed_tools: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] })} placeholder="tool_a, tool_b" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="禁止工具 (逗号分隔)">
                <Input value={(formData.blocked_tools || []).join(', ')} onChange={e => setFormData({ ...formData, blocked_tools: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] })} placeholder="tool_x, tool_y" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="允许网络主机 (逗号分隔, 后缀匹配)">
            <Input value={(formData.allowed_network_hosts || []).join(', ')} onChange={e => setFormData({ ...formData, allowed_network_hosts: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] })} placeholder="api.example.com, cdn.example.com" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="写入路径 (逗号分隔)">
                <Input value={(formData.fs_write_paths || []).join(', ')} onChange={e => setFormData({ ...formData, fs_write_paths: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] })} placeholder="/tmp/work, /data/out" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="读取路径 (逗号分隔)">
                <Input value={(formData.fs_read_paths || []).join(', ')} onChange={e => setFormData({ ...formData, fs_read_paths: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] })} placeholder="/data/in" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}><Form.Item label="超时(秒)"><InputNumber value={formData.timeout_seconds} onChange={v => setFormData({ ...formData, timeout_seconds: v || 0 })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item label="内存(MB)"><InputNumber value={formData.max_memory_mb} onChange={v => setFormData({ ...formData, max_memory_mb: v || 0 })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item label="CPU(秒)"><InputNumber value={formData.max_cpu_seconds} onChange={v => setFormData({ ...formData, max_cpu_seconds: v || 0 })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item label="输出Token"><InputNumber value={formData.max_output_tokens} onChange={v => setFormData({ ...formData, max_output_tokens: v || 0 })} min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Sandbox Executions Modal */}
      <Modal
        title={`沙盒执行记录 #${execSandboxId || ''}`}
        open={execOpen}
        onCancel={() => setExecOpen(false)}
        footer={null}
        width={820}
      >
        <Table
          size="small"
          dataSource={executions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 60 },
            { title: 'Agent', dataIndex: 'agent_id', width: 70, render: (v: number) => `#${v}` },
            { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => <Tag color={s === 'completed' ? 'green' : s === 'running' ? 'blue' : s === 'violated' ? 'red' : s === 'revoked' ? 'orange' : 'default'}>{s}</Tag> },
            { title: '工具调用', dataIndex: 'tool_calls', width: 80 },
            { title: '网络调用', dataIndex: 'network_calls', width: 80 },
            { title: '开始', dataIndex: 'started_at', width: 150, render: (v: string) => v || '-' },
            { title: '操作', width: 200, render: (_: unknown, r) => (
              <Space size={4} wrap>
                <Button size="small" onClick={() => onOpenExecDetail(r.id)}>详情</Button>
                {r.status === 'running' && <>
                  <Button size="small" onClick={() => onCompleteExec(r.id)}>完成</Button>
                  <Popconfirm title="吊销此执行？" onConfirm={() => onRevokeExec(r.id)}>
                    <Button size="small" danger>吊销</Button>
                  </Popconfirm>
                  <Button size="small" onClick={() => onOpenViolation(r.id)}>报违规</Button>
                </>}
              </Space>
            ) },
          ]}
        />
      </Modal>

      {/* Sandbox Execution Detail Modal */}
      <Modal
        title={`执行详情 #${execDetail?.id || ''}`}
        open={execDetailOpen}
        onCancel={() => setExecDetailOpen(false)}
        footer={null}
        width={700}
      >
        {execDetail && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="状态"><Tag color={execDetail.status === 'completed' ? 'green' : execDetail.status === 'violated' ? 'red' : 'blue'}>{execDetail.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Agent">#{execDetail.agent_id}</Descriptions.Item>
              <Descriptions.Item label="开始">{execDetail.started_at || '-'}</Descriptions.Item>
              <Descriptions.Item label="结束">{execDetail.ended_at || '-'}</Descriptions.Item>
              <Descriptions.Item label="工具调用">{execDetail.tool_calls || 0}</Descriptions.Item>
              <Descriptions.Item label="网络调用">{execDetail.network_calls || 0}</Descriptions.Item>
              <Descriptions.Item label="内存峰值">{execDetail.peak_memory_mb || 0} MB</Descriptions.Item>
              <Descriptions.Item label="CPU">{execDetail.cpu_seconds || 0}s</Descriptions.Item>
              {execDetail.termination_reason && <Descriptions.Item label="终止原因" span={2}>{execDetail.termination_reason}</Descriptions.Item>}
              {execDetail.output_summary && <Descriptions.Item label="输出摘要" span={2}>{execDetail.output_summary}</Descriptions.Item>}
            </Descriptions>
            <Title level={5}>违规记录 ({(execDetail.violations || []).length})</Title>
            {(execDetail.violations || []).length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={execDetail.violations}
                renderItem={(v) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Space><Tag color="red">{v.violation_type}</Tag><Text type="secondary">{v.blocked_at}</Text></Space>}
                      description={<div><div>{v.attempted_action}</div>{v.detail && <Text type="secondary" style={{ fontSize: 11 }}>{v.detail}</Text>}</div>}
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="无违规记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </>
        )}
      </Modal>

      {/* Sandbox Check Modal */}
      <Modal
        title="沙盒策略检查 (Dry-run)"
        open={checkOpen}
        onCancel={() => { setCheckOpen(false); setCheckResult(null) }}
        onOk={onSubmitCheck}
        okText="检查"
      >
        <Form layout="vertical">
          <Form.Item label="动作类型" required>
            <Select value={checkForm.action} onChange={v => setCheckForm({ ...checkForm, action: v })}>
              <Option value="tool">工具调用 (tool)</Option>
              <Option value="network">网络访问 (network)</Option>
              <Option value="fs_write">文件写入 (fs_write)</Option>
            </Select>
          </Form.Item>
          <Form.Item label="目标" required>
            <Input value={checkForm.target} onChange={e => setCheckForm({ ...checkForm, target: e.target.value })} placeholder="工具名 / 主机名 / 路径" />
          </Form.Item>
        </Form>
        {checkResult && (
          <Alert
            type={checkResult.allowed ? 'success' : 'error'}
            message={checkResult.allowed ? '允许' : '拒绝'}
            description={checkResult.reason || (checkResult.allowed ? '符合沙盒策略' : '违反沙盒策略')}
            showIcon
          />
        )}
      </Modal>

      {/* Sandbox Start Execution Modal */}
      <Modal
        title="启动沙盒执行"
        open={startOpen}
        onCancel={() => setStartOpen(false)}
        onOk={onSubmitStart}
        okText="启动"
      >
        <Form layout="vertical">
          <Form.Item label="Agent" required>
            <Select value={startForm.agent_id} onChange={v => setStartForm({ ...startForm, agent_id: v })} placeholder="选择执行 Agent" style={{ width: '100%' }}>
              {agents.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="关联 AgentRun ID (可选)">
            <InputNumber value={startForm.run_id} onChange={v => setStartForm({ ...startForm, run_id: v || undefined })} placeholder="AgentRun ID" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="关联 WorkflowStepRun ID (可选)">
            <InputNumber value={startForm.step_run_id} onChange={v => setStartForm({ ...startForm, step_run_id: v || undefined })} placeholder="StepRun ID" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Sandbox Violation Report Modal */}
      <Modal
        title="报告沙盒违规"
        open={violationOpen}
        onCancel={() => setViolationOpen(false)}
        onOk={onSubmitViolation}
        okText="记录"
      >
        <Form layout="vertical">
          <Form.Item label="违规类型" required>
            <Select value={violationForm.violation_type} onChange={v => setViolationForm({ ...violationForm, violation_type: v })}>
              <Option value="disallowed_tool">禁止工具</Option>
              <Option value="network_blocked">网络被阻止</Option>
              <Option value="fs_write_blocked">写入被阻止</Option>
              <Option value="fs_read_blocked">读取被阻止</Option>
              <Option value="resource_limit">资源超限</Option>
              <Option value="timeout">超时</Option>
              <Option value="capability_exceed">能力越界</Option>
            </Select>
          </Form.Item>
          <Form.Item label="尝试动作">
            <Input value={violationForm.attempted_action} onChange={e => setViolationForm({ ...violationForm, attempted_action: e.target.value })} placeholder="Agent 试图做什么" />
          </Form.Item>
          <Form.Item label="详情">
            <Input.TextArea value={violationForm.detail} onChange={e => setViolationForm({ ...violationForm, detail: e.target.value })} placeholder="为何被阻止" rows={3} />
          </Form.Item>
          <Form.Item>
            <Checkbox checked={violationForm.terminate} onChange={e => setViolationForm({ ...violationForm, terminate: e.target.checked })}>同时终止此执行 (标记为 violated)</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default SandboxDrawer