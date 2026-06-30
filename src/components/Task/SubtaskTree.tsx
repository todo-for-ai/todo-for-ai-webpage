import React, { useEffect, useState } from 'react'
import { Card, Spin, Tag, Empty, Typography, Tooltip } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons'
import { tasksApi, type Task } from '../../api/tasks'

const { Text } = Typography

interface Props {
  parentTaskId: number
  projectId: number
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  todo: { color: 'default', icon: <ClockCircleOutlined />, label: '待办' },
  in_progress: { color: 'processing', icon: <ClockCircleOutlined />, label: '进行中' },
  review: { color: 'warning', icon: <ClockCircleOutlined />, label: '审查' },
  done: { color: 'success', icon: <CheckCircleOutlined />, label: '完成' },
  cancelled: { color: 'error', icon: <StopOutlined />, label: '取消' },
  blocked: { color: 'red', icon: <ExclamationCircleOutlined />, label: '阻塞' },
}

/** Renders a tree view of subtasks under a parent task */
const SubtaskTree: React.FC<Props> = ({ parentTaskId, projectId }) => {
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadSubtasks = async () => {
      setLoading(true)
      try {
        const result = await tasksApi.getTasks({
          project_id: projectId,
          parent_task_id: parentTaskId,
          per_page: 100,
        })
        setSubtasks(result.data || [])
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    loadSubtasks()
  }, [parentTaskId, projectId])

  if (loading) return <Spin size="small" />
  if (subtasks.length === 0) return <Empty description="暂无子任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />

  const done = subtasks.filter(t => t.status === 'done').length
  const total = subtasks.length

  return (
    <Card size="small" title={`子任务 (${done}/${total})`} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {subtasks.map(task => {
          const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo
          return (
            <Tooltip
              key={task.id}
              title={
                <div>
                  <div>{task.title}</div>
                  <div>状态: {cfg.label}</div>
                  {task.required_capabilities?.length > 0 && (
                    <div>能力要求: {task.required_capabilities.join(', ')}</div>
                  )}
                </div>
              }
            >
              <Tag
                color={cfg.color}
                icon={cfg.icon}
                style={{ cursor: 'pointer', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {task.title.length > 16 ? task.title.slice(0, 16) + '…' : task.title}
              </Tag>
            </Tooltip>
          )
        })}
      </div>

      {/* Simple progress bar */}
      <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${total > 0 ? (done / total) * 100 : 0}%`,
          background: done === total && total > 0 ? '#52c41a' : '#1890ff',
          borderRadius: 2,
          transition: 'width 0.3s',
        }} />
      </div>
      <Text type="secondary" style={{ fontSize: 11 }}>
        完成率 {total > 0 ? Math.round((done / total) * 100) : 0}%
      </Text>
    </Card>
  )
}

export default SubtaskTree
