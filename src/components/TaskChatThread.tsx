import { useEffect, useState, useRef, useCallback } from 'react'
import { Input, Button, Avatar, Space, Spin, Empty, message } from 'antd'
import { SendOutlined, RobotOutlined, UserOutlined, DesktopOutlined, MessageOutlined } from '@ant-design/icons'
import { taskChatApi } from '../api/taskChat.js'
import type { ChatMessage } from '../api/taskChat.js'
import { getErrorMessage } from '../utils/errorUtils.js'
import { useTaskRealtime } from '../hooks/useTaskRealtime'

const ACTOR_CONFIG = {
  HUMAN: { color: '#00b96b', icon: <UserOutlined />, label: '用户', avatar: 'U' },
  AGENT: { color: '#1890ff', icon: <RobotOutlined />, label: 'Agent', avatar: 'A' },
  SYSTEM: { color: '#999', icon: <DesktopOutlined />, label: '系统', avatar: 'S' },
} as const

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return d.toLocaleDateString('zh-CN')
}

interface TaskChatThreadProps {
  taskId: number
}

interface ReplyState {
  parentId: number | null
  content: string
}

const TaskChatThread: React.FC<TaskChatThreadProps> = ({ taskId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [content, setContent] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [replyState, setReplyState] = useState<ReplyState>({ parentId: null, content: '' })
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (pageNum: number, append = false) => {
    try {
      setLoading(true)
      const res = await taskChatApi.getMessages(taskId, pageNum)
      setTotal(res.total)
      setPage(res.page)
      if (append) {
        setMessages(prev => [...res.items, ...prev])
      } else {
        setMessages(res.items)
      }
    } catch (error) {
      message.error(getErrorMessage(error, '加载对话消息失败'))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadMessages(1)
  }, [loadMessages])

  // Real-time: reload messages when WebSocket receives new comment
  useTaskRealtime({
    taskId,
    onComment: () => { loadMessages(1) },
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async () => {
    const text = content.trim()
    if (!text) return
    try {
      setSending(true)
      await taskChatApi.sendMessage(taskId, text)
      setContent('')
      await loadMessages(1)
    } catch (error) {
      message.error(getErrorMessage(error, '发送消息失败'))
    } finally {
      setSending(false)
    }
  }

  const handleReplySend = async () => {
    const text = replyState.content.trim()
    if (!text || !replyState.parentId) return
    try {
      setSending(true)
      await taskChatApi.sendMessage(taskId, text, replyState.parentId)
      setReplyState({ parentId: null, content: '' })
      await loadMessages(1)
    } catch (error) {
      message.error(getErrorMessage(error, '发送回复失败'))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, sendFn: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendFn()
    }
  }

  const loadMore = () => {
    loadMessages(page + 1, true)
  }

  const hasMore = messages.length < total

  const renderMessage = (msg: ChatMessage, isReply = false) => {
    const config = ACTOR_CONFIG[msg.actor_type] || ACTOR_CONFIG.SYSTEM

    return (
      <div
        key={msg.id}
        style={{
          borderLeft: `3px solid ${config.color}`,
          padding: '10px 12px',
          marginBottom: isReply ? 8 : 12,
          marginLeft: isReply ? 32 : 0,
          backgroundColor: '#fafafa',
          borderRadius: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Avatar
            size="small"
            style={{ backgroundColor: config.color, flexShrink: 0 }}
            icon={config.icon}
          >
            {config.avatar}
          </Avatar>
          <span style={{ fontWeight: 500, color: config.color }}>{config.label}</span>
          <span style={{ color: '#999', fontSize: 12 }}>{formatTime(msg.created_at)}</span>
        </div>

        <div style={{ paddingLeft: 32, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.content}
        </div>

        {/* Reply toggle button for top-level messages */}
        {!isReply && (
          <div style={{ paddingLeft: 32, marginTop: 6 }}>
            <Button
              type="link"
              size="small"
              icon={<MessageOutlined />}
              style={{ padding: 0, color: '#999', fontSize: 12 }}
              onClick={() => {
                if (replyState.parentId === msg.id) {
                  setReplyState({ parentId: null, content: '' })
                } else {
                  setReplyState({ parentId: msg.id, content: '' })
                }
              }}
            >
              回复
            </Button>
          </div>
        )}

        {/* Inline reply input */}
        {!isReply && replyState.parentId === msg.id && (
          <div style={{ paddingLeft: 32, marginTop: 8, display: 'flex', gap: 8 }}>
            <Input
              size="small"
              value={replyState.content}
              onChange={(e) => setReplyState(prev => ({ ...prev, content: e.target.value }))}
              onKeyDown={(e) => handleKeyDown(e, handleReplySend)}
              placeholder="输入回复..."
              style={{ flex: 1 }}
              autoFocus
            />
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={handleReplySend}
              loading={sending}
              disabled={!replyState.content.trim()}
            />
          </div>
        )}

        {/* Nested replies */}
        {msg.replies && msg.replies.length > 0 && (
          <div style={{ paddingLeft: 32, marginTop: 8 }}>
            {msg.replies.map(reply => renderMessage(reply, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Load more button */}
      {hasMore && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <Button type="link" size="small" onClick={loadMore} loading={loading}>
            加载更多消息
          </Button>
        </div>
      )}

      {/* Message list */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && messages.length === 0 ? (
          <Spin style={{ display: 'block', margin: '20px auto' }} />
        ) : messages.length === 0 ? (
          <Empty description="暂无对话消息" />
        ) : (
          messages.map(msg => renderMessage(msg))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 8 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input.TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSend)}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1, resize: 'none' }}
            disabled={sending}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!content.trim()}
            style={{ alignSelf: 'flex-end' }}
          />
        </Space.Compact>
      </div>
    </div>
  )
}

export default TaskChatThread
