import React, { useEffect, useMemo, useRef, useState } from 'react'
import { consoleStatusMeta, filterConsoleTasks, relativeTime, type ConsoleTaskLike } from './consoleData'
import { CONSOLE_TOKENS as T, CONSOLE_MONO } from './consoleTheme'

interface ConsoleQuickSwitcherProps {
  open: boolean
  tasks: ConsoleTaskLike[]
  onClose: () => void
  onSelect: (taskId: number) => void
}

/**
 * ⌘K / Ctrl+K 快速任务切换：输入过滤 + 上下键选择 + Enter 打开。
 * 自绘弹层（非 antd Modal）：工作台内样式完全可控，也便于测试。
 */
export const ConsoleQuickSwitcher: React.FC<ConsoleQuickSwitcherProps> = ({
  open, tasks, onClose, onSelect,
}) => {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () => filterConsoleTasks(tasks, query).slice(0, 12),
    [tasks, query]
  )

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      // 等弹层渲染后聚焦
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  if (!open) return null

  const pick = (task?: ConsoleTaskLike) => {
    if (!task) return
    onSelect(task.id)
    onClose()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(filtered[activeIdx])
    }
  }

  return (
    <div
      data-testid="console-switcher-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120,
      }}
    >
      <div
        data-testid="console-switcher"
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, maxWidth: '92vw', background: T.bgPanel,
          border: `1px solid ${T.border}`, borderRadius: 8,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
          onKeyDown={handleInputKeyDown}
          placeholder="切换任务…（↑↓ 选择，Enter 打开，Esc 关闭）"
          data-testid="console-switcher-input"
          style={{
            width: '100%', boxSizing: 'border-box', background: T.bgField,
            border: 'none', outline: 'none', color: T.textPrimary,
            padding: '12px 14px', fontSize: 14, borderRadius: 0,
          }}
        />
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '6px' }}>
          {filtered.length === 0 && (
            <div style={{ color: T.textFaint, fontSize: 13, textAlign: 'center', padding: '18px 0' }}>
              没有匹配的任务
            </div>
          )}
          {filtered.map((task, idx) => {
            const meta = consoleStatusMeta(task.status)
            const active = idx === activeIdx
            return (
              <div
                key={task.id}
                onClick={() => pick(task)}
                onMouseEnter={() => setActiveIdx(idx)}
                data-testid={`console-switcher-item-${task.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                  background: active ? T.bgHover : 'transparent',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: meta.color }} />
                <span style={{ flex: 1, fontSize: 13, color: active ? T.textPrimary : T.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color: T.textGhost, marginRight: 6, fontFamily: CONSOLE_MONO, fontSize: 12 }}>#{task.id}</span>
                  {task.title}
                </span>
                <span style={{ fontSize: 11, color: T.textFaint, flexShrink: 0 }}>{relativeTime(task.updated_at)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ConsoleQuickSwitcher
