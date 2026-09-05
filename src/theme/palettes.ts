/**
 * 像素皮肤（色板）系统 —— 单一事实源
 *
 * 40+ 内置皮肤按风格分组，供 PaletteSwitcher（AppLayout 内）与 Login 等
 * 公开页（AppLayout 外）共同使用。所有皮肤共用同一组 CSS 变量槽位：
 *   sky=页面底色 / white=面板底色 / black=描边+文字色（暗色皮肤用浅色）
 *   red=危险 / gold(+dark)=主按钮金 / green=成功 / blue=信息
 *
 * 持久化两层：
 * - localStorage（key: px-palette）：即时生效 + 未登录可用
 * - 服务端 user-settings.theme：到人级别，登录后跨设备跟随
 */
import '../styles/palette-dark-compat.css'

export const STORAGE_KEY = 'px-palette'

export interface PaletteDef {
  id: string
  name: string
  group: string
  swatch: string
  vars: Record<string, string>
}

/** [sky, white, black(ink), red, gold, goldDark, green, blue] */
type Vars = [string, string, string, string, string, string, string, string]

/** 皮肤分组（展示顺序即数组顺序） */
export const PALETTE_GROUPS = [
  '经典游戏',
  '马里奥系列',
  '冷色调',
  '暖色调',
  '自然风光',
  '暗色夜战',
  '粉彩糖果',
  '黑白极简',
] as const

function def(id: string, name: string, group: string, swatch: string, v: Vars, extra?: Record<string, string>): PaletteDef {
  return {
    id,
    name,
    group,
    swatch,
    vars: {
      '--mario-sky': v[0],
      '--mario-white': v[1],
      '--mario-black': v[2],
      '--mario-red': v[3],
      '--mario-gold': v[4],
      '--mario-gold-dark': v[5],
      '--mario-green': v[6],
      '--mario-blue': v[7],
      '--px-ink': v[2],
      ...extra,
    },
  }
}

/** 暗色皮肤专用覆盖：金底文字用深色、表格悬停用浅白叠加（见 palette-dark-compat.css） */
const DARK_EXTRA = {
  '--px-on-gold': '#141414',
  '--px-row-hover': 'rgba(255, 255, 255, 0.12)',
}

