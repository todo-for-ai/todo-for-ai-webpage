/**
 * 像素皮肤（色板）系统 —— 单一事实源
 *
 * 色板定义 + 应用逻辑集中在这里，供 PaletteSwitcher（AppLayout 内）
 * 与 Login 等公开页（AppLayout 外）共同使用。
 *
 * 持久化两层：
 * - localStorage（key: px-palette）：即时生效 + 未登录可用
 * - 服务端 user-settings.theme：到人级别，登录后跨设备跟随
 *   （同步逻辑在 PaletteSwitcher，公开页只走 localStorage 快路径）
 */

export const STORAGE_KEY = 'px-palette'

export interface PaletteDef {
  id: string
  name: string
  swatch: string
  vars: Record<string, string>
}

export const PALETTES: PaletteDef[] = [
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
      '--mario-white': '#c5d96b',
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

export function getPalette(id: string | null | undefined): PaletteDef {
  return PALETTES.find((p) => p.id === id) || PALETTES[0]
}

export function readSavedPaletteId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'sky'
  } catch {
    return 'sky'
  }
}

export function savePaletteId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // localStorage 不可用时仅本次会话生效
  }
}

/** 把指定色板写到 documentElement 的 --mario-* 变量（先清后设，避免残留） */
export function applyPalette(id: string): void {
  const palette = getPalette(id)
  const rootStyle = document.documentElement.style
  PALETTES.forEach((p) =>
    Object.keys(p.vars).forEach((k) => rootStyle.removeProperty(k)),
  )
  if (palette.id !== 'sky') {
    Object.entries(palette.vars).forEach(([k, v]) => rootStyle.setProperty(k, v))
  }
}

/** 读取 localStorage 已存皮肤并应用（供 AppLayout 外的页面如 Login 使用） */
export function applySavedPalette(): void {
  applyPalette(readSavedPaletteId())
}
