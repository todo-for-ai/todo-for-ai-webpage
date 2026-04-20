import { useEffect, useState, useCallback } from 'react'
import { Tag, Input, Spin, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { taskDependenciesApi, TaskDependencies } from '../api/taskDependencies'
import { getErrorMessage } from '../utils/errorUtils'

interface TaskDependenciesProps {
  taskId: number
}

const TaskDependenciesComponent: React.FC<TaskDependenciesProps> = ({ taskId }) => {
  const [dependencies, setDependencies] = useState<TaskDependencies>({ blocking: [], blocked_by: [] })
  const [loading, setLoading] = useState(true)
  const [newBlockingId, setNewBlockingId] = useState('')
  const [newBlockedById, setNewBlockedById] = useState('')

  const loadDependencies = useCallback(async () => {
    try {
      setLoading(true)
      const data = await taskDependenciesApi.get(taskId)
      setDependencies(data)
    } catch (error) {
      message.error(getErrorMessage(error, '加载依赖关系失败'))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadDependencies()
  }, [loadDependencies])

  const handleRemoveBlocking = async (id: number) => {
    try {
      const updated = dependencies.blocking.filter((bid) => bid !== id)
      await taskDependenciesApi.update(taskId, { blocking: updated })
      setDependencies((prev) => ({ ...prev, blocking: updated }))
    } catch (error) {
      message.error(getErrorMessage(error, '移除阻塞关系失败'))
    }
  }

  const handleRemoveBlockedBy = async (id: number) => {
    try {
      const updated = dependencies.blocked_by.filter((bid) => bid !== id)
      await taskDependenciesApi.update(taskId, { blocked_by: updated })
      setDependencies((prev) => ({ ...prev, blocked_by: updated }))
    } catch (error) {
      message.error(getErrorMessage(error, '移除依赖关系失败'))
    }
  }

  const handleAddBlocking = async () => {
    const id = parseInt(newBlockingId.trim(), 10)
    if (isNaN(id) || dependencies.blocking.includes(id)) {
      setNewBlockingId('')
      return
    }
    try {
      const updated = [...dependencies.blocking, id]
      await taskDependenciesApi.update(taskId, { blocking: updated })
      setDependencies((prev) => ({ ...prev, blocking: updated }))
      setNewBlockingId('')
    } catch (error) {
      message.error(getErrorMessage(error, '添加阻塞关系失败'))
    }
  }

  const handleAddBlockedBy = async () => {
    const id = parseInt(newBlockedById.trim(), 10)
    if (isNaN(id) || dependencies.blocked_by.includes(id)) {
      setNewBlockedById('')
      return
    }
    try {
      const updated = [...dependencies.blocked_by, id]
      await taskDependenciesApi.update(taskId, { blocked_by: updated })
      setDependencies((prev) => ({ ...prev, blocked_by: updated }))
      setNewBlockedById('')
    } catch (error) {
      message.error(getErrorMessage(error, '添加依赖关系失败'))
    }
  }

  if (loading) {
    return <Spin size="small" />
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#d46b08' }}>
          阻塞的任务
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {dependencies.blocking.map((id) => (
            <Tag
              key={id}
              color="orange"
              closable
              onClose={() => handleRemoveBlocking(id)}
            >
              #{id}
            </Tag>
          ))}
          <Input
            size="small"
            style={{ width: 100 }}
            placeholder="任务ID"
            value={newBlockingId}
            onChange={(e) => setNewBlockingId(e.target.value)}
            onPressEnter={handleAddBlocking}
            suffix={
              <PlusOutlined
                style={{ color: '#d46b08', cursor: 'pointer' }}
                onClick={handleAddBlocking}
              />
            }
          />
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#cf1322' }}>
          被阻塞于
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {dependencies.blocked_by.map((id) => (
            <Tag
              key={id}
              color="red"
              closable
              onClose={() => handleRemoveBlockedBy(id)}
            >
              #{id}
            </Tag>
          ))}
          <Input
            size="small"
            style={{ width: 100 }}
            placeholder="任务ID"
            value={newBlockedById}
            onChange={(e) => setNewBlockedById(e.target.value)}
            onPressEnter={handleAddBlockedBy}
            suffix={
              <PlusOutlined
                style={{ color: '#cf1322', cursor: 'pointer' }}
                onClick={handleAddBlockedBy}
              />
            }
          />
        </div>
      </div>
    </div>
  )
}

export default TaskDependenciesComponent
