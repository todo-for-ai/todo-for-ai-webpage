/**
 * 像素皮肤（主题）系统 —— 单一事实源
 *
 * 设计原则（对齐主流主题系统的做法）：
 * 1. 不凭空造色：除品牌色外，每个主题都映射自经过时间检验的配色方案
 *    （Dracula / Nord / Gruvbox / Tokyo Night / Catppuccin / Solarized /
 *    Flexoki / Rosé Pine / Everforest / Kanagawa / One / GitHub 等）。
 * 2. 角色化槽位：所有主题共用同一组 CSS 变量——
 *    sky=页面底色 / white=面板底色 / black=墨色（描边+文字，暗色主题取浅色）
 *    red=危险 / gold(+dark)=主按钮金 / green=成功 / blue=信息。
 * 3. 对比度纪律：全部主题经 WCAG 相对亮度公式程序化验证
 *    （墨色/面板 ≥4.5、墨色/页底 ≥4.5、金底文字 ≥4.5、功能色/面板 ≥3），
 *    验证脚本见仓库 scripts/validate_palettes.py。
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

/** [sky, white(面板), black(墨), red, gold, goldDark, green, blue] */
type Vars = [string, string, string, string, string, string, string, string]

/** 皮肤分组（展示顺序即数组顺序） */
export const PALETTE_GROUPS = [
  '马里奥经典',
  '经典暗色',
  '经典浅色',
  '复古终端',
  '柔和粉彩',
  '黑白极简',
] as const

/** 暗色主题专用覆盖：金底文字用主题底色、表格悬停用浅白叠加 */
const darkExtra = (bg: string): Record<string, string> => ({
  '--px-on-gold': bg,
  '--px-row-hover': 'rgba(255, 255, 255, 0.08)',
})

