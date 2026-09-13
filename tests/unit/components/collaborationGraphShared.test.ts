import { describe, expect, it } from 'vitest'
import {
  KIND_COLORS,
  kindColor,
  kindGradientUrl,
  reputationColor,
  reputationStrokeWidth,
  computeStaticPositions,
  filterGraphData,
} from '../../../src/components/collaboration-graph/collaborationGraphShared'

const nodes = [
  { id: 1, name: 'alice', kind: 'assistant' },
  { id: 2, name: 'bob', kind: 'coordinator' },
  { id: 3, name: 'carol', kind: 'assistant' },
]
const edges = [
  { source: 1, target: 2, count: 9 },
  { source: 1, target: 3, count: 1 },
]

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

describe('filterGraphData 数据过滤', () => {
  it('无过滤返回全量', () => {
    const r = filterGraphData(nodes, edges, {})
    expect(r.edges).toHaveLength(2)
    expect(r.nodes).toHaveLength(3)
  })

  it('minCount 过滤低消息边并隐藏孤立节点', () => {
    const r = filterGraphData(nodes, edges, { minCount: 5 })
    expect(r.edges.map((e) => e.count)).toEqual([9])
    expect(r.nodes.map((n) => n.id)).toEqual([1, 2])
  })

  it('kind 过滤保留中心节点', () => {
    const r = filterGraphData(nodes, edges, { filterKinds: ['assistant'], centerNodeId: 1 })
    // alice 与 carol 均为 assistant：1-3 边存活
    expect(r.nodes.map((n) => n.id)).toEqual([1, 3])
    expect(r.edges.map((e) => e.count)).toEqual([1])
  })

  it('centerNodeId 始终保留', () => {
    const r = filterGraphData(nodes, edges, { minCount: 100, centerNodeId: 3 })
    expect(r.nodes.map((n) => n.id)).toEqual([3])
    expect(r.edges).toHaveLength(0)
  })
})

describe('computeStaticPositions 布局计算', () => {
  it('circular 节点位于圆周上（半径 = size/2 - 40）', () => {
    const pos = computeStaticPositions(nodes.slice(0, 2), 'circular', 400)
    for (const p of pos.values()) {
      const r = Math.hypot(p.x - 200, p.y - 200)
      expect(r).toBeCloseTo(160, 0)
    }
  })

  it('grid 布局按行列排布且不越出边距', () => {
    const pos = computeStaticPositions(nodes, 'grid', 400)
    const xs = [...pos.values()].map((p) => p.x)
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(20)
  })

  it('单节点 circular 位于顶部中央', () => {
    const pos = computeStaticPositions([nodes[0]], 'circular', 400)
    const p = pos.get(1)!
    expect(p.x).toBeCloseTo(200, 0)
    expect(p.y).toBeLessThan(200)
  })
})
