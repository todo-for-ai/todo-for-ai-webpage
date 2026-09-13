import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import type { CollaborationGraph as GraphData } from '../../../src/api/agents'

// jsdom 无 rAF：force 布局用桩替代，避免真实循环
let rafCallbacks: Array<(t: number) => void> = []
beforeEach(() => {
  rafCallbacks = []
  ;(globalThis as any).requestAnimationFrame = vi.fn((cb: (t: number) => void) => {
    rafCallbacks.push(cb)
    return rafCallbacks.length
  })
  ;(globalThis as any).cancelAnimationFrame = vi.fn()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const fixture: GraphData = {
  nodes: [
    { id: 1, name: 'alice', kind: 'assistant', messages: 30 },
    { id: 2, name: 'bob', kind: 'coordinator', messages: 20 },
    { id: 3, name: 'carol', kind: 'external', messages: 1 },
  ],
  edges: [
    { source: 1, target: 2, count: 9, source_to_target: 5, target_to_source: 4 },
    { source: 1, target: 3, count: 1 },
  ],
  total_edges: 2,
} as unknown as GraphData

import CollaborationGraphView from '../../../src/components/CollaborationGraphView'

describe('CollaborationGraphView 组件渲染', () => {
  afterEach(() => {
    cleanup()
  })

  it('默认 circular 布局：渲染全部节点与边', () => {
    const { container } = render(<CollaborationGraphView data={fixture} />)
    const svg = container.querySelector('svg')!
    expect(svg).toBeTruthy()
    const circles = svg.querySelectorAll('circle')
    expect(circles.length).toBeGreaterThanOrEqual(3)
    expect(svg.textContent).toContain('alice')
    expect(svg.textContent).toContain('carol')
  })

  it('filterKinds 过滤后非同类节点消失', () => {
    const { container } = render(<CollaborationGraphView data={fixture} filterKinds={['assistant', 'coordinator']} />)
    const svg = container.querySelector('svg')!
    expect(svg.textContent).toContain('alice')
    expect(svg.textContent).toContain('bob')
    expect(svg.textContent).not.toContain('carol')
  })

  it('minCount 过滤低消息量边', () => {
    const { container } = render(<CollaborationGraphView data={fixture} minCount={5} />)
    const svg = container.querySelector('svg')!
    // 仅 1-2 边（count=9）存活；1-3（count=1）被滤，carol 成为孤立节点随之隐藏
    expect(svg.textContent).toContain('alice')
    expect(svg.textContent).toContain('bob')
    expect(svg.textContent).not.toContain('carol')
  })

  it('showEdgeLabels 渲染边中点消息数', () => {
    const { container } = render(<CollaborationGraphView data={fixture} showEdgeLabels />)
    const texts = [...container.querySelectorAll('svg text')].map((t) => t.textContent)
    expect(texts.some((t) => t === '9')).toBe(true)
  })

  it('空数据渲染空态不抛错', () => {
    const { container } = render(<CollaborationGraphView data={null} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('force 布局在 rAF 桩下可渲染', () => {
    const { container } = render(<CollaborationGraphView data={fixture} layout="force" />)
    expect(container.querySelector('svg')).toBeTruthy()
    rafCallbacks.forEach((cb) => cb(16))
  })
})
