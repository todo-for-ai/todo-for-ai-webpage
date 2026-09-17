import React, { useEffect, useState } from 'react'
import { Descriptions, Tag } from 'antd'
import { agentsApi, type SharedContextEntry } from '../../api/agents'
import dayjs from 'dayjs'
import { consoleStatusMeta } from './consoleData'

interface ConsoleInfoPanelProps {
  task: any
}

const labelStyle: React.CSSProperties = { color: '#8c8c8c' }

/**
 * Console 右侧信息面板：任务元信息、执行者、子任务进度、共享上下文（只读）。
 */
export const ConsoleInfoPanel: React.FC<ConsoleInfoPanelProps> = ({ task }) => {
  const [sharedCtx, setSharedCtx] = useState<SharedContextEntry[]>([])

  useEffect(() => {
    if (!task?.id) return
    let cancelled = false
    agentsApi.getSharedContext(task.id)
      .then(items => { if (!cancelled) setSharedCtx(Array.isArray(items) ? items : []) })
      .catch(() => { /* 静默 */ })
    return () => { cancelled = true }
  }, [task?.id, task?.updated_at])

  if (!task) return null
  const meta = consoleStatusMeta(task.status)
  const subtaskTotal = task.subtask_count || 0
  const subtaskDone = task.subtask_done_count || 0
  const agentAssignees = (task.assignees || []).filter((a: any) => a.type === 'agent')
  const humanAssignees = (task.assignees || []).filter((a: any) => a.type === 'human')

  const sectionTitle = (text: string) => (
    <div style={{ fontSize: 12, color: '#8c8c8c', margin: '16px 0 8px', letterSpacing: 1 }}>{text}</div>
  )

  return (
    <div style={{ padding: '12px 16px', overflowY: 'auto', height: '100%' }} data-testid="console-info-panel">
      <div style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 600, marginBottom: 4 }}>任务信息</div>
      <Descriptions column={1} size="small" labelStyle={labelStyle} contentStyle={{ color: '#d9d9d9' }}>
        <Descriptions.Item label="状态">
          <Tag style={{ marginRight: 0, borderRadius: 4 }} color={task.status === 'in_progress' ? 'green' : task.status === 'done' ? 'blue' : 'default'}>
            <span style={{ color: meta.color }}>{meta.label}</span>
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="优先级">{task.priority}</Descriptions.Item>
        <Descriptions.Item label="创建">{dayjs(task.created_at).format('MM-DD HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="更新">{dayjs(task.updated_at).format('MM-DD HH:mm')}</Descriptions.Item>
      </Descriptions>

      {(agentAssignees.length > 0 || humanAssignees.length > 0) && (
        <>
          {sectionTitle('执行者')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {agentAssignees.map((a: any) => (
              <Tag key={`agent-${a.id}`} color="green" style={{ borderRadius: 4 }}>Agent #{a.id}</Tag>
            ))}
            {humanAssignees.map((a: any) => (
              <Tag key={`human-${a.id}`} style={{ borderRadius: 4 }}>用户 #{a.id}</Tag>
            ))}
          </div>
        </>
      )}

      {subtaskTotal > 0 && (
        <>
          {sectionTitle('子任务进度')}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 6, background: '#2b2d31', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round((subtaskDone / subtaskTotal) * 100)}%`,
                height: '100%', background: '#00b96b',
              }} />
            </div>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>{subtaskDone}/{subtaskTotal}</span>
          </div>
        </>
      )}

      {sectionTitle('共享上下文')}
      {sharedCtx.length === 0 ? (
        <div style={{ fontSize: 12, color: '#595959' }}>暂无共享上下文</div>
      ) : (
        sharedCtx.map(entry => (
          <div key={entry.id} style={{ marginBottom: 10, padding: '8px 10px', background: '#1e1f23', borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: '#69b1ff', fontFamily: 'SFMono-Regular, Consolas, monospace' }}>{entry.key}</div>
            <div style={{
              fontSize: 12, color: '#b8b8b8', marginTop: 4,
              maxHeight: 72, overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {entry.value}
            </div>
            <div style={{ fontSize: 11, color: '#595959', marginTop: 4 }}>
              {entry.author_agent_name || entry.author_user_name || ''} · {dayjs(entry.updated_at).format('HH:mm')}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default ConsoleInfoPanel
