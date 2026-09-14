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

const getSvg = (container: HTMLElement) => container.querySelector('svg')!

describe('CollaborationGraphView 指针交互', () => {
  beforeEach(() => {
    localStorage.clear()
    // jsdom 的 SVG getScreenCTM 未实现：拖拽坐标转换依赖它，注入最小桩
    ;(globalThis as any).SVGGraphicsElement = (globalThis as any).SVGGraphicsElement || class {}
  })

  afterEach(() => {
    cleanup()
  })

  const findNodeGroup = (container: HTMLElement, name: string) => {
    const matches = [...container.querySelectorAll('svg g')].filter((g) => g.textContent?.includes(name))
    // 最内层（textContent 最短）为目标节点组
    return matches.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0]
  }

  it('节点拖拽覆盖依赖 getScreenCTM（jsdom 不支持，跳过断言仅冒烟）', () => {
    const { container } = render(
      <CollaborationGraphView data={fixture} layout="circular" size={400} storageKey="cg-test-drag" />,
    )
    const bobGroup = findNodeGroup(container, 'bob')!
    expect(bobGroup).toBeTruthy()
  })

  it('滚轮缩放：放大倍率有上下限', () => {
    const { container } = render(<CollaborationGraphView data={fixture} layout="circular" size={400} />)
    const svg = getSvg(container)
    // 放大若干次
    for (let i = 0; i < 5; i++) {
      fireEvent.wheel(svg, { deltaY: -100 })
    }
    const viewGroup = [...container.querySelectorAll('svg g')].find((g) =>
      (g.getAttribute('transform') || '').includes('scale'),
    )
    expect(viewGroup).toBeTruthy()
    const scale = Number((viewGroup!.getAttribute('transform') || '').match(/scale\(([\d.]+)\)/)?.[1] || 1)
    expect(scale).toBeGreaterThan(1)
    // 缩小到底
    for (let i = 0; i < 30; i++) {
      fireEvent.wheel(svg, { deltaY: 100 })
    }
    const transforms = [...container.querySelectorAll('svg g')]
      .map((g) => g.getAttribute('transform') || '')
      .filter((t) => t.includes('scale'))
    const scaleAfter = transforms.length
      ? Math.max(...transforms.map((t) => Number(t.match(/scale\(([\d.]+)\)/)?.[1] || 1)))
      : 1
    expect(scaleAfter).toBeGreaterThanOrEqual(0.3)
  })

  it('背景按下拖动触发平移', () => {
    const { container } = render(<CollaborationGraphView data={fixture} layout="circular" size={400} />)
    const svg = getSvg(container)
    const bg = container.querySelector('rect[fill="transparent"]')
    expect(bg).toBeTruthy()
    const before = [...container.querySelectorAll('svg g')].map((g) => g.getAttribute('transform'))
    fireEvent.mouseDown(bg as Element, { clientX: 200, clientY: 200 })
    fireEvent.mouseMove(svg, { clientX: 260, clientY: 230 })
    fireEvent.mouseUp(svg)
    const after = [...container.querySelectorAll('svg g')].map((g) => g.getAttribute('transform'))
    expect(after).not.toEqual(before)
  })

  it('onNodeClick 点击节点触发回调（未拖拽时）', () => {
    const onNodeClick = vi.fn()
    const { container } = render(<CollaborationGraphView data={fixture} onNodeClick={onNodeClick} />)
    const bobGroup = findNodeGroup(container, 'bob')!
    fireEvent.click(bobGroup)
    expect(onNodeClick).toHaveBeenCalledWith(2)
  })
})
