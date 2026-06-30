import React, { useCallback, useEffect, useState } from 'react'
import { Button, Card, Descriptions, Input, List, message, Popconfirm, Tag, Typography } from 'antd'
import { DeleteOutlined, LinkOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import TaskIdBadge from '../../../components/TaskIdBadge'
import { MarkdownEditor } from '../../../components/MarkdownEditor'
import { tasksApi, type Task } from '../../../api/tasks'
import { agentsApi, type SharedContextEntry } from '../../../api/agents'
import dayjs from 'dayjs'
import { TaskCollaborationTimeline } from './TaskCollaborationTimeline'
import SubtaskTree from '../../../components/Task/SubtaskTree'

const { Paragraph, Text, Link } = Typography

const statusColor = (s: string) =>
  s === 'done' ? 'green'
    : s === 'in_progress' ? 'blue'
      : s === 'blocked' ? 'red'
        : s === 'review' ? 'purple'
          : 'default'

interface TaskDetailContentProps {
  task: any
  customButtons: any[]
  handleCreateFromTask: () => void
  handleCreateTask: () => void
  handleCopyTask: () => void
  tp: (key: string, options?: any) => string
}

export const TaskDetailContent: React.FC<TaskDetailContentProps> = ({
  task,
  customButtons,
  handleCreateFromTask,
  handleCreateTask,
  handleCopyTask,
  tp
}) => {
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [creatingSubtask, setCreatingSubtask] = useState(false)
  const [sharedCtx, setSharedCtx] = useState<SharedContextEntry[]>([])
  const [newCtxKey, setNewCtxKey] = useState('')
  const [newCtxValue, setNewCtxValue] = useState('')
  const [savingCtx, setSavingCtx] = useState(false)

  const loadSubtasks = useCallback(async () => {
    if (!task?.id) return
    try {
      const result = await tasksApi.getSubtasks(task.id)
      setSubtasks(Array.isArray(result) ? result : (result as any)?.data || [])
    } catch {
      // silent — may not have subtasks
    }
  }, [task?.id])

  useEffect(() => {
    loadSubtasks()
  }, [loadSubtasks])

  const handleCreateSubtask = useCallback(async () => {
    if (!task?.id || !newSubtaskTitle.trim()) return
    setCreatingSubtask(true)
    try {
      await tasksApi.createTask({
        title: newSubtaskTitle.trim(),
        project_id: task.project_id,
        parent_task_id: task.id,
      })
      setNewSubtaskTitle('')
      message.success(tp('subtask.created') || '子任务已创建')
      loadSubtasks()
    } catch {
      message.error(tp('subtask.createFailed') || '创建子任务失败')
    } finally {
      setCreatingSubtask(false)
    }
  }, [task, newSubtaskTitle, loadSubtasks, tp])

  const loadSharedCtx = useCallback(async () => {
    if (!task?.id) return
    try {
      const result = await agentsApi.getSharedContext(task.id)
      setSharedCtx(Array.isArray(result) ? result : [])
    } catch {
      // silent
    }
  }, [task?.id])

  useEffect(() => {
    loadSharedCtx()
  }, [loadSharedCtx])

  const handleSaveCtx = useCallback(async () => {
    if (!task?.id || !newCtxKey.trim()) return
    setSavingCtx(true)
    try {
      await agentsApi.setSharedContext(task.id, { key: newCtxKey.trim(), value: newCtxValue })
      setNewCtxKey('')
      setNewCtxValue('')
      message.success(tp('sharedContext.saved') || '已保存')
      loadSharedCtx()
    } catch {
      message.error(tp('sharedContext.saveFailed') || '保存失败')
    } finally {
      setSavingCtx(false)
    }
  }, [task, newCtxKey, newCtxValue, loadSharedCtx, tp])

  const handleDeleteCtx = useCallback(async (entryId: number) => {
    if (!task?.id) return
    try {
      await agentsApi.deleteSharedContext(task.id, entryId)
      loadSharedCtx()
    } catch {
      message.error(tp('sharedContext.deleteFailed') || '删除失败')
    }
  }, [task, loadSharedCtx, tp])

  if (!task) return null

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{ flex: 3 }}>
        <Card title={tp('content.title')} style={{ marginBottom: '16px' }}>
          <div className="markdown-content">
            {task.content ? (
              <div dangerouslySetInnerHTML={{ __html: task.content }} />
            ) : (
              <Paragraph type="secondary">{tp('content.empty')}</Paragraph>
            )}
          </div>
        </Card>
      </div>

      <div style={{ flex: 2 }}>
        <Card title={tp('info.title')}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={tp('info.taskId')}>
              <span>#{task.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.project')}>
              {task.project_id}
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.status')}>
              <Tag color={statusColor(task.status)}>
                {tp(`status.${task.status}`)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.priority')}>
              <Tag color={task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : 'blue'}>
                {tp(`priority.${task.priority}`)}
              </Tag>
            </Descriptions.Item>
            {task.due_date && (
              <Descriptions.Item label={tp('info.dueDate')}>
                {dayjs(task.due_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={tp('info.createdAt')}>
              {dayjs(task.created_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label={tp('info.updatedAt')}>
              {dayjs(task.updated_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {task.required_capabilities && task.required_capabilities.length > 0 && (
              <Descriptions.Item label="能力要求">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {task.required_capabilities.map((cap: string) => (
                    <Tag key={cap} color="blue">{cap}</Tag>
                  ))}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* 父任务链接 */}
        {task.parent_task_id && (
          <Card size="small" style={{ marginTop: 8 }}>
            <Text type="secondary"><LinkOutlined /> {tp('subtask.parentLabel') || '父任务'}</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue">#{task.parent_task_id}</Tag>
            </div>
          </Card>
        )}

        {/* 子任务区域 */}
        <Card
          title={tp('subtask.listTitle') || '子任务'}
          size="small"
          style={{ marginTop: 8 }}
        >
          {subtasks.length > 0 && (
            <List
              size="small"
              dataSource={subtasks}
              renderItem={(sub) => (
                <List.Item style={{ padding: '6px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span>
                      <Tag>#{sub.id}</Tag>
                      <Text>{sub.title}</Text>
                    </span>
                    <Tag color={statusColor(sub.status)}>{sub.status}</Tag>
                  </div>
                </List.Item>
              )}
            />
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: subtasks.length > 0 ? 8 : 0 }}>
            <Input
              size="small"
              placeholder={tp('subtask.createPlaceholder') || '输入子任务标题...'}
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onPressEnter={handleCreateSubtask}
              disabled={creatingSubtask}
            />
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateSubtask}
              loading={creatingSubtask}
              disabled={!newSubtaskTitle.trim()}
            >
              {tp('subtask.createButton') || '创建'}
            </Button>
          </div>
        </Card>

        {/* 共享上下文 */}
        <Card
          title={tp('sharedContext.title') || '共享上下文'}
          size="small"
          style={{ marginTop: 8 }}
        >
          {sharedCtx.length > 0 && (
            <List
              size="small"
              dataSource={sharedCtx}
              renderItem={(entry) => (
                <List.Item
                  style={{ padding: '6px 0' }}
                  actions={[
                    <Popconfirm
                      key="del"
                      title={tp('sharedContext.confirmDelete') || '确定删除？'}
                      onConfirm={() => handleDeleteCtx(entry.id)}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={<Tag color="geekblue">{entry.key}</Tag>}
                    description={
                      <div>
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 80, overflow: 'auto' }}>
                          {entry.value}
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                          {entry.author_agent_name || entry.author_user_name || ''} · {dayjs(entry.updated_at).format('HH:mm')}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
          <div style={{ marginTop: sharedCtx.length > 0 ? 8 : 0 }}>
            <Input
              size="small"
              placeholder={tp('sharedContext.keyPlaceholder') || 'key（如 research_summary）'}
              value={newCtxKey}
              onChange={(e) => setNewCtxKey(e.target.value)}
              style={{ marginBottom: 4 }}
            />
            <Input.TextArea
              size="small"
              rows={2}
              placeholder={tp('sharedContext.valuePlaceholder') || '值（Markdown 或 JSON）'}
              value={newCtxValue}
              onChange={(e) => setNewCtxValue(e.target.value)}
            />
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveCtx}
              loading={savingCtx}
              disabled={!newCtxKey.trim()}
              style={{ marginTop: 4 }}
            >
              {tp('sharedContext.save') || '保存'}
            </Button>
          </div>
        </Card>

        <TaskCollaborationTimeline taskId={task.id} tp={tp} />

        {/* Subtask tree */}
        {task.project_id && (
          <SubtaskTree parentTaskId={task.id} projectId={task.project_id} />
        )}
      </div>
    </div>
  )
}
