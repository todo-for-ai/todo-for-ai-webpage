/**
 * PaletteSwitcher —— 像素色板切换器（右下角悬浮）
 *
 * 三套内置色板（天空蓝 / FC 灰紫 / Game Boy 绿）实时切换：
 * 直接在 documentElement 上写入 --mario-* CSS 变量（覆盖 pixel-theme.css
 * 的 :root 定义），并持久化到 localStorage（key: px-palette）。
 * 全站所有使用 var(--mario-*) 的元素（含 AppLayout 的 --px-sky）即时跟随。
 */
import { useEffect, useState } from 'react'
import { Tooltip } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'

const STORAGE_KEY = 'px-palette'

interface PaletteDef {
  id: string
  name: string
  swatch: string
  vars: Record<string, string>
}

const PALETTES: PaletteDef[] = [
  {
    id: 'sky',
    name: '天空蓝（默认）',
    swatch: '#5c94fc',
    vars: {},
  },
  {
    id: 'fc',
    name: 'FC 灰紫',
    swatch: '#b8aedb',
    vars: {
      '--mario-sky': '#b8aedb',
      '--mario-white': '#efeaf8',
      '--mario-black': '#2a2140',
      '--mario-red': '#d95763',
      '--mario-gold': '#e0a84e',
      '--mario-gold-dark': '#b9823a',
      '--mario-green': '#7bb661',
      '--mario-blue': '#6f7bd1',
      '--px-ink': '#2a2140',
    },
  },
  {
    id: 'gameboy',
    name: 'Game Boy 绿',
    swatch: '#8bac0f',
    vars: {
      '--mario-sky': '#8bac0f',
      '--mario-white': '#9bbc0f',
      '--mario-black': '#0f380f',
      '--mario-red': '#306230',
      '--mario-gold': '#306230',
      '--mario-gold-dark': '#0f380f',
      '--mario-green': '#306230',
      '--mario-blue': '#0f380f',
      '--px-ink': '#0f380f',
    },
  },
]

/** 读取 localStorage 已存色板并应用（供 AppLayout 外的页面如 Login 使用） */
export function applySavedPalette(): void {
  let id = 'sky'
  try {
    id = localStorage.getItem(STORAGE_KEY) || 'sky'
  } catch {
    return
  }
  const palette = PALETTES.find((p) => p.id === id)
  const rootStyle = document.documentElement.style
  PALETTES.forEach((p) =>
    Object.keys(p.vars).forEach((k) => rootStyle.removeProperty(k)),
  )
  if (palette && palette.id !== 'sky') {
    Object.entries(palette.vars).forEach(([k, v]) => rootStyle.setProperty(k, v))
  }
}

export function PaletteSwitcher() {
  const [current, setCurrent] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'sky'
    } catch {
      return 'sky'
    }
  })

  useEffect(() => {
    const palette = PALETTES.find((p) => p.id === current)
    const rootStyle = document.documentElement.style
    // 先清掉上一个色板写入的变量，再应用当前色板
    PALETTES.forEach((p) =>
      Object.keys(p.vars).forEach((k) => rootStyle.removeProperty(k)),
    )
    if (palette && palette.id !== 'sky') {
      Object.entries(palette.vars).forEach(([k, v]) => rootStyle.setProperty(k, v))
    }
  }, [current])

  const select = (id: string) => {
    setCurrent(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // localStorage 不可用时仅本次会话生效
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 14,
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px',
        background: '#1f1f1f',
        border: '2px solid #000',
        boxShadow: '2px 2px 0 #000',
      }}
      title="像素色板"
    >
      <BgColorsOutlined style={{ color: '#ffe28a', fontSize: 13 }} />
      {PALETTES.map((p) => (
        <Tooltip key={p.id} title={p.name}>
          <button
            aria-label={p.name}
            onClick={() => select(p.id)}
            style={{
              width: 18,
              height: 18,
              cursor: 'pointer',
              background: p.swatch,
              border: current === p.id ? '2px solid #ffe28a' : '2px solid #000',
              padding: 0,
            }}
          />
        </Tooltip>
      ))}
    </div>
  )
}

export default PaletteSwitcher
