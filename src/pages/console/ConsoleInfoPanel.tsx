import React, { useEffect, useState } from 'react'
import { Descriptions, Tag } from 'antd'
import { DownOutlined, RightOutlined, PaperClipOutlined } from '@ant-design/icons'
import { agentsApi, type SharedContextEntry } from '../../api/agents'
import { tasksApi, type TaskAttachment } from '../../api/tasks'
import dayjs from 'dayjs'
import { consoleStatusMeta } from './consoleData'
import { parseTaskDocument } from '../../utils/taskContent'
import { MarkdownEditor } from '../../components/MarkdownEditor'
import { CONSOLE_TOKENS as T, CONSOLE_MONO } from './consoleTheme'

interface ConsoleInfoPanelProps {
  task: any
}

interface SubtaskLite {
  id: number
  title: string
  status: string
}

/**
 * Console 右侧信息面板：任务元信息、任务描述（Markdown 折叠）、执行者、
 * 子任务进度与列表、附件下载、共享上下文（只读）。
 */
export const ConsoleInfoPanel: React.FC<ConsoleInfoPanelProps> = ({ task }) => {
  const [sharedCtx, setSharedCtx] = useState<SharedContextEntry[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [subtasks, setSubtasks] = useState<SubtaskLite[]>([])
  const [descExpanded, setDescExpanded] = useState(false)

  useEffect(() => {
    if (!task?.id) return
    let cancelled = false
    agentsApi.getSharedContext(task.id)
      .then(items => { if (!cancelled) setSharedCtx(Array.isArray(items) ? items : []) })
      .catch(() => { /* 静默 */ })
    tasksApi.getTaskAttachments(task.id)
      .then(items => { if (!cancelled) setAttachments(Array.isArray(items) ? items : []) })
      .catch(() => { if (!cancelled) setAttachments([]) })
    tasksApi.getSubtasks(task.id)
      .then(items => {
        if (cancelled) return
        const arr = Array.isArray(items) ? items : (items as any)?.data || []
        setSubtasks(arr.slice(0, 8))
      })
      .catch(() => { if (!cancelled) setSubtasks([]) })
    return () => { cancelled = true }
  }, [task?.id, task?.updated_at])

  if (!task) return null
  const meta = consoleStatusMeta(task.status)
  const subtaskTotal = task.subtask_count || 0
  const subtaskDone = task.subtask_done_count || 0
  const agentAssignees = (task.assignees || []).filter((a: any) => a.type === 'agent')
  const humanAssignees = (task.assignees || []).filter((a: any) => a.type === 'human')
  // 历史任务 content 可能是 JSON 信封，归一化还原人类正文
  const description = parseTaskDocument(task.content || '').body.trim()

  const sectionTitle = (text: string) => (
    <div style={{ margin: '16px 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 2, height: 11, borderRadius: 1, background: T.accent, display: 'inline-block', opacity: 0.8 }} />
        <span style={{ fontSize: 12, color: T.textMuted, letterSpacing: 1 }}>{text}</span>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '12px 16px', overflowY: 'auto', height: '100%' }} data-testid="console-info-panel">
      <div style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600, marginBottom: 4 }}>任务信息</div>
      <Descriptions column={1} size="small" styles={{ label: { color: T.textMuted }, content: { color: T.textBody } }}>
        <Descriptions.Item label="状态">
          <Tag style={{ marginRight: 0, borderRadius: 4 }} color={task.status === 'in_progress' ? 'green' : task.status === 'done' ? 'blue' : 'default'}>
            <span style={{ color: meta.color }}>{meta.label}</span>
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="优先级">{task.priority}</Descriptions.Item>
        <Descriptions.Item label="创建">{dayjs(task.created_at).format('MM-DD HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="更新">{dayjs(task.updated_at).format('MM-DD HH:mm')}</Descriptions.Item>
      </Descriptions>

      {description && (
        <>
          {sectionTitle('任务描述')}
          <div
            data-testid="console-task-desc"
            style={{
              position: 'relative', fontSize: 12.5, color: T.textSecondary,
              maxHeight: descExpanded ? 'none' : 96, overflow: 'hidden',
              background: T.bgPanelAlt, borderRadius: 6, padding: '8px 10px',
            }}
            className="console-markdown"
          >
            <MarkdownEditor value={description} readOnly hideToolbar autoHeight />
          </div>
          <ButtonLike onClick={() => setDescExpanded(v => !v)} expanded={descExpanded} />
        </>
      )}

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
            <div style={{ flex: 1, height: 6, background: T.bgHover, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round((subtaskDone / subtaskTotal) * 100)}%`,
                height: '100%', background: T.accent,
              }} />
            </div>
            <span style={{ fontSize: 12, color: T.textMuted }}>{subtaskDone}/{subtaskTotal}</span>
          </div>
          {subtasks.length > 0 && (
            <div style={{ marginTop: 8 }} data-testid="console-subtasks">
              {subtasks.map(sub => {
                const subMeta = consoleStatusMeta(sub.status)
                return (
                  <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12 }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: subMeta.color,
                    }} />
                    <span style={{ flex: 1, color: T.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub.title}
                    </span>
                    <span style={{ color: T.textGhost, fontSize: 11 }}>{subMeta.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {attachments.length > 0 && (
        <>
          {sectionTitle('附件')}
          <div data-testid="console-attachments">
            {attachments.map(att => (
              <a
                key={att.id}
                href={tasksApi.getTaskAttachmentDownloadUrl(task.id, att.id)}
                target="_blank"
                rel="noreferrer"
                className="console-attachment"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
                  marginBottom: 4, background: T.bgPanelAlt, borderRadius: 6,
                  color: T.info, fontSize: 12, textDecoration: 'none',
                }}
              >
                <PaperClipOutlined />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {att.original_filename || att.filename}
                </span>
                <span style={{ color: T.textGhost, fontSize: 11, flexShrink: 0 }}>
                  {att.file_size_human || `${Math.ceil((att.file_size || 0) / 1024)}KB`}
                </span>
              </a>
            ))}
          </div>
        </>
      )}

      {sectionTitle('共享上下文')}
      {sharedCtx.length === 0 ? (
        <div style={{ fontSize: 12, color: T.textGhost }}>暂无共享上下文</div>
      ) : (
        sharedCtx.map(entry => (
          <div key={entry.id} style={{ marginBottom: 10, padding: '8px 10px', background: T.bgPanelAlt, borderRadius: 6 }}>
            <div style={{ fontSize: 12, color: T.info, fontFamily: CONSOLE_MONO }}>{entry.key}</div>
            <div style={{
              fontSize: 12, color: T.textSecondary, marginTop: 4,
              maxHeight: 72, overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {entry.value}
            </div>
            <div style={{ fontSize: 11, color: T.textGhost, marginTop: 4 }}>
              {entry.author_agent_name || entry.author_user_name || ''} · {dayjs(entry.updated_at).format('HH:mm')}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

/** 描述展开/收起的小按钮（避免 antd Button 全量样式，保持面板轻量） */
const ButtonLike: React.FC<{ onClick: () => void; expanded: boolean }> = ({ onClick, expanded }) => (
  <div
    onClick={onClick}
    data-testid="console-desc-toggle"
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
      fontSize: 11, color: T.info, marginTop: 4, userSelect: 'none',
    }}
  >
    {expanded ? <DownOutlined /> : <RightOutlined />}
    {expanded ? '收起描述' : '展开完整描述'}
  </div>
)

export default ConsoleInfoPanel
