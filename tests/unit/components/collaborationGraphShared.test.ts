import { describe, expect, it } from 'vitest'
import {
  KIND_COLORS,
  kindColor,
  kindGradientUrl,
  reputationColor,
  reputationStrokeWidth,
} from '../../../src/components/collaboration-graph/collaborationGraphShared'

describe('collaborationGraphShared 纯渲染助手', () => {
  it('kindColor 已知/未知/空值', () => {
    expect(kindColor('coordinator')).toBe('#722ed1')
    expect(kindColor('external')).toBe('#fa8c16')
    expect(kindColor('mystery')).toBe('#8c8c8c')
    expect(kindColor(null)).toBe('#8c8c8c')
    expect(kindColor(undefined)).toBe('#8c8c8c')
  })

  it('kindGradientUrl 按类型生成渐变引用', () => {
    expect(kindGradientUrl('assistant')).toBe('url(#cg-grad-assistant)')
    expect(kindGradientUrl(null)).toBe('url(#cg-grad-default)')
  })

  it('reputationColor 阈值边界', () => {
    expect(reputationColor(null)).toBeNull()
    expect(reputationColor(undefined)).toBeNull()
    expect(reputationColor(0)).toBe('#ff4d4f')
    expect(reputationColor(39.9)).toBe('#ff4d4f')
    expect(reputationColor(40)).toBe('#faad14')
    expect(reputationColor(69.9)).toBe('#faad14')
    expect(reputationColor(70)).toBe('#52c41a')
    expect(reputationColor(100)).toBe('#52c41a')
  })

  it('reputationStrokeWidth 阈值边界', () => {
    expect(reputationStrokeWidth(0)).toBe(1.5)
    expect(reputationStrokeWidth(49)).toBe(1.5)
    expect(reputationStrokeWidth(50)).toBe(2.5)
    expect(reputationStrokeWidth(79)).toBe(2.5)
    expect(reputationStrokeWidth(80)).toBe(3.5)
    expect(reputationStrokeWidth(null)).toBe(1.5)
  })

  it('KIND_COLORS 覆盖四类 Agent', () => {
    expect(Object.keys(KIND_COLORS).sort()).toEqual(['assistant', 'autonomous', 'coordinator', 'external'])
  })
})
