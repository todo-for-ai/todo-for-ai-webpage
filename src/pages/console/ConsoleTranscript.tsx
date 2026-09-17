import React, { useMemo } from 'react'
import { Button } from 'antd'
import { VerticalAlignBottomOutlined } from '@ant-design/icons'
import { useAgentTimeline } from '../../hooks/useAgentTimeline'
import type { TerminalLine } from '../components/TaskDetail/agentTerminalCore'
import { MarkdownEditor } from '../../components/MarkdownEditor'
import { splitAttemptSegments } from './consoleData'
import ConsoleComposer from './ConsoleComposer'

const MONO = 'SFMono-Regular, Consolas, Menlo, monospace'

interface ConsoleTranscriptProps {
  task: any
  running: boolean
  onStopped?: () => void
  onActivity?: () => void
}

/** Agent 聊天消息（TaskLog）→ Markdown 块；运行事件原始输出 → 等宽文本 */
const LineBody: React.FC<{ line: TerminalLine }> = ({ line }) => {
  if (line.kind === 'user') {
    return (
      <div style={{ display: 'flex', gap: 10, margin: '10px 0' }} data-testid="console-user-line">
        <span style={{ color: '#00b96b', fontWeight: 700, fontFamily: MONO, flexShrink: 0 }}>❯</span>
        <div style={{
          flex: 1, color: '#e8e8e8', fontSize: 14, lineHeight: '22px',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {line.text}
        </div>
      </div>
    )
  }
  if (line.kind === 'agent' && line.source === 'chat') {
    return (
      <div style={{ display: 'flex', gap: 10, margin: '10px 0' }} data-testid="console-agent-message">
        <span style={{ color: '#1668dc', flexShrink: 0, lineHeight: '22px' }}>⏺</span>
        <div className="console-markdown" style={{ flex: 1, minWidth: 0, color: '#d9d9d9', fontSize: 14 }}>
          <MarkdownEditor value={line.text} readOnly hideToolbar autoHeight />
        </div>
      </div>
    )
  }
  if (line.kind === 'agent' || line.kind === 'progress') {
    const isProgress = line.kind === 'progress'
    return (
      <div style={{ display: 'flex', gap: 10, margin: '2px 0' }}>
        <span style={{ color: isProgress ? '#69b1ff' : '#8c8c8c', fontFamily: MONO, flexShrink: 0 }}>
          {isProgress ? '·' : '⏺'}
        </span>
        <span style={{
          flex: 1, minWidth: 0, color: isProgress ? '#69b1ff' : '#b8b8b8',
          fontFamily: MONO, fontSize: 12.5, lineHeight: '19px',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {line.text}
        </span>
      </div>
    )
  }
  if (line.kind === 'error') {
    return (
      <div style={{ display: 'flex', gap: 10, margin: '6px 0' }}>
        <span style={{ color: '#ff7875', fontFamily: MONO }}>✗</span>
        <span style={{ flex: 1, color: '#ff7875', fontFamily: MONO, fontSize: 12.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {line.text}
        </span>
      </div>
    )
  }
  if (line.kind === 'status' && line.text !== '开始执行') {
    // 开始执行由 Iteration 分隔条呈现，其余状态渲染成居中小徽章
    const color = line.text === '已中断' ? '#faad14' : '#52c41a'
    return (
      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <span style={{
          color, border: `1px solid ${color}55`, borderRadius: 4,
          padding: '1px 10px', fontSize: 12, fontFamily: MONO,
        }}>
          {line.text === '执行完成' ? '✓ ' : '■ '}{line.text}
        </span>
      </div>
    )
  }
  // 系统/跳过的行
  return (
    <div style={{ color: '#8c8c8c', fontStyle: 'italic', fontSize: 13, margin: '4px 0' }}>○ {line.text}</div>
  )
}

/**
 * Console 会话主区：完整时间线（对话 + 运行事件）按执行轮次分代渲染，
 * Iteration 分隔条对应每轮 attempt；底部为指令区（ConsoleComposer）。
 */
export const ConsoleTranscript: React.FC<ConsoleTranscriptProps> = ({
  task,
  running,
  onStopped,
  onActivity,
}) => {
  const timeline = useAgentTimeline(task?.id ?? null)
  const { lines, atBottom, scrollRef, handleScroll, scrollToBottom } = timeline

  const segments = useMemo(() => splitAttemptSegments(lines), [lines])
  const isEmpty = lines.length === 0

  if (!task) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        data-testid="console-transcript"
        style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: 0 }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {isEmpty ? (
            <div style={{ color: '#666', textAlign: 'center', paddingTop: 80 }}>
              <div style={{ fontSize: 22, color: '#fa8c16' }}>✻</div>
              <div style={{ marginTop: 10, fontSize: 15 }}>开始与 Agent 协作</div>
              <div style={{ marginTop: 6, fontSize: 13 }}>
                在下方输入任务指令，Agent 执行时输出会实时滚动在这里。
              </div>
            </div>
          ) : (
            segments.map(seg => (
              <div key={seg.key}>
                {seg.label && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    margin: '18px 0 8px', color: '#8c8c8c', fontSize: 12,
                  }} data-testid="console-iteration">
                    <span style={{ flex: 1, height: 1, background: '#2b2d31' }} />
                    <span>{seg.label}</span>
                    <span style={{ flex: 1, height: 1, background: '#2b2d31' }} />
                  </div>
                )}
                {seg.lines.map(line => <LineBody key={line.key} line={line} />)}
              </div>
            ))
          )}
        </div>
      </div>

      {!atBottom && (
        <div style={{ textAlign: 'center', marginTop: -36, marginBottom: 4 }}>
          <Button size="small" icon={<VerticalAlignBottomOutlined />} onClick={scrollToBottom} style={{ background: '#232428', borderColor: '#2b2d31' }}>
            回到底部
          </Button>
        </div>
      )}

      <ConsoleComposer
        task={task}
        running={running}
        timeline={timeline}
        onActivity={onActivity}
        onStopped={onStopped}
      />
    </div>
  )
}

export default ConsoleTranscript
