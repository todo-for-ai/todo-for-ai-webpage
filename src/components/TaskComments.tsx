import { useEffect, useState, useCallback } from 'react'
import { Input, Button, List, Avatar, Tag, Spin, Empty, message } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined, DesktopOutlined } from '@ant-design/icons'
import { taskLogsApi, TaskLogEntry } from '../api/taskLogs'
import { usePageTranslation } from '../i18n/hooks/useTranslation'
import { getErrorMessage } from '../utils/errorUtils'

const { TextArea } = Input

interface TaskCommentsProps {
  taskId: number
}

const ACTOR_CONFIG = {
  HUMAN: { icon: <UserOutlined />, color: '#00b96b', label: '用户' },
  AGENT: { icon: <RobotOutlined />, color: '#1677ff', label: 'Agent' },
  SYSTEM: { icon: <DesktopOutlined />, color: '#999', label: '系统' },
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const { tp } = usePageTranslation('taskDetail')
  const [logs, setLogs] = useState<TaskLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await taskLogsApi.getLogs(taskId)
      setLogs(response.items || [])
    } catch (error) {
      message.error(getErrorMessage(error, '加载评论失败'))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => { loadLogs() }, [loadLogs])

  const handleSubmit = async () => {
    if (!content.trim()) return
    try {
      setSubmitting(true)
      await taskLogsApi.addComment(taskId, content.trim())
      setContent('')
      await loadLogs()
    } catch (error) {
      message.error(getErrorMessage(error, '发送评论失败'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="添加评论... (支持 Markdown)"
          autoSize={{ minRows: 2, maxRows: 6 }}
          style={{ marginBottom: 8 }}
        />
        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={!content.trim()}
            size="small"
          >
            发送
          </Button>
        </div>
      </div>

      {loading ? (
        <Spin style={{ display: 'block', margin: '20px auto' }} />
      ) : logs.length === 0 ? (
        <Empty description="暂无评论" />
      ) : (
        <List
          dataSource={logs}
          renderItem={(log: TaskLogEntry) => {
            const actorConfig = ACTOR_CONFIG[log.actor_type] || ACTOR_CONFIG.SYSTEM
            return (
              <List.Item style={{ padding: '8px 0', border: 'none' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size="small"
                      icon={actorConfig.icon}
                      style={{ backgroundColor: actorConfig.color }}
                      src={log.actor_avatar}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {log.actor_name || actorConfig.label}
                      </span>
                      <Tag color={actorConfig.color} style={{ fontSize: 11, margin: 0 }}>
                        {actorConfig.label}
                      </Tag>
                      <span style={{ color: '#999', fontSize: 11 }}>
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  }
                  description={
                    <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>
                      {log.content}
                    </div>
                  }
                />
              </List.Item>
            )
          }}
        />
      )}
    </div>
  )
}

export default TaskComments
