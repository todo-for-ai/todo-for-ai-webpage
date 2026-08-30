import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Input, List, Space, Tag, Typography, message } from 'antd'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { tasksApi, type TaskLog } from '../api/tasks'

const { TextArea } = Input
const { Title, Text, Paragraph } = Typography

const TaskLogs = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [items, setItems] = useState<TaskLog[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')

  const taskId = Number(id)

  const loadLogs = async () => {
    if (!taskId) return
    try {
      setLoading(true)
      const data = await tasksApi.getTaskLogs(taskId, { page: 1, per_page: 200 })
      setItems(data.items || [])
    } catch (error: any) {
      message.error(error?.message || 'Failed to load task logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [taskId])

  const appendLog = async () => {
    if (!taskId || !content.trim()) {
      return
    }
    try {
      setLoading(true)
      await tasksApi.appendTaskLog(taskId, content.trim())
      setContent('')
      await loadLogs()
      message.success('Task log appended')
    } catch (error: any) {
      message.error(error?.message || 'Failed to append task log')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', width: '80%', margin: '0 auto', minWidth: '800px', maxWidth: '1400px' }}>
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/todo-for-ai/pages/tasks/${taskId}`)}>
              Back to task
            </Button>
            <Title level={4} style={{ margin: 0 }}>Task Logs #{taskId}</Title>
          </Space>
        </Space>
      </Card>

      <Card title="Append Log" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            rows={4}
            value={content}
            placeholder="Append a log line for this task"
            onChange={(event) => setContent(event.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={appendLog} loading={loading}>
            Append
          </Button>
        </Space>
      </Card>

      <Card title="Log Stream">
        <List
          loading={loading}
          dataSource={items}
          locale={{ emptyText: 'No logs yet' }}
          renderItem={(item) => (
            <List.Item>
              <div style={{ width: '100%' }}>
                <Space style={{ marginBottom: 8 }}>
                  <Tag>{item.actor_type}</Tag>
                  <Text type="secondary">{new Date(item.created_at).toLocaleString()}</Text>
                </Space>
                <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{item.content}</Paragraph>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default TaskLogs
