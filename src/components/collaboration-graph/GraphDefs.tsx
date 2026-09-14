import { KIND_COLOR_DEFAULT, KIND_COLORS } from './collaborationGraphShared'

/**
 * svg defs：箭头 marker（默认灰 / 高亮蓝）+ 按 kind 的径向渐变（中心亮→边缘深，含默认 kind）。
 * 纯静态定义，从 CollaborationGraphView 原样抽出。
 */
const GraphDefs = () => (
  <defs>
    {/* 边箭头：默认灰、高亮蓝 */}
    <marker id="cg-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto-start-reverse">
      <path d="M0,0 L6,3 L0,6 Z" fill="#bfbfbf" />
    </marker>
    <marker id="cg-arrow-hl" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto-start-reverse">
      <path d="M0,0 L6,3 L0,6 Z" fill="#1890ff" />
    </marker>
    {/* 按 kind 的径向渐变：中心亮→边缘深，增强节点立体感 */}
    {Object.entries(KIND_COLORS).map(([kind, color]) => {
      // 将 hex 转为更亮/更暗版本
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      const lighter = `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)})`
      const darker = `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)})`
      return (
        <radialGradient key={kind} id={`cg-grad-${kind}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={lighter} />
          <stop offset="100%" stopColor={darker} />
        </radialGradient>
      )
    })}
    {/* 默认 kind 渐变 */}
    {(() => {
      const color = KIND_COLOR_DEFAULT
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      const lighter = `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)})`
      const darker = `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)})`
      return (
        <radialGradient id="cg-grad-default" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={lighter} />
          <stop offset="100%" stopColor={darker} />
        </radialGradient>
      )
    })()}
  </defs>
)

export default GraphDefs
