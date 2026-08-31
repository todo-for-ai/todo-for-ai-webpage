import React, { useEffect, useState } from 'react'
import { Timeline, Spin, Empty, Tag, Tooltip, message } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  SwapOutlined,
  UserSwitchOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { taskHistoryApi } from '../api/taskHistory.js'
import type { TaskHistoryEntry } from '../api/taskHistory.js'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { getErrorMessage } from '../utils/errorUtils'

interface TaskActivityTimelineProps {
  taskId: number
}

const ACTION_CONFIG: Record<string, { color: string; icon: React.ReactNode; labelKey: string }> = {
  CREATED: { color: 'green', icon: <PlusOutlined />, labelKey: 'created' },
  UPDATED: { color: 'blue', icon: <EditOutlined />, labelKey: 'updated' },
  STATUS_CHANGED: { color: 'orange', icon: <SwapOutlined />, labelKey: 'statusChanged' },
  ASSIGNED: { color: 'purple', icon: <UserSwitchOutlined />, labelKey: 'assigned' },
  COMPLETED: { color: 'green', icon: <CheckCircleOutlined />, labelKey: 'completed' },
  DELETED: { color: 'red', icon: <DeleteOutlined />, labelKey: 'deleted' },
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}天前`
  return date.toLocaleDateString('zh-CN')
}

function getChangeDescription(entry: TaskHistoryEntry): string {
  if (entry.comment) return entry.comment
  const field = entry.field_name
  if (!field) return '更新了任务'
  const fieldNames: Record<string, string> = {
    title: '标题', content: '内容', status: '状态', priority: '优先级',
    assignee_id: '负责人', due_date: '截止日期', tags: '标签',
  }
  const fieldName = fieldNames[field] || field
  if (entry.old_value && entry.new_value) {
    return `${fieldName}: "${entry.old_value}" → "${entry.new_value}"`
  }
  return `更新了${fieldName}`
}

const TaskActivityTimeline: React.FC<TaskActivityTimelineProps> = ({ taskId }) => {
  const { tp } = usePageTranslation('taskDetail')
  const [history, setHistory] = useState<TaskHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true)
        const data = await taskHistoryApi.getHistory(taskId)
        setHistory(data)
      } catch (error) {
        message.error(getErrorMessage(error, '加载活动记录失败'))
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [taskId])

  if (loading) {
    return <Spin style={{ display: 'block', margin: '20px auto' }} />
  }

  if (history.length === 0) {
    return <Empty description="暂无活动记录" />
  }

  return (
    <Timeline
      items={history.map((entry) => {
        const config = ACTION_CONFIG[entry.action] || {
          color: 'gray', icon: <ClockCircleOutlined />, labelKey: entry.action,
        }
        return {
          color: config.color,
          dot: config.icon,
          children: (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Tag color={config.color} style={{ margin: 0 }}>
                  {tp(`activity.${config.labelKey}`, config.labelKey)}
                </Tag>
                <span style={{ color: '#999', fontSize: 12 }}>
                  <Tooltip title={new Date(entry.changed_at).toLocaleString('zh-CN')}>
                    {formatTime(entry.changed_at)}
                  </Tooltip>
                </span>
              </div>
              <div style={{ fontSize: 13 }}>
                {entry.changed_by && (
                  <span style={{ fontWeight: 500, marginRight: 4 }}>{entry.changed_by}</span>
                )}
                {getChangeDescription(entry)}
              </div>
            </div>
          ),
        }
      })}
    />
  )
}

export default TaskActivityTimeline
