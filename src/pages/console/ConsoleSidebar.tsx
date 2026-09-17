import React, { useMemo, useState } from 'react'
import { Button, Input, Modal, Select, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { tasksApi } from '../../api/tasks'
import { getErrorMessage } from '../../utils/errorUtils.js'
import {
  consoleStatusMeta,
  filterConsoleTasks,
  groupConsoleTasks,
  relativeTime,
  summarizeConsoleTasks,
  type ConsoleTaskLike,
} from './consoleData'
import { CONSOLE_TOKENS as T, CONSOLE_MONO } from './consoleTheme'

interface ConsoleSidebarProps {
  tasks: ConsoleTaskLike[]
  selectedId: number | null
  onSelect: (taskId: number) => void
  /** 新建任务成功后回调（父级刷新列表并选中新任务） */
  onCreated?: (taskId: number) => void
  projects?: Array<{ id: number; name: string }>
}

/**
 * Console 左侧任务流：新建任务、搜索、按项目分组的近期 AI 任务列表。
 * 视觉对标远程控制台（深色、紧凑、相对时间戳、状态点）。
 */
export const ConsoleSidebar: React.FC<ConsoleSidebarProps> = ({
  tasks,
  selectedId,
  onSelect,
  onCreated,
  projects = [],
}) => {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ title: string; projectId?: number; content: string }>({ title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  const groups = useMemo(
    () => groupConsoleTasks(filterConsoleTasks(tasks, query)),
    [tasks, query]
  )
  const summary = useMemo(() => summarizeConsoleTasks(tasks), [tasks])

  const handleCreate = async () => {
    if (!form.title.trim() || !form.projectId) {
      message.warning('请填写标题并选择项目')
      return
    }
    try {
      setSubmitting(true)
      const task = await tasksApi.createTask({
        title: form.title.trim(),
        project_id: form.projectId,
        content: form.content.trim(),
        is_ai_task: true,
      } as any)
      message.success('任务已创建')
      setCreating(false)
      setForm({ title: '', content: '' })
      onCreated?.((task as any)?.id)
    } catch (error) {
      message.error(getErrorMessage(error, '创建任务失败'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 12px 8px' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={() => setCreating(true)}
          style={{ borderRadius: 6 }}
        >
          新任务
        </Button>
        <Input
          size="small"
          prefix={<SearchOutlined style={{ color: '#666' }} />}
          placeholder="搜索任务…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          allowClear
          style={{ marginTop: 8, background: T.bgField, borderColor: T.border, borderRadius: 6 }}
          data-testid="console-search"
        />
        <div
          data-testid="console-summary"
          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textGhost, padding: '6px 4px 0' }}
        >
          <span>共 {summary.total} 个任务</span>
          {summary.running > 0 && (
            <span style={{ color: T.accent }}>
              <span className="tfai-pulse-dot" style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: T.accent, marginRight: 4,
              }} />
              {summary.running} 执行中
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }} data-testid="console-task-list">
        {groups.length === 0 && (
          <div style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: '24px 8px' }}>
            {query ? '没有匹配的任务' : '暂无 AI 任务'}
          </div>
        )}
        {groups.map(group => (
          <div key={group.projectId} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11, color: '#8c8c8c', padding: '6px 8px 4px',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{group.projectName}</span>
              <span>{group.tasks.length}</span>
            </div>
            {group.tasks.map(task => {
              const meta = consoleStatusMeta(task.status)
              const active = task.id === selectedId
              return (
                <div
                  key={task.id}
                  onClick={() => onSelect(task.id)}
                  data-testid={`console-task-${task.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 8px', borderRadius: 6, cursor: 'pointer',
                    background: active ? '#2b2d31' : 'transparent',
                    marginBottom: 2,
                  }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: meta.color,
                    boxShadow: task.status === 'in_progress' ? `0 0 6px ${meta.color}` : 'none',
                  }} />
                  <span style={{
                    flex: 1, fontSize: 13, color: active ? '#e8e8e8' : '#b8b8b8',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {task.title}
                  </span>
                  <span style={{ fontSize: 11, color: '#666', flexShrink: 0 }}>
                    {relativeTime(task.updated_at)}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <Modal
        title="新建 AI 任务"
        open={creating}
        onCancel={() => setCreating(false)}
        onOk={handleCreate}
        okText="创建"
        confirmLoading={submitting}
        okButtonProps={{ disabled: !form.title.trim() || !form.projectId }}
        destroyOnHidden
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
          <Select
            placeholder="选择项目"
            value={form.projectId}
            onChange={v => setForm(f => ({ ...f, projectId: v }))}
            options={projects.map(p => ({ value: p.id, label: p.name }))}
            showSearch
            optionFilterProp="label"
          />
          <Input
            placeholder="任务标题"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <Input.TextArea
            placeholder="任务描述（可选，Markdown）"
            rows={5}
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}

export default ConsoleSidebar
