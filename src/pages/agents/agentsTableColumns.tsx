/**
 * Agents.tsx 表格列定义构建器：Agent 列表列 + 派发记录列。
 * 从 Agents.tsx 原样抽出，静态依赖（statusColor/stateColor/formatDateTime/renderCapabilities/
 * CapabilityRadar）直连模块导入，跨域处理器经 ctx 显式注入，逻辑零改动。
 */

import { Badge, Button, Progress, Space, Tag, Tooltip } from 'antd'
import { Typography } from 'antd'
import {
  ThunderboltOutlined, SearchOutlined, DeploymentUnitOutlined,
  PlayCircleOutlined, BulbOutlined, ApiOutlined, EditOutlined,
  SoundOutlined, SendOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import type {
  Agent, AgentKind, TaskAssignment, TaskAssignmentState,
} from '../../api/agents'
import CapabilityRadar from '../../components/Agent/CapabilityRadar'
import { statusColor, stateColor, formatDateTime, renderCapabilities } from './utils'

const { Text } = Typography

export interface AgentsTableColumnsCtx {
  heartbeat: (agent: Agent) => void
  previewDispatchTasks: (agent: Agent) => void
  dispatchTasks: (agent: Agent) => void
  claimTask: (agent: Agent, a: null, b: boolean) => void
  loadRecommendedTasks: (agent: Agent) => void
  loadAssignments: (agent: Agent) => void
  openEditModal: (agent: Agent) => void
  setBroadcastAgent: (agent: Agent) => void
  setBroadcastOpen: (v: boolean) => void
  setBroadcastContent: (v: string) => void
  setDmFrom: (agent: Agent) => void
  setDmTo: (v: null) => void
  setDmOpen: (v: boolean) => void
  setDmContent: (v: string) => void
  updateAssignmentState: (record: TaskAssignment, state: TaskAssignmentState) => void
}

export function buildAgentsTableColumns(ctx: AgentsTableColumnsCtx) {
  const {
    heartbeat, previewDispatchTasks, dispatchTasks, claimTask, loadRecommendedTasks,
    loadAssignments, openEditModal,
    setBroadcastAgent, setBroadcastOpen, setBroadcastContent,
    setDmFrom, setDmTo, setDmOpen, setDmContent,
    updateAssignmentState,
  } = ctx

  const columns = [
    {
      title: 'Agent',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Agent) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Text strong>{record.name}</Text>
            <Tag color={statusColor[record.status]}>{record.status}</Tag>
          </Space>
          <Text type="secondary">
            {record.description || `${record.provider || 'runtime'} ${record.model || ''}`.trim() || '未配置描述'}
          </Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'kind',
      key: 'kind',
      width: 110,
      render: (kind: AgentKind) => <Tag>{kind}</Tag>,
    },
    {
      title: '协作角色',
      dataIndex: 'collaboration_role',
      key: 'collaboration_role',
      width: 100,
      render: (role: string) => {
        const roleMap: Record<string, { color: string; label: string }> = {
          leader: { color: 'gold', label: '领导者' },
          follower: { color: 'blue', label: '跟随者' },
          standalone: { color: 'default', label: '独立' },
        }
        const info = roleMap[role || 'standalone'] || roleMap.standalone
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: '能力',
      dataIndex: 'capabilities',
      key: 'capabilities',
      render: (capabilities: string[], record: Agent) => (
        <Tooltip
          title={capabilities.length >= 3 ? <CapabilityRadar capabilities={capabilities} size={140} /> : undefined}
          overlayStyle={{ maxWidth: 'none' }}
        >
          <div>{renderCapabilities(capabilities)}</div>
        </Tooltip>
      ),
    },
    {
      title: '派发',
      dataIndex: ['stats', 'active_assignments'],
      key: 'active_assignments',
      width: 120,
      render: (_: number, record: Agent) => (
        <Space direction="vertical" size={0}>
          <Text>{record.stats?.active_assignments || 0} 活跃</Text>
          <Text type="secondary">{record.stats?.total_runs || 0} 次运行</Text>
        </Space>
      ),
    },
    {
      title: '在线状态',
      dataIndex: 'last_seen_at',
      key: 'online_status',
      width: 180,
      render: (val: string | undefined, record: Agent) => {
        const ONLINE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes
        const WARN_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes
        const lastSeen = val ? new Date(val).getTime() : 0
        const now = Date.now()
        const elapsed = now - lastSeen

        if (record.status === 'offline' || !val) {
          return <Space><Badge status="default" /><span style={{ color: '#999' }}>离线</span></Space>
        }
        if (elapsed < WARN_THRESHOLD_MS) {
          return <Space><Badge status="success" /><span style={{ color: '#52c41a' }}>在线</span></Space>
        }
        if (elapsed < ONLINE_THRESHOLD_MS) {
          const mins = Math.floor(elapsed / 60000)
          return <Space><Badge status="warning" /><span style={{ color: '#faad14' }}>{mins}分钟前</span></Space>
        }
        return <Space><Badge status="error" /><span style={{ color: '#ff4d4f' }}>超时</span></Space>
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 430,
      render: (_: unknown, record: Agent) => (
        <Space size="small" wrap>
          <Tooltip title="记录一次在线心跳">
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => heartbeat(record)}>
              心跳
            </Button>
          </Tooltip>
          {record.kind === 'coordinator' ? (
            <>
              <Tooltip title="先查看待办任务与空闲 Agent 的匹配计划">
                <Button size="small" icon={<SearchOutlined />} onClick={() => previewDispatchTasks(record)}>
                  预览派活
                </Button>
              </Tooltip>
              <Tooltip title="作为协调器，把待办任务按能力匹配自动分派给空闲 Agent">
                <Button size="small" type="primary" icon={<DeploymentUnitOutlined />} onClick={() => dispatchTasks(record)}>
                  自动派活
                </Button>
              </Tooltip>
            </>
          ) : (
            <>
              <Button size="small" icon={<PlayCircleOutlined />} onClick={() => claimTask(record, null, true)}>
                智能领取
              </Button>
              <Tooltip title="查看与此 Agent 能力匹配的待办任务">
                <Button size="small" icon={<BulbOutlined />} onClick={() => loadRecommendedTasks(record)}>
                  推荐
                </Button>
              </Tooltip>
              <Button size="small" onClick={() => claimTask(record, null, false)}>
                优先级领取
              </Button>
            </>
          )}
          <Button size="small" icon={<ApiOutlined />} onClick={() => loadAssignments(record)}>
            派发
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Tooltip title="向所有活跃 Agent 发送广播消息">
            <Button size="small" icon={<SoundOutlined />} onClick={() => { setBroadcastAgent(record); setBroadcastOpen(true); setBroadcastContent('') }}>
              广播
            </Button>
          </Tooltip>
          <Tooltip title="向指定 Agent 发送直接消息">
            <Button size="small" icon={<SendOutlined />} onClick={() => { setDmFrom(record); setDmTo(null); setDmOpen(true); setDmContent('') }}>
              消息
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  const assignmentColumns = [
    {
      title: '任务',
      dataIndex: 'task',
      key: 'task',
      render: (_: unknown, record: TaskAssignment) => (
        <Space direction="vertical" size={2}>
          <Text strong>#{record.task_id} {record.task?.title || '未加载任务标题'}</Text>
          <Text type="secondary">{record.task?.project?.name || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      width: 120,
      render: (state: TaskAssignmentState) => <Tag color={stateColor[state]}>{state}</Tag>,
    },
    {
      title: '进度',
      dataIndex: 'progress_rate',
      key: 'progress_rate',
      width: 130,
      render: (progress: number) => <Progress percent={progress || 0} size="small" />,
    },
    {
      title: '租约到期',
      dataIndex: 'lease_expires_at',
      key: 'lease_expires_at',
      width: 190,
      render: formatDateTime,
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      render: (_: unknown, record: TaskAssignment) => (
        <Space size="small" wrap>
          <Button size="small" onClick={() => updateAssignmentState(record, 'running')}>运行</Button>
          <Button size="small" onClick={() => updateAssignmentState(record, 'waiting_human')}>等人</Button>
          <Button size="small" icon={<CheckCircleOutlined />} onClick={() => updateAssignmentState(record, 'done')}>
            完成
          </Button>
          <Button size="small" danger onClick={() => updateAssignmentState(record, 'failed')}>失败</Button>
        </Space>
      ),
    },
  ]

  return { columns, assignmentColumns }
}