export const PALETTES: PaletteDef[] = [
  // ── 经典游戏 ──
  def('sky', '天空蓝（默认）', '经典游戏', '#5c94fc', ['#5c94fc', '#fcfcfc', '#000000', '#d82800', '#f8b800', '#ac7c00', '#00a800', '#0058f8']),
  def('fc', 'FC 灰紫', '经典游戏', '#b8aedb', ['#b8aedb', '#efeaf8', '#2a2140', '#d95763', '#e0a84e', '#b9823a', '#7bb661', '#6f7bd1']),
  def('gameboy', '复古掌机绿', '经典游戏', '#8bac0f', ['#8bac0f', '#c5d96b', '#0f380f', '#306230', '#306230', '#0f380f', '#306230', '#0f380f']),
  def('gba', '掌机彩壳', '经典游戏', '#a8c8f8', ['#a8c8f8', '#eef4ff', '#1c2b4a', '#e4574f', '#f0a840', '#c07820', '#58b868', '#3f6fd8']),
  def('virtualboy', '虚拟男孩', '经典游戏', '#2e0d0d', ['#1a0505', '#2e0d0d', '#ff6b6b', '#ff2020', '#ff8050', '#c85030', '#a03030', '#802020'], DARK_EXTRA),
  def('arcade', '街机荧幕', '经典游戏', '#0d1b1e', ['#0d1b1e', '#12262b', '#7ef0ff', '#ff4757', '#ffd32a', '#d9a410', '#2ed573', '#18dcff'], DARK_EXTRA),
  def('pico8', '幻想主机', '经典游戏', '#29adff', ['#29adff', '#fff1e8', '#1d2b53', '#ff004d', '#ffa300', '#ab5236', '#00e436', '#7e2553']),
  def('solarized', '日光纸', '经典游戏', '#eee8d5', ['#eee8d5', '#fdf6e3', '#073642', '#dc322f', '#b58900', '#8a6a00', '#2aa198', '#268bd2']),

  // ── 马里奥系列 ──
  def('mario-red', '水管工红', '马里奥系列', '#e8503a', ['#e8503a', '#fff4ef', '#3a0f06', '#b71c0c', '#f8b800', '#ac7c00', '#00a800', '#0058f8']),
  def('luigi', '路易吉绿', '马里奥系列', '#4caf50', ['#4caf50', '#f0fff4', '#0a2f12', '#d82800', '#f8b800', '#ac7c00', '#1b5e20', '#0058f8']),
  def('peach', '碧奇粉', '马里奥系列', '#ffa8c5', ['#ffa8c5', '#fff0f5', '#4a0e25', '#d81b60', '#f8b800', '#ac7c00', '#4caf50', '#3f6fd8']),
  def('coin', '金币国', '马里奥系列', '#f0b429', ['#f0b429', '#fff9e6', '#4a3200', '#d82800', '#e08e0b', '#9c6a08', '#2e7d32', '#0277bd']),
  def('yoshi', '耀西蛋', '马里奥系列', '#8fd460', ['#8fd460', '#f6ffe8', '#1f3a0d', '#e53935', '#fdd835', '#9e9d24', '#558b2f', '#00897b']),
  def('iceflower', '冰花蓝', '马里奥系列', '#a8d8f0', ['#a8d8f0', '#f0faff', '#0d3a52', '#d95763', '#7fd4f0', '#3a9cb8', '#4dd0e1', '#0288d1']),

  // ── 冷色调 ──
  def('arctic', '北极冰蓝', '冷色调', '#dcedfc', ['#dcedfc', '#ffffff', '#10365c', '#d95763', '#f0a840', '#b97f22', '#58b868', '#2f6fd8']),
  def('deepsea', '深海', '冷色调', '#0b3d5c', ['#0b3d5c', '#10516f', '#cfe8f5', '#ff6b6b', '#ffd166', '#d9a410', '#2eb8a0', '#118ab2'], DARK_EXTRA),
  def('morningfog', '晨雾蓝灰', '冷色调', '#b8c4d0', ['#b8c4d0', '#eef2f6', '#26303a', '#d95763', '#c9a227', '#96731a', '#5f8a5f', '#4a6d8a']),
  def('steel', '钢青', '冷色调', '#5a7d9a', ['#5a7d9a', '#e8eef4', '#16222e', '#d95763', '#e0a84e', '#a87c2a', '#4a8a6a', '#2a5d8f']),
  def('aurora', '极光青', '冷色调', '#0f3a3a', ['#0f3a3a', '#155052', '#9ef0dc', '#ff6b6b', '#ffd166', '#d9a410', '#34d399', '#22d3ee'], DARK_EXTRA),

  // ── 暖色调 ──
  def('sunset', '落日橙', '暖色调', '#f88f4a', ['#f88f4a', '#fff5ec', '#4a2005', '#e53935', '#f8b800', '#ac7c00', '#43a047', '#1e88e5']),
  def('tomato', '番茄', '暖色调', '#e74c3c', ['#e74c3c', '#fdeeea', '#450a0a', '#b71c0c', '#f8b800', '#a97800', '#388e3c', '#1565c0']),
  def('peachmilk', '蜜桃', '暖色调', '#ffb59e', ['#ffb59e', '#fff3ee', '#4a1508', '#e53935', '#f08a4b', '#b85a20', '#66bb6a', '#5c8ae6']),
  def('caramel', '焦糖', '暖色调', '#c68b4e', ['#c68b4e', '#f7ecdd', '#38200a', '#c0392b', '#e2a63d', '#a5761f', '#6a994e', '#4a7ba6']),
  def('flame', '火焰', '暖色调', '#331105', ['#331105', '#4a2412', '#ffb08a', '#ff3d00', '#ff9100', '#c65e00', '#7cb342', '#e64a19'], DARK_EXTRA),

  // ── 自然风光 ──
  def('forest', '森林', '自然风光', '#2d6a4f', ['#2d6a4f', '#eef6f0', '#143527', '#c0564a', '#d9a441', '#9c742a', '#1b4332', '#2a6f8e']),
  def('olive', '橄榄', '自然风光', '#a3b18a', ['#a3b18a', '#f4f7ee', '#2f3a1f', '#bc4749', '#e0a84e', '#a87c2a', '#588157', '#3d5a80']),
  def('sand', '沙漠', '自然风光', '#e8d5a8', ['#e8d5a8', '#fdf8ec', '#4a3a14', '#c0564a', '#d9a441', '#9c742a', '#8a9a5b', '#6a8dad']),
  def('lagoon', '海洋湖', '自然风光', '#2aa8b8', ['#2aa8b8', '#ecfbfc', '#0a3237', '#e05252', '#f4c542', '#b08c14', '#128f76', '#1265a8']),
  def('sakura', '樱花', '自然风光', '#fbd3e0', ['#fbd3e0', '#fff8fa', '#4d1a2e', '#e05275', '#ddb050', '#a87c3a', '#7fb069', '#7a9ec2']),

  // ── 暗色夜战（面板深底 + 浅色描边文字） ──
  def('midnight', '午夜蓝', '暗色夜战', '#0f1a2e', ['#0f1a2e', '#1c2b47', '#cfe0ff', '#ff6b6b', '#ffd166', '#c99b1a', '#4ade80', '#60a5fa'], DARK_EXTRA),
  def('deepspace', '深空黑', '暗色夜战', '#0d0d12', ['#0d0d12', '#1a1a24', '#d8d8e0', '#ff5c5c', '#f8c53a', '#c79a15', '#5cd65c', '#6a9ef8'], DARK_EXTRA),
  def('carbon', '碳灰', '暗色夜战', '#22262a', ['#22262a', '#31363c', '#dbe0e5', '#ff6b6b', '#e8b04a', '#b5862a', '#6abf8a', '#6a9fd8'], DARK_EXTRA),
  def('nightforest', '暗夜绿', '暗色夜战', '#0c1f14', ['#0c1f14', '#163324', '#b8e6cc', '#ff6b6b', '#d4b83a', '#9c8a1a', '#4ade80', '#55a88a'], DARK_EXTRA),
  def('ember', '余烬', '暗色夜战', '#1a0f0d', ['#1a0f0d', '#2e1b17', '#f0c8b8', '#ff5722', '#ffa726', '#c47500', '#7fa650', '#b06a3f'], DARK_EXTRA),

  // ── 粉彩糖果 ──
  def('mint', '薄荷', '粉彩糖果', '#b8e8d8', ['#b8e8d8', '#f2fcf8', '#0e3d2c', '#e57373', '#e8c568', '#ad8f2f', '#52b788', '#5fa8d3']),
  def('lemon', '柠檬', '粉彩糖果', '#f7eda0', ['#f7eda0', '#fffef2', '#4a4208', '#e57373', '#d9b40a', '#9c8408', '#8bc34a', '#7fb3d5']),
  def('cottoncandy', '棉花糖', '粉彩糖果', '#f8c8dc', ['#f8c8dc', '#fff5f9', '#4a2430', '#e05a7a', '#edb45e', '#b5852f', '#7cc5a0', '#8ab6d6']),
  def('skyday', '晴日浅蓝', '粉彩糖果', '#c8e0f8', ['#c8e0f8', '#f7fbff', '#16324a', '#d95763', '#e8b84a', '#ad852f', '#5aaf7a', '#3f7fc8']),
  def('milktea', '乌龙奶茶', '粉彩糖果', '#d2b48c', ['#d2b48c', '#f8f2e8', '#3d2b1a', '#c05a4a', '#d9a441', '#9c742a', '#8a9a5b', '#7a8aa0']),

  // ── 黑白极简 ──
  def('mono', '黑白像素', '黑白极简', '#f2f2f2', ['#f2f2f2', '#ffffff', '#111111', '#c62828', '#444444', '#222222', '#2e7d32', '#1565c0']),
  def('blueprint', '蓝图', '黑白极简', '#1e3a5f', ['#1e3a5f', '#27496d', '#d0e4ff', '#ff6b6b', '#8fc7ff', '#5f92c4', '#6abf8a', '#8fc7ff'], DARK_EXTRA),
  def('newsprint', '新闻纸', '黑白极简', '#e8e4da', ['#e8e4da', '#f7f4ec', '#26231c', '#b3402e', '#a88a3a', '#75621e', '#5f7a4a', '#4a6d8a']),
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
