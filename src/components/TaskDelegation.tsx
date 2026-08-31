import { useState, useCallback, useMemo } from 'react'
import { Button, Dropdown, Input, Popconfirm, Tag, Spin, message, Empty } from 'antd'
import type { MenuProps } from 'antd'
import { RobotOutlined, SwapOutlined, SearchOutlined } from '@ant-design/icons'
import { taskDelegationApi } from '../api/taskDelegation'
import type { DelegatableAgent } from '../api/taskDelegation'
import { getErrorMessage } from '../utils/errorUtils'

interface TaskDelegationProps {
  taskId: number
  workspaceId: number
  currentAssigneeId?: number
  onDelegated?: () => void
}

const STATUS_DOT_COLORS: Record<string, string> = {
  running: '#52c41a',
  idle: '#1890ff',
  busy: '#faad14',
  error: '#ff4d4f',
  inactive: '#d9d9d9',
}

const TaskDelegation: React.FC<TaskDelegationProps> = ({
  taskId,
  workspaceId,
  currentAssigneeId,
  onDelegated,
}) => {
  const [agents, setAgents] = useState<DelegatableAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const loadAgents = useCallback(async () => {
    try {
      setLoading(true)
      const data = await taskDelegationApi.listAgents(workspaceId)
      setAgents(data)
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to load agents'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  const handleOpenChange = useCallback(
    (visible: boolean) => {
      setOpen(visible)
      if (visible && agents.length === 0) {
        void loadAgents()
      }
    },
    [agents.length, loadAgents]
  )

  const handleDelegate = useCallback(
    async (agent: DelegatableAgent) => {
      try {
        setActionLoading(true)
        await taskDelegationApi.delegate(taskId, agent.id)
        message.success(`Task delegated to ${agent.name}`)
        setOpen(false)
        onDelegated?.()
      } catch (error) {
        message.error(getErrorMessage(error, 'Failed to delegate task'))
      } finally {
        setActionLoading(false)
      }
    },
    [taskId, onDelegated]
  )

  const handleReclaim = useCallback(async () => {
    try {
      setActionLoading(true)
      await taskDelegationApi.reclaim(taskId)
      message.success('Task reclaimed')
      onDelegated?.()
    } catch (error) {
      message.error(getErrorMessage(error, 'Failed to reclaim task'))
    } finally {
      setActionLoading(false)
    }
  }, [taskId, onDelegated])

  const filteredAgents = useMemo(() => {
    if (!searchText) return agents
    const lower = searchText.toLowerCase()
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        (a.role && a.role.toLowerCase().includes(lower))
    )
  }, [agents, searchText])

  const menuItems: MenuProps['items'] = [
    {
      key: 'search',
      label: (
        <Input
          placeholder="Search agents..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="small"
          style={{ marginBottom: 4 }}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      disabled: true,
    },
    { type: 'divider' },
  ]

  if (loading) {
    menuItems.push({
      key: 'loading',
      label: (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <Spin size="small" />
        </div>
      ),
      disabled: true,
    })
  } else if (filteredAgents.length === 0) {
    menuItems.push({
      key: 'empty',
      label: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No agents available" />,
      disabled: true,
    })
  } else {
    filteredAgents.forEach((agent) => {
      menuItems.push({
        key: `agent-${agent.id}`,
        label: (
          <Popconfirm
            title={`Confirm delegating this task to ${agent.name}?`}
            onConfirm={(e) => {
              e?.stopPropagation()
              void handleDelegate(agent)
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Confirm"
            cancelText="Cancel"
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: STATUS_DOT_COLORS[agent.status] || '#d9d9d9',
                }}
              />
              <span style={{ flex: 1 }}>{agent.name}</span>
              {agent.role && <Tag size="small">{agent.role}</Tag>}
            </div>
          </Popconfirm>
        ),
      })
    })
  }

  if (currentAssigneeId) {
    return (
      <Popconfirm
        title="Confirm reclaiming this task from the agent?"
        onConfirm={() => void handleReclaim()}
        okText="Confirm"
        cancelText="Cancel"
      >
        <Button icon={<SwapOutlined />} loading={actionLoading} size="small">
          Reclaim from Agent
        </Button>
      </Popconfirm>
    )
  }

  return (
    <Dropdown
      menu={{ items: menuItems }}
      open={open}
      onOpenChange={handleOpenChange}
      trigger={['click']}
      destroyPopupOnHide
    >
      <Button icon={<RobotOutlined />} loading={actionLoading} size="small">
        Delegate to Agent
      </Button>
    </Dropdown>
  )
}

export default TaskDelegation