function def(
  id: string,
  name: string,
  group: string,
  swatch: string,
  v: Vars,
  extra?: Record<string, string>,
): PaletteDef {
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

export const PALETTES: PaletteDef[] = [
  // ── 马里奥经典（品牌色系，保留） ──
  def('sky', '天空蓝（默认）', '马里奥经典', '#5c94fc', ['#5c94fc', '#fcfcfc', '#000000', '#d82800', '#f8b800', '#ac7c00', '#00a800', '#0058f8']),
  def('fc', 'FC 灰紫', '马里奥经典', '#b8aedb', ['#b8aedb', '#efeaf8', '#2a2140', '#d95763', '#e0a84e', '#b9823a', '#5d8a4a', '#6f7bd1']),
  def('gameboy', '复古掌机绿', '马里奥经典', '#8bac0f', ['#8bac0f', '#c5d96b', '#0f380f', '#306230', '#306230', '#0f380f', '#306230', '#0f380f'], { '--px-on-gold': '#ffffff' }),
  def('gba', '掌机纸蓝', '马里奥经典', '#b6c8e8', ['#b6c8e8', '#eef4ff', '#1c2b4a', '#c04a42', '#b8860b', '#8a6508', '#3f7d4a', '#3a5fa8'], { '--px-on-gold': '#141414' }),

  // ── 经典暗色（映射自著名配色方案） ──
  def('dracula', '德古拉 Dracula', '经典暗色', '#282a36', ['#282a36', '#343746', '#f8f8f2', '#ff5555', '#f1fa8c', '#b8b34a', '#50fa7b', '#8be9fd'], darkExtra('#282a36')),
  def('tokyonight', '东京夜 Tokyo Night', '经典暗色', '#1a1b26', ['#1a1b26', '#24283b', '#c0caf5', '#f7768e', '#e0af68', '#a8813f', '#9ece6a', '#7aa2f7'], darkExtra('#1a1b26')),
  def('nord', '极地夜 Nord', '经典暗色', '#2e3440', ['#2e3440', '#3b4252', '#eceff4', '#c97a82', '#ebcb8b', '#b09a5f', '#a3be8c', '#81a1c1'], darkExtra('#2e3440')),
  def('gruvbox-dark', 'Gruvbox 暖褐', '经典暗色', '#282828', ['#282828', '#3c3836', '#ebdbb2', '#fb4934', '#fabd2f', '#c79a1a', '#b8bb26', '#83a598'], darkExtra('#282828')),
  def('onedark', 'One Dark', '经典暗色', '#282c34', ['#282c34', '#2f343d', '#abb2bf', '#e06c75', '#e5c07b', '#a8893d', '#98c379', '#61afef'], darkExtra('#282c34')),
  def('catppuccin-mocha', '卡布奇诺·摩卡', '经典暗色', '#1e1e2e', ['#1e1e2e', '#313244', '#cdd6f4', '#f38ba8', '#f9e2af', '#bfa66a', '#a6e3a1', '#89b4fa'], darkExtra('#1e1e2e')),
  def('catppuccin-macchiato', '卡布奇诺·玛奇朵', '经典暗色', '#24273a', ['#24273a', '#363a4f', '#cad3f5', '#ed8796', '#eed49f', '#bfa575', '#a6da95', '#8aadf4'], darkExtra('#24273a')),
  def('catppuccin-frappe', '卡布奇诺·弗雷', '经典暗色', '#303446', ['#303446', '#414559', '#c6d0f5', '#e78284', '#e5c890', '#b3a271', '#a6d189', '#8caaee'], darkExtra('#303446')),
  def('rosepine', '玫瑰松 Rosé Pine', '经典暗色', '#191724', ['#191724', '#1f1d2e', '#e0def4', '#eb6f92', '#f6c177', '#c49a5a', '#9ccfd8', '#3e8fb0'], darkExtra('#191724')),
  def('everforest', '常青林 Everforest', '经典暗色', '#2d353b', ['#2d353b', '#343f44', '#d3c6aa', '#e67e80', '#dbbc7f', '#a99055', '#a7c080', '#7fbbb3'], darkExtra('#2d353b')),
  def('kanagawa', '神奈川 Kanagawa', '经典暗色', '#1f1f28', ['#1f1f28', '#2a2a37', '#dcd7ba', '#e46376', '#c0a36e', '#8a7350', '#98bb6c', '#7e9cd8'], darkExtra('#1f1f28')),
  def('github-dark', 'GitHub 夜', '经典暗色', '#0d1117', ['#0d1117', '#161b22', '#c9d1d9', '#f85149', '#d29922', '#96691a', '#3fb950', '#58a6ff'], darkExtra('#0d1117')),

  // ── 经典浅色（映射自著名配色方案） ──
  def('solarized-light', '日光纸 Solarized Light', '经典浅色', '#eee8d5', ['#eee8d5', '#fdf6e3', '#073642', '#dc322f', '#b58900', '#8a6900', '#7a8d00', '#268bd2'], { '--px-on-gold': '#141414' }),
  def('catppuccin-latte', '卡布奇诺·拿铁', '经典浅色', '#eff1f5', ['#e6e9ef', '#eff1f5', '#4c4f69', '#d20f39', '#df8e1d', '#a86c12', '#3b9328', '#1e66f5'], { '--px-on-gold': '#141414' }),
  def('gruvbox-light', 'Gruvbox 米黄', '经典浅色', '#ebdbb2', ['#ebdbb2', '#fbf1c7', '#3c3836', '#cc241d', '#b57614', '#8a5a10', '#8c8b18', '#076678'], { '--px-on-gold': '#141414' }),
  def('flexoki-light', 'Flexoki 纸墨', '经典浅色', '#f2f0e5', ['#f2f0e5', '#fffcf0', '#100f0c', '#af3029', '#ad8301', '#845f00', '#66800b', '#205ea6']),
  def('github-light', 'GitHub 昼', '经典浅色', '#f6f8fa', ['#f6f8fa', '#ffffff', '#24292f', '#cf222e', '#bf8700', '#8a6100', '#1a7f37', '#0969da']),
  def('nord-light', '极地昼 Nord Light', '经典浅色', '#d8dee9', ['#d8dee9', '#eceff4', '#2e3440', '#9b3d46', '#8f7832', '#6f5c26', '#5a7d46', '#5e81ac'], { '--px-on-gold': '#000000' }),
  def('rosepine-dawn', '玫瑰松·晨 Dawn', '经典浅色', '#faf4ed', ['#faf4ed', '#fffaf3', '#575279', '#b4637a', '#ea9d34', '#b5771f', '#286983', '#56949f'], { '--px-on-gold': '#141414' }),
  def('onelight', 'One Light', '经典浅色', '#fafafa', ['#fafafa', '#ffffff', '#383a42', '#e45649', '#c18401', '#96690b', '#50a14f', '#4078f2'], { '--px-on-gold': '#141414' }),

  // ── 复古终端 ──
  def('phosphor-green', '磷光绿终端', '复古终端', '#0a2313', ['#03140b', '#0a2313', '#8af7b0', '#ff6b6b', '#ffd166', '#c7a53c', '#4ae07a', '#57d9e8'], darkExtra('#03140b')),
  def('phosphor-amber', '琥珀终端', '复古终端', '#241a04', ['#140f02', '#241a04', '#ffc97a', '#ff7a5c', '#ffb000', '#b57c00', '#b8c96a', '#e0a050'], darkExtra('#140f02')),
  def('pico8', '幻想主机 PICO-8', '复古终端', '#1d2b53', ['#1d2b53', '#2c3a66', '#fff1e8', '#ff2969', '#ffa300', '#c27a00', '#00e436', '#29adff'], darkExtra('#1d2b53')),
  def('solarized-dark', '日光暗 Solarized Dark', '复古终端', '#002b36', ['#002b36', '#073642', '#93a1a1', '#ec5f67', '#d2b036', '#9c852a', '#9bb556', '#4f9fc4'], darkExtra('#002b36')),

  // ── 柔和粉彩 ──
  def('horizon', '地平线 Horizon', '柔和粉彩', '#1c1e26', ['#1c1e26', '#2a2c3a', '#d5d8da', '#e95678', '#fab795', '#c98a6b', '#29d398', '#26bbd9'], darkExtra('#1c1e26')),
  def('seafoam', '海雾', '柔和粉彩', '#dcebe9', ['#dcebe9', '#f0f7f6', '#1f4a44', '#a8504c', '#96742f', '#715621', '#3f6f55', '#38697a'], { '--px-on-gold': '#000000' }),
  def('cream', '麦芽糖', '柔和粉彩', '#f5eede', ['#f5eede', '#fbf6ea', '#4a3f2e', '#a34a38', '#a07a24', '#7a5c1a', '#5f7a3a', '#40708a'], { '--px-on-gold': '#141414' }),
  def('slate', '青灰', '柔和粉彩', '#dfe5ea', ['#dfe5ea', '#f2f5f7', '#25313a', '#a04a4a', '#8a6c28', '#68511e', '#42725a', '#356480'], { '--px-on-gold': '#ffffff' }),

  // ── 黑白极简 ──
  def('mono', '黑白像素', '黑白极简', '#f2f2f2', ['#f2f2f2', '#ffffff', '#111111', '#c62828', '#2b2b2b', '#111111', '#2e7d32', '#1565c0'], { '--px-on-gold': '#ffffff' }),
  def('newsprint', '新闻纸', '黑白极简', '#e8e4da', ['#e8e4da', '#f7f4ec', '#26231c', '#9c3a2a', '#7a6222', '#5c4a1a', '#4f6a35', '#3a6285'], { '--px-on-gold': '#ffffff' }),
  def('blueprint', '蓝图', '黑白极简', '#1e3a5f', ['#1e3a5f', '#2c5078', '#d0e4ff', '#ff8080', '#f5c86e', '#b8934a', '#6ac093', '#a0d4ff'], darkExtra('#1e3a5f')),
  def('terracotta', '陶土', '黑白极简', '#e8d5c4', ['#e8d5c4', '#f8ede0', '#4a2c1a', '#a84a32', '#ad7422', '#825416', '#5f7036', '#4a6a80'], { '--px-on-gold': '#141414' }),
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
