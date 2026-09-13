// 协作关系图共享的纯渲染助手：kind 配色、声誉环样式（由 CollaborationGraphView 沉淀，可单测）。

export const KIND_COLORS: Record<string, string> = {
  coordinator: '#722ed1', // 紫：协调者
  autonomous: '#13c2c2',  // 青：自主型
  assistant: '#1890ff',   // 蓝：助手型
  external: '#fa8c16',    // 橙：外部
}
export const KIND_COLOR_DEFAULT = '#8c8c8c'
export const kindColor = (kind?: string | null) =>
  (kind && KIND_COLORS[kind]) || KIND_COLOR_DEFAULT
export const kindGradientUrl = (kind?: string | null) =>
  (kind && KIND_COLORS[kind]) ? `url(#cg-grad-${kind})` : 'url(#cg-grad-default)'

// 声誉 0-100 -> 环颜色（红<40 黄40-70 绿>70）
export const reputationColor = (rep?: number | null) => {
  if (rep === null || rep === undefined) return null
  if (rep < 40) return '#ff4d4f'
  if (rep < 70) return '#faad14'
  return '#52c41a'
}
// 声誉 -> 环描边粗细梯度（高声誉更粗，强化视觉权重）
export const reputationStrokeWidth = (rep?: number | null) => {
  if (rep === null || rep === undefined) return 1.5
  if (rep >= 80) return 3.5
  if (rep >= 50) return 2.5
  return 1.5
}
