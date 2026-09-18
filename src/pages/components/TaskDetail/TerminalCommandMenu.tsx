import React from 'react'
import type { TerminalCommandMenuState } from '../../../hooks/useTerminalSend'
import { CONSOLE_POP_CSS } from '../../console/consoleTheme'

const PALETTES = {
  console: {
    bg: '#1e1f23', border: '#2b2d31', text: '#d9d9d9', muted: '#8c8c8c',
    activeBg: 'rgba(0, 185, 107, 0.14)', activeText: '#00b96b', cmd: '#69b1ff',
  },
  card: {
    bg: '#fff', border: '#f0f0f0', text: '#444', muted: '#999',
    activeBg: 'rgba(82, 196, 26, 0.12)', activeText: '#389e0d', cmd: '#1668dc',
  },
} as const

interface TerminalCommandMenuProps {
  menu: TerminalCommandMenuState
  /** console=工作台深色；card=任务详情卡片浅色 */
  theme?: keyof typeof PALETTES
  /** 触发选中（含点击） */
  testIdPrefix?: string
}

/**
 * 斜杠命令补全菜单（终端惯例：悬到输入框上方）。
 * 键位（↑↓ 选择 / Enter·Tab 选中 / Esc 关闭）由 useTerminalSend.handleInputKeyDown 统一处理。
 */
export const TerminalCommandMenu: React.FC<TerminalCommandMenuProps> = ({
  menu,
  theme = 'console',
  testIdPrefix = 'terminal-cmd-menu',
}) => {
  if (!menu.open || menu.items.length === 0) return null
  const c = PALETTES[theme]
  return (
    <div
      data-testid={testIdPrefix}
      className="console-pop"
      style={{
        position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, minWidth: 280, zIndex: 30,
        background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.35)', padding: 4, overflow: 'hidden',
        transformOrigin: 'bottom left',
      }}
    >
      {/* 卡片终端（非 .tfai-console 作用域）也要有入场动画，随菜单挂载一次 */}
      <style>{CONSOLE_POP_CSS}</style>
      {menu.items.map((item, i) => {
        const active = i === menu.index
        return (
          <div
            key={item.name}
            data-testid={`${testIdPrefix}-item-${item.name}`}
            onMouseEnter={() => menu.setIndex(i)}
            onMouseDown={(e) => {
              // mousedown 先于 blur，避免输入框失焦吞掉点击
              e.preventDefault()
              menu.pick(item)
            }}
            style={{
              display: 'flex', gap: 10, alignItems: 'baseline',
              padding: '5px 10px', borderRadius: 4, cursor: 'pointer',
              background: active ? c.activeBg : 'transparent',
            }}
          >
            <span style={{ fontFamily: 'SFMono-Regular, Consolas, Menlo, monospace', color: active ? c.activeText : c.cmd, fontWeight: 600, fontSize: 12.5 }}>
              /{item.name}
            </span>
            <span style={{ color: active ? c.text : c.muted, fontSize: 12 }}>{item.desc}</span>
          </div>
        )
      })}
    </div>
  )
}

export default TerminalCommandMenu
