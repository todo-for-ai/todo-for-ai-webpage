import React from 'react'
import { CONSOLE_TOKENS as T, CONSOLE_MONO } from './consoleTheme'

interface ConsoleShortcutsOverlayProps {
  open: boolean
  onClose: () => void
}

const GROUPS: Array<{ title: string; items: Array<[string, string]> }> = [
  {
    title: '全局',
    items: [
      ['⌘K / Ctrl+K', '快速切换任务'],
      ['?', '打开/关闭快捷键帮助'],
      ['Esc', '关闭浮层'],
    ],
  },
  {
    title: '输入',
    items: [
      ['Enter', '发送'],
      ['Shift+Enter', '换行'],
      ['↑ / ↓', '召回输入历史（光标在首/末行时）'],
      ['/', '唤出命令补全（↑↓ 选择，Enter 执行，Esc 关闭）'],
    ],
  },
  {
    title: '执行中',
    items: [
      ['Esc · Esc', '两段式中断当前执行'],
      ['/stop', '中断当前执行'],
    ],
  },
  {
    title: '视图',
    items: [
      ['/clear', '清空当前视图（不影响服务端记录）'],
      ['/help', '显示命令列表'],
      ['右上角图标', '复制 / 下载会话转录（Markdown）'],
    ],
  },
]

/**
 * 快捷键帮助浮层（? 唤起）：自绘弹层，与 ⌘K 切换器同款风格。
 */
export const ConsoleShortcutsOverlay: React.FC<ConsoleShortcutsOverlayProps> = ({
  open, onClose,
}) => {
  if (!open) return null
  return (
    <div
      data-testid="console-shortcuts-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 210,
        background: 'rgba(0,0,0,0.55)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        data-testid="console-shortcuts"
        onClick={e => e.stopPropagation()}
        style={{
          width: 520, maxWidth: '92vw', maxHeight: '78vh', overflowY: 'auto',
          background: T.bgPanel, border: `1px solid ${T.border}`, borderRadius: 8,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)', padding: '18px 22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, flex: 1 }}>键盘快捷键</span>
          <span style={{ fontSize: 12, color: T.textFaint, fontFamily: CONSOLE_MONO }}>Esc 关闭</span>
        </div>
        {GROUPS.map(group => (
          <div key={group.title} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: T.accent, fontFamily: CONSOLE_MONO, marginBottom: 6 }}>
              {group.title}
            </div>
            {group.items.map(([keys, desc]) => (
              <div key={keys} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '3px 0' }}>
                <kbd
                  data-testid="console-shortcut-key"
                  style={{
                    flexShrink: 0, minWidth: 96, textAlign: 'center', boxSizing: 'border-box',
                    background: T.bgField, border: `1px solid ${T.border}`, borderRadius: 4,
                    color: T.textPrimary, fontFamily: CONSOLE_MONO, fontSize: 12,
                    padding: '2px 8px',
                  }}
                >
                  {keys}
                </kbd>
                <span style={{ fontSize: 13, color: T.textSecondary }}>{desc}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ConsoleShortcutsOverlay
