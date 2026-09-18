/**
 * Console 工作台设计令牌：颜色、字体、作用域样式。
 * 所有 console 组件从此取值，避免色值/字体串烧；像素皮肤的
 * 全局覆盖（如 mario-theme 的 .ant-btn-primary）在此统一对抗。
 */

export const CONSOLE_TOKENS = {
  accent: '#00b96b',
  accentHover: '#23b888',
  accentDim: '#95de64',
  blue: '#1668dc',
  info: '#69b1ff',
  orange: '#fa8c16',
  amber: '#faad14',
  red: '#ff7875',
  green: '#52c41a',
  textPrimary: '#e8e8e8',
  textBody: '#d9d9d9',
  textSecondary: '#b8b8b8',
  textMuted: '#8c8c8c',
  textFaint: '#666',
  textGhost: '#595959',
  bgPage: '#141517',
  bgPanel: '#1b1c1f',
  bgPanelAlt: '#1e1f23',
  bgField: '#232428',
  bgHover: '#2b2d31',
  border: '#2b2d31',
} as const

export const CONSOLE_MONO = 'SFMono-Regular, Consolas, Menlo, monospace'

/** 像素皮肤（mario-theme.css 全局 .ant-btn-primary 等）会压过 antd 主题 token，
 *  工作台用命名空间规则按皮肤 compat 层同款手法夺回主色（绿）并保持小圆角。 */
export const CONSOLE_SCOPE_CSS = `
.tfai-console .ant-btn.ant-btn-primary { background: ${CONSOLE_TOKENS.accent}; border-color: ${CONSOLE_TOKENS.accent}; }
.tfai-console .ant-btn.ant-btn-primary:not(:disabled):hover { background: ${CONSOLE_TOKENS.accentHover}; border-color: ${CONSOLE_TOKENS.accentHover}; }
.tfai-console .ant-switch.ant-switch-checked { background: ${CONSOLE_TOKENS.accent}; }
.tfai-console .ant-input,
.tfai-console .ant-input textarea { background: transparent; caret-color: ${CONSOLE_TOKENS.accent}; }
.tfai-console .ant-select-selector { background: ${CONSOLE_TOKENS.bgField} !important; }
/* 深色滚动条：默认亮色滚动条在深底上非常突兀 */
.tfai-console { scrollbar-width: thin; scrollbar-color: #34363b transparent; }
.tfai-console ::-webkit-scrollbar { width: 10px; height: 10px; }
.tfai-console ::-webkit-scrollbar-thumb { background: #34363b; border-radius: 5px; border: 2px solid transparent; background-clip: content-box; }
.tfai-console ::-webkit-scrollbar-thumb:hover { background-color: #43464c; background-clip: content-box; }
.tfai-console ::-webkit-scrollbar-track { background: transparent; }
.tfai-console ::selection { background: rgba(0, 185, 107, 0.30); }
/* 任务项 hover（inline style 无法表达 :hover） */
.tfai-console .console-task-item:hover { background: rgba(255, 255, 255, 0.04); }
/* 输入壳：聚焦时整行一圈主色描边 */
.tfai-console .console-input-shell { transition: box-shadow 0.15s ease, background 0.15s ease; }
.tfai-console .console-input-shell:focus-within { box-shadow: 0 0 0 1px rgba(0, 185, 107, 0.45); background: rgba(0, 185, 107, 0.04); }
/* 附件行 hover */
.tfai-console .console-attachment:hover { background: #26282c; }
@keyframes tfai-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.tfai-console .tfai-pulse-dot { animation: tfai-pulse 1.4s ease-in-out infinite; }
`

/** 弹层入场动画（补全菜单/切换器/快捷键浮层共用）；
 *  类名 console-pop 不限 .tfai-console 作用域，卡片终端的补全菜单也要用。 */
export const CONSOLE_POP_CSS = `
@keyframes tfai-pop {
  from { opacity: 0; transform: translateY(4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.console-pop { animation: tfai-pop 0.16s ease-out both; }
`
